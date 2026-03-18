// ============================================
// Bulk Volume Pricing Engine
// Based on actual Fulfill Engine price tiers
// ============================================

// Embroidery pricing: [maxQty, costByStitchCount]
// Stitch counts: 6000, 7000, 8000, 9000, 10000, 11000, 12000, 13000, 14000, 15000, 16000, 17000
const EMBROIDERY_TIERS: Array<{ maxQty: number; costs: number[] }> = [
  { maxQty: 5, costs: [8.00, 8.30, 8.60, 8.90, 9.20, 9.50, 9.80, 10.10, 10.40, 10.70, 11.00, 11.30] },
  { maxQty: 11, costs: [7.35, 7.65, 7.95, 8.25, 8.55, 8.85, 9.15, 9.45, 9.75, 10.05, 10.35, 10.65] },
  { maxQty: 23, costs: [5.35, 5.65, 5.95, 6.25, 6.55, 6.85, 7.15, 7.45, 7.75, 8.05, 8.35, 8.65] },
  { maxQty: 47, costs: [5.00, 5.30, 5.60, 5.90, 6.20, 6.50, 6.80, 7.10, 7.40, 7.70, 8.00, 8.30] },
  { maxQty: 71, costs: [4.70, 5.00, 5.30, 5.60, 5.90, 6.20, 6.50, 6.80, 7.10, 7.40, 7.70, 8.00] },
  { maxQty: 143, costs: [4.35, 4.65, 4.95, 5.25, 5.55, 5.85, 6.15, 6.45, 6.75, 7.05, 7.35, 7.65] },
  { maxQty: 499, costs: [4.00, 4.30, 4.60, 4.90, 5.20, 5.50, 5.80, 6.10, 6.40, 6.70, 7.00, 7.30] },
  { maxQty: 999999, costs: [3.70, 4.00, 4.30, 4.60, 4.90, 5.20, 5.50, 5.80, 6.10, 6.40, 6.70, 7.00] },
];

// Screen printing: [maxQty, costByColorCount]
// Colors: 1, 2, 3, 4, 5, 6, 7, 8
const SCREEN_PRINT_TIERS: Array<{ maxQty: number; costs: number[] }> = [
  { maxQty: 47, costs: [3.72, 5.02, 6.32, 7.62, 8.92, 10.22, 11.52, 12.82] },
  { maxQty: 71, costs: [2.73, 3.84, 4.94, 6.05, 7.15, 8.26, 9.36, 10.47] },
  { maxQty: 143, costs: [2.24, 2.89, 3.54, 4.19, 4.84, 5.49, 6.14, 6.79] },
  { maxQty: 239, costs: [1.66, 2.18, 2.70, 3.22, 3.74, 4.26, 4.78, 5.30] },
  { maxQty: 359, costs: [1.46, 1.85, 2.24, 2.63, 3.02, 3.41, 3.80, 4.19] },
  { maxQty: 499, costs: [1.38, 1.70, 2.03, 2.35, 2.68, 3.00, 3.33, 3.65] },
  { maxQty: 1199, costs: [1.18, 1.44, 1.70, 1.96, 2.22, 2.48, 2.74, 3.00] },
  { maxQty: 2499, costs: [1.04, 1.24, 1.43, 1.63, 1.82, 2.02, 2.21, 2.41] },
  { maxQty: 4999, costs: [0.91, 1.11, 1.30, 1.50, 1.69, 1.89, 2.08, 2.28] },
  { maxQty: 999999, costs: [0.85, 0.98, 1.11, 1.24, 1.37, 1.50, 1.63, 1.76] },
];

// DTG/DTF/UV flat rates per location (from FE price sheet)
const FLAT_DECORATION_COSTS: Record<string, number> = {
  dtg: 6.50,
  dtf: 6.50,
  uv_dtf: 7.00,
  uv: 7.00,
  engraving: 8.00,
  laser_engrave: 8.00,
  dye_sublimation: 7.00,
  liquid_3d: 8.75,
  heat_seal_patch: 5.00,
  sticker: 3.00,
  transfer_label: 3.00,
};

