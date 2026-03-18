import { NextRequest, NextResponse } from "next/server";

const PRINTIFY_API_KEY = process.env.PRINTIFY_API_KEY || "";

// GET /api/catalog/product-details?blueprintId=6
// Returns full product details including all color images and variants
export async function GET(req: NextRequest) {
  const blueprintId = req.nextUrl.searchParams.get("blueprintId");
  const provider = req.nextUrl.searchParams.get("provider") || "printify";

  if (!blueprintId) {
    return NextResponse.json({ error: "blueprintId required" }, { status: 400 });
  }

  if (provider === "printify") {
    try {
      // Fetch blueprint details (has all images)
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

      // Get variants from first provider to extract colors/sizes
      let colors: string[] = [];
      let sizes: string[] = [];

      if (providers.length > 0) {
        const variantsRes = await fetch(
          `https://api.printify.com/v1/catalog/blueprints/${blueprintId}/print_providers/${providers[0].id}/variants.json`,
          {
            headers: {
              Authorization: `Bearer ${PRINTIFY_API_KEY}`,
              "User-Agent": "CreateAndSource/1.0",
            },
          }
        );

        if (variantsRes.ok) {
          const variantsData = await variantsRes.json();
          const variants = variantsData.variants || variantsData;

          // Extract unique colors and sizes
          const colorSet = new Set<string>();
          const sizeSet = new Set<string>();

          // Known size values to distinguish from colors
          const sizeValues = new Set(["XXS", "2XS", "XS", "S", "M", "L", "XL", "XXL", "2XL", "3XL", "4XL", "5XL", "6XL", "One Size", "OS", "OSFA", "2", "4", "6", "8", "10", "12", "14", "16", "0-3M", "3-6M", "6-12M", "12-18M", "18-24M", "2T", "3T", "4T", "5T", "6T", "YXS", "YS", "YM", "YL", "YXL"]);

          for (const v of variants) {
            const title = v.title || "";
            const parts = title.split(" / ");
            if (parts.length >= 2) {
              // First part is usually color, second is size
              const part1 = parts[0].trim();
              const part2 = parts[1].trim();

              if (sizeValues.has(part2)) {
                colorSet.add(part1);
                sizeSet.add(part2);
              } else if (sizeValues.has(part1)) {
                sizeSet.add(part1);
                colorSet.add(part2);
              } else {
                colorSet.add(part1);
                sizeSet.add(part2);
              }
            } else if (parts.length === 1) {
              const val = parts[0].trim();
              if (sizeValues.has(val)) {
                sizeSet.add(val);
              } else {
                colorSet.add(val);
              }
            }
          }

          colors = Array.from(colorSet).sort();
          sizes = Array.from(sizeSet);
        }
      }

      // Strip HTML from description
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
        printProviders: providers.slice(0, 5).map((p: { id: number; title: string }) => ({
          id: p.id,
          name: p.title,
        })),
      });
    } catch (e) {
      return NextResponse.json({ error: "Failed to fetch product details" }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Provider not supported" }, { status: 400 });
}
