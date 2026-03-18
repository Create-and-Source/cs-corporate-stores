import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import crypto from "crypto";

const WEBHOOK_SECRET = process.env.PRINTIFY_WEBHOOK_SECRET || "";

// Verify Printify webhook signature
function verifySignature(payload: string, signature: string | null): boolean {
  if (!WEBHOOK_SECRET || !signature) return !WEBHOOK_SECRET; // Skip if no secret configured
  const expected = crypto.createHmac("sha256", WEBHOOK_SECRET).update(payload).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

// POST /api/webhooks/printify — Receive order status updates from Printify
export async function POST(req: NextRequest) {
  const supabase = createServerClient();

  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-printify-hmac-sha256");

    if (!verifySignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const body = JSON.parse(rawBody);
    const { type, resource } = body;

    // Find order by Printify order ID
    const { data: order } = await supabase
      .from("orders")
      .select("*")
      .eq("provider_order_id", resource?.id)
      .single();

    if (!order) {
      // Also check for mixed-provider orders (pipe-separated IDs)
      const { data: mixedOrder } = await supabase
        .from("orders")
        .select("*")
        .like("provider_order_id", `%${resource?.id}%`)
        .single();

      if (!mixedOrder) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }
      // Use the mixed order
      Object.assign(order || {}, mixedOrder);
    }

    const targetOrder = order!;

    switch (type) {
      case "order:shipped": {
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
          .eq("id", targetOrder.id);
        break;
      }

      case "order:canceled":
        await supabase
          .from("orders")
          .update({ status: "canceled", updated_at: new Date().toISOString() })
          .eq("id", targetOrder.id);

        // Refund credits
        await supabase.rpc("refund_credits", {
          p_user_id: targetOrder.user_id,
          p_store_id: targetOrder.store_id,
          p_amount: targetOrder.total,
          p_order_id: targetOrder.id,
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
