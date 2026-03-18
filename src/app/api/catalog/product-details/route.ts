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

          for (const v of variants) {
            const title = v.title || "";
            const parts = title.split(" / ");
            if (parts.length >= 2) {
              colorSet.add(parts[0].trim());
              sizeSet.add(parts[1].trim());
            } else if (parts.length === 1) {
              colorSet.add(parts[0].trim());
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
