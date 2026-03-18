#!/usr/bin/env node

/**
 * Scrape product images from apparelvideos.com (SanMar CDN)
 * Run: node scripts/scrape-images.js
 * Saves to src/data/product-images.json
 */

const fs = require("fs");
const path = require("path");

const PRICES_CSV = path.join(__dirname, "../src/data/fe-prices.csv");
const OUTPUT_FILE = path.join(__dirname, "../src/data/product-images.json");
const BATCH_SIZE = 3;
const DELAY_MS = 1500;

// Load existing cache
let imageCache = {};
if (fs.existsSync(OUTPUT_FILE)) {
  imageCache = JSON.parse(fs.readFileSync(OUTPUT_FILE, "utf-8"));
  console.log(`Loaded ${Object.keys(imageCache).length} cached images`);
}

// Parse unique products from price CSV
function getProducts() {
  const csv = fs.readFileSync(PRICES_CSV, "utf-8");
  const products = [];
  const seen = new Set();
  for (const line of csv.split("\n").slice(1)) {
    const match = line.trim().match(/^"([^"]+)","([^"]+)",/);
    if (match && !imageCache[match[1]] && !seen.has(match[1])) {
      seen.add(match[1]);
      products.push({ id: match[1], name: match[2] });
    }
  }
  return products;
}

async function findImage(productId) {
  try {
    const res = await fetch(
      `https://www.apparelvideos.com/cs/CatalogBrowser?todo=mm&productId=${productId}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        },
        redirect: "follow",
      }
    );
    const html = await res.text();

    // Find product image (624Wx724H format = good size)
    const match = html.match(
      /\/\/cdnp\.sanmar\.com\/medias\/sys_master\/images\/[^"]*624Wx724H[^"]*\.jpg/
    );
    if (match) return "https:" + match[0];

    // Try any sanmar CDN product image (not logos/banners)
    const fallback = html.match(
      /\/\/cdnp\.sanmar\.com\/medias\/sys_master\/images\/[^"]*FlatFront[^"]*\.jpg/
    );
    if (fallback) return "https:" + fallback[0];

    // Any product image
    const any = html.match(
      /\/\/cdnp\.sanmar\.com\/medias\/sys_master\/images\/[^"]*\d{3,}[^"]*\.jpg/
    );
    if (any) return "https:" + any[0];
  } catch (e) {
    // skip
  }
  return null;
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const products = getProducts();
  console.log(`\nFound ${products.length} products to scrape\n`);

  if (products.length === 0) {
    console.log("All products already cached!");
    return;
  }

  let found = 0;
  let notFound = 0;
  const startTime = Date.now();

  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE);

    const results = await Promise.all(
      batch.map(async (product) => {
        const url = await findImage(product.id);
        return { id: product.id, name: product.name, url };
      })
    );

    for (const result of results) {
      if (result.url) {
        imageCache[result.id] = result.url;
        found++;
        process.stdout.write(`✓ `);
      } else {
        imageCache[result.id] = null;
        notFound++;
        process.stdout.write(`✗ `);
      }
    }

    // Save progress every batch
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(imageCache, null, 2));

    // Progress update every 30 products
    const total = found + notFound;
    if (total % 30 === 0) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
      const rate = (total / (elapsed || 1)).toFixed(1);
      console.log(
        `\n  ${total}/${products.length} | ${found} found | ${rate}/sec | ${elapsed}s elapsed`
      );
    }

    // Rate limit
    if (i + BATCH_SIZE < products.length) {
      await sleep(DELAY_MS);
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
  console.log(`\n\nDone in ${elapsed}s!`);
  console.log(`${found} images found, ${notFound} not found`);
  console.log(`Saved to ${OUTPUT_FILE}`);
}

main().catch(console.error);
