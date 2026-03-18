import { NextRequest, NextResponse } from "next/server";

const PRINTIFY_API_KEY = process.env.PRINTIFY_API_KEY || "";
const PRINTIFY_SHOP_ID = process.env.PRINTIFY_SHOP_ID || "";

// Cache color images by blueprintId so we don't re-create temp products
const colorImageCache = new Map<string, { colorImages: Record<string, string>; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

// Known size values to distinguish from colors
const SIZE_VALUES = new Set(["XXS", "2XS", "XS", "S", "M", "L", "XL", "XXL", "2XL", "3XL", "4XL", "5XL", "6XL", "One Size", "OS", "OSFA", "2", "4", "6", "8", "10", "12", "14", "16", "0-3M", "3-6M", "6-12M", "12-18M", "18-24M", "2T", "3T", "4T", "5T", "6T", "YXS", "YS", "YM", "YL", "YXL"]);

function parseVariantTitle(title: string): { color: string; size: string } {
  const parts = title.split(" / ");
  if (parts.length >= 2) {
    const part1 = parts[0].trim();
    const part2 = parts[1].trim();
    if (SIZE_VALUES.has(part2)) return { color: part1, size: part2 };
    if (SIZE_VALUES.has(part1)) return { color: part2, size: part1 };
    return { color: part1, size: part2 };
  }
  const val = (parts[0] || "").trim();
  if (SIZE_VALUES.has(val)) return { color: "", size: val };
  return { color: val, size: "" };
}

// GET /api/catalog/product-details?blueprintId=6&provider=printify
export async function GET(req: NextRequest) {
  const blueprintId = req.nextUrl.searchParams.get("blueprintId");
  const provider = req.nextUrl.searchParams.get("provider") || "printify";

  if (!blueprintId) {
    return NextResponse.json({ error: "blueprintId required" }, { status: 400 });
  }

  if (provider === "printify") {
    try {
      // Fetch blueprint details and providers in parallel
      const [blueprintRes, providersRes] = await Promise.all([
        fetch(`https://api.printify.com/v1/catalog/blueprints/${blueprintId}.json`, {
          headers: {
            Authorization: `Bearer ${PRINTIFY_API_KEY}`,
            "User-Agent": "CreateAndSource/1.0",
          },
        }),
        fetch(`https://api.printify.com/v1/catalog/blueprints/${blueprintId}/print_providers.json`, {
          headers: {
            Authorization: `Bearer ${PRINTIFY_API_KEY}`,
            "User-Agent": "CreateAndSource/1.0",
          },
        }),
      ]);

      if (!blueprintRes.ok) {
        return NextResponse.json({ error: "Blueprint not found" }, { status: 404 });
      }

      const blueprint = await blueprintRes.json();
      const providers = await providersRes.json();

      let colors: string[] = [];
      let sizes: string[] = [];
      let colorImages: Record<string, string> = {};
      let allVariants: Array<{ id: number; title: string }> = [];
      let providerId: number | null = null;

      if (providers.length > 0) {
        providerId = providers[0].id;
        const variantsRes = await fetch(
          `https://api.printify.com/v1/catalog/blueprints/${blueprintId}/print_providers/${providerId}/variants.json`,
          {
            headers: {
              Authorization: `Bearer ${PRINTIFY_API_KEY}`,
              "User-Agent": "CreateAndSource/1.0",
            },
          }
        );

        if (variantsRes.ok) {
          const variantsData = await variantsRes.json();
          allVariants = variantsData.variants || variantsData;

          const colorSet = new Set<string>();
          const sizeSet = new Set<string>();

          for (const v of allVariants) {
            const { color, size } = parseVariantTitle(v.title || "");
            if (color) colorSet.add(color);
            if (size) sizeSet.add(size);
          }

          colors = Array.from(colorSet).sort();
          sizes = Array.from(sizeSet);
        }
      }

      // Fetch color-specific images from Printify by creating a temp product
      if (providerId && allVariants.length > 0 && colors.length > 0) {
        const cached = colorImageCache.get(blueprintId);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
          colorImages = cached.colorImages;
        } else {
          try {
            colorImages = await fetchColorImages(
              parseInt(blueprintId),
              providerId,
              allVariants,
              colors
            );
            colorImageCache.set(blueprintId, { colorImages, timestamp: Date.now() });
          } catch (e) {
            console.error("Color image fetch failed:", e);
          }
        }
      }

      const description = (blueprint.description || "")
        .replace(/<[^>]*>/g, "")
        .replace(/\s+/g, " ")
        .trim();

      return NextResponse.json({
        id: blueprint.id,
        title: blueprint.title,
        description,
        images: blueprint.images || [],
        colors,
        sizes,
        colorImages,
        printProviders: providers.slice(0, 5).map((p: { id: number; title: string }) => ({
          id: p.id,
          name: p.title,
        })),
      });
    } catch (e) {
      console.error("Product details error:", e);
      return NextResponse.json({ error: "Failed to fetch product details" }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Provider not supported" }, { status: 400 });
}

// Create a temp Printify product to get color-specific mockup images
async function fetchColorImages(
  blueprintId: number,
  providerId: number,
  allVariants: Array<{ id: number; title: string }>,
  colors: string[]
): Promise<Record<string, string>> {
  // Pick one variant per color (first size found for each color)
  const seenColors = new Set<string>();
  const selectedVariants: Array<{ id: number; color: string }> = [];

  for (const v of allVariants) {
    const { color } = parseVariantTitle(v.title || "");
    if (color && !seenColors.has(color)) {
      seenColors.add(color);
      selectedVariants.push({ id: v.id, color });
    }
    // Limit to avoid massive products
    if (selectedVariants.length >= 30) break;
  }

  if (selectedVariants.length === 0) return {};

  // Create temp product with these variants (no logo needed)
  const productRes = await fetch(
    `https://api.printify.com/v1/shops/${PRINTIFY_SHOP_ID}/products.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PRINTIFY_API_KEY}`,
        "Content-Type": "application/json",
        "User-Agent": "CreateAndSource/1.0",
      },
      body: JSON.stringify({
        title: "Color Preview Temp",
        description: "Temporary product for color images",
        blueprint_id: blueprintId,
        print_provider_id: providerId,
        variants: selectedVariants.map((v) => ({
          id: v.id,
          price: 100,
          is_enabled: true,
        })),
        print_areas: [
          {
            variant_ids: selectedVariants.map((v) => v.id),
            placeholders: [],
          },
        ],
      }),
    }
  );

  if (!productRes.ok) {
    // Try again without print_areas — some blueprints don't require them
    const retryRes = await fetch(
      `https://api.printify.com/v1/shops/${PRINTIFY_SHOP_ID}/products.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PRINTIFY_API_KEY}`,
          "Content-Type": "application/json",
          "User-Agent": "CreateAndSource/1.0",
        },
        body: JSON.stringify({
          title: "Color Preview Temp",
          description: "Temporary product for color images",
          blueprint_id: blueprintId,
          print_provider_id: providerId,
          variants: selectedVariants.map((v) => ({
            id: v.id,
            price: 100,
            is_enabled: true,
          })),
        }),
      }
    );
    if (!retryRes.ok) {
      console.error("Printify color image product creation failed:", await retryRes.text());
      return {};
    }
    const retryProduct = await retryRes.json();
    return extractColorImages(retryProduct, selectedVariants);
  }

  const product = await productRes.json();
  const colorImageMap = extractColorImages(product, selectedVariants);

  // Clean up temp product
  fetch(
    `https://api.printify.com/v1/shops/${PRINTIFY_SHOP_ID}/products/${product.id}.json`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${PRINTIFY_API_KEY}`,
        "User-Agent": "CreateAndSource/1.0",
      },
    }
  ).catch(() => {});

  return colorImageMap;
}

function extractColorImages(
  product: { images?: Array<{ src: string; variant_ids: number[] }> },
  selectedVariants: Array<{ id: number; color: string }>
): Record<string, string> {
  const images = product.images || [];

  const variantIdToColor = new Map<number, string>();
  for (const sv of selectedVariants) {
    variantIdToColor.set(sv.id, sv.color);
  }

  const colorImageMap: Record<string, string> = {};
  for (const img of images) {
    if (!img.src || !img.variant_ids?.length) continue;
    for (const vid of img.variant_ids) {
      const color = variantIdToColor.get(vid);
      if (color && !colorImageMap[color]) {
        colorImageMap[color] = img.src;
      }
    }
  }

  return colorImageMap;
}
