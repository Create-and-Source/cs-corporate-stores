"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Users,
  Package,
  DollarSign,
  CreditCard,
  ExternalLink,
  Settings,
  ShoppingBag,
  Plus,
  Gift,
  TrendingUp,
  Eye,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface StoreDetail {
  id: string;
  slug: string;
  company_name: string;
  primary_color: string;
  secondary_color: string;
  welcome_message: string | null;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  cost: number;
  category: string;
  images: string[];
  is_active: boolean;
}

interface Employee {
  id: string;
  full_name: string;
  email: string;
  department: string | null;
  balance: number;
  lifetime_spent: number;
  orders: number;
}

export default function StoreDetailPage() {
  const params = useParams();
  const storeId = params.storeId as string;
  const [store, setStore] = useState<StoreDetail | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [orders, setOrders] = useState<Array<{ id: string; total: number; status: string; created_at: string; user_name: string }>>([]);
  const [stats, setStats] = useState({ revenue: 0, margin: 0, creditsLoaded: 0, creditsRemaining: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "products" | "employees" | "orders">("overview");

  useEffect(() => {
    async function load() {
      const { data: storeData } = await supabase.from("stores").select("*").eq("id", storeId).single();
      if (!storeData) { setLoading(false); return; }
      setStore(storeData);

      const [productsRes, usersRes, ordersRes, creditsRes, itemsRes] = await Promise.all([
        supabase.from("products").select("*").eq("store_id", storeId),
        supabase.from("users").select("*").eq("store_id", storeId),
        supabase.from("orders").select("*").eq("store_id", storeId).order("created_at", { ascending: false }),
        supabase.from("credit_balances").select("*").eq("store_id", storeId),
        supabase.from("order_items").select("order_id, quantity"),
      ]);

      setProducts(productsRes.data || []);

      const credits = creditsRes.data || [];
      const users = usersRes.data || [];
      const allOrders = ordersRes.data || [];
      const items = itemsRes.data || [];

      const enrichedEmployees = users
        .filter((u) => u.role === "employee")
        .map((u) => {
          const credit = credits.find((c) => c.user_id === u.id);
          const userOrders = allOrders.filter((o) => o.user_id === u.id);
          return {
            id: u.id,
            full_name: u.full_name,
            email: u.email,
            department: u.department,
            balance: credit?.balance || 0,
            lifetime_spent: credit?.lifetime_spent || 0,
            orders: userOrders.length,
          };
        });
      setEmployees(enrichedEmployees);

      const enrichedOrders = allOrders.slice(0, 20).map((o) => ({
        id: o.id,
        total: o.total,
        status: o.status,
        created_at: o.created_at,
        user_name: users.find((u) => u.id === o.user_id)?.full_name || "—",
      }));
      setOrders(enrichedOrders);

      const revenue = allOrders.reduce((s, o) => s + o.total, 0);
      const avgMargin = (productsRes.data || []).length > 0
        ? 1 - (productsRes.data || []).reduce((s, p) => s + (p.cost / (p.price || 1)), 0) / (productsRes.data || []).length
        : 0.3;

      setStats({
        revenue,
        margin: revenue * avgMargin,
        creditsLoaded: credits.reduce((s, c) => s + (c.lifetime_received || 0), 0),
        creditsRemaining: credits.reduce((s, c) => s + (c.balance || 0), 0),
      });

      setLoading(false);
    }
    load();
  }, [storeId]);

  if (loading) return <div className="p-8 text-smoky">Loading...</div>;
  if (!store) return <div className="p-8 text-smoky">Store not found</div>;

  return (
    <div className="p-8">
      {/* Header */}
      <a href="/ops/stores" className="inline-flex items-center gap-1 text-xs text-smoky hover:text-black mb-4">
        <ArrowLeft size={12} /> All Stores
      </a>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{store.company_name}</h1>
          <p className="text-sm text-smoky mt-1">{store.slug}.createandsource.com</p>
          <div className="flex items-center gap-3 mt-2">
            <div className="w-4 h-4 border border-gray-200" style={{ backgroundColor: store.primary_color }} />
            <div className="w-4 h-4 border border-gray-200" style={{ backgroundColor: store.secondary_color }} />
            <span className={`text-[9px] tracking-[0.1em] uppercase font-medium px-2 py-0.5 ${store.is_active ? "bg-success/10 text-success" : "bg-gray-100 text-gray-500"}`}>
              {store.is_active ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <a href={`/store/${store.slug}`} target="_blank" className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-sm hover:border-kraft transition-colors">
            <Eye size={14} /> View Store
          </a>
          <a href={`/store/${store.slug}/admin/settings`} target="_blank" className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-sm hover:border-kraft transition-colors">
            <Settings size={14} /> Settings
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-gray-100 p-4">
          <DollarSign size={16} className="text-success mb-2" />
          <p className="text-xl font-bold">${(stats.revenue / 100).toFixed(0)}</p>
          <p className="text-[10px] tracking-wider uppercase text-smoky">Revenue</p>
        </div>
        <div className="bg-white border border-gray-100 p-4">
          <TrendingUp size={16} className="text-kraft-dark mb-2" />
          <p className="text-xl font-bold">${(stats.margin / 100).toFixed(0)}</p>
          <p className="text-[10px] tracking-wider uppercase text-smoky">Your Profit</p>
        </div>
        <div className="bg-white border border-gray-100 p-4">
          <Users size={16} className="text-blue-600 mb-2" />
          <p className="text-xl font-bold">{employees.length}</p>
          <p className="text-[10px] tracking-wider uppercase text-smoky">Employees</p>
        </div>
        <div className="bg-white border border-gray-100 p-4">
          <CreditCard size={16} className="text-kraft-dark mb-2" />
          <p className="text-xl font-bold">${(stats.creditsRemaining / 100).toFixed(0)}</p>
          <p className="text-[10px] tracking-wider uppercase text-smoky">Credits Left</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-100">
        {[
          { id: "overview" as const, label: "Overview" },
          { id: "products" as const, label: `Products (${products.length})` },
          { id: "employees" as const, label: `Employees (${employees.length})` },
          { id: "orders" as const, label: `Orders (${orders.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-xs tracking-[0.1em] uppercase font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.id ? "border-black text-black" : "border-transparent text-smoky hover:text-black"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white border border-gray-100 p-5">
            <h3 className="font-bold text-sm mb-4">Quick Info</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-smoky">Created</span>
                <span>{new Date(store.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-smoky">Products</span>
                <span className="font-medium">{products.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-smoky">Total Orders</span>
                <span className="font-medium">{orders.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-smoky">Avg Order Value</span>
                <span className="font-medium">${orders.length > 0 ? ((stats.revenue / orders.length) / 100).toFixed(2) : "0"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-smoky">Credits Loaded</span>
                <span className="font-medium">${(stats.creditsLoaded / 100).toFixed(0)}</span>
              </div>
              {store.welcome_message && (
                <div className="pt-3 border-t border-gray-50">
                  <p className="text-[10px] tracking-wider uppercase text-smoky mb-1">Welcome Message</p>
                  <p className="text-xs text-smoky italic">&ldquo;{store.welcome_message}&rdquo;</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-100 p-5">
            <h3 className="font-bold text-sm mb-4">Suggest Products</h3>
            <p className="text-xs text-smoky mb-4">Recommend products to add to this store</p>
            <a
              href={`/store/${store.slug}/admin/catalog`}
              target="_blank"
              className="flex items-center gap-2 bg-black text-white px-4 py-3 text-xs tracking-[0.1em] uppercase font-medium hover:bg-brown transition-colors justify-center"
            >
              <Plus size={14} /> Open Product Catalog
            </a>
          </div>
        </div>
      )}

      {activeTab === "products" && (
        <div>
          {products.length === 0 ? (
            <div className="bg-white border border-gray-100 p-12 text-center">
              <ShoppingBag size={36} className="mx-auto text-kraft mb-3" />
              <p className="font-semibold mb-1">No products yet</p>
              <p className="text-xs text-smoky mb-4">Add products from the catalog</p>
              <a href={`/store/${store.slug}/admin/catalog`} target="_blank" className="text-xs text-kraft-dark hover:text-black underline">
                Open Catalog
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {products.map((p) => (
                <div key={p.id} className="bg-white border border-gray-100 overflow-hidden">
                  <div className="aspect-square bg-off-white flex items-center justify-center overflow-hidden">
                    {p.images?.[0] ? (
                      <img src={p.images[0]} alt={p.name} className="w-full h-full object-contain p-2" />
                    ) : (
                      <Package size={20} className="text-kraft" />
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-[9px] tracking-wider uppercase text-kraft-dark">{p.category}</p>
                    <p className="text-xs font-medium line-clamp-1">{p.name}</p>
                    <div className="flex justify-between mt-1">
                      <p className="text-xs font-bold">${(p.price / 100).toFixed(2)}</p>
                      <p className="text-[10px] text-success">+${(((p.price - p.cost)) / 100).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "employees" && (
        <div className="bg-white border border-gray-100">
          {employees.map((emp) => (
            <div key={emp.id} className="flex items-center justify-between p-4 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-kraft/20 flex items-center justify-center text-kraft-dark text-xs font-bold">
                  {emp.full_name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <p className="text-sm font-medium">{emp.full_name}</p>
                  <p className="text-[10px] text-smoky">{emp.email}{emp.department ? ` · ${emp.department}` : ""}</p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-right">
                <div>
                  <p className="text-sm font-bold">${(emp.balance / 100).toFixed(0)}</p>
                  <p className="text-[9px] text-smoky">balance</p>
                </div>
                <div>
                  <p className="text-sm">${(emp.lifetime_spent / 100).toFixed(0)}</p>
                  <p className="text-[9px] text-smoky">spent</p>
                </div>
                <div>
                  <p className="text-sm">{emp.orders}</p>
                  <p className="text-[9px] text-smoky">orders</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "orders" && (
        <div className="bg-white border border-gray-100">
          {orders.map((order) => (
            <div key={order.id} className="flex items-center justify-between p-4 border-b border-gray-50">
              <div>
                <p className="text-sm font-medium">{order.user_name}</p>
                <p className="text-[10px] text-smoky font-mono">#{order.id.slice(0, 8)}</p>
              </div>
              <div className="flex items-center gap-4">
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
                <p className="text-xs text-smoky">
                  {new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
