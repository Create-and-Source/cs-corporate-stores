import { NextRequest, NextResponse } from "next/server";
import {
  getFulfillEngineProductIds,
  getFulfillEngineProducts,
} from "@/lib/fulfill-engine";
import FE_PRICES_DATA from "@/data/fe-prices";
import IMAGE_CACHE_DATA from "@/data/product-images";

const PRINTIFY_API_KEY = process.env.PRINTIFY_API_KEY || "";
const FE_API_KEY = process.env.FULFILL_ENGINE_API_KEY || "";
const FE_ACCOUNT_ID = process.env.FULFILL_ENGINE_ACCOUNT_ID || "";
// FE markup: market-rate pricing based on wholesale cost
// Low-cost items get higher markup, premium items get lower markup
function calculateFEClientPrice(wholesaleCost: number, decorationCost: number): number {
  const totalCost = wholesaleCost + decorationCost;
  // Tiered markup: cheaper items = higher margin, premium = lower margin
  if (totalCost < 10) return Math.round(totalCost * 2.2 * 100); // 120% markup on cheap items
  if (totalCost < 20) return Math.round(totalCost * 1.8 * 100); // 80% markup
  if (totalCost < 35) return Math.round(totalCost * 1.6 * 100); // 60% markup
  if (totalCost < 50) return Math.round(totalCost * 1.5 * 100); // 50% markup
  return Math.round(totalCost * 1.4 * 100); // 40% markup on premium items
}
// Market-rate pricing by category
// Based on SwagUp, Axomo, CustomInk, and industry standard corporate merch pricing
// These are what the CLIENT pays (your cost + your profit built in)
const PRINTIFY_CLIENT_PRICES: Record<string, number> = {
  "T-Shirts & Tops": 2200,    // $22 — market rate $18-28 for custom tee
  "Hoodies & Sweats": 4500,   // $45 — market rate $38-55 for custom hoodie
  "Outerwear": 5500,          // $55 — market rate $45-75 for custom jacket
  "Headwear": 2200,           // $22 — market rate $18-28 for custom hat
  "Drinkware": 1800,          // $18 — market rate $12-25 for custom mug/bottle
  "Bags": 2500,               // $25 — market rate $18-35 for custom bag
  "Wall Art": 2200,           // $22 — market rate $15-35 for poster/canvas
  "Tech": 2500,               // $25 — market rate $18-35 for phone case/laptop sleeve
  "Accessories": 1500,        // $15 — market rate $8-20 for stickers/patches
  "Office": 1800,             // $18 — market rate $12-25 for notebooks/mousepads
  "Bottoms & Activewear": 3800, // $38 — market rate $30-50
  "Home & Living": 4200,      // $42 — market rate $30-55 for blankets/pillows
  "Kids & Baby": 2200,        // $22 — market rate $18-28
  "Footwear": 3500,           // $35 — market rate $25-45
  "Polos": 3200,              // $32 — market rate $25-45 for custom polo
  "Other": 2500,              // $25 default
};

interface CatalogProduct {
  id: string;
  name: string;
  description: string;
  image: string | null;
  category: string;
  provider: "fulfill_engine" | "printify";
  providerId: string;
  printLocations?: Array<{ id: string; label: string }>;
  printMethods?: string[];
  brand?: string;
  colors?: string[];
  clientPrice: number | null; // in cents, with margin
  hasImage: boolean;
}

// Caches
let feCache: { products: CatalogProduct[]; timestamp: number } | null = null;
let printifyCache: { products: CatalogProduct[]; timestamp: number } | null = null;
let priceMap: Map<string, number> | null = null;
const CACHE_TTL = 1000 * 60 * 60;

function loadImageMap(): Record<string, string | null> {
  return IMAGE_CACHE_DATA as Record<string, string | null>;
}

function loadPriceMap(): Map<string, number> {
  if (priceMap) return priceMap;
  const map = new Map<string, number>();
  for (const [id, data] of Object.entries(FE_PRICES_DATA)) {
    map.set(id, data.cost);
  }
  priceMap = map;
  return map;
}

