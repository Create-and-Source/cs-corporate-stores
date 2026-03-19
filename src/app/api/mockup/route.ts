import { NextRequest, NextResponse } from "next/server";

const PRINTIFY_API_KEY = process.env.PRINTIFY_API_KEY || "";
const PRINTIFY_SHOP_ID = process.env.PRINTIFY_SHOP_ID || "";

// POST /api/mockup — Generate a product mockup with the client's logo
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { blueprintId, imageUrl, position = "front", color, category } = body;

    if (!blueprintId || !imageUrl) {
      return NextResponse.json(
        { error: "blueprintId and imageUrl are required" },
        { status: 400 }
      );
    }

    // Step 1: Upload the image to Printify
    const uploadRes = await fetch("https://api.printify.com/v1/uploads/images.json", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PRINTIFY_API_KEY}`,
        "Content-Type": "application/json",
        "User-Agent": "CreateAndSource/1.0",
      },
      body: JSON.stringify({
        file_name: "logo.png",
        url: imageUrl,
      }),
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      return NextResponse.json(
        { error: "Failed to upload image to Printify", details: err },
        { status: 400 }
      );
    }

    const uploadData = await uploadRes.json();
    const printifyImageId = uploadData.id;

    // Step 2: Get a print provider for this blueprint
    const providersRes = await fetch(
      `https://api.printify.com/v1/catalog/blueprints/${blueprintId}/print_providers.json`,
      {
        headers: {
          Authorization: `Bearer ${PRINTIFY_API_KEY}`,
          "User-Agent": "CreateAndSource/1.0",
        },
      }
    );

    const providers = await providersRes.json();
    if (!providers.length) {
      return NextResponse.json(
        { error: "No print providers available for this product" },
        { status: 400 }
      );
    }

    const providerId = providers[0].id;

    // Step 3: Get variants for this provider
    const variantsRes = await fetch(
      `https://api.printify.com/v1/catalog/blueprints/${blueprintId}/print_providers/${providerId}/variants.json`,
      {
        headers: {
          Authorization: `Bearer ${PRINTIFY_API_KEY}`,
          "User-Agent": "CreateAndSource/1.0",
        },
      }
    );

    const variantsData = await variantsRes.json();
    const variants = variantsData.variants || variantsData;
    if (!variants.length) {
      return NextResponse.json(
        { error: "No variants available" },
        { status: 400 }
      );
    }

    // Filter variants by selected color if provided
    let matchedVariants = variants;
    if (color) {
      const colorLower = color.toLowerCase();
      const colorFiltered = variants.filter((v: { id: number; title?: string }) => {
        const title = (v.title || "").toLowerCase();
        // Variant titles are "Color / Size" format
        const colorPart = title.split(" / ")[0]?.trim();
        return colorPart === colorLower;
      });
      if (colorFiltered.length > 0) {
        matchedVariants = colorFiltered;
      }
    }

    // Pick first few variants for mockup
    const selectedVariants = matchedVariants.slice(0, 3).map((v: { id: number }) => ({
      id: v.id,
      price: 2500,
      is_enabled: true,
    }));

    const allVariantIds = selectedVariants.map((v: { id: number }) => v.id);

    // Determine Printify placeholder position and image placement
    // Printify positions: "front", "back", etc. — x/y are 0-1 center coords, scale is relative size
    const cat = (category || "").toLowerCase();
    const isDrinkware = cat.includes("drinkware") || cat.includes("mug") || cat.includes("tumbler") || cat.includes("bottle");
    const isHeadwear = cat.includes("headwear") || cat.includes("hat") || cat.includes("cap") || cat.includes("beanie");
    const isBag = cat.includes("bag") || cat.includes("tote") || cat.includes("backpack");
    const isAccessory = cat.includes("accessory") || cat.includes("phone") || cat.includes("tech") || cat.includes("sticker");

    const isLeftChest = position === "left_chest";
    const isRightChest = position === "right_chest";
    const printifyPosition = (isLeftChest || isRightChest) ? "front" : position;

    // Smart placement by product type
    let imgX = 0.5;
    let imgY = 0.5;
    let imgScale = 1;

    if (isDrinkware) {
      // Center on the mug/tumbler surface
      imgX = 0.5;
      imgY = 0.45;
      imgScale = 0.6;
    } else if (isHeadwear) {
      // Front panel of cap
      imgX = 0.5;
      imgY = 0.45;
      imgScale = 0.5;
    } else if (isBag) {
      // Center of bag face
      imgX = 0.5;
      imgY = 0.45;
      imgScale = 0.5;
    } else if (isAccessory) {
      // Center, fill more of the surface
      imgX = 0.5;
      imgY = 0.5;
      imgScale = 0.7;
    } else if (isLeftChest) {
      imgX = 0.34;
      imgY = 0.39;
      imgScale = 0.35;
    } else if (isRightChest) {
      imgX = 0.66;
      imgY = 0.39;
      imgScale = 0.35;
    }

    // Step 4: Create a temporary product with the logo
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
          title: "Mockup Preview",
          description: "Temporary mockup for preview",
          blueprint_id: blueprintId,
          print_provider_id: providerId,
          variants: selectedVariants,
          print_areas: [
            {
              variant_ids: allVariantIds,
              placeholders: [
                {
                  position: printifyPosition,
                  images: [
                    {
                      id: printifyImageId,
                      x: imgX,
                      y: imgY,
                      scale: imgScale,
                      angle: 0,
                    },
                  ],
                },
              ],
            },
          ],
        }),
      }
    );

    if (!productRes.ok) {
      const err = await productRes.text();
      return NextResponse.json(
        { error: "Failed to create mockup product", details: err },
        { status: 400 }
      );
    }

    const product = await productRes.json();

    // The product response includes mockup images
    const mockupImages = product.images || [];

    // Step 5: Clean up — delete the temp product after getting images
    // (do this async, don't wait)
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

    return NextResponse.json({
      mockups: mockupImages,
      productId: product.id,
    });
  } catch (error) {
    console.error("Mockup generation error:", error);
    return NextResponse.json(
      { error: "Mockup generation failed" },
      { status: 500 }
    );
  }
}
