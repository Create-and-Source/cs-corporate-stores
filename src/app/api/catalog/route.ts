import { NextRequest, NextResponse } from "next/server";
import {
  getFulfillEngineProductIds,
  getFulfillEngineProducts,
} from "@/lib/fulfill-engine";

const PRINTIFY_API_KEY = process.env.PRINTIFY_API_KEY || "";
const FE_API_KEY = process.env.FULFILL_ENGINE_API_KEY || "";
const FE_ACCOUNT_ID = process.env.FULFILL_ENGINE_ACCOUNT_ID || "";

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
}

// Caches
let feCache: { products: CatalogProduct[]; timestamp: number } | null = null;
let printifyCache: { products: CatalogProduct[]; timestamp: number } | null = null;
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

// GET /api/catalog?provider=all|fulfill_engine|printify&search=tee&category=Apparel&page=1
export async function GET(req: NextRequest) {
  const provider = req.nextUrl.searchParams.get("provider") || "all";
  const search = req.nextUrl.searchParams.get("search")?.toLowerCase() || "";
  const category = req.nextUrl.searchParams.get("category") || "All";
  const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
  const perPage = 30;

  let allProducts: CatalogProduct[] = [];

  // --- Fulfill Engine ---
  if (provider === "all" || provider === "fulfill_engine") {
    if (feCache && Date.now() - feCache.timestamp < CACHE_TTL) {
      allProducts.push(...feCache.products);
    } else {
      try {
        // Step 1: Get CSV for brand names and colors
        const csvRes = await fetch(
          `https://api.fulfillengine.com/api/accounts/${FE_ACCOUNT_ID}/catalogproducts/catalog_product_skus_csv`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-API-KEY": FE_API_KEY,
            },
          }
        );
        const csvUrl = await csvRes.text();

        // Parse CSV for unique products with brand/color info
        const csvDataRes = await fetch(csvUrl.replace(/"/g, ""));
        const csvText = await csvDataRes.text();
        const csvProducts = parseFECsv(csvText);

        // Step 2: Get product details (print locations, methods)
        const productIds = await getFulfillEngineProductIds();
        const productDetailsMap = new Map<string, { printLocations: Array<{ id: string; label: string }>; printMethods: string[]; description: string }>();

        // Fetch first 500 products in batches
        for (let i = 0; i < Math.min(productIds.length, 500); i += 50) {
          const batch = productIds.slice(i, i + 50);
          try {
            const details = await getFulfillEngineProducts(batch);
            if (Array.isArray(details)) {
              for (const p of details) {
                productDetailsMap.set(p.id, {
                  printLocations: (p.printLocations || []).map(
                    (loc: { id: string }) => ({
                      id: loc.id,
                      label: formatLocationLabel(loc.id),
                    })
                  ),
                  printMethods: p.eligiblePrintingMethods || [],
                  description: p.description ? p.description.replace(/\n/g, " ").slice(0, 150) : "",
                });
              }
            }
          } catch {
            // Continue on batch error
          }
        }

        // Merge CSV + details
        const feProducts: CatalogProduct[] = [];
        for (const [productId, csvInfo] of csvProducts) {
          const details = productDetailsMap.get(productId);
          feProducts.push({
            id: `fe-${productId}`,
            name: csvInfo.name,
            description: details?.description || csvInfo.name,
            image: buildSSActivewearImage(csvInfo.ssaSku),
            category: mapFECategory(csvInfo.name),
            provider: "fulfill_engine",
            providerId: productId,
            printLocations: details?.printLocations,
            printMethods: details?.printMethods,
            brand: csvInfo.brand,
            colors: csvInfo.colors,
          });
        }

        feCache = { products: feProducts, timestamp: Date.now() };
        allProducts.push(...feProducts);
      } catch (e) {
        console.error("Fulfill Engine catalog error:", e);
      }
    }
  }

  // --- Printify ---
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
            pProducts.push({
              id: `pf-${b.id}`,
              name: b.title || "Untitled",
              description: stripHtml(b.description || "").slice(0, 150),
              image: b.images?.[0] || null,
              category: mapPrintifyCategory(b.title || ""),
              provider: "printify",
              providerId: String(b.id),
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

// Parse FE CSV into unique products with brand/color info
function parseFECsv(csvText: string): Map<string, { name: string; brand: string; ssaSku: string | null; colors: string[] }> {
  const lines = csvText.split("\n");
  const products = new Map<string, { name: string; brand: string; ssaSku: string | null; colors: string[] }>();

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length < 11) continue;

    const productId = cols[0];
    const name = cols[1];
    const brand = cols[2];
    const color = cols[3];
    const ssaSku = cols[10] || null;

    if (!products.has(productId)) {
      products.set(productId, { name, brand, ssaSku, colors: [] });
    }
    const product = products.get(productId)!;
    if (color && !product.colors.includes(color)) {
      product.colors.push(color);
    }
    // Keep first SSA SKU we find
    if (!product.ssaSku && ssaSku) {
      product.ssaSku = ssaSku;
    }
  }

  return products;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// FE doesn't provide images via API — return null, frontend shows placeholder
function buildSSActivewearImage(_ssaSku: string | null): string | null {
  return null;
}

function formatLocationLabel(id: string): string {
  return id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function mapFECategory(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("tee") || n.includes("shirt") || n.includes("tank") || n.includes("crew") && !n.includes("sweat") || n.includes("jersey") || n.includes("henley"))
    return "T-Shirts & Tops";
  if (n.includes("hoodie") || n.includes("sweatshirt") || n.includes("pullover") || n.includes("fleece") || n.includes("crewneck"))
    return "Hoodies & Sweats";
  if (n.includes("polo"))
    return "Polos";
  if (n.includes("jacket") || n.includes("vest") || n.includes("coat") || n.includes("puffer") || n.includes("windbreaker") || n.includes("softshell"))
    return "Outerwear";
  if (n.includes("cap") || n.includes("hat") || n.includes("beanie") || n.includes("visor") || n.includes("trucker"))
    return "Headwear";
  if (n.includes("mug") || n.includes("tumbler") || n.includes("bottle") || n.includes("cup") || n.includes("drinkware") || n.includes("quencher"))
    return "Drinkware";
  if (n.includes("bag") || n.includes("tote") || n.includes("backpack") || n.includes("duffel"))
    return "Bags";
  if (n.includes("quarter zip") || n.includes("1/4 zip"))
    return "Quarter Zips";
  return "Other";
}

function mapPrintifyCategory(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("shirt") || t.includes("tee") || t.includes("tank") || t.includes("crop") || t.includes("bodysuit"))
    return "T-Shirts & Tops";
  if (t.includes("hoodie") || t.includes("sweatshirt") || t.includes("pullover") || t.includes("crewneck"))
    return "Hoodies & Sweats";
  if (t.includes("jacket") || t.includes("vest") || t.includes("coat") || t.includes("windbreaker"))
    return "Outerwear";
  if (t.includes("hat") || t.includes("cap") || t.includes("beanie") || t.includes("visor") || t.includes("bucket"))
    return "Headwear";
  if (t.includes("mug") || t.includes("tumbler") || t.includes("bottle") || t.includes("cup") || t.includes("can") || t.includes("glass"))
    return "Drinkware";
  if (t.includes("bag") || t.includes("tote") || t.includes("backpack") || t.includes("pouch") || t.includes("fanny") || t.includes("duffel"))
    return "Bags";
  if (t.includes("poster") || t.includes("canvas") || t.includes("print") || t.includes("frame") || t.includes("tapestry"))
    return "Wall Art";
  if (t.includes("phone") || t.includes("case") || t.includes("laptop") || t.includes("mouse") || t.includes("airpod"))
    return "Tech";
  if (t.includes("sticker") || t.includes("patch") || t.includes("pin") || t.includes("keychain") || t.includes("magnet"))
    return "Accessories";
  if (t.includes("notebook") || t.includes("desk") || t.includes("pen") || t.includes("planner") || t.includes("coaster"))
    return "Office";
  if (t.includes("shorts") || t.includes("jogger") || t.includes("pant") || t.includes("legging") || t.includes("skirt") || t.includes("swim"))
    return "Bottoms & Activewear";
  if (t.includes("blanket") || t.includes("towel") || t.includes("pillow") || t.includes("mat") || t.includes("rug"))
    return "Home & Living";
  if (t.includes("onesie") || t.includes("baby") || t.includes("bib") || t.includes("kid") || t.includes("toddler") || t.includes("youth"))
    return "Kids & Baby";
  if (t.includes("sock") || t.includes("shoe") || t.includes("slipper") || t.includes("clog"))
    return "Footwear";
  if (t.includes("polo"))
    return "Polos";
  return "Other";
}
