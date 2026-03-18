import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

// POST /api/webhooks/printify — Receive order status updates from Printify
export async function POST(req: NextRequest) {
  const supabase = createServerClient();

  try {
    const body = await req.json();
    const { type, resource } = body;

    // Find order by Printify order ID
    const { data: order } = await supabase
      .from("orders")
      .select("*")
      .eq("provider_order_id", resource?.id)
      .single();

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    switch (type) {
      case "order:shipped":
        const shipment = resource?.shipments?.[0];
        await supabase
          .from("orders")
          .update({
            status: "shipped",
            tracking_number: shipment?.tracking_number,
            tracking_url: shipment?.tracking_url,
            shipping_carrier: shipment?.carrier,
            updated_at: new Date().toISOString(),
          })
          .eq("id", order.id);
        break;

      case "order:canceled":
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
    console.error("Printify webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
