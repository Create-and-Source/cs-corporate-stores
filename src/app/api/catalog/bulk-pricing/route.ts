import { NextRequest, NextResponse } from "next/server";
import { calculateBulkPricing } from "@/lib/pricing";
import FE_PRICES_DATA from "@/data/fe-prices";

const PRINTIFY_API_KEY = process.env.PRINTIFY_API_KEY || "";

// Printify base costs by category (in dollars)
const PRINTIFY_BASE_COSTS: Record<string, number> = {
  "T-Shirts & Tops": 12.95,
  "Hoodies & Sweats": 24.95,
  "Outerwear": 32.95,
  "Headwear": 14.95,
  "Drinkware": 8.95,
  "Bags": 12.95,
  "Wall Art": 11.95,
  "Tech": 14.95,
  "Accessories": 6.95,
  "Office": 9.95,
  "Bottoms & Activewear": 21.95,
  "Home & Living": 24.95,
  "Kids & Baby": 11.95,
  "Footwear": 18.95,
  "Polos": 18.95,
  "Other": 14.95,
};

const PRINTIFY_MARGIN = 0.20;

// GET /api/catalog/bulk-pricing?productId=K500&provider=fulfill_engine&method=embroidery&locations=1&stitchCount=8000&colors=1&category=Polos
export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get("productId") || "";
  const provider = req.nextUrl.searchParams.get("provider") || "fulfill_engine";
  const method = req.nextUrl.searchParams.get("method") || "dtf";
  const locations = parseInt(req.nextUrl.searchParams.get("locations") || "1");
  const stitchCount = parseInt(req.nextUrl.searchParams.get("stitchCount") || "8000");
  const colors = parseInt(req.nextUrl.searchParams.get("colors") || "1");
  const category = req.nextUrl.searchParams.get("category") || "Other";

  if (provider === "printify") {
    // Printify bulk pricing — volume discounts on production
    const baseCost = PRINTIFY_BASE_COSTS[category] || 14.95;

    // Printify volume discounts (approximate — varies by provider)
    const tiers = [
      { min: 1, max: 24, label: "1-24", discount: 0 },
      { min: 25, max: 49, label: "25-49", discount: 0.05 },
      { min: 50, max: 99, label: "50-99", discount: 0.10 },
      { min: 100, max: 249, label: "100-249", discount: 0.15 },
      { min: 250, max: 499, label: "250-499", discount: 0.18 },
      { min: 500, max: 999999, label: "500+", discount: 0.22 },
    ].map((tier) => {
      const discountedCost = baseCost * (1 - tier.discount);
      const withMargin = discountedCost * (1 + PRINTIFY_MARGIN);
      return {
        minQty: tier.min,
        maxQty: tier.max,
        label: tier.label,
        decorationCost: 0,
        totalPerItem: discountedCost,
        totalWithMargin: withMargin,
        clientPrice: Math.round(withMargin * 100),
        clientPriceFormatted: `$${withMargin.toFixed(2)}`,
        savings: Math.round(tier.discount * 100),
      };
    });

    return NextResponse.json({
      provider: "printify",
      method: "print-on-demand",
      tiers,
    });
  }

  // Fulfill Engine bulk pricing
  const priceData = FE_PRICES_DATA[productId.toLowerCase() as keyof typeof FE_PRICES_DATA];
  const blankCost = priceData?.cost || 10.00;

  const pricing = calculateBulkPricing(blankCost, method, locations, stitchCount, colors);

  // Format for client
  const tiers = pricing.tiers.map((t) => ({
    ...t,
    clientPrice: Math.round(t.totalWithMargin * 100),
    clientPriceFormatted: `$${t.totalWithMargin.toFixed(2)}`,
  }));

  return NextResponse.json({
    provider: "fulfill_engine",
    productName: priceData?.name || productId,
    method,
    tiers,
  });
}
