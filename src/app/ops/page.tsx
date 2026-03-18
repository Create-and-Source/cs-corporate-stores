"use client";

import { useState, useEffect } from "react";
import {
  DollarSign,
  Package,
  Store,
  Users,
  TrendingUp,
  Clock,
  Truck,
  CheckCircle,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingBag,
  CreditCard,
  BarChart3,
  Layers,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function OpsDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalMargin: 0,
    totalOrders: 0,
    totalStores: 0,
    totalEmployees: 0,
    totalCreditsLoaded: 0,
    totalCreditsSpent: 0,
    totalCreditsRemaining: 0,
    totalProducts: 0,
    feOrders: 0,
    printifyOrders: 0,
    ordersByStatus: {} as Record<string, number>,
    recentOrders: [] as Array<{
      id: string;
      total: number;
      status: string;
      created_at: string;
      store_name: string;
      user_name: string;
      item_count: number;
      provider: string;
    }>,
    topProducts: [] as Array<{
      name: string;
      count: number;
      revenue: number;
    }>,
    storeBreakdown: [] as Array<{
      name: string;
      orders: number;
      revenue: number;
      employees: number;
      credits: number;
    }>,
  });

  useEffect(() => {
    async function load() {
      const [ordersRes, storesRes, usersRes, productsRes, creditsRes, orderItemsRes, transactionsRes] =
        await Promise.all([
          supabase.from("orders").select("*").order("created_at", { ascending: false }),
          supabase.from("stores").select("*"),
          supabase.from("users").select("*"),
          supabase.from("products").select("id, name, price, cost"),
          supabase.from("credit_balances").select("*"),
          supabase.from("order_items").select("*"),
          supabase.from("credit_transactions").select("*"),
        ]);

      const orders = ordersRes.data || [];
      const stores = storesRes.data || [];
      const users = usersRes.data || [];
      const products = productsRes.data || [];
      const credits = creditsRes.data || [];
      const orderItems = orderItemsRes.data || [];
      const transactions = transactionsRes.data || [];

      // Revenue
      const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0);
      const avgMarginRate = products.length > 0
        ? 1 - products.reduce((s, p) => s + (p.cost / (p.price || 1)), 0) / products.length
        : 0.3;
      const totalMargin = totalRevenue * avgMarginRate;

      // Orders by status
      const ordersByStatus: Record<string, number> = {};
      orders.forEach((o) => {
        ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1;
      });

      // Provider breakdown
      const feOrders = orders.filter((o) => o.fulfillment_provider === "fulfill_engine").length;
      const printifyOrders = orders.filter((o) => o.fulfillment_provider === "printify").length;

      // Credits
      const totalCreditsLoaded = credits.reduce((s, c) => s + (c.lifetime_received || 0), 0);
      const totalCreditsSpent = credits.reduce((s, c) => s + (c.lifetime_spent || 0), 0);
      const totalCreditsRemaining = credits.reduce((s, c) => s + (c.balance || 0), 0);

      // Top products
      const productCounts: Record<string, { name: string; count: number; revenue: number }> = {};
      orderItems.forEach((item) => {
        if (!productCounts[item.product_name]) {
          productCounts[item.product_name] = { name: item.product_name, count: 0, revenue: 0 };
        }
        productCounts[item.product_name].count += item.quantity;
        productCounts[item.product_name].revenue += item.price * item.quantity;
      });
      const topProducts = Object.values(productCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Store breakdown
      const storeBreakdown = stores.map((s) => ({
        name: s.company_name,
        orders: orders.filter((o) => o.store_id === s.id).length,
        revenue: orders.filter((o) => o.store_id === s.id).reduce((sum, o) => sum + o.total, 0),
        employees: users.filter((u) => u.store_id === s.id && u.role === "employee").length,
        credits: credits.filter((c) => c.store_id === s.id).reduce((sum, c) => sum + c.balance, 0),
      }));

      // Recent orders enriched
      const recentOrders = orders.slice(0, 8).map((o) => {
        const store = stores.find((s) => s.id === o.store_id);
        const user = users.find((u) => u.id === o.user_id);
        const items = orderItems.filter((i) => i.order_id === o.id);
        return {
          id: o.id,
          total: o.total,
          status: o.status,
          created_at: o.created_at,
          store_name: store?.company_name || "—",
          user_name: user?.full_name || "—",
          item_count: items.reduce((s, i) => s + i.quantity, 0),
          provider: o.fulfillment_provider || "—",
        };
      });

      setStats({
        totalRevenue,
        totalMargin,
        totalOrders: orders.length,
        totalStores: stores.length,
        totalEmployees: users.filter((u) => u.role === "employee").length,
        totalCreditsLoaded,
        totalCreditsSpent,
        totalCreditsRemaining,
        totalProducts: products.length,
        feOrders,
        printifyOrders,
        ordersByStatus,
        recentOrders,
        topProducts,
        storeBreakdown,
      });
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <p className="text-smoky">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Operations Dashboard</h1>
        <p className="text-sm text-smoky mt-1">
          All stores, orders, and revenue at a glance
        </p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={DollarSign} label="Revenue" value={`$${(stats.totalRevenue / 100).toFixed(2)}`} color="text-success" bg="bg-success/10" />
        <StatCard icon={TrendingUp} label="Your Profit" value={`$${(stats.totalMargin / 100).toFixed(2)}`} color="text-kraft-dark" bg="bg-kraft/10" sub={`${stats.totalRevenue > 0 ? ((stats.totalMargin / stats.totalRevenue) * 100).toFixed(0) : 0}% margin`} />
        <StatCard icon={Package} label="Total Orders" value={String(stats.totalOrders)} color="text-blue-600" bg="bg-blue-50" />
        <StatCard icon={Store} label="Active Stores" value={String(stats.totalStores)} color="text-purple-600" bg="bg-purple-50" />
      </div>

      {/* Second row stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} label="Total Employees" value={String(stats.totalEmployees)} color="text-smoky" bg="bg-off-white" />
        <StatCard icon={ShoppingBag} label="Products Listed" value={String(stats.totalProducts)} color="text-smoky" bg="bg-off-white" />
        <StatCard icon={CreditCard} label="Credits Loaded" value={`$${(stats.totalCreditsLoaded / 100).toFixed(0)}`} color="text-smoky" bg="bg-off-white" sub={`$${(stats.totalCreditsSpent / 100).toFixed(0)} spent`} />
        <StatCard icon={CreditCard} label="Credits Remaining" value={`$${(stats.totalCreditsRemaining / 100).toFixed(0)}`} color="text-kraft-dark" bg="bg-kraft/10" sub={`${stats.totalCreditsLoaded > 0 ? ((stats.totalCreditsSpent / stats.totalCreditsLoaded) * 100).toFixed(0) : 0}% utilization`} />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Order Pipeline */}
        <div className="bg-white border border-gray-100 p-5">
          <h2 className="font-bold text-sm mb-4">Order Pipeline</h2>
          <div className="space-y-3">
            {[
              { status: "pending", label: "Pending", icon: Clock, color: "text-warning", bg: "bg-warning/10" },
              { status: "submitted", label: "Submitted", icon: Package, color: "text-kraft-dark", bg: "bg-kraft/10" },
              { status: "in_production", label: "In Production", icon: AlertCircle, color: "text-blue-600", bg: "bg-blue-50" },
              { status: "shipped", label: "Shipped", icon: Truck, color: "text-purple-600", bg: "bg-purple-50" },
              { status: "delivered", label: "Delivered", icon: CheckCircle, color: "text-success", bg: "bg-success/10" },
            ].map((s) => (
              <div key={s.status} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 flex items-center justify-center ${s.bg}`}>
                    <s.icon size={14} className={s.color} />
                  </div>
                  <span className="text-sm">{s.label}</span>
                </div>
                <span className="font-bold text-lg">{stats.ordersByStatus[s.status] || 0}</span>
              </div>
            ))}
          </div>

          {/* Provider breakdown */}
          <div className="mt-6 pt-4 border-t border-gray-50">
            <p className="text-[10px] tracking-[0.15em] uppercase text-smoky mb-3">By Provider</p>
            <div className="flex justify-between text-sm">
              <span className="text-smoky">Fulfill Engine</span>
              <span className="font-medium">{stats.feOrders}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-smoky">Printify</span>
              <span className="font-medium">{stats.printifyOrders}</span>
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white border border-gray-100 p-5">
          <h2 className="font-bold text-sm mb-4">Top Products</h2>
          {stats.topProducts.length === 0 ? (
            <p className="text-smoky text-sm py-8 text-center">No orders yet</p>
          ) : (
            <div className="space-y-3">
              {stats.topProducts.map((p, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-off-white flex items-center justify-center text-xs font-bold text-smoky">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium line-clamp-1">{p.name}</p>
                      <p className="text-[10px] text-smoky">{p.count} sold</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold">${(p.revenue / 100).toFixed(0)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Store Breakdown */}
        <div className="bg-white border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-sm">Revenue by Store</h2>
            <a href="/ops/stores" className="text-[10px] tracking-[0.1em] uppercase text-kraft-dark hover:text-black">
              View All
            </a>
          </div>
          {stats.storeBreakdown.length === 0 ? (
            <p className="text-smoky text-sm py-8 text-center">No stores yet</p>
          ) : (
            <div className="space-y-4">
              {stats.storeBreakdown.map((s, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{s.name}</span>
                    <span className="font-bold">${(s.revenue / 100).toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-smoky">
                    <span>{s.employees} employees · {s.orders} orders</span>
                    <span>${(s.credits / 100).toFixed(0)} credits left</span>
                  </div>
                  {/* Revenue bar */}
                  <div className="mt-1 h-1.5 bg-gray-100 overflow-hidden">
                    <div
                      className="h-full bg-kraft"
                      style={{
                        width: `${Math.min(100, stats.totalRevenue > 0 ? (s.revenue / stats.totalRevenue) * 100 : 0)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-sm">Recent Orders</h2>
          <a href="/ops/orders" className="text-[10px] tracking-[0.1em] uppercase text-kraft-dark hover:text-black">
            View All
          </a>
        </div>

        {stats.recentOrders.length === 0 ? (
          <p className="text-smoky text-sm py-8 text-center">No orders yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50">
                  {["Order", "Store", "Customer", "Items", "Total", "Margin", "Provider", "Status", "Date"].map((h) => (
                    <th key={h} className="text-left pb-2 text-[10px] tracking-[0.15em] uppercase text-smoky font-medium pr-4">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-50 hover:bg-off-white/30 transition-colors">
                    <td className="py-3 pr-4 text-xs font-mono">#{order.id.slice(0, 8)}</td>
                    <td className="py-3 pr-4 text-xs font-medium">{order.store_name}</td>
                    <td className="py-3 pr-4 text-xs">{order.user_name}</td>
                    <td className="py-3 pr-4 text-xs">{order.item_count}</td>
                    <td className="py-3 pr-4 text-xs font-bold">${(order.total / 100).toFixed(2)}</td>
                    <td className="py-3 pr-4 text-xs font-medium text-success">+${((order.total * 0.3) / 100).toFixed(2)}</td>
                    <td className="py-3 pr-4 text-xs text-smoky">{order.provider.replace(/_/g, " ")}</td>
                    <td className="py-3 pr-4"><StatusBadge status={order.status} /></td>
                    <td className="py-3 text-xs text-smoky">
                      {new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, bg, sub }: {
  icon: typeof DollarSign;
  label: string;
  value: string;
  color: string;
  bg: string;
  sub?: string;
}) {
  return (
    <div className="bg-white border border-gray-100 p-5">
      <div className={`w-9 h-9 ${bg} flex items-center justify-center mb-3`}>
        <Icon size={18} className={color} />
      </div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      <p className="text-[10px] tracking-[0.15em] uppercase text-smoky mt-1">{label}</p>
      {sub && <p className="text-xs text-kraft-dark mt-1">{sub}</p>}
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
