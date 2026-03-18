"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Users,
  DollarSign,
  Package,
  TrendingUp,
  ArrowRight,
  UserPlus,
  Gift,
  ShoppingBag,
  CreditCard,
  Clock,
  Truck,
  CheckCircle,
  BarChart3,
  Layers,
} from "lucide-react";
import { StoreHeader } from "@/components/store/StoreHeader";
import { StoreFooter } from "@/components/store/StoreFooter";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";

export default function AdminDashboard() {
  const params = useParams();
  const slug = params.slug as string;
  const [loading, setLoading] = useState(true);
  const [storeName, setStoreName] = useState("Store");
  const [stats, setStats] = useState({
    employees: 0,
    totalCreditsLoaded: 0,
    totalCreditsSpent: 0,
    totalCreditsRemaining: 0,
    creditUtilization: 0,
    orders: 0,
    ordersThisMonth: 0,
    ordersByStatus: {} as Record<string, number>,
    totalSpent: 0,
    avgOrderValue: 0,
    topProducts: [] as Array<{ name: string; count: number }>,
    recentOrders: [] as Array<{
      employee: string;
      items: string;
      total: number;
      status: string;
      date: string;
    }>,
    topSpenders: [] as Array<{ name: string; spent: number; balance: number }>,
    products: 0,
  });

  useEffect(() => {
    async function load() {
      const { data: store } = await supabase
        .from("stores")
        .select("id, company_name")
        .eq("slug", slug)
        .single();

      if (!store) { setLoading(false); return; }
      setStoreName(store.company_name || "Store");
      const storeId = store.id;

      const [usersRes, creditsRes, ordersRes, itemsRes, productsRes, transactionsRes] = await Promise.all([
        supabase.from("users").select("*").eq("store_id", storeId),
        supabase.from("credit_balances").select("*").eq("store_id", storeId),
        supabase.from("orders").select("*").eq("store_id", storeId).order("created_at", { ascending: false }),
        supabase.from("order_items").select("*"),
        supabase.from("products").select("id").eq("store_id", storeId),
        supabase.from("credit_transactions").select("*").eq("store_id", storeId),
      ]);

      const users = usersRes.data || [];
      const credits = creditsRes.data || [];
      const orders = ordersRes.data || [];
      const items = itemsRes.data || [];
      const products = productsRes.data || [];

      const employees = users.filter((u) => u.role === "employee");
      const totalCreditsLoaded = credits.reduce((s, c) => s + (c.lifetime_received || 0), 0);
      const totalCreditsSpent = credits.reduce((s, c) => s + (c.lifetime_spent || 0), 0);
      const totalCreditsRemaining = credits.reduce((s, c) => s + (c.balance || 0), 0);

      const now = new Date();
      const thisMonth = orders.filter((o) => {
        const d = new Date(o.created_at);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });

      const ordersByStatus: Record<string, number> = {};
      orders.forEach((o) => { ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1; });

      const totalSpent = orders.reduce((s, o) => s + o.total, 0);

      // Top products
      const productCounts: Record<string, number> = {};
      const orderIds = new Set(orders.map((o) => o.id));
      items.filter((i) => orderIds.has(i.order_id)).forEach((i) => {
        productCounts[i.product_name] = (productCounts[i.product_name] || 0) + i.quantity;
      });
      const topProducts = Object.entries(productCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

      // Recent orders
      const recentOrders = orders.slice(0, 5).map((o) => {
        const user = users.find((u) => u.id === o.user_id);
        const orderItems = items.filter((i) => i.order_id === o.id);
        return {
          employee: user?.full_name || "—",
          items: orderItems.map((i) => i.product_name).join(", "),
          total: o.total,
          status: o.status,
          date: new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        };
      });

      // Top spenders
      const topSpenders = credits
        .map((c) => {
          const user = users.find((u) => u.id === c.user_id);
          return { name: user?.full_name || "—", spent: c.lifetime_spent, balance: c.balance };
        })
        .sort((a, b) => b.spent - a.spent)
        .slice(0, 5);

      setStats({
        employees: employees.length,
        totalCreditsLoaded,
        totalCreditsSpent,
        totalCreditsRemaining,
        creditUtilization: totalCreditsLoaded > 0 ? (totalCreditsSpent / totalCreditsLoaded) * 100 : 0,
        orders: orders.length,
        ordersThisMonth: thisMonth.length,
        ordersByStatus,
        totalSpent,
        avgOrderValue: orders.length > 0 ? totalSpent / orders.length : 0,
        topProducts,
        recentOrders,
        topSpenders,
        products: products.length,
      });
      setLoading(false);
    }
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-smoky">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <StoreHeader
        companyName={storeName}
        logoUrl={null}
        creditBalance={0}
        cartCount={0}
        isAdmin={true}
        storeSlug={slug}
      />

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-[11px] tracking-[0.2em] uppercase text-kraft-dark mb-1">
              Store Administration
            </p>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          </div>
          <div className="flex gap-3">
            <a href={`/store/${slug}/admin/employees`}>
              <Button variant="outline" size="sm">
                <UserPlus size={16} className="mr-2" />
                Manage Team
              </Button>
            </a>
            <a href={`/store/${slug}/admin/catalog`}>
              <Button variant="primary" size="sm">
                <ShoppingBag size={16} className="mr-2" />
                Product Catalog
              </Button>
            </a>
          </div>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="border border-gray-100 p-5">
            <Users size={20} className="text-kraft-dark mb-3" />
            <p className="text-2xl font-bold">{stats.employees}</p>
            <p className="text-[10px] tracking-[0.15em] uppercase text-smoky mt-1">Active Employees</p>
          </div>
          <div className="border border-gray-100 p-5">
            <CreditCard size={20} className="text-kraft-dark mb-3" />
            <p className="text-2xl font-bold">${(stats.totalCreditsLoaded / 100).toFixed(0)}</p>
            <p className="text-[10px] tracking-[0.15em] uppercase text-smoky mt-1">Credits Loaded</p>
            <p className="text-xs text-kraft-dark mt-1">${(stats.totalCreditsSpent / 100).toFixed(0)} spent ({stats.creditUtilization.toFixed(0)}%)</p>
          </div>
          <div className="border border-gray-100 p-5">
            <Package size={20} className="text-kraft-dark mb-3" />
            <p className="text-2xl font-bold">{stats.orders}</p>
            <p className="text-[10px] tracking-[0.15em] uppercase text-smoky mt-1">Total Orders</p>
            <p className="text-xs text-kraft-dark mt-1">{stats.ordersThisMonth} this month</p>
          </div>
          <div className="border border-gray-100 p-5">
            <DollarSign size={20} className="text-kraft-dark mb-3" />
            <p className="text-2xl font-bold">${(stats.totalCreditsRemaining / 100).toFixed(0)}</p>
            <p className="text-[10px] tracking-[0.15em] uppercase text-smoky mt-1">Credits Remaining</p>
            <p className="text-xs text-kraft-dark mt-1">${(stats.avgOrderValue / 100).toFixed(0)} avg order</p>
          </div>
        </div>

        {/* Credit utilization bar */}
        <div className="bg-off-white border border-kraft/20 p-5 mb-8">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold">Credit Utilization</p>
            <p className="text-sm font-bold">{stats.creditUtilization.toFixed(0)}%</p>
          </div>
          <div className="h-3 bg-white border border-gray-200 overflow-hidden">
            <div
              className="h-full bg-kraft transition-all"
              style={{ width: `${Math.min(100, stats.creditUtilization)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-smoky mt-2">
            <span>${(stats.totalCreditsSpent / 100).toFixed(0)} spent</span>
            <span>${(stats.totalCreditsRemaining / 100).toFixed(0)} remaining</span>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div>
            <h2 className="font-bold tracking-wide uppercase text-sm mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {[
                { label: "Manage Employees", href: `/store/${slug}/admin/employees`, icon: Users },
                { label: "Product Catalog", href: `/store/${slug}/admin/catalog`, icon: ShoppingBag },
                { label: "View All Orders", href: `/store/${slug}/admin/orders`, icon: Package },
                { label: "Store Setup", href: `/store/${slug}/setup`, icon: Layers },
              ].map((action) => (
                <a
                  key={action.label}
                  href={action.href}
                  className="flex items-center justify-between p-4 border border-gray-100 hover:border-kraft hover:bg-off-white transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <action.icon size={16} className="text-kraft-dark" />
                    <span className="text-sm font-medium">{action.label}</span>
                  </div>
                  <ArrowRight size={16} className="text-smoky group-hover:text-kraft-dark transition-colors" />
                </a>
              ))}
            </div>

            {/* Order Pipeline */}
            <h2 className="font-bold tracking-wide uppercase text-sm mt-8 mb-4">Order Status</h2>
            <div className="border border-gray-100 p-4 space-y-2">
              {[
                { status: "pending", label: "Pending", icon: Clock, color: "text-warning" },
                { status: "in_production", label: "In Production", icon: Package, color: "text-blue-600" },
                { status: "shipped", label: "Shipped", icon: Truck, color: "text-purple-600" },
                { status: "delivered", label: "Delivered", icon: CheckCircle, color: "text-success" },
              ].map((s) => (
                <div key={s.status} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <s.icon size={14} className={s.color} />
                    <span className="text-xs">{s.label}</span>
                  </div>
                  <span className="font-bold">{stats.ordersByStatus[s.status] || 0}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold tracking-wide uppercase text-sm">Recent Orders</h2>
              <a href={`/store/${slug}/admin/orders`} className="text-[10px] tracking-[0.1em] uppercase text-kraft-dark hover:text-black">
                View All
              </a>
            </div>

            <div className="border border-gray-100">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-off-white">
                    {["Employee", "Items", "Total", "Status", "Date"].map((h) => (
                      <th key={h} className="text-left p-3 text-[10px] tracking-[0.15em] uppercase text-smoky font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-smoky text-sm">
                        No orders yet
                      </td>
                    </tr>
                  ) : (
                    stats.recentOrders.map((order, i) => (
                      <tr key={i} className="border-b border-gray-50 hover:bg-off-white/50 transition-colors">
                        <td className="p-3 text-sm font-medium">{order.employee}</td>
                        <td className="p-3 text-sm text-smoky truncate max-w-[200px]">{order.items}</td>
                        <td className="p-3 text-sm font-medium">${(order.total / 100).toFixed(2)}</td>
                        <td className="p-3">
                          <span className={`text-[9px] tracking-[0.1em] uppercase font-medium px-2 py-1 ${
                            {
                              pending: "bg-warning/10 text-warning",
                              in_production: "bg-blue-50 text-blue-600",
                              shipped: "bg-purple-50 text-purple-600",
                              delivered: "bg-success/10 text-success",
                            }[order.status] || "bg-gray-100 text-gray-500"
                          }`}>
                            {order.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="p-3 text-sm text-smoky">{order.date}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Top Products + Top Spenders side by side */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="border border-gray-100 p-4">
                <h3 className="font-bold text-xs tracking-wide uppercase mb-3">Popular Products</h3>
                {stats.topProducts.length === 0 ? (
                  <p className="text-xs text-smoky">No data yet</p>
                ) : (
                  <div className="space-y-2">
                    {stats.topProducts.map((p, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span className="truncate">{p.name}</span>
                        <span className="font-medium ml-2 flex-shrink-0">{p.count} sold</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border border-gray-100 p-4">
                <h3 className="font-bold text-xs tracking-wide uppercase mb-3">Top Spenders</h3>
                {stats.topSpenders.length === 0 ? (
                  <p className="text-xs text-smoky">No data yet</p>
                ) : (
                  <div className="space-y-2">
                    {stats.topSpenders.map((s, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span className="truncate">{s.name}</span>
                        <span className="font-medium ml-2 flex-shrink-0">${(s.spent / 100).toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <StoreFooter companyName={storeName} />
    </div>
  );
}
