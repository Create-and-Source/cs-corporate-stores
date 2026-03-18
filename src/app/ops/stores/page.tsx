"use client";

import { useState, useEffect } from "react";
import { Store, Users, Package, DollarSign, Plus, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface StoreData {
  id: string;
  slug: string;
  company_name: string;
  is_active: boolean;
  created_at: string;
  employeeCount: number;
  orderCount: number;
  revenue: number;
  creditBalance: number;
}

export default function OpsStoresPage() {
  const [stores, setStores] = useState<StoreData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [storesRes, usersRes, ordersRes, creditsRes] = await Promise.all([
        supabase.from("stores").select("*"),
        supabase.from("users").select("store_id, role"),
        supabase.from("orders").select("store_id, total"),
        supabase.from("credit_balances").select("store_id, balance"),
      ]);

      const storesData = storesRes.data || [];
      const users = usersRes.data || [];
      const orders = ordersRes.data || [];
      const credits = creditsRes.data || [];

      const enriched = storesData.map((s) => ({
        id: s.id,
        slug: s.slug,
        company_name: s.company_name,
        is_active: s.is_active,
        created_at: s.created_at,
        employeeCount: users.filter((u) => u.store_id === s.id && u.role === "employee").length,
        orderCount: orders.filter((o) => o.store_id === s.id).length,
        revenue: orders.filter((o) => o.store_id === s.id).reduce((sum, o) => sum + o.total, 0),
        creditBalance: credits.filter((c) => c.store_id === s.id).reduce((sum, c) => sum + c.balance, 0),
      }));

      setStores(enriched);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Client Stores</h1>
          <p className="text-sm text-smoky mt-1">
            Manage all corporate merch stores
          </p>
        </div>
        <button className="bg-black text-white px-5 py-2.5 text-sm font-medium flex items-center gap-2 hover:bg-brown transition-colors">
          <Plus size={16} />
          New Store
        </button>
      </div>

      {loading ? (
        <p className="text-smoky text-center py-12">Loading stores...</p>
      ) : stores.length === 0 ? (
        <div className="bg-white border border-gray-100 p-12 text-center">
          <Store size={36} className="mx-auto text-kraft mb-3" />
          <p className="font-semibold mb-1">No stores yet</p>
          <p className="text-smoky text-sm">Create your first client store to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {stores.map((store) => (
            <a key={store.id} href={`/ops/stores/${store.id}`} className="bg-white border border-gray-100 p-5 hover:border-kraft transition-colors block">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-lg">{store.company_name}</h3>
                  <p className="text-xs text-smoky mt-0.5">{store.slug}.createandsource.com</p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`/store/${store.slug}`}
                    target="_blank"
                    className="p-2 hover:bg-off-white transition-colors"
                  >
                    <ExternalLink size={14} className="text-smoky" />
                  </a>
                  <span className={`text-[9px] tracking-[0.1em] uppercase font-medium px-2 py-1 ${
                    store.is_active ? "bg-success/10 text-success" : "bg-gray-100 text-gray-500"
                  }`}>
                    {store.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Users size={12} className="text-smoky" />
                    <span className="text-[10px] text-smoky uppercase tracking-wider">Employees</span>
                  </div>
                  <p className="text-lg font-bold">{store.employeeCount}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Package size={12} className="text-smoky" />
                    <span className="text-[10px] text-smoky uppercase tracking-wider">Orders</span>
                  </div>
                  <p className="text-lg font-bold">{store.orderCount}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <DollarSign size={12} className="text-smoky" />
                    <span className="text-[10px] text-smoky uppercase tracking-wider">Revenue</span>
                  </div>
                  <p className="text-lg font-bold">${(store.revenue / 100).toFixed(0)}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <DollarSign size={12} className="text-kraft-dark" />
                    <span className="text-[10px] text-smoky uppercase tracking-wider">Credits</span>
                  </div>
                  <p className="text-lg font-bold text-kraft-dark">${(store.creditBalance / 100).toFixed(0)}</p>
                </div>
              </div>

              <p className="text-[10px] text-smoky mt-4 pt-3 border-t border-gray-50">
                Created {new Date(store.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
