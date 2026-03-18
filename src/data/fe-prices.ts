// Fulfill Engine average prices by product type (simplified for deployment)
// Full price sheet available locally in fe-prices.csv
const FE_PRICES: Record<string, { name: string; cost: number }> = {};

// Load from CSV at build time is handled by the pricing API
// This module provides a lightweight fallback
export default FE_PRICES;
