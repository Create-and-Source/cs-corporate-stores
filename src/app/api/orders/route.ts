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

    // Validate required fields
    if (!userId || !storeId || !items?.length || !shippingAddress) {
      return NextResponse.json(
        { error: "Missing required fields: userId, storeId, items, shippingAddress" },
        { status: 400 }
      );
    }

    // Validate shipping address
    if (!shippingAddress.name || !shippingAddress.line1 || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zip) {
      return NextResponse.json(
        { error: "Incomplete shipping address" },
        { status: 400 }
      );
    }

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

    if (!products || products.length === 0) {
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

    // 6. Submit to fulfillment providers BEFORE deducting credits
    // Group items by provider
    const feItems = products.filter(
      (p: { fulfillment_provider: string }) =>
        p.fulfillment_provider === "fulfill_engine"
    );
    const printifyItems = products.filter(
      (p: { fulfillment_provider: string }) =>
        p.fulfillment_provider === "printify"
    );

    // Track provider order IDs separately
    let feOrderId: string | null = null;
    let printifyOrderId: string | null = null;
    const providers: string[] = [];

    try {
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
        feOrderId = feOrder.orderId;
        providers.push("fulfill_engine");
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
        printifyOrderId = pOrder.id;
        providers.push("printify");
      }
    } catch (providerError) {
      // Provider submission failed — cancel the order, don't deduct credits
      await supabase
        .from("orders")
        .update({ status: "canceled", updated_at: new Date().toISOString() })
        .eq("id", order.id);

      console.error("Fulfillment provider error:", providerError);
      return NextResponse.json(
        { error: "Order could not be submitted to fulfillment provider. No credits were charged." },
        { status: 502 }
      );
    }

    // 7. Provider submission succeeded — now deduct credits
    await supabase.rpc("deduct_credits", {
      p_user_id: userId,
      p_store_id: storeId,
      p_amount: total,
      p_order_id: order.id,
    });

    // 8. Update order with provider info (store both if mixed)
    const providerLabel = providers.length > 1 ? providers.join("+") : providers[0] || "pending";
    const providerOrderIds = [feOrderId, printifyOrderId].filter(Boolean).join("|");

    await supabase
      .from("orders")
      .update({
        provider_order_id: providerOrderIds,
        fulfillment_provider: providerLabel,
        status: "submitted",
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    return NextResponse.json({ order: { ...order, status: "submitted" } });
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
