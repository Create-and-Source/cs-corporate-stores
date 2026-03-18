"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { CreditCard, ArrowUpRight, ArrowDownRight, Gift, ShoppingBag, RefreshCw, ArrowLeft } from "lucide-react";
import { StoreHeader } from "@/components/store/StoreHeader";
import { StoreFooter } from "@/components/store/StoreFooter";
import { supabase } from "@/lib/supabase";

interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  description: string;
  created_at: string;
  user_name: string;
}

export default function CreditHistoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [totals, setTotals] = useState({ loaded: 0, spent: 0, remaining: 0 });

  useEffect(() => {
    async function load() {
      const { data: store } = await supabase.from("stores").select("id").eq("slug", slug).single();
      if (!store) { setLoading(false); return; }

      const [txRes, usersRes, creditsRes] = await Promise.all([
        supabase.from("credit_transactions").select("*").eq("store_id", store.id).order("created_at", { ascending: false }),
        supabase.from("users").select("id, full_name").eq("store_id", store.id),
        supabase.from("credit_balances").select("*").eq("store_id", store.id),
      ]);

      const users = usersRes.data || [];
      const credits = creditsRes.data || [];

      const enriched = (txRes.data || []).map((tx) => ({
        ...tx,
        user_name: users.find((u) => u.id === tx.user_id)?.full_name || "—",
      }));

      setTransactions(enriched);
      setTotals({
        loaded: credits.reduce((s, c) => s + (c.lifetime_received || 0), 0),
        spent: credits.reduce((s, c) => s + (c.lifetime_spent || 0), 0),
        remaining: credits.reduce((s, c) => s + (c.balance || 0), 0),
      });
      setLoading(false);
    }
    load();
  }, [slug]);

  const filtered = filter === "all"
    ? transactions
    : filter === "credits"
      ? transactions.filter((t) => t.amount > 0)
      : transactions.filter((t) => t.amount < 0);

  const typeConfig: Record<string, { icon: typeof Gift; color: string; label: string }> = {
    bonus: { icon: Gift, color: "text-success", label: "Bonus" },
    new_hire: { icon: Gift, color: "text-kraft-dark", label: "New Hire" },
    holiday: { icon: Gift, color: "text-purple-600", label: "Holiday" },
    manual: { icon: CreditCard, color: "text-blue-600", label: "Manual" },
    purchase: { icon: ShoppingBag, color: "text-error", label: "Purchase" },
    refund: { icon: RefreshCw, color: "text-success", label: "Refund" },
  };

  return (
    <div className="min-h-screen bg-white">
      <StoreHeader companyName="ACME Corporation" logoUrl={null} creditBalance={0} cartCount={0} isAdmin={true} storeSlug={slug} />

      <div className="max-w-5xl mx-auto px-6 py-10">
        <a href={`/store/${slug}/admin`} className="inline-flex items-center gap-1 text-xs text-smoky hover:text-black mb-4">
          <ArrowLeft size={12} /> Back to Dashboard
        </a>

        <h1 className="text-3xl font-bold tracking-tight mb-2">Credit History</h1>
        <p className="text-sm text-smoky mb-8">All credit transactions across your team</p>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-success/5 border border-success/20 p-5">
            <p className="text-[10px] tracking-[0.15em] uppercase text-smoky mb-1">Total Loaded</p>
            <p className="text-2xl font-bold text-success">${(totals.loaded / 100).toFixed(2)}</p>
          </div>
          <div className="bg-error/5 border border-error/20 p-5">
            <p className="text-[10px] tracking-[0.15em] uppercase text-smoky mb-1">Total Spent</p>
            <p className="text-2xl font-bold text-error">${(totals.spent / 100).toFixed(2)}</p>
          </div>
          <div className="bg-off-white border border-kraft/20 p-5">
            <p className="text-[10px] tracking-[0.15em] uppercase text-smoky mb-1">Remaining</p>
            <p className="text-2xl font-bold">${(totals.remaining / 100).toFixed(2)}</p>
            <p className="text-xs text-kraft-dark mt-1">
              {totals.loaded > 0 ? ((totals.spent / totals.loaded) * 100).toFixed(0) : 0}% utilized
            </p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { value: "all", label: "All Transactions" },
            { value: "credits", label: "Credits Added" },
            { value: "spent", label: "Credits Spent" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 text-xs tracking-[0.1em] uppercase font-medium transition-colors ${
                filter === f.value ? "bg-black text-white" : "bg-off-white text-smoky hover:text-black"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Transaction list */}
        {loading ? (
          <p className="text-smoky text-center py-12">Loading...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <CreditCard size={36} className="mx-auto text-kraft mb-3" />
            <p className="font-semibold">No transactions yet</p>
          </div>
        ) : (
          <div className="border border-gray-100">
            {filtered.map((tx) => {
              const config = typeConfig[tx.type] || typeConfig.manual;
              const isCredit = tx.amount > 0;
              const Icon = config.icon;

              return (
                <div key={tx.id} className="flex items-center justify-between p-4 border-b border-gray-50 hover:bg-off-white/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-9 h-9 flex items-center justify-center ${isCredit ? "bg-success/10" : "bg-error/10"}`}>
                      {isCredit ? (
                        <ArrowUpRight size={16} className="text-success" />
                      ) : (
                        <ArrowDownRight size={16} className="text-error" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{tx.user_name}</p>
                      <p className="text-[10px] text-smoky">
                        {tx.description || config.label}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className={`text-[9px] tracking-[0.1em] uppercase font-medium px-2 py-1 ${
                      isCredit ? "bg-success/10 text-success" : "bg-error/10 text-error"
                    }`}>
                      {config.label}
                    </span>
                    <p className={`text-sm font-bold ${isCredit ? "text-success" : "text-error"}`}>
                      {isCredit ? "+" : ""}${(Math.abs(tx.amount) / 100).toFixed(2)}
                    </p>
                    <p className="text-xs text-smoky w-20 text-right">
                      {new Date(tx.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <StoreFooter companyName="ACME Corporation" />
    </div>
  );
}