export interface PriceTier {
  minQty: number;
  maxQty: number;
  label: string;
  decorationCost: number;
  totalPerItem: number; // blank + decoration
  totalWithMargin: number; // final client price
  savings: number; // % saved vs single qty
}

export interface BulkPricing {
  method: string;
  blankCost: number;
  margin: number;
  tiers: PriceTier[];
}

const FE_MARGIN = 0.30;

export function calculateBulkPricing(
  blankCost: number, // wholesale blank cost
  method: string = "dtf",
  locations: number = 1,
  stitchCount: number = 8000, // for embroidery
  colors: number = 1, // for screen printing
): BulkPricing {
  const tiers: PriceTier[] = [];

  if (method === "embroidery") {
    // Stitch count index (6000 = 0, 7000 = 1, etc.)
    const stitchIndex = Math.min(11, Math.max(0, Math.floor((stitchCount - 6000) / 1000)));

    const qtyLabels = ["1-5", "6-11", "12-23", "24-47", "48-71", "72-143", "144-499", "500+"];
    const qtyMins = [1, 6, 12, 24, 48, 72, 144, 500];

    EMBROIDERY_TIERS.forEach((tier, i) => {
      const decorationCost = tier.costs[stitchIndex] * locations;
      const totalPerItem = blankCost + decorationCost;
      const totalWithMargin = totalPerItem * (1 + FE_MARGIN);

      tiers.push({
        minQty: qtyMins[i],
        maxQty: tier.maxQty,
        label: qtyLabels[i],
        decorationCost,
        totalPerItem,
        totalWithMargin,
        savings: 0,
      });
    });
  } else if (method === "screen_printing") {
    const colorIndex = Math.min(7, Math.max(0, colors - 1));

    const qtyLabels = ["24-47", "48-71", "72-143", "144-239", "240-359", "360-499", "500-1199", "1200-2499", "2500-4999", "5000+"];
    const qtyMins = [24, 48, 72, 144, 240, 360, 500, 1200, 2500, 5000];

    SCREEN_PRINT_TIERS.forEach((tier, i) => {
      const decorationCost = tier.costs[colorIndex] * locations;
      const totalPerItem = blankCost + decorationCost;
      const totalWithMargin = totalPerItem * (1 + FE_MARGIN);

      tiers.push({
        minQty: qtyMins[i],
        maxQty: tier.maxQty,
        label: qtyLabels[i],
        decorationCost,
        totalPerItem,
        totalWithMargin,
        savings: 0,
      });
    });
  } else {
    // Flat-rate decoration (DTG, DTF, UV, etc.) — no volume discounts on decoration
    // But we can still show bulk estimates
    const decorationCost = (FLAT_DECORATION_COSTS[method] || 6.50) * locations;
    const totalPerItem = blankCost + decorationCost;
    const totalWithMargin = totalPerItem * (1 + FE_MARGIN);

    [
      { min: 1, max: 11, label: "1-11" },
      { min: 12, max: 47, label: "12-47" },
      { min: 48, max: 143, label: "48-143" },
      { min: 144, max: 499, label: "144-499" },
      { min: 500, max: 999999, label: "500+" },
    ].forEach((range) => {
      tiers.push({
        minQty: range.min,
        maxQty: range.max,
        label: range.label,
        decorationCost,
        totalPerItem,
        totalWithMargin,
        savings: 0,
      });
    });
  }

  // Calculate savings vs first tier
  if (tiers.length > 0) {
    const baseTier = tiers[0].totalWithMargin;
    tiers.forEach((t) => {
      t.savings = baseTier > 0 ? Math.round((1 - t.totalWithMargin / baseTier) * 100) : 0;
    });
  }

  return {
    method,
    blankCost,
    margin: FE_MARGIN,
    tiers,
  };
}
