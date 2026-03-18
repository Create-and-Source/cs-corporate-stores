#!/usr/bin/env node

/**
 * Fetch product images from SSActivewear API
 * Maps Fulfill Engine products → SSA styles by brand + style name
 * Run: node scripts/fetch-ssa-images.js
 * Updates src/data/product-images.json with high-quality SSA images
 */

const fs = require("fs");
const path = require("path");

const SSA_ACCOUNT = "989139";
const SSA_API_KEY = "4afa39e6-f0b9-4237-92a7-acf76a8418ef";
const SSA_BASE = "https://api.ssactivewear.com/v2";
const AUTH = "Basic " + Buffer.from(`${SSA_ACCOUNT}:${SSA_API_KEY}`).toString("base64");

const PRICES_CSV = path.join(__dirname, "../src/data/fe-prices.csv");
const OUTPUT_FILE = path.join(__dirname, "../src/data/product-images.json");

// Load existing image cache
let imageCache = {};
if (fs.existsSync(OUTPUT_FILE)) {
  imageCache = JSON.parse(fs.readFileSync(OUTPUT_FILE, "utf-8"));
  console.log(`Loaded ${Object.keys(imageCache).length} cached images`);
}

// Parse FE products from CSV
function getFEProducts() {
  const csv = fs.readFileSync(PRICES_CSV, "utf-8");
  const products = [];
  const seen = new Set();
  for (const line of csv.split("\n").slice(1)) {
    const match = line.trim().match(/^"([^"]+)","([^"]+)",/);
    if (match && !seen.has(match[1])) {
      seen.add(match[1]);
      products.push({ id: match[1], name: match[2] });
    }
  }
  return products;
}

