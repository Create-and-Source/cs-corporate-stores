"use client";

import { useState, useEffect } from "react";
import { Minus, Plus, Trash2, ArrowLeft, ShoppingBag, Package } from "lucide-react";
import { useParams } from "next/navigation";
import { StoreHeader } from "@/components/store/StoreHeader";
import { StoreFooter } from "@/components/store/StoreFooter";
import { useCart } from "@/lib/cart";
import { supabase } from "@/lib/supabase";

interface Store {
  company_name: string;
  logo_url: string | null;
}

export default function CartPage() {
  const params = useParams();
  const slug = params.slug as string;
  const cart = useCart();

  const [store, setStore] = useState<Store | null>(null);
  const [creditBalance, setCreditBalance] = useState(0);

  useEffect(() => {
    async function load() {
      const { data: storeData } = await supabase
        .from("stores")
        .select("company_name, logo_url, id")
        .eq("slug", slug)
        .single();

      if (storeData) {
        setStore(storeData);
        const { data: creditData } = await supabase
          .from("credit_balances")
          .select("balance")
          .eq("store_id", storeData.id)
          .limit(1)
          .single();
        if (creditData) setCreditBalance(creditData.balance);
      }
    }
    load();
  }, [slug]);

  const companyName = store?.company_name || "Store";
  const remaining = creditBalance - cart.total;

  return (
    <div className="min-h-screen bg-white">
      <StoreHeader
        companyName={companyName}
        logoUrl={store?.logo_url || null}
        creditBalance={creditBalance}
        cartCount={cart.count}
        isAdmin={false}
        storeSlug={slug}
      />

      <div className="max-w-4xl mx-auto px-6 py-12">
        <a
          href={`/store/${slug}`}
          className="inline-flex items-center gap-2 text-smoky text-[11px] tracking-[0.1em] uppercase hover:text-black transition-colors mb-10"
        >
          <ArrowLeft size={14} />
          Continue Shopping
        </a>

        <h1 className="text-3xl font-bold tracking-tight mb-2">Your Cart</h1>
        <div className="w-10 h-[2px] bg-kraft mb-10" />

        {cart.items.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag size={48} className="mx-auto text-kraft mb-4" />
            <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
            <p className="text-smoky text-sm mb-8">Browse the store to add some merch</p>
            <a
              href={`/store/${slug}`}
              className="inline-flex items-center justify-center bg-black text-white px-8 py-4 text-xs tracking-[0.2em] uppercase font-medium hover:bg-brown transition-all"
            >
              Shop Now
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-0">
              {cart.items.map((item, index) => (
                <div
                  key={`${item.productId}-${item.size}-${item.color}`}
                  className={`flex gap-5 py-6 ${
                    index < cart.items.length - 1 ? "border-b border-gray-100" : ""
                  }`}
                >
                  <div className="w-28 h-28 bg-off-white flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package size={24} className="text-kraft" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-4">
                      <div>
                        <h3 className="font-medium text-sm">{item.name}</h3>
                        <p className="text-[11px] text-smoky mt-1 tracking-wide uppercase">
                          {item.color} / {item.size}
                        </p>
                      </div>
                      <p className="font-semibold text-sm tabular-nums whitespace-nowrap">
                        ${((item.price * item.quantity) / 100).toFixed(2)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center border border-gray-200">
                        <button
                          onClick={() =>
                            cart.updateQuantity(
                              item.productId,
                              item.size,
                              item.color,
                              item.quantity - 1
                            )
                          }
                          className="p-2 hover:bg-off-white transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="px-4 text-xs font-medium tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            cart.updateQuantity(
                              item.productId,
                              item.size,
                              item.color,
                              item.quantity + 1
                            )
                          }
                          className="p-2 hover:bg-off-white transition-colors"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <button
                        onClick={() =>
                          cart.removeItem(item.productId, item.size, item.color)
                        }
                        className="text-smoky hover:text-error transition-colors p-1"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="bg-off-white p-8 h-fit">
              <h3 className="text-[11px] font-bold tracking-[0.2em] uppercase mb-8">
                Order Summary
              </h3>

              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-smoky text-[11px] tracking-wide uppercase">Subtotal</span>
                  <span className="font-medium tabular-nums">
                    ${(cart.total / 100).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-smoky text-[11px] tracking-wide uppercase">Shipping</span>
                  <span className="text-success text-[11px] font-medium uppercase tracking-wide">Free</span>
                </div>
                <div className="border-t border-kraft/30 pt-4 flex justify-between items-baseline">
                  <span className="font-bold text-xs uppercase tracking-wide">Total</span>
                  <span className="font-bold text-lg tabular-nums">
                    ${(cart.total / 100).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="mt-8 p-4 bg-white border border-kraft/20">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-smoky text-[11px] tracking-wide uppercase">Your credit balance</span>
                  <span className="font-medium tabular-nums">
                    ${(creditBalance / 100).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-smoky text-[11px] tracking-wide uppercase">After this order</span>
                  <span
                    className={`font-medium tabular-nums ${remaining >= 0 ? "text-success" : "text-error"}`}
                  >
                    ${(remaining / 100).toFixed(2)}
                  </span>
                </div>
              </div>

              <a
                href={`/store/${slug}/checkout`}
                className="w-full mt-8 py-4 text-xs tracking-[0.2em] uppercase font-medium bg-black text-white hover:bg-brown transition-all flex items-center justify-center"
              >
                Proceed to Checkout
              </a>

              <p className="text-[10px] text-smoky text-center mt-4 tracking-[0.1em] uppercase">
                You&apos;ll enter your shipping address next
              </p>
            </div>
          </div>
        )}
      </div>

      <StoreFooter companyName={companyName} />
    </div>
  );
}
