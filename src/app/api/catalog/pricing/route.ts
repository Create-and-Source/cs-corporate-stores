import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

// Default margin — Tovah's markup on top of wholesale cost
const DEFAULT_MARGIN = 0.30; // 30%

// Decoration cost estimates (per item, based on method + locations)
// Actual FE decoration costs per location (from FE Price Sheet)
const DECORATION_COSTS: Record<string, number> = {
  dtg: 6.50,
  dtf: 6.50,
  uv_dtf: 7.00,
  uv: 7.00,
  embroidery: 8.00, // Base: 6000 stitches, 1-5 qty. Drops to $4.70 at 48+ qty
  screen_printing: 3.72, // 1 color, 24-47 qty. Min 24 units. Drops to $1.18 at 500+
  heat_seal_patch: 5.00,
  laser_engrave: 8.00,
  engraving: 8.00,
  sticker: 3.00,
  transfer_label: 3.00,
  dye_sublimation: 7.00,
  liquid_3d: 8.75,
};

// Size surcharges
const SIZE_SURCHARGES: Record<string, number> = {
  "2XL": 2.50,
  "3XL": 3.50,
  "4XL": 4.50,
  "5XL": 5.50,
  "6XL": 6.50,
};

const EXTRA_LOCATION_COST = 6.50; // Each additional location is another decoration charge

// Cache the price map
let priceMap: Map<string, { name: string; cost: number }> | null = null;

function loadPrices(): Map<string, { name: string; cost: number }> {
  if (priceMap) return priceMap;

  try {
    const csvPath = join(process.cwd(), "src/data/fe-prices.csv");
    const csv = readFileSync(csvPath, "utf-8");
    const lines = csv.split("\n");
    const map = new Map<string, { name: string; cost: number }>();

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Parse CSV: "id","name",price
      const match = line.match(/^"([^"]+)","([^"]+)",([0-9.]+)$/);
      if (match) {
        map.set(match[1].toLowerCase(), {
          name: match[2],
          cost: parseFloat(match[3]),
        });
      }
    }

    priceMap = map;
    return map;
  } catch (e) {
    console.error("Failed to load prices:", e);
    return new Map();
  }
}

// GET /api/catalog/pricing?productId=nl6210&locations=2&method=embroidery
export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get("productId")?.toLowerCase() || "";
  const locations = parseInt(req.nextUrl.searchParams.get("locations") || "1");
  const method = req.nextUrl.searchParams.get("method") || "dtf";

  const prices = loadPrices();
  const product = prices.get(productId);

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const blankCost = product.cost;
  const decorationCost = (DECORATION_COSTS[method] || 4.00) + (Math.max(0, locations - 1) * EXTRA_LOCATION_COST);
  const totalCost = blankCost + decorationCost;
  const margin = totalCost * DEFAULT_MARGIN;
  const clientPrice = totalCost + margin;

  return NextResponse.json({
    productId,
    productName: product.name,
    clientPrice: Math.round(clientPrice * 100),
    clientPriceFormatted: `$${clientPrice.toFixed(2)}`,
    locations,
    method: method.replace(/_/g, " "),
  });
}

// POST /api/catalog/pricing/bulk — Get prices for multiple products
export async function POST(req: NextRequest) {
  const { productIds, locations = 1, method = "dtf" } = await req.json();
  const prices = loadPrices();

  const results = (productIds || []).map((id: string) => {
    const product = prices.get(id.toLowerCase());
    if (!product) return { productId: id, clientPrice: null };

    const blankCost = product.cost;
    const decorationCost = (DECORATION_COSTS[method] || 4.00) + (Math.max(0, locations - 1) * EXTRA_LOCATION_COST);
    const totalCost = blankCost + decorationCost;
    const clientPrice = totalCost * (1 + DEFAULT_MARGIN);

    return {
      productId: id,
      productName: product.name,
      clientPrice: Math.round(clientPrice * 100),
      clientPriceFormatted: `$${clientPrice.toFixed(2)}`,
    };
  });

  return NextResponse.json({ prices: results });
}
