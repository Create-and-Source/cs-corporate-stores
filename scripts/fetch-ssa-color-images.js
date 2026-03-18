#!/usr/bin/env node

/**
 * Fetch per-color product images from SSActivewear API
 * Uses the FE catalog CSV (with SSA SKUs per color) to map each color variant
 * Run: node scripts/fetch-ssa-color-images.js
 * Saves to src/data/product-color-images.json
 *
 * Structure: { "feProductId": { "Black": "https://...", "White": "https://..." } }
 */

const fs = require("fs");
const path = require("path");

const SSA_ACCOUNT = "989139";
const SSA_API_KEY = "4afa39e6-f0b9-4237-92a7-acf76a8418ef";
const SSA_BASE = "https://api.ssactivewear.com/v2";
const AUTH = "Basic " + Buffer.from(`${SSA_ACCOUNT}:${SSA_API_KEY}`).toString("base64");

const FE_ACCOUNT = "act-9679744";
const FE_KEY = "BqzP0ooxj3heKmHYM7Xs9D0FDFLZYDOGecAEnk0feeENLgdZrducpPkbTDpzydy20s7VZsZe-py6i1B9i-j7FU";

const OUTPUT_FILE = path.join(__dirname, "../src/data/product-color-images.json");

// Load existing cache
let colorImageCache = {};
if (fs.existsSync(OUTPUT_FILE)) {
  colorImageCache = JSON.parse(fs.readFileSync(OUTPUT_FILE, "utf-8"));
  const products = Object.keys(colorImageCache).length;
  const colors = Object.values(colorImageCache).reduce((sum, obj) => sum + Object.keys(obj).length, 0);
  console.log(`Loaded cache: ${products} products, ${colors} color images`);
}

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') inQuotes = !inQuotes;
    else if (ch === "," && !inQuotes) { result.push(current.trim()); current = ""; }
    else current += ch;
  }
  result.push(current.trim());
  return result;
}

async function fetchFECatalog() {
  console.log("Fetching Fulfill Engine catalog CSV...");
  const res = await fetch(
    `https://api.fulfillengine.com/api/accounts/${FE_ACCOUNT}/catalogproducts/catalog_product_skus_csv`,
    { method: "POST", headers: { "Content-Type": "application/json", "X-API-KEY": FE_KEY } }
  );
  const csvUrl = (await res.text()).replace(/"/g, "");
  const csvRes = await fetch(csvUrl);
  const csvText = await csvRes.text();
  console.log("Got FE catalog CSV");
  return csvText;
}

function parseFEColors(csvText) {
  const lines = csvText.split("\n");
  // Header: CatalogProductId, CatalogProductName, Brand, Color, HexCode, Size, SKU, GTIN, CarolinaMadePartId, SanMarPartId, SSActivewear_SKU, ...

  // Map: feProductId → { colorName → ssaSku (first one per color) }
  const products = new Map();

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length < 11) continue;

    const productId = cols[0];
    const color = cols[3];
    const ssaSku = cols[10];

    if (!productId || !color) continue;

    if (!products.has(productId)) {
      products.set(productId, new Map());
    }

    const colorMap = products.get(productId);
    // Only store first SKU per color (we just need one to get the image)
    if (!colorMap.has(color) && ssaSku) {
      colorMap.set(color, ssaSku);
    }
  }

  return products;
}

async function fetchSSAProductBySku(skus) {
  try {
    const res = await fetch(`${SSA_BASE}/products/?sku=${skus.join(",")}`, {
      headers: { Authorization: AUTH, Accept: "application/json" },
    });
    if (res.ok) {
      return await res.json();
    }
    return [];
  } catch {
    return [];
  }
}

async function main() {
  const csvText = await fetchFECatalog();
  const products = parseFEColors(csvText);

  console.log(`\nFE products with color data: ${products.size}`);

  // Collect all unique SKUs we need to look up
  const allSkuLookups = []; // { feId, color, ssaSku }
  let skippedCached = 0;

  for (const [feId, colorMap] of products) {
    for (const [color, ssaSku] of colorMap) {
      // Skip if already cached
      if (colorImageCache[feId]?.[color]) {
        skippedCached++;
        continue;
      }
      allSkuLookups.push({ feId, color, ssaSku });
    }
  }

  console.log(`SKUs to look up: ${allSkuLookups.length}`);
  console.log(`Already cached: ${skippedCached}`);

  if (allSkuLookups.length === 0) {
    console.log("All color images already cached!");
    return;
  }

  // Batch fetch from SSA API
  const BATCH_SIZE = 50;
  let updated = 0;
  let noImage = 0;

  for (let i = 0; i < allSkuLookups.length; i += BATCH_SIZE) {
    const batch = allSkuLookups.slice(i, i + BATCH_SIZE);
    const skus = batch.map(b => b.ssaSku);

    const ssaProducts = await fetchSSAProductBySku(skus);

    // Map SSA SKU → colorFrontImage
    const skuToImage = new Map();
    for (const p of ssaProducts) {
      if (p.sku && p.colorFrontImage) {
        skuToImage.set(p.sku, `https://www.ssactivewear.com/${p.colorFrontImage}`);
      }
    }

    for (const item of batch) {
      const img = skuToImage.get(item.ssaSku);
      if (img) {
        if (!colorImageCache[item.feId]) colorImageCache[item.feId] = {};
        colorImageCache[item.feId][item.color] = img;
        updated++;
      } else {
        noImage++;
      }
    }

    // Progress
    const done = Math.min(i + BATCH_SIZE, allSkuLookups.length);
    if (done % 500 === 0 || done === allSkuLookups.length) {
      console.log(`  ${done}/${allSkuLookups.length} (${updated} images found)`);
    }

    // Save progress every 500
    if (done % 500 === 0) {
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(colorImageCache, null, 2));
    }

    // Rate limit
    await new Promise(r => setTimeout(r, 300));
  }

  // Final save — JSON
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(colorImageCache, null, 2));

  // Also generate .ts file for TypeScript import
  const TS_FILE = path.join(__dirname, "../src/data/product-color-images.ts");
  const tsContent = `const COLOR_IMAGES: Record<string, Record<string, string>> = ${JSON.stringify(colorImageCache)};\nexport default COLOR_IMAGES;\n`;
  fs.writeFileSync(TS_FILE, tsContent);

  const totalProducts = Object.keys(colorImageCache).length;
  const totalColors = Object.values(colorImageCache).reduce((sum, obj) => sum + Object.keys(obj).length, 0);

  console.log(`\nDone!`);
  console.log(`New color images: ${updated}`);
  console.log(`No image found: ${noImage}`);
  console.log(`Total: ${totalProducts} products, ${totalColors} color images`);
  console.log(`Saved to ${OUTPUT_FILE}`);
  console.log(`Saved TS file to ${TS_FILE}`);
}

main().catch(console.error);