// GET /api/catalog
export async function GET(req: NextRequest) {
  const provider = req.nextUrl.searchParams.get("provider") || "all";
  const search = req.nextUrl.searchParams.get("search")?.toLowerCase() || "";
  const category = req.nextUrl.searchParams.get("category") || "All";
  const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
  const perPage = 30;

  let allProducts: CatalogProduct[] = [];
  const prices = loadPriceMap();
  const images = loadImageMap();

  // --- Printify (shown FIRST — they have photos) ---
  if (provider === "all" || provider === "printify") {
    if (printifyCache && Date.now() - printifyCache.timestamp < CACHE_TTL) {
      allProducts.push(...printifyCache.products);
    } else {
      try {
        const res = await fetch(
          "https://api.printify.com/v1/catalog/blueprints.json",
          {
            headers: {
              Authorization: `Bearer ${PRINTIFY_API_KEY}`,
              "User-Agent": "CreateAndSource/1.0",
            },
          }
        );

        if (res.ok) {
          const blueprints = await res.json();
          const pProducts: CatalogProduct[] = [];
          for (const b of blueprints) {
            const category = mapPrintifyCategory(b.title || "");
            const clientPrice = PRINTIFY_CLIENT_PRICES[category] || 2500;
            pProducts.push({
              id: `pf-${b.id}`,
              name: b.title || "Untitled",
              description: stripHtml(b.description || "").slice(0, 200),
              image: b.images?.[0] || null,
              category,
              provider: "printify",
              providerId: String(b.id),
              clientPrice,
              hasImage: !!(b.images && b.images.length > 0),
            });
          }
          printifyCache = { products: pProducts, timestamp: Date.now() };
          allProducts.push(...pProducts);
        }
      } catch (e) {
        console.error("Printify catalog error:", e);
      }
    }
  }

  // --- Fulfill Engine ---
  if (provider === "all" || provider === "fulfill_engine") {
    if (feCache && Date.now() - feCache.timestamp < CACHE_TTL) {
      allProducts.push(...feCache.products);
    } else {
      try {
        // Get CSV for colors/brand
        const csvRes = await fetch(
          `https://api.fulfillengine.com/api/accounts/${FE_ACCOUNT_ID}/catalogproducts/catalog_product_skus_csv`,
          { method: "POST", headers: { "Content-Type": "application/json", "X-API-KEY": FE_API_KEY } }
        );
        const csvUrl = (await csvRes.text()).replace(/"/g, "");
        const csvDataRes = await fetch(csvUrl);
        const csvText = await csvDataRes.text();
        const csvProducts = parseFECsv(csvText);

        // Get product details
        const productIds = await getFulfillEngineProductIds();
        const detailsMap = new Map<string, { printLocations: Array<{ id: string; label: string }>; printMethods: string[]; description: string }>();

        for (let i = 0; i < Math.min(productIds.length, 500); i += 50) {
          try {
            const details = await getFulfillEngineProducts(productIds.slice(i, i + 50));
            if (Array.isArray(details)) {
              for (const p of details) {
                detailsMap.set(p.id, {
                  printLocations: (p.printLocations || []).map((loc: { id: string }) => ({
                    id: loc.id, label: formatLocationLabel(loc.id),
                  })),
                  printMethods: p.eligiblePrintingMethods || [],
                  description: p.description ? p.description.replace(/\n/g, " ").slice(0, 200) : "",
                });
              }
            }
          } catch { /* continue */ }
        }

        const feProducts: CatalogProduct[] = [];
        for (const [productId, csvInfo] of csvProducts) {
          const details = detailsMap.get(productId);
          const wholesaleCost = prices.get(productId.toLowerCase());
          let clientPrice: number | null = null;

          if (wholesaleCost) {
            const decorationCost = 6.50; // Default DTF per FE price sheet
            clientPrice = calculateFEClientPrice(wholesaleCost, decorationCost);
          }

          feProducts.push({
            id: `fe-${productId}`,
            name: csvInfo.name,
            description: details?.description || csvInfo.name,
            image: images[productId] || null,
            category: mapFECategory(csvInfo.name),
            provider: "fulfill_engine",
            providerId: productId,
            printLocations: details?.printLocations,
            printMethods: details?.printMethods,
            brand: csvInfo.brand,
            colors: csvInfo.colors,
            clientPrice,
            hasImage: !!(images[productId]),
          });
        }

        feCache = { products: feProducts, timestamp: Date.now() };
        allProducts.push(...feProducts);
      } catch (e) {
        console.error("Fulfill Engine catalog error:", e);
      }
    }
  }

  // --- Filter ---
  let filtered = allProducts;

  if (search) {
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(search) ||
        p.description.toLowerCase().includes(search) ||
        p.category.toLowerCase().includes(search) ||
        (p.brand && p.brand.toLowerCase().includes(search))
    );
  }

  if (category !== "All") {
    filtered = filtered.filter((p) => p.category === category);
  }

  // Sort: products with images first
  filtered.sort((a, b) => {
    if (a.hasImage && !b.hasImage) return -1;
    if (!a.hasImage && b.hasImage) return 1;
    return 0;
  });

  const allCategories = [...new Set(allProducts.map((p) => p.category))].sort();
  const total = filtered.length;
  const totalPages = Math.ceil(total / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  return NextResponse.json({
    products: paginated,
    total,
    page,
    totalPages,
    categories: allCategories,
  });
}

function parseFECsv(csvText: string): Map<string, { name: string; brand: string; ssaSku: string | null; colors: string[] }> {
  const lines = csvText.split("\n");
  const products = new Map<string, { name: string; brand: string; ssaSku: string | null; colors: string[] }>();
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length < 11) continue;
    const [productId, name, brand, color, , , , , , , ssaSku] = cols;
    if (!products.has(productId)) {
      products.set(productId, { name, brand, ssaSku: ssaSku || null, colors: [] });
    }
    const product = products.get(productId)!;
    if (color && !product.colors.includes(color)) product.colors.push(color);
    if (!product.ssaSku && ssaSku) product.ssaSku = ssaSku;
  }
  return products;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') inQuotes = !inQuotes;
    else if (char === "," && !inQuotes) { result.push(current.trim()); current = ""; }
    else current += char;
  }
  result.push(current.trim());
  return result;
}

