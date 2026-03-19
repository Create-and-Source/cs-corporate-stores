#!/usr/bin/env node

/**
 * Fetch per-color product images from SanMar catalog
 * For Nike, OGIO, Port Authority, Sport-Tek, and other SanMar-sourced products
 * Run: node scripts/fetch-sanmar-color-images.js
 * Updates src/data/product-color-images.json and product-images.json
 */

const fs = require("fs");
const path = require("path");

const FE_CATALOG = "/tmp/fe-catalog.csv";
const COLOR_OUTPUT = path.join(__dirname, "../src/data/product-color-images.json");
const IMAGE_OUTPUT = path.join(__dirname, "../src/data/product-images.json");
const DELAY_MS = 1500; // Be polite to SanMar servers
const BATCH_SIZE = 1;

// Load caches
let colorImageCache = {};
if (fs.existsSync(COLOR_OUTPUT)) {
  colorImageCache = JSON.parse(fs.readFileSync(COLOR_OUTPUT, "utf-8"));
}
let imageCache = {};
if (fs.existsSync(IMAGE_OUTPUT)) {
  imageCache = JSON.parse(fs.readFileSync(IMAGE_OUTPUT, "utf-8"));
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

function getSanMarProducts() {
  const csv = fs.readFileSync(FE_CATALOG, "utf-8");
  const lines = csv.split("\n");

  // Map: feProductId → { name, colors: [{ color, sanmarPartId }] }
  const products = new Map();

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length < 11) continue;

    const feId = cols[0];
    const name = cols[1];
    const color = cols[3];
    const sanmarPartId = cols[9];
    const ssaSku = cols[10];

    // Only SanMar products (have SanMar ID, no SSA SKU)
    if (!feId || !sanmarPartId || ssaSku) continue;

    if (!products.has(feId)) {
      products.set(feId, { name, colors: new Map() });
    }

    const product = products.get(feId);
    if (color && !product.colors.has(color)) {
      product.colors.set(color, sanmarPartId);
    }
  }

  return products;
}

// Get SanMar product number from redirect
async function getSanMarProductNum(feId) {
  try {
    const res = await fetch(
      `https://www.apparelvideos.com/cs/CatalogBrowser?todo=mm&productId=${feId}`,
      {
        headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" },
        redirect: "manual",
      }
    );
    const location = res.headers.get("location");
    if (location) {
      // Pattern: /p/13774_Anthracite/...
      const match = location.match(/\/p\/(\d+)_/);
      if (match) return match[1];
    }
  } catch {}
  return null;
}

// Get color image from SanMar catalog page
async function getColorImage(sanmarProductNum, colorName) {
  try {
    // Clean color name for URL (remove spaces, special chars)
    const urlColor = colorName.replace(/\s+/g, "").replace(/[\/\\]/g, "");
    const res = await fetch(
      `https://catalog.companycasuals.com/p/${sanmarProductNum}_${urlColor}`,
      {
        headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" },
        redirect: "follow",
      }
    );
    const html = await res.text();

    // Find the CDN image URL
    const match = html.match(/https:\/\/cdnp\.sanmar\.com\/medias\/sys_master\/images\/[^"]*\.jpg/);
    if (match) return match[0];
  } catch {}
  return null;
}

async function main() {
  const products = getSanMarProducts();

  // Filter to products that need images
  const needWork = [];
  for (const [feId, info] of products) {
    // Skip if we already have color images for this product
    if (colorImageCache[feId] && Object.keys(colorImageCache[feId]).length >= info.colors.size * 0.5) continue;
    needWork.push([feId, info]);
  }

  console.log(`SanMar products total: ${products.size}`);
  console.log(`Need color images: ${needWork.length}`);

  if (needWork.length === 0) {
    console.log("All done!");
    return;
  }

  let processed = 0;
  let imagesFound = 0;
  let noProductNum = 0;

  for (const [feId, info] of needWork) {
    // Step 1: Get SanMar product number
    const productNum = await getSanMarProductNum(feId);

    if (!productNum) {
      noProductNum++;
      processed++;
      if (processed % 50 === 0) {
        console.log(`  ${processed}/${needWork.length} (${imagesFound} images, ${noProductNum} no product#)`);
      }
      await new Promise(r => setTimeout(r, 500));
      continue;
    }

    // Step 2: Get image for each color
    if (!colorImageCache[feId]) colorImageCache[feId] = {};
    let firstImage = null;

    for (const [color] of info.colors) {
      if (colorImageCache[feId][color]) continue; // Already cached

      const img = await getColorImage(productNum, color);
      if (img) {
        colorImageCache[feId][color] = img;
        if (!firstImage) firstImage = img;
        imagesFound++;
      }

      await new Promise(r => setTimeout(r, DELAY_MS));
    }

    // Also set the main product image if missing
    if (firstImage && (!imageCache[feId] || imageCache[feId] === null)) {
      imageCache[feId] = firstImage;
    }

    processed++;

    // Save progress every 20 products
    if (processed % 20 === 0) {
      console.log(`  ${processed}/${needWork.length} (${imagesFound} color images found)`);
      fs.writeFileSync(COLOR_OUTPUT, JSON.stringify(colorImageCache, null, 2));
      fs.writeFileSync(IMAGE_OUTPUT, JSON.stringify(imageCache, null, 2));
    }

    await new Promise(r => setTimeout(r, 500));
  }

  // Final save
  fs.writeFileSync(COLOR_OUTPUT, JSON.stringify(colorImageCache, null, 2));
  fs.writeFileSync(IMAGE_OUTPUT, JSON.stringify(imageCache, null, 2));

  // Regen .ts files
  const ts1 = `const IMAGE_CACHE: Record<string, string | null> = ${JSON.stringify(imageCache)};\nexport default IMAGE_CACHE;\n`;
  fs.writeFileSync(path.join(__dirname, "../src/data/product-images.ts"), ts1);

  const ts2 = `const COLOR_IMAGES: Record<string, Record<string, string>> = ${JSON.stringify(colorImageCache)};\nexport default COLOR_IMAGES;\n`;
  fs.writeFileSync(path.join(__dirname, "../src/data/product-color-images.ts"), ts2);

  const totalProducts = Object.keys(colorImageCache).length;
  const totalColors = Object.values(colorImageCache).reduce((sum, obj) => sum + Object.keys(obj).length, 0);
  const totalMainImages = Object.values(imageCache).filter(Boolean).length;

  console.log(`\nDone!`);
  console.log(`Color images: ${totalProducts} products, ${totalColors} color variants`);
  console.log(`Main images: ${totalMainImages} / ${Object.keys(imageCache).length}`);
}

main().catch(console.error);
