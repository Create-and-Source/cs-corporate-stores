"use client";

import { useState, useEffect } from "react";
import { Package, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Order {
  id: string;
  total: number;
  status: string;
  tracking_number: string | null;
  tracking_url: string | null;
  shipping_carrier: string | null;
  fulfillment_provider: string | null;
  provider_order_id: string | null;
  created_at: string;
  store?: { company_name: string };
  user?: { full_name: string; email: string };
  order_items?: Array<{
    product_name: string;
    quantity: number;
    size: string;
    color: string;
    price: number;
  }>;
}

export default function OpsOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });

      if (data) {
        // Enrich with store and user names
        const [storesRes, usersRes] = await Promise.all([
          supabase.from("stores").select("id, company_name"),
          supabase.from("users").select("id, full_name, email"),
        ]);

        const stores = storesRes.data || [];
        const users = usersRes.data || [];

        const enriched = data.map((o) => ({
          ...o,
          store: stores.find((s) => s.id === o.store_id),
          user: users.find((u) => u.id === o.user_id),
        }));

        setOrders(enriched);
      }
      setLoading(false);
    }
    load();
  }, []);

  const filtered = orders.filter((o) => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        o.id.toLowerCase().includes(s) ||
        o.store?.company_name?.toLowerCase().includes(s) ||
        o.user?.full_name?.toLowerCase().includes(s) ||
        o.user?.email?.toLowerCase().includes(s)
      );
    }
    return true;
  });

  const totalRevenue = filtered.reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">All Orders</h1>
          <p className="text-sm text-smoky mt-1">
            {filtered.length} orders · ${(totalRevenue / 100).toFixed(2)} total
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-smoky" />
          <input
            type="text"
            placeholder="Search orders, stores, customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 text-sm focus:outline-none focus:border-kraft"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-kraft"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="submitted">Submitted</option>
          <option value="in_production">In Production</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="canceled">Canceled</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-gray-100">
        {loading ? (
          <div className="p-12 text-center text-smoky">Loading orders...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Package size={36} className="mx-auto text-kraft mb-3" />
            <p className="text-smoky">No orders found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-off-white/50">
                {["Order", "Store", "Customer", "Items", "Total", "Margin", "Status", "Date"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-[10px] tracking-[0.15em] uppercase text-smoky font-medium"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => {
                const isExpanded = expandedOrder === order.id;
                const itemCount = order.order_items?.reduce((s, i) => s + i.quantity, 0) || 0;
                const estimatedMargin = order.total * 0.3; // 30% margin estimate

                return (
                  <>
                    <tr
                      key={order.id}
                      onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                      className="border-b border-gray-50 hover:bg-off-white/30 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 text-xs font-mono">
                        #{order.id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3 text-xs font-medium">
                        {order.store?.company_name || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium">{order.user?.full_name || "—"}</p>
                        <p className="text-[10px] text-smoky">{order.user?.email || ""}</p>
                      </td>
                      <td className="px-4 py-3 text-xs">{itemCount} items</td>
                      <td className="px-4 py-3 text-xs font-bold">
                        ${(order.total / 100).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-success">
                        +${(estimatedMargin / 100).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-4 py-3 text-xs text-smoky">
                        {new Date(order.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                    </tr>

                    {/* Expanded row */}
                    {isExpanded && (
                      <tr key={`${order.id}-detail`}>
                        <td colSpan={8} className="px-4 py-4 bg-off-white/50">
                          <div className="grid grid-cols-2 gap-6">
                            {/* Items */}
                            <div>
                              <p className="text-[10px] tracking-[0.15em] uppercase text-smoky mb-2 font-medium">
                                Order Items
                              </p>
                              <div className="space-y-2">
                                {order.order_items?.map((item, i) => (
                                  <div key={i} className="flex justify-between text-xs">
                                    <span>
                                      {item.product_name} · {item.color} / {item.size} × {item.quantity}
                                    </span>
                                    <span className="font-medium">
                                      ${((item.price * item.quantity) / 100).toFixed(2)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Fulfillment */}
                            <div>
                              <p className="text-[10px] tracking-[0.15em] uppercase text-smoky mb-2 font-medium">
                                Fulfillment
                              </p>
                              <div className="text-xs space-y-1">
                                <p>
                                  <span className="text-smoky">Provider:</span>{" "}
                                  {order.fulfillment_provider?.replace(/_/g, " ") || "Not submitted"}
                                </p>
                                <p>
                                  <span className="text-smoky">Provider Order:</span>{" "}
                                  {order.provider_order_id || "—"}
                                </p>
                                {order.tracking_number && (
                                  <p>
                                    <span className="text-smoky">Tracking:</span>{" "}
                                    {order.tracking_url ? (
                                      <a href={order.tracking_url} target="_blank" rel="noopener noreferrer" className="text-kraft-dark hover:text-black">
                                        {order.tracking_number}
                                      </a>
                                    ) : (
                                      order.tracking_number
                                    )}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-warning/10 text-warning",
    submitted: "bg-kraft/20 text-kraft-dark",
    in_production: "bg-blue-50 text-blue-600",
    shipped: "bg-purple-50 text-purple-600",
    delivered: "bg-success/10 text-success",
    canceled: "bg-error/10 text-error",
  };

  return (
    <span className={`text-[9px] tracking-[0.1em] uppercase font-medium px-2 py-1 ${styles[status] || "bg-gray-100 text-gray-600"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}