// Fetch all SSA styles
async function fetchSSAStyles() {
  console.log("Fetching SSA styles catalog...");
  const res = await fetch(`${SSA_BASE}/styles/`, {
    headers: { Authorization: AUTH, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`SSA styles API error: ${res.status}`);
  const styles = await res.json();
  console.log(`Got ${styles.length} SSA styles`);
  return styles;
}

// Build lookup maps from SSA styles
function buildSSALookup(styles) {
  const lookup = {
    byStyleName: new Map(),    // "brandName styleName" → style
    byTitle: new Map(),        // normalized title → style
    byBrandTitle: new Map(),   // "brand: title" → style
  };

  for (const s of styles) {
    const brand = s.brandName.toLowerCase().trim();
    const styleName = s.styleName?.toLowerCase().trim();
    const title = s.title?.toLowerCase().trim();

    // Key by brand + styleName (e.g., "richardson 112")
    if (styleName) {
      lookup.byStyleName.set(`${brand} ${styleName}`, s);
    }
    // Key by brand + title (e.g., "richardson trucker cap")
    if (title) {
      lookup.byBrandTitle.set(`${brand} ${title}`, s);
    }
  }

  return lookup;
}

// Try to match an FE product name to an SSA style
function matchProduct(feName, lookup) {
  const name = feName.toLowerCase().trim();

  // Known brand mappings: FE name prefix → SSA brand
  const brandMappings = [
    // Exact SSA brand names that appear as FE name prefixes
    { prefix: "richardson", brand: "richardson" },
    { prefix: "paragon", brand: "paragon" },
    { prefix: "augusta sportswear", brand: "augusta sportswear" },
    { prefix: "augusta", brand: "augusta sportswear" },
    { prefix: "american apparel", brand: "american apparel" },
    { prefix: "independent trading co.", brand: "independent trading co." },
    { prefix: "independent trading", brand: "independent trading co." },
    { prefix: "bella + canvas", brand: "bella + canvas" },
    { prefix: "bella+canvas", brand: "bella + canvas" },
    { prefix: "next level", brand: "next level" },
    { prefix: "gildan", brand: "gildan" },
    { prefix: "comfort colors", brand: "comfort colors" },
    { prefix: "hanes", brand: "hanes" },
    { prefix: "champion", brand: "champion" },
    { prefix: "adidas", brand: "adidas" },
    { prefix: "under armour", brand: "under armour" },
    { prefix: "nike", brand: "nike" },
    { prefix: "columbia", brand: "columbia" },
    { prefix: "carhartt", brand: "carhartt" },
    { prefix: "port authority", brand: "port authority" },
    { prefix: "port & company", brand: "port & company" },
    { prefix: "sport-tek", brand: "sport-tek" },
    { prefix: "district", brand: "district" },
    { prefix: "allmade", brand: "allmade" },
    { prefix: "alternative apparel", brand: "alternative apparel" },
    { prefix: "alternative", brand: "alternative apparel" },
    { prefix: "badger", brand: "badger" },
    { prefix: "bayside", brand: "bayside" },
    { prefix: "boxercraft", brand: "boxercraft" },
    { prefix: "charles river apparel", brand: "charles river apparel" },
    { prefix: "charles river", brand: "charles river apparel" },
    { prefix: "devon & jones", brand: "devon & jones" },
    { prefix: "dickies", brand: "dickies" },
    { prefix: "dri duck", brand: "dri duck" },
    { prefix: "fruit of the loom", brand: "fruit of the loom" },
    { prefix: "harriton", brand: "harriton" },
    { prefix: "holloway", brand: "holloway" },
    { prefix: "j. america", brand: "j. america" },
    { prefix: "jerzees", brand: "jerzees" },
    { prefix: "lat", brand: "lat" },
    { prefix: "liberty bags", brand: "liberty bags" },
    { prefix: "north end", brand: "north end" },
    { prefix: "rabbit skins", brand: "rabbit skins" },
    { prefix: "russell athletic", brand: "russell athletic" },
    { prefix: "spyder", brand: "spyder" },
    { prefix: "team 365", brand: "team 365" },
    { prefix: "big accessories", brand: "big accessories" },
    { prefix: "core365", brand: "core365" },
    { prefix: "flexfit", brand: "flexfit" },
    { prefix: "yupoong", brand: "yupoong" },
    { prefix: "mv sport", brand: "mv sport" },
    { prefix: "oakley", brand: "oakley" },
    { prefix: "puma", brand: "puma" },
    { prefix: "comfort wash", brand: "comfortwash by hanes" },
    { prefix: "shaka wear", brand: "shaka wear" },
  ];

  for (const { prefix, brand } of brandMappings) {
    if (!name.startsWith(prefix)) continue;

    const remainder = name.slice(prefix.length).trim();

    // Try matching brand + remainder as title
    const titleKey = `${brand} ${remainder}`;
    if (lookup.byBrandTitle.has(titleKey)) {
      return lookup.byBrandTitle.get(titleKey);
    }

    // Try extracting a style number from remainder (e.g., "112" from "112 Trucker Cap")
    const styleMatch = remainder.match(/^(\S+)/);
    if (styleMatch) {
      const styleKey = `${brand} ${styleMatch[1]}`;
      if (lookup.byStyleName.has(styleKey)) {
        return lookup.byStyleName.get(styleKey);
      }
    }

    // Try remainder words as a fuzzy title match
    const words = remainder.split(/\s+/).filter(w => w.length > 2);
    if (words.length >= 2) {
      for (const [key, style] of lookup.byBrandTitle) {
        if (!key.startsWith(brand)) continue;
        const matchCount = words.filter(w => key.includes(w)).length;
        if (matchCount >= Math.ceil(words.length * 0.7)) {
          return style;
        }
      }
    }
  }

  return null;
}

// Get the best image URL for a style
function getStyleImageUrl(style) {
  // styleImage is the main product photo
  if (style.styleImage) {
    return `https://www.ssactivewear.com/${style.styleImage}`;
  }
  return null;
}

// Fetch color-level images for a batch of style IDs
async function fetchColorImages(styleIds) {
  const results = new Map();
  const batchSize = 20;

  for (let i = 0; i < styleIds.length; i += batchSize) {
    const batch = styleIds.slice(i, i + batchSize);
    const ids = batch.join(",");

    try {
      const res = await fetch(`${SSA_BASE}/products/?styleid=${ids}`, {
        headers: { Authorization: AUTH, Accept: "application/json" },
      });
      if (res.ok) {
        const products = await res.json();
        for (const p of products) {
          if (!results.has(p.styleID)) {
            // Get the first color's front image (usually the default/hero color)
            if (p.colorFrontImage) {
              results.set(p.styleID, `https://www.ssactivewear.com/${p.colorFrontImage}`);
            }
          }
        }
      }
    } catch (e) {
      console.error(`Error fetching products for batch:`, e.message);
    }

    // Rate limit
    if (i + batchSize < styleIds.length) {
      await new Promise(r => setTimeout(r, 300));
    }
  }

  return results;
}

async function main() {
  const feProducts = getFEProducts();
  console.log(`\nFE products: ${feProducts.length}`);

  const ssaStyles = await fetchSSAStyles();
  const lookup = buildSSALookup(ssaStyles);

  // Match FE products to SSA styles
  let matched = 0;
  let unmatched = 0;
  let alreadyHadGoodImage = 0;
  const matchedProducts = []; // { feId, ssaStyle }
  const unmatchedNames = [];

  for (const fe of feProducts) {
    const style = matchProduct(fe.name, lookup);
    if (style) {
      matched++;
      matchedProducts.push({ feId: fe.id, feName: fe.name, style });
    } else {
      unmatched++;
      if (unmatchedNames.length < 30) unmatchedNames.push(fe.name);
    }
  }

  console.log(`\nMatched: ${matched} / ${feProducts.length}`);
  console.log(`Unmatched: ${unmatched}`);
  if (unmatchedNames.length > 0) {
    console.log(`\nSample unmatched:`);
    unmatchedNames.slice(0, 15).forEach(n => console.log(`  - ${n}`));
  }

  // Fetch color-level front images for matched styles (better quality than style images)
  const uniqueStyleIds = [...new Set(matchedProducts.map(m => m.style.styleID))];
  console.log(`\nFetching color images for ${uniqueStyleIds.length} unique SSA styles...`);
  const colorImages = await fetchColorImages(uniqueStyleIds);

  // Update image cache
  let updated = 0;
  let skipped = 0;
  for (const m of matchedProducts) {
    const existingImage = imageCache[m.feId];
    // Prefer color front image, fall back to style image
    const colorImg = colorImages.get(m.style.styleID);
    const styleImg = getStyleImageUrl(m.style);
    const newImage = colorImg || styleImg;

    if (!newImage) {
      skipped++;
      continue;
    }

    // Replace if: no image, null image, or low-res SAGE/promoplace thumbnail
    const shouldReplace = !existingImage || existingImage === null ||
      existingImage.includes("promoplace.com") || existingImage.includes("QPic");

    if (shouldReplace) {
      imageCache[m.feId] = newImage;
      updated++;
    } else {
      skipped++;
    }
  }

  // Save
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(imageCache, null, 2));

  const totalWithImages = Object.values(imageCache).filter(Boolean).length;
  console.log(`\nDone!`);
  console.log(`Updated: ${updated} images (replaced SAGE thumbnails with SSA photos)`);
  console.log(`Skipped: ${skipped} (already had good images or no SSA image available)`);
  console.log(`Total images in cache: ${totalWithImages} / ${Object.keys(imageCache).length}`);
  console.log(`Saved to ${OUTPUT_FILE}`);
}

main().catch(console.error);
