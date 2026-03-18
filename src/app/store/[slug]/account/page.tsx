"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  User,
  CreditCard,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingBag,
  Gift,
  Clock,
  Truck,
  CheckCircle,
  MapPin,
  Mail,
  Building2,
  ArrowRight,
} from "lucide-react";
import { StoreHeader } from "@/components/store/StoreHeader";
import { StoreFooter } from "@/components/store/StoreFooter";
import { CreditBadge } from "@/components/ui/CreditBadge";
import { useCart } from "@/lib/cart";
import { supabase } from "@/lib/supabase";

interface UserData {
  id: string;
  full_name: string;
  email: string;
  department: string | null;
  role: string;
  created_at: string;
}

interface CreditData {
  balance: number;
  lifetime_received: number;
  lifetime_spent: number;
}

interface Transaction {
  amount: number;
  type: string;
  description: string;
  created_at: string;
}

interface Order {
  id: string;
  total: number;
  status: string;
  created_at: string;
  item_count: number;
}

export default function AccountPage() {
  const params = useParams();
  const slug = params.slug as string;
  const cart = useCart();

  const [storeName, setStoreName] = useState("Store");
  const [user, setUser] = useState<UserData | null>(null);
  const [credits, setCredits] = useState<CreditData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Get store
      const { data: store } = await supabase
        .from("stores")
        .select("id, company_name")
        .eq("slug", slug)
        .single();

      if (!store) { setLoading(false); return; }
      setStoreName(store.company_name);

      // Check for logged-in user in localStorage
      const savedUser = localStorage.getItem(`cs-user-${slug}`);
      let userId: string | null = null;

      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        userId = parsed.id;
      } else {
        // Demo: use first employee
        const { data: firstUser } = await supabase
          .from("users")
          .select("id")
          .eq("store_id", store.id)
          .eq("role", "employee")
          .limit(1)
          .single();
        if (firstUser) userId = firstUser.id;
      }

      if (!userId) { setLoading(false); return; }

      // Fetch all user data
      const [userRes, creditRes, txRes, ordersRes, itemsRes] = await Promise.all([
        supabase.from("users").select("*").eq("id", userId).single(),
        supabase.from("credit_balances").select("*").eq("user_id", userId).eq("store_id", store.id).single(),
        supabase.from("credit_transactions").select("*").eq("user_id", userId).eq("store_id", store.id).order("created_at", { ascending: false }).limit(10),
        supabase.from("orders").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
        supabase.from("order_items").select("order_id, quantity"),
      ]);

      if (userRes.data) setUser(userRes.data);
      if (creditRes.data) setCredits(creditRes.data);
      if (txRes.data) setTransactions(txRes.data);

      if (ordersRes.data) {
        const items = itemsRes.data || [];
        setOrders(
          ordersRes.data.map((o) => ({
            id: o.id,
            total: o.total,
            status: o.status,
            created_at: o.created_at,
            item_count: items.filter((i) => i.order_id === o.id).reduce((s, i) => s + i.quantity, 0),
          }))
        );
      }

      setLoading(false);
    }
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-smoky text-sm">Loading your account...</p>
      </div>
    );
  }

  const statusConfig: Record<string, { icon: typeof Clock; label: string; color: string }> = {
    pending: { icon: Clock, label: "Pending", color: "text-warning bg-warning/10" },
    submitted: { icon: Package, label: "Submitted", color: "text-kraft-dark bg-kraft/10" },
    in_production: { icon: Package, label: "In Production", color: "text-blue-600 bg-blue-50" },
    shipped: { icon: Truck, label: "Shipped", color: "text-purple-600 bg-purple-50" },
    delivered: { icon: CheckCircle, label: "Delivered", color: "text-success bg-success/10" },
  };

  return (
    <div className="min-h-screen bg-white">
      <StoreHeader
        companyName={storeName}
        logoUrl={null}
        creditBalance={credits?.balance || 0}
        cartCount={cart.count}
        isAdmin={false}
        storeSlug={slug}
      />

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Profile Header */}
        <div className="flex items-start gap-6 mb-10">
          <div className="w-16 h-16 bg-kraft/20 flex items-center justify-center text-kraft-dark text-xl font-bold flex-shrink-0">
            {user?.full_name?.split(" ").map((n) => n[0]).join("") || "?"}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">{user?.full_name || "Employee"}</h1>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-sm text-smoky flex items-center gap-1">
                <Mail size={12} /> {user?.email}
              </span>
              {user?.department && (
                <span className="text-sm text-smoky flex items-center gap-1">
                  <Building2 size={12} /> {user.department}
                </span>
              )}
            </div>
            <p className="text-[10px] text-smoky mt-2">
              Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "—"}
            </p>
          </div>
          <a
            href={`/store/${slug}`}
            className="bg-black text-white px-5 py-2.5 text-xs tracking-[0.12em] uppercase font-medium hover:bg-brown transition-colors flex items-center gap-2"
          >
            <ShoppingBag size={14} />
            Shop
          </a>
        </div>

        {/* Credit Summary */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="bg-off-white border border-kraft/20 p-6 text-center">
            <p className="text-3xl font-bold">${((credits?.balance || 0) / 100).toFixed(2)}</p>
            <p className="text-[10px] tracking-[0.15em] uppercase text-smoky mt-2">Available Credits</p>
          </div>
          <div className="border border-gray-100 p-6 text-center">
            <p className="text-3xl font-bold text-smoky">${((credits?.lifetime_received || 0) / 100).toFixed(2)}</p>
            <p className="text-[10px] tracking-[0.15em] uppercase text-smoky mt-2">Total Received</p>
          </div>
          <div className="border border-gray-100 p-6 text-center">
            <p className="text-3xl font-bold text-smoky">${((credits?.lifetime_spent || 0) / 100).toFixed(2)}</p>
            <p className="text-[10px] tracking-[0.15em] uppercase text-smoky mt-2">Total Spent</p>
          </div>
        </div>

        {/* Credit utilization bar */}
        {credits && credits.lifetime_received > 0 && (
          <div className="mb-10">
            <div className="flex justify-between text-xs text-smoky mb-2">
              <span>Credit Usage</span>
              <span>{Math.round((credits.lifetime_spent / credits.lifetime_received) * 100)}% used</span>
            </div>
            <div className="h-2 bg-gray-100 overflow-hidden">
              <div
                className="h-full bg-kraft transition-all"
                style={{ width: `${Math.min(100, (credits.lifetime_spent / credits.lifetime_received) * 100)}%` }}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Orders */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-sm tracking-wide uppercase">Your Orders</h2>
              <a href={`/store/${slug}/orders`} className="text-[10px] tracking-[0.1em] uppercase text-kraft-dark hover:text-black flex items-center gap-1">
                View All <ArrowRight size={10} />
              </a>
            </div>

            {orders.length === 0 ? (
              <div className="border border-gray-100 p-8 text-center">
                <ShoppingBag size={32} className="mx-auto text-kraft mb-3" />
                <p className="text-sm font-medium mb-1">No orders yet</p>
                <p className="text-xs text-smoky mb-4">Browse the store and place your first order</p>
                <a href={`/store/${slug}`} className="text-xs text-kraft-dark hover:text-black underline">
                  Start Shopping
                </a>
              </div>
            ) : (
              <div className="border border-gray-100">
                {orders.slice(0, 5).map((order) => {
                  const config = statusConfig[order.status] || statusConfig.pending;
                  return (
                    <a
                      key={order.id}
                      href={`/store/${slug}/orders`}
                      className="flex items-center justify-between p-4 border-b border-gray-50 hover:bg-off-white/30 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium">{order.item_count} items</p>
                        <p className="text-[10px] text-smoky">
                          {new Date(order.created_at).toLocaleDateString("en-US", {
                            month: "short", day: "numeric", year: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[9px] tracking-[0.1em] uppercase font-medium px-2 py-1 ${config.color}`}>
                          {config.label}
                        </span>
                        <p className="text-sm font-bold">${(order.total / 100).toFixed(2)}</p>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Credit History */}
          <div>
            <h2 className="font-bold text-sm tracking-wide uppercase mb-4">Credit Activity</h2>

            {transactions.length === 0 ? (
              <div className="border border-gray-100 p-8 text-center">
                <CreditCard size={32} className="mx-auto text-kraft mb-3" />
                <p className="text-sm font-medium mb-1">No credit activity</p>
                <p className="text-xs text-smoky">Credits will appear here when they&apos;re assigned</p>
              </div>
            ) : (
              <div className="border border-gray-100">
                {transactions.map((tx, i) => {
                  const isCredit = tx.amount > 0;
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between p-4 border-b border-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 flex items-center justify-center ${isCredit ? "bg-success/10" : "bg-error/10"}`}>
                          {isCredit ? (
                            <ArrowUpRight size={14} className="text-success" />
                          ) : (
                            <ArrowDownRight size={14} className="text-error" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {tx.description || (isCredit ? "Credits received" : "Purchase")}
                          </p>
                          <p className="text-[10px] text-smoky">
                            {new Date(tx.created_at).toLocaleDateString("en-US", {
                              month: "short", day: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                      <p className={`text-sm font-bold ${isCredit ? "text-success" : "text-error"}`}>
                        {isCredit ? "+" : ""}${(Math.abs(tx.amount) / 100).toFixed(2)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-10 grid grid-cols-3 gap-4">
          <a
            href={`/store/${slug}`}
            className="border border-gray-100 p-5 hover:border-kraft transition-colors text-center group"
          >
            <ShoppingBag size={24} className="mx-auto text-kraft-dark mb-2 group-hover:text-kraft" />
            <p className="text-sm font-medium">Shop Merch</p>
            <p className="text-[10px] text-smoky mt-1">Browse products</p>
          </a>
          <a
            href={`/store/${slug}/orders`}
            className="border border-gray-100 p-5 hover:border-kraft transition-colors text-center group"
          >
            <Package size={24} className="mx-auto text-kraft-dark mb-2 group-hover:text-kraft" />
            <p className="text-sm font-medium">Track Orders</p>
            <p className="text-[10px] text-smoky mt-1">See order status</p>
          </a>
          <a
            href={`/store/${slug}/cart`}
            className="border border-gray-100 p-5 hover:border-kraft transition-colors text-center group"
          >
            <Gift size={24} className="mx-auto text-kraft-dark mb-2 group-hover:text-kraft" />
            <p className="text-sm font-medium">Your Cart</p>
            <p className="text-[10px] text-smoky mt-1">{cart.count} items</p>
          </a>
        </div>
      </div>

      <StoreFooter companyName={storeName} />
    </div>
  );
}
