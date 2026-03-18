import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { createFulfillEngineOrder } from "@/lib/fulfill-engine";
import { createPrintifyOrder } from "@/lib/printify";

// POST /api/orders — Create a new order using credits
export async function POST(req: NextRequest) {
  const supabase = createServerClient();

  try {
    const body = await req.json();
    const { userId, storeId, items, shippingAddress } = body;

    // 1. Verify user and get credit balance
    const { data: user } = await supabase
      .from("users")
      .select("*, credit_balances(*)")
      .eq("id", userId)
      .eq("store_id", storeId)
      .single();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 2. Get products and calculate total
    const productIds = items.map((i: { product_id: string }) => i.product_id);
    const { data: products } = await supabase
      .from("products")
      .select("*")
      .in("id", productIds);

    if (!products) {
      return NextResponse.json(
        { error: "Products not found" },
        { status: 404 }
      );
    }

    const total = items.reduce(
      (sum: number, item: { product_id: string; quantity: number }) => {
        const product = products.find(
          (p: { id: string }) => p.id === item.product_id
        );
        return sum + (product?.price || 0) * item.quantity;
      },
      0
    );

    // 3. Check credit balance
    const balance = user.credit_balances?.[0]?.balance || 0;
    if (balance < total) {
      return NextResponse.json(
        { error: "Insufficient credits", balance, total },
        { status: 400 }
      );
    }

    // 4. Create order in database
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        store_id: storeId,
        user_id: userId,
        total,
        status: "pending",
        shipping_address: shippingAddress,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // 5. Create order items
    const orderItems = items.map(
      (item: {
        product_id: string;
        quantity: number;
        size: string;
        color: string;
      }) => {
        const product = products.find(
          (p: { id: string }) => p.id === item.product_id
        );
        return {
          order_id: order.id,
          product_id: item.product_id,
          product_name: product?.name,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
          price: product?.price,
          image_url: product?.images?.[0],
        };
      }
    );

    await supabase.from("order_items").insert(orderItems);

    // 6. Deduct credits
    await supabase.rpc("deduct_credits", {
      p_user_id: userId,
      p_store_id: storeId,
      p_amount: total,
      p_order_id: order.id,
    });

    // 7. Submit to fulfillment provider
    // Group items by provider
    const feItems = products.filter(
      (p: { fulfillment_provider: string }) =>
        p.fulfillment_provider === "fulfill_engine"
    );
    const printifyItems = products.filter(
      (p: { fulfillment_provider: string }) =>
        p.fulfillment_provider === "printify"
    );

    if (feItems.length > 0) {
      const feOrder = await createFulfillEngineOrder({
        customId: order.id,
        items: feItems.map(
          (p: { provider_product_id: string; id: string }) => ({
            sku: p.provider_product_id,
            quantity:
              items.find(
                (i: { product_id: string }) => i.product_id === p.id
              )?.quantity || 1,
          })
        ),
        shippingAddress,
        email: user.email,
      });

      await supabase
        .from("orders")
        .update({
          provider_order_id: feOrder.orderId,
          fulfillment_provider: "fulfill_engine",
          status: "submitted",
        })
        .eq("id", order.id);
    }

    if (printifyItems.length > 0) {
      const pOrder = await createPrintifyOrder({
        externalId: order.id,
        items: printifyItems.map(
          (p: {
            provider_product_id: string;
            provider_variant_id: string;
            id: string;
          }) => ({
            productId: p.provider_product_id,
            variantId: parseInt(p.provider_variant_id),
            quantity:
              items.find(
                (i: { product_id: string }) => i.product_id === p.id
              )?.quantity || 1,
          })
        ),
        shippingAddress,
        email: user.email,
      });

      await supabase
        .from("orders")
        .update({
          provider_order_id: pOrder.id,
          fulfillment_provider: "printify",
          status: "submitted",
        })
        .eq("id", order.id);
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