function formatLocationLabel(id: string): string {
  return id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function mapFECategory(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("polo")) return "Polos";
  if (n.includes("hoodie") || n.includes("sweatshirt") || n.includes("pullover") || n.includes("fleece") || n.includes("crewneck")) return "Hoodies & Sweats";
  if (n.includes("tee") || n.includes("shirt") || n.includes("tank") || n.includes("crew") || n.includes("jersey") || n.includes("henley")) return "T-Shirts & Tops";
  if (n.includes("jacket") || n.includes("vest") || n.includes("coat") || n.includes("puffer") || n.includes("windbreaker") || n.includes("softshell")) return "Outerwear";
  if (n.includes("cap") || n.includes("hat") || n.includes("beanie") || n.includes("visor") || n.includes("trucker")) return "Headwear";
  if (n.includes("mug") || n.includes("tumbler") || n.includes("bottle") || n.includes("cup") || n.includes("drinkware")) return "Drinkware";
  if (n.includes("bag") || n.includes("tote") || n.includes("backpack") || n.includes("duffel")) return "Bags";
  if (n.includes("quarter zip") || n.includes("1/4 zip")) return "Quarter Zips";
  return "Other";
}

function mapPrintifyCategory(title: string): string {
  const t = title.toLowerCase();
  // Check drinkware BEFORE shirts (to catch "travel mug", "steel tumbler", etc.)
  if (t.includes("mug") || t.includes("tumbler") || t.includes("bottle") || t.includes("cup") || t.includes("can") || t.includes("glass") || t.includes("travel") || t.includes("water") || t.includes("thermos") || t.includes("flask") || t.includes("drinkware")) return "Drinkware";
  if (t.includes("polo")) return "Polos";
  if (t.includes("hoodie") || t.includes("sweatshirt") || t.includes("pullover") || t.includes("crewneck")) return "Hoodies & Sweats";
  if (t.includes("shirt") || t.includes("tee") || t.includes("tank") || t.includes("crop") || t.includes("bodysuit")) return "T-Shirts & Tops";
  if (t.includes("jacket") || t.includes("vest") || t.includes("coat") || t.includes("windbreaker")) return "Outerwear";
  if (t.includes("hat") || t.includes("cap") || t.includes("beanie") || t.includes("visor") || t.includes("bucket")) return "Headwear";
  if (t.includes("bag") || t.includes("tote") || t.includes("backpack") || t.includes("pouch") || t.includes("fanny") || t.includes("duffel")) return "Bags";
  if (t.includes("poster") || t.includes("canvas") || t.includes("print") || t.includes("frame") || t.includes("tapestry")) return "Wall Art";
  if (t.includes("phone") || t.includes("case") || t.includes("laptop") || t.includes("mouse") || t.includes("airpod")) return "Tech";
  if (t.includes("sticker") || t.includes("patch") || t.includes("pin") || t.includes("keychain") || t.includes("magnet")) return "Accessories";
  if (t.includes("notebook") || t.includes("desk") || t.includes("pen") || t.includes("planner") || t.includes("coaster")) return "Office";
  if (t.includes("shorts") || t.includes("jogger") || t.includes("pant") || t.includes("legging") || t.includes("skirt") || t.includes("swim")) return "Bottoms & Activewear";
  if (t.includes("blanket") || t.includes("towel") || t.includes("pillow") || t.includes("mat") || t.includes("rug")) return "Home & Living";
  if (t.includes("onesie") || t.includes("baby") || t.includes("bib") || t.includes("kid") || t.includes("toddler") || t.includes("youth")) return "Kids & Baby";
  if (t.includes("sock") || t.includes("shoe") || t.includes("slipper") || t.includes("clog")) return "Footwear";
  return "Other";
}
