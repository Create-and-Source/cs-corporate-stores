import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

// Default margin — Tovah's markup on top of wholesale cost
const DEFAULT_MARGIN = 0.30; // 30%

// Decoration cost estimates (per item, based on method + locations)
const DECORATION_COSTS: Record<string, number> = {
  embroidery: 5.00,
  screen_printing: 3.50,
  dtg: 4.00,
  dtf: 4.50,
  heat_seal_patch: 3.00,
  laser_engrave: 4.00,
  sticker: 1.50,
  transfer_label: 2.00,
};

const EXTRA_LOCATION_COST = 2.50; // Each additional print location

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
