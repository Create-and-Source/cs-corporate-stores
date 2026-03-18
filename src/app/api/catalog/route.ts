import { NextRequest, NextResponse } from "next/server";
import {
  getFulfillEngineProductIds,
  getFulfillEngineProducts,
} from "@/lib/fulfill-engine";
import { readFileSync } from "fs";
import { join } from "path";

const PRINTIFY_API_KEY = process.env.PRINTIFY_API_KEY || "";
const FE_API_KEY = process.env.FULFILL_ENGINE_API_KEY || "";
const FE_ACCOUNT_ID = process.env.FULFILL_ENGINE_ACCOUNT_ID || "";
const FE_MARGIN = 0.30; // 30% on Fulfill Engine products
const PRINTIFY_MARGIN = 0.15; // 15% on Printify products

// Printify typical production costs by category (in cents)
const PRINTIFY_COSTS: Record<string, number> = {
  "T-Shirts & Tops": 1295,
  "Hoodies & Sweats": 2495,
  "Outerwear": 3295,
  "Headwear": 1495,
  "Drinkware": 895,
  "Bags": 1295,
  "Wall Art": 1195,
  "Tech": 1495,
  "Accessories": 695,
  "Office": 995,
  "Bottoms & Activewear": 2195,
  "Home & Living": 2495,
  "Kids & Baby": 1195,
  "Footwear": 1895,
  "Polos": 1895,
  "Other": 1495,
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
let imageMap: Record<string, string | null> | null = null;
const CACHE_TTL = 1000 * 60 * 60;

function loadImageMap(): Record<string, string | null> {
  if (imageMap) return imageMap;
  try {
    const data = readFileSync(join(process.cwd(), "src/data/product-images.json"), "utf-8");
    imageMap = JSON.parse(data);
    return imageMap!;
  } catch {
    return {};
  }
}

function loadPriceMap(): Map<string, number> {
  if (priceMap) return priceMap;
  try {
    const csv = readFileSync(join(process.cwd(), "src/data/fe-prices.csv"), "utf-8");
    const map = new Map<string, number>();
    for (const line of csv.split("\n").slice(1)) {
      const match = line.trim().match(/^"([^"]+)","([^"]+)",([0-9.]+)$/);
      if (match) map.set(match[1].toLowerCase(), parseFloat(match[3]));
    }
    priceMap = map;
    return map;
  } catch {
    return new Map();
  }
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
            const baseCost = PRINTIFY_COSTS[category] || 1495;
            const clientPrice = Math.round(baseCost * (1 + PRINTIFY_MARGIN));
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
            const decorationCost = 4.50; // Default DTF
            const total = wholesaleCost + decorationCost;
            clientPrice = Math.round(total * (1 + FE_MARGIN) * 100);
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
  if (t.includes("polo")) return "Polos";
  if (t.includes("hoodie") || t.includes("sweatshirt") || t.includes("pullover") || t.includes("crewneck")) return "Hoodies & Sweats";
  if (t.includes("shirt") || t.includes("tee") || t.includes("tank") || t.includes("crop") || t.includes("bodysuit")) return "T-Shirts & Tops";
  if (t.includes("jacket") || t.includes("vest") || t.includes("coat") || t.includes("windbreaker")) return "Outerwear";
  if (t.includes("hat") || t.includes("cap") || t.includes("beanie") || t.includes("visor") || t.includes("bucket")) return "Headwear";
  if (t.includes("mug") || t.includes("tumbler") || t.includes("bottle") || t.includes("cup") || t.includes("can") || t.includes("glass")) return "Drinkware";
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
