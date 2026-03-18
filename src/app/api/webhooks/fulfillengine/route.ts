import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

// POST /api/webhooks/fulfillengine — Receive order status updates
export async function POST(req: NextRequest) {
  const supabase = createServerClient();

  try {
    const body = await req.json();
    const { webhook, orderId, trackingNumber, trackingUrl, shippingCarrier } =
      body;

    // Find the order by provider order ID
    const { data: order } = await supabase
      .from("orders")
      .select("*")
      .eq("provider_order_id", orderId)
      .single();

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Update order based on webhook event
    switch (webhook) {
      case "order_in_progress":
        await supabase
          .from("orders")
          .update({ status: "in_production", updated_at: new Date().toISOString() })
          .eq("id", order.id);
        break;

      case "shipped":
        await supabase
          .from("orders")
          .update({
            status: "shipped",
            tracking_number: trackingNumber,
            tracking_url: trackingUrl,
            shipping_carrier: shippingCarrier,
            updated_at: new Date().toISOString(),
          })
          .eq("id", order.id);
        break;

      case "shipment_canceled":
      case "order_canceled":
        await supabase
          .from("orders")
          .update({ status: "canceled", updated_at: new Date().toISOString() })
          .eq("id", order.id);

        // Refund credits
        await supabase.rpc("refund_credits", {
          p_user_id: order.user_id,
          p_store_id: order.store_id,
          p_amount: order.total,
          p_order_id: order.id,
        });
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Fulfill Engine webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
