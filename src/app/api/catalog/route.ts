import { NextRequest, NextResponse } from "next/server";

const PRINTIFY_API_KEY = process.env.PRINTIFY_API_KEY || "";

interface PrintifyBlueprint {
  id: number;
  title: string;
  description: string;
  images: string[];
}

// GET /api/catalog?search=tee&category=Apparel&page=1
export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.get("search")?.toLowerCase() || "";
  const category = req.nextUrl.searchParams.get("category") || "All";
  const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
  const perPage = 30;

  try {
    // Fetch all blueprints from Printify
    const res = await fetch(
      "https://api.printify.com/v1/catalog/blueprints.json",
      {
        headers: {
          Authorization: `Bearer ${PRINTIFY_API_KEY}`,
          "User-Agent": "CreateAndSource/1.0",
        },
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    );

    if (!res.ok) {
      throw new Error(`Printify API error: ${res.status}`);
    }

    const blueprints: PrintifyBlueprint[] = await res.json();

    // Map to our catalog format
    let products = blueprints.map((b) => ({
      id: `printify-${b.id}`,
      name: b.title,
      description: stripHtml(b.description || ""),
      image: b.images?.[0] || null,
      category: mapCategory(b.title),
      provider: "printify" as const,
      providerId: String(b.id),
      blueprintId: b.id,
    }));

    // Filter by search
    if (search) {
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.description.toLowerCase().includes(search) ||
          p.category.toLowerCase().includes(search)
      );
    }

    // Filter by category
    if (category !== "All") {
      products = products.filter((p) => p.category === category);
    }

    // Get all unique categories for filter pills
    const allCategories = [
      ...new Set(
        blueprints.map((b) => mapCategory(b.title))
      ),
    ].sort();

    // Paginate
    const total = products.length;
    const totalPages = Math.ceil(total / perPage);
    const paginated = products.slice((page - 1) * perPage, page * perPage);

    return NextResponse.json({
      products: paginated,
      total,
      page,
      totalPages,
      categories: allCategories,
    });
  } catch (error) {
    console.error("Catalog fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch catalog", products: [], total: 0 },
      { status: 500 }
    );
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 150);
}

function mapCategory(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("shirt") || t.includes("tee") || t.includes("tank") || t.includes("crop top") || t.includes("bodysuit") || t.includes("jersey"))
    return "T-Shirts & Tops";
  if (t.includes("hoodie") || t.includes("sweatshirt") || t.includes("pullover") || t.includes("crewneck") || t.includes("crew neck") || t.includes("zip"))
    return "Hoodies & Sweats";
  if (t.includes("jacket") || t.includes("vest") || t.includes("coat") || t.includes("windbreaker"))
    return "Outerwear";
  if (t.includes("hat") || t.includes("cap") || t.includes("beanie") || t.includes("visor") || t.includes("headband") || t.includes("bucket"))
    return "Headwear";
  if (t.includes("mug") || t.includes("tumbler") || t.includes("bottle") || t.includes("cup") || t.includes("can") || t.includes("glass") || t.includes("flask") || t.includes("drinkware"))
    return "Drinkware";
  if (t.includes("bag") || t.includes("tote") || t.includes("backpack") || t.includes("pouch") || t.includes("fanny") || t.includes("duffel") || t.includes("satchel"))
    return "Bags";
  if (t.includes("poster") || t.includes("canvas") || t.includes("print") || t.includes("frame") || t.includes("tapestry") || t.includes("flag") || t.includes("banner"))
    return "Wall Art";
  if (t.includes("phone") || t.includes("case") || t.includes("laptop") || t.includes("mouse") || t.includes("charger") || t.includes("airpod"))
    return "Tech";
  if (t.includes("sticker") || t.includes("patch") || t.includes("pin") || t.includes("keychain") || t.includes("magnet") || t.includes("button") || t.includes("lanyard"))
    return "Accessories";
  if (t.includes("notebook") || t.includes("desk") || t.includes("pen") || t.includes("planner") || t.includes("calendar") || t.includes("coaster"))
    return "Office";
  if (t.includes("shorts") || t.includes("jogger") || t.includes("pant") || t.includes("legging") || t.includes("skirt") || t.includes("swimsuit") || t.includes("bikini"))
    return "Bottoms & Activewear";
  if (t.includes("blanket") || t.includes("towel") || t.includes("pillow") || t.includes("mat") || t.includes("rug") || t.includes("curtain"))
    return "Home & Living";
  if (t.includes("onesie") || t.includes("baby") || t.includes("bib") || t.includes("kid") || t.includes("toddler") || t.includes("infant") || t.includes("youth"))
    return "Kids & Baby";
  if (t.includes("sock") || t.includes("shoe") || t.includes("slipper") || t.includes("flip flop") || t.includes("sneaker") || t.includes("clog"))
    return "Footwear";
  if (t.includes("ornament") || t.includes("christmas") || t.includes("holiday") || t.includes("gift"))
    return "Seasonal";
  if (t.includes("puzzle") || t.includes("playing card") || t.includes("game"))
    return "Games & Puzzles";
  if (t.includes("apron") || t.includes("cutting board") || t.includes("oven"))
    return "Kitchen";
  return "Other";
}
