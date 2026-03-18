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
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface DashboardData {
  totalRevenue: number;
  totalOrders: number;
  totalStores: number;
  totalEmployees: number;
  totalMargin: number;
  recentOrders: Array<{
    id: string;
    total: number;
    status: string;
    created_at: string;
    store_name?: string;
    user_name?: string;
  }>;
  ordersByStatus: Record<string, number>;
}

export default function OpsDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Fetch all data in parallel
      const [ordersRes, storesRes, usersRes, productsRes] = await Promise.all([
        supabase.from("orders").select("*").order("created_at", { ascending: false }),
        supabase.from("stores").select("*"),
        supabase.from("users").select("*"),
        supabase.from("products").select("price, cost"),
      ]);

      const orders = ordersRes.data || [];
      const stores = storesRes.data || [];
      const users = usersRes.data || [];
      const products = productsRes.data || [];

      // Calculate totals
      const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
      const avgCostRatio = products.length > 0
        ? products.reduce((sum, p) => sum + (p.cost / (p.price || 1)), 0) / products.length
        : 0.5;
      const totalMargin = totalRevenue * (1 - avgCostRatio);

      // Orders by status
      const ordersByStatus: Record<string, number> = {};
      for (const o of orders) {
        ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1;
      }

      setData({
        totalRevenue,
        totalOrders: orders.length,
        totalStores: stores.length,
        totalEmployees: users.filter((u) => u.role === "employee").length,
        totalMargin,
        recentOrders: orders.slice(0, 10).map((o) => ({
          id: o.id,
          total: o.total,
          status: o.status,
          created_at: o.created_at,
          store_name: stores.find((s) => s.id === o.store_id)?.company_name,
          user_name: users.find((u) => u.id === o.user_id)?.full_name,
        })),
        ordersByStatus,
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

  if (!data) return null;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-smoky mt-1">
          Overview of all stores, orders, and revenue
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Total Revenue",
            value: `$${(data.totalRevenue / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
            icon: DollarSign,
            color: "text-success",
            bg: "bg-success/10",
          },
          {
            label: "Your Margin",
            value: `$${(data.totalMargin / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
            icon: TrendingUp,
            color: "text-kraft-dark",
            bg: "bg-kraft/10",
          },
          {
            label: "Total Orders",
            value: String(data.totalOrders),
            icon: Package,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Active Stores",
            value: String(data.totalStores),
            icon: Store,
            color: "text-purple-600",
            bg: "bg-purple-50",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white border border-gray-100 p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 ${stat.bg} flex items-center justify-center`}>
                <stat.icon size={18} className={stat.color} />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
            <p className="text-[10px] tracking-[0.15em] uppercase text-smoky mt-1">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Order Status + Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Pipeline */}
        <div className="bg-white border border-gray-100 p-5">
          <h2 className="font-bold text-sm mb-4">Order Pipeline</h2>
          <div className="space-y-3">
            {[
              { status: "pending", label: "Pending", icon: Clock, color: "text-warning bg-warning/10" },
              { status: "submitted", label: "Submitted", icon: Package, color: "text-kraft-dark bg-kraft/10" },
              { status: "in_production", label: "In Production", icon: AlertCircle, color: "text-blue-600 bg-blue-50" },
              { status: "shipped", label: "Shipped", icon: Truck, color: "text-purple-600 bg-purple-50" },
              { status: "delivered", label: "Delivered", icon: CheckCircle, color: "text-success bg-success/10" },
            ].map((s) => (
              <div key={s.status} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 flex items-center justify-center ${s.color.split(" ")[1]}`}>
                    <s.icon size={14} className={s.color.split(" ")[0]} />
                  </div>
                  <span className="text-sm">{s.label}</span>
                </div>
                <span className="font-bold text-lg">
                  {data.ordersByStatus[s.status] || 0}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-sm">Recent Orders</h2>
            <a
              href="/ops/orders"
              className="text-[10px] tracking-[0.15em] uppercase text-kraft-dark hover:text-black transition-colors"
            >
              View All
            </a>
          </div>

          {data.recentOrders.length === 0 ? (
            <p className="text-smoky text-sm py-8 text-center">No orders yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="text-left pb-2 text-[10px] tracking-[0.15em] uppercase text-smoky font-medium">
                      Order
                    </th>
                    <th className="text-left pb-2 text-[10px] tracking-[0.15em] uppercase text-smoky font-medium">
                      Store
                    </th>
                    <th className="text-left pb-2 text-[10px] tracking-[0.15em] uppercase text-smoky font-medium">
                      Customer
                    </th>
                    <th className="text-left pb-2 text-[10px] tracking-[0.15em] uppercase text-smoky font-medium">
                      Total
                    </th>
                    <th className="text-left pb-2 text-[10px] tracking-[0.15em] uppercase text-smoky font-medium">
                      Status
                    </th>
                    <th className="text-left pb-2 text-[10px] tracking-[0.15em] uppercase text-smoky font-medium">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-gray-50 hover:bg-off-white/50 transition-colors"
                    >
                      <td className="py-3 text-xs font-mono">
                        #{order.id.slice(0, 8)}
                      </td>
                      <td className="py-3 text-xs">
                        {order.store_name || "—"}
                      </td>
                      <td className="py-3 text-xs">
                        {order.user_name || "—"}
                      </td>
                      <td className="py-3 text-xs font-medium">
                        ${(order.total / 100).toFixed(2)}
                      </td>
                      <td className="py-3">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="py-3 text-xs text-smoky">
                        {new Date(order.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Margin Breakdown */}
      <div className="mt-6 bg-white border border-gray-100 p-5">
        <h2 className="font-bold text-sm mb-4">Margin Summary</h2>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-[10px] tracking-[0.15em] uppercase text-smoky mb-1">
              Revenue
            </p>
            <p className="text-xl font-bold">
              ${(data.totalRevenue / 100).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-[10px] tracking-[0.15em] uppercase text-smoky mb-1">
              Estimated Cost
            </p>
            <p className="text-xl font-bold text-smoky">
              ${((data.totalRevenue - data.totalMargin) / 100).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-[10px] tracking-[0.15em] uppercase text-smoky mb-1">
              Your Profit
            </p>
            <p className="text-xl font-bold text-success">
              ${(data.totalMargin / 100).toFixed(2)}
            </p>
            <p className="text-[10px] text-kraft-dark">
              {data.totalRevenue > 0
                ? `${((data.totalMargin / data.totalRevenue) * 100).toFixed(0)}% margin`
                : "—"}
            </p>
          </div>
        </div>
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
    <span
      className={`text-[9px] tracking-[0.1em] uppercase font-medium px-2 py-1 ${styles[status] || "bg-gray-100 text-gray-600"}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
