#!/usr/bin/env node

/**
 * Scrape product images from SAGE Product Search API
 * Run once: node scripts/scrape-sage-images.js
 * Saves to src/data/product-images.json
 */

const fs = require("fs");
const path = require("path");

const SAGE_URL = "https://www.promoplace.com/ws/ws.dll/ConnectAPI";
const SAGE_AUTH = {
  acctId: 273687,
  loginId: "createandsource",
  key: "46af4b66fd48f3c6e0963d2dce6bfb0a",
};

const PRICES_CSV = path.join(__dirname, "../src/data/fe-prices.csv");
const OUTPUT_FILE = path.join(__dirname, "../src/data/product-images.json");
const BATCH_SIZE = 1; // One SAGE search at a time to be safe
const DELAY_MS = 500;

// Load existing cache
let imageCache = {};
if (fs.existsSync(OUTPUT_FILE)) {
  imageCache = JSON.parse(fs.readFileSync(OUTPUT_FILE, "utf-8"));
}

// Get unique product names from price CSV
function getProducts() {
  const csv = fs.readFileSync(PRICES_CSV, "utf-8");
  const products = [];
  const seen = new Set();
  for (const line of csv.split("\n").slice(1)) {
    const match = line.trim().match(/^"([^"]+)","([^"]+)",/);
    if (match && !seen.has(match[1])) {
      seen.add(match[1]);
      // Skip if we already have a good image (not null)
      if (imageCache[match[1]]) continue;
      products.push({ id: match[1], name: match[2] });
    }
  }
  return products;
}

async function searchSAGE(productName, productId) {
  try {
    // Search by item number first (more precise)
    const res = await fetch(SAGE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceId: 103,
        apiVer: 130,
        auth: SAGE_AUTH,
        search: {
          itemNum: productId,
          allAudiences: true,
          maxRecs: 1,
          thumbPicRes: 300,
          sort: "BESTMATCH",
        },
      }),
    });

    const data = await res.json();
    if (data.ok && data.products && data.products.length > 0) {
      const img = data.products[0].thumbPic;
      if (img) return img;
    }

    // Fallback: search by product name
    const res2 = await fetch(SAGE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceId: 103,
        apiVer: 130,
        auth: SAGE_AUTH,
        search: {
          keywords: productName,
          allAudiences: true,
          maxRecs: 1,
          thumbPicRes: 300,
          sort: "BESTMATCH",
        },
      }),
    });

    const data2 = await res2.json();
    if (data2.ok && data2.products && data2.products.length > 0) {
      return data2.products[0].thumbPic || null;
    }
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
  const alreadyCached = Object.keys(imageCache).length;
  const withImages = Object.values(imageCache).filter(Boolean).length;

  console.log(`\nSAGE Image Scraper`);
  console.log(`Already cached: ${alreadyCached} (${withImages} with images)`);
  console.log(`Products to search: ${products.length}\n`);

  if (products.length === 0) {
    console.log("All products already cached!");
    return;
  }

  let found = 0;
  let notFound = 0;
  let queries = 0;
  const startTime = Date.now();

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const img = await searchSAGE(product.name, product.id);
    queries += img ? 1 : 2; // 1 query if itemNum hit, 2 if fallback

    if (img) {
      imageCache[product.id] = img;
      found++;
      process.stdout.write("✓ ");
    } else {
      imageCache[product.id] = null;
      notFound++;
      process.stdout.write("✗ ");
    }

    // Save every 10 products
    if ((found + notFound) % 10 === 0) {
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(imageCache, null, 2));
    }

    // Progress every 50
    if ((found + notFound) % 50 === 0) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
      console.log(
        `\n  ${found + notFound}/${products.length} | ${found} found | ~${queries} queries used | ${elapsed}s`
      );
    }

    await sleep(DELAY_MS);
  }

  // Final save
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(imageCache, null, 2));

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
  const totalWithImages = Object.values(imageCache).filter(Boolean).length;
  console.log(`\n\nDone in ${elapsed}s!`);
  console.log(`${found} new images found (${totalWithImages} total with images)`);
  console.log(`~${queries} SAGE queries used`);
  console.log(`Saved to ${OUTPUT_FILE}`);
}

main().catch(console.error);
