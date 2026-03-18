"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Package, Search, Clock, Truck, CheckCircle, ArrowLeft } from "lucide-react";
import { StoreHeader } from "@/components/store/StoreHeader";
import { StoreFooter } from "@/components/store/StoreFooter";
import { supabase } from "@/lib/supabase";

interface Order {
  id: string;
  total: number;
  status: string;
  tracking_number: string | null;
  tracking_url: string | null;
  created_at: string;
  user_name: string;
  user_email: string;
  items: Array<{
    product_name: string;
    quantity: number;
    size: string;
    color: string;
    price: number;
  }>;
}

export default function AdminOrdersPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [storeName, setStoreName] = useState("Store");

  useEffect(() => {
    async function load() {
      const { data: store } = await supabase.from("stores").select("id, company_name").eq("slug", slug).single();
      if (!store) { setLoading(false); return; }
      setStoreName(store.company_name || "Store");

      const [ordersRes, usersRes, itemsRes] = await Promise.all([
        supabase.from("orders").select("*").eq("store_id", store.id).order("created_at", { ascending: false }),
        supabase.from("users").select("id, full_name, email").eq("store_id", store.id),
        supabase.from("order_items").select("*"),
      ]);

      const users = usersRes.data || [];
      const items = itemsRes.data || [];

      const enriched = (ordersRes.data || []).map((o) => {
        const user = users.find((u) => u.id === o.user_id);
        const orderItems = items.filter((i) => i.order_id === o.id);
        return {
          ...o,
          user_name: user?.full_name || "—",
          user_email: user?.email || "",
          items: orderItems,
        };
      });

      setOrders(enriched);
      setLoading(false);
    }
    load();
  }, [slug]);

  const filtered = orders.filter((o) => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return o.user_name.toLowerCase().includes(s) || o.id.includes(s) || o.user_email.toLowerCase().includes(s);
    }
    return true;
  });

  const totalRevenue = filtered.reduce((s, o) => s + o.total, 0);

  return (
    <div className="min-h-screen bg-white">
      <StoreHeader companyName={storeName} logoUrl={null} creditBalance={0} cartCount={0} isAdmin={true} storeSlug={slug} />

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <a href={`/store/${slug}/admin`} className="inline-flex items-center gap-1 text-xs text-smoky hover:text-black mb-2">
              <ArrowLeft size={12} /> Back to Dashboard
            </a>
            <h1 className="text-3xl font-bold tracking-tight">All Orders</h1>
            <p className="text-sm text-smoky mt-1">{filtered.length} orders · ${(totalRevenue / 100).toFixed(2)} total</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-smoky" />
            <input type="text" placeholder="Search by employee name or order ID..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-kraft" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-kraft">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="submitted">Submitted</option>
            <option value="in_production">In Production</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>

        {/* Status summary */}
        <div className="flex gap-3 mb-6">
          {[
            { s: "pending", label: "Pending", icon: Clock, color: "text-warning bg-warning/10" },
            { s: "in_production", label: "Production", icon: Package, color: "text-blue-600 bg-blue-50" },
            { s: "shipped", label: "Shipped", icon: Truck, color: "text-purple-600 bg-purple-50" },
            { s: "delivered", label: "Delivered", icon: CheckCircle, color: "text-success bg-success/10" },
          ].map((item) => {
            const count = orders.filter((o) => o.status === item.s).length;
            return (
              <button key={item.s} onClick={() => setStatusFilter(statusFilter === item.s ? "all" : item.s)}
                className={`flex items-center gap-2 px-4 py-2 border transition-colors ${statusFilter === item.s ? "border-black" : "border-gray-100 hover:border-kraft"}`}>
                <item.icon size={14} className={item.color.split(" ")[0]} />
                <span className="text-xs font-medium">{count}</span>
                <span className="text-[10px] text-smoky">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Orders */}
        {loading ? (
          <p className="text-smoky text-center py-12">Loading...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Package size={36} className="mx-auto text-kraft mb-3" />
            <p className="font-semibold">No orders found</p>
          </div>
        ) : (
          <div className="border border-gray-100">
            {filtered.map((order) => (
              <div key={order.id}>
                <button onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                  className="w-full flex items-center justify-between p-4 border-b border-gray-50 hover:bg-off-white/30 transition-colors text-left">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm font-medium">{order.user_name}</p>
                      <p className="text-[10px] text-smoky">{order.user_email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <p className="text-xs text-smoky">{order.items.reduce((s, i) => s + i.quantity, 0)} items</p>
                    <p className="text-sm font-bold">${(order.total / 100).toFixed(2)}</p>
                    <span className={`text-[9px] tracking-[0.1em] uppercase font-medium px-2 py-1 ${{
                      pending: "bg-warning/10 text-warning",
                      submitted: "bg-kraft/20 text-kraft-dark",
                      in_production: "bg-blue-50 text-blue-600",
                      shipped: "bg-purple-50 text-purple-600",
                      delivered: "bg-success/10 text-success",
                    }[order.status] || "bg-gray-100 text-gray-500"}`}>
                      {order.status.replace(/_/g, " ")}
                    </span>
                    <p className="text-xs text-smoky w-16 text-right">
                      {new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                </button>

                {expandedId === order.id && (
                  <div className="px-4 py-4 bg-off-white/50 border-b border-gray-100">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-[10px] tracking-[0.15em] uppercase text-smoky mb-2 font-medium">Items</p>
                        {order.items.map((item, i) => (
                          <div key={i} className="flex justify-between text-xs mb-1">
                            <span>{item.product_name} · {item.color}/{item.size} ×{item.quantity}</span>
                            <span className="font-medium">${((item.price * item.quantity) / 100).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                      <div>
                        <p className="text-[10px] tracking-[0.15em] uppercase text-smoky mb-2 font-medium">Tracking</p>
                        {order.tracking_number ? (
                          <p className="text-xs">
                            {order.tracking_url ? (
                              <a href={order.tracking_url} target="_blank" rel="noopener noreferrer" className="text-kraft-dark hover:text-black font-medium">
                                {order.tracking_number}
                              </a>
                            ) : order.tracking_number}
                          </p>
                        ) : (
                          <p className="text-xs text-smoky">No tracking yet</p>
                        )}
                        <p className="text-[10px] text-smoky mt-2">Order #{order.id.slice(0, 8)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <StoreFooter companyName={storeName} />
    </div>
  );
}
