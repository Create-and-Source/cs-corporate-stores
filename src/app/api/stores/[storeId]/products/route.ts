import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

// POST /api/stores/[storeId]/products — Add a product from catalog to a store
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  const { storeId } = await params;
  const supabase = createServerClient();
  const body = await req.json();

  const {
    name,
    description,
    price,
    cost,
    category,
    provider,
    providerId,
    images,
    sizes,
    colors,
  } = body;

  const { data, error } = await supabase
    .from("products")
    .insert({
      store_id: storeId,
      name,
      description: description || "",
      price: price || 0,
      cost: cost || 0,
      category: category || "Other",
      fulfillment_provider: provider || "printify",
      provider_product_id: providerId,
      provider_variant_id: "",
      images: images || [],
      sizes: sizes || [],
      colors: colors || [],
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ product: data });
}
