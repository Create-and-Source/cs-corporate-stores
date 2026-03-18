"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Package, Truck, CheckCircle, Clock, XCircle, ArrowLeft } from "lucide-react";
import { StoreHeader } from "@/components/store/StoreHeader";
import { StoreFooter } from "@/components/store/StoreFooter";
import { useCart } from "@/lib/cart";
import { supabase } from "@/lib/supabase";

interface Order {
  id: string;
  total: number;
  status: string;
  tracking_number: string | null;
  tracking_url: string | null;
  shipping_carrier: string | null;
  created_at: string;
  order_items: Array<{
    id: string;
    product_name: string;
    quantity: number;
    size: string;
    color: string;
    price: number;
    image_url: string | null;
  }>;
}

const STATUS_CONFIG: Record<string, { icon: typeof Clock; label: string; color: string }> = {
  pending: { icon: Clock, label: "Pending", color: "text-warning bg-warning/10" },
  submitted: { icon: Package, label: "Submitted", color: "text-kraft-dark bg-kraft/20" },
  in_production: { icon: Package, label: "In Production", color: "text-kraft-dark bg-kraft/20" },
  shipped: { icon: Truck, label: "Shipped", color: "text-blue-700 bg-blue-50" },
  delivered: { icon: CheckCircle, label: "Delivered", color: "text-success bg-success/10" },
  canceled: { icon: XCircle, label: "Canceled", color: "text-error bg-error/10" },
};

export default function OrdersPage() {
  const params = useParams();
  const slug = params.slug as string;
  const cart = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeName, setStoreName] = useState("Store");

  useEffect(() => {
    async function load() {
      const { data: store } = await supabase.from("stores").select("company_name").eq("slug", slug).single();
      if (store) setStoreName(store.company_name || "Store");

      const { data } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });

      if (data) setOrders(data);
      setLoading(false);
    }
    load();
  }, [slug]);

  return (
    <div className="min-h-screen bg-white">
      <StoreHeader
        companyName={storeName}
        logoUrl={null}
        creditBalance={15000}
        cartCount={cart.count}
        isAdmin={true}
        storeSlug={slug}
      />

      <div className="max-w-4xl mx-auto px-6 py-10">
        <a
          href={`/store/${slug}`}
          className="inline-flex items-center gap-2 text-smoky text-sm hover:text-black transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          Back to Store
        </a>

        <h1 className="text-3xl font-bold tracking-tight mb-10">Your Orders</h1>

        {loading ? (
          <div className="text-center py-16 text-smoky">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <Package size={48} className="mx-auto text-kraft mb-4" />
            <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
            <p className="text-smoky text-sm">Your order history will appear here</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              const StatusIcon = config.icon;

              return (
                <div key={order.id} className="border border-gray-100 p-5">
                  {/* Order header */}
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-50">
                    <div>
                      <p className="text-[10px] tracking-[0.15em] uppercase text-smoky">
                        Order placed{" "}
                        {new Date(order.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                      <p className="text-xs text-smoky mt-0.5">
                        #{order.id.slice(0, 8)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] tracking-[0.1em] uppercase font-medium ${config.color}`}
                      >
                        <StatusIcon size={12} />
                        {config.label}
                      </span>
                      <p className="font-bold">
                        ${(order.total / 100).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Order items */}
                  <div className="space-y-3">
                    {order.order_items?.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-4"
                      >
                        <div className="w-14 h-14 bg-off-white flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.product_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package size={16} className="text-kraft" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {item.product_name}
                          </p>
                          <p className="text-xs text-smoky">
                            {item.color} / {item.size} · Qty {item.quantity}
                          </p>
                        </div>
                        <p className="text-sm font-medium">
                          ${((item.price * item.quantity) / 100).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Tracking */}
                  {order.tracking_number && (
                    <div className="mt-4 pt-4 border-t border-gray-50">
                      <p className="text-xs text-smoky">
                        {order.shipping_carrier && (
                          <span className="uppercase font-medium">
                            {order.shipping_carrier} ·{" "}
                          </span>
                        )}
                        Tracking:{" "}
                        {order.tracking_url ? (
                          <a
                            href={order.tracking_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-kraft-dark hover:text-black font-medium"
                          >
                            {order.tracking_number}
                          </a>
                        ) : (
                          <span className="font-medium">{order.tracking_number}</span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <StoreFooter companyName={storeName} />
    </div>
  );
}
