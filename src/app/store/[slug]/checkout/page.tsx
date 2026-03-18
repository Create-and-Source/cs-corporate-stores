"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Truck, Loader2, MapPin, Package, Shield } from "lucide-react";
import { StoreHeader } from "@/components/store/StoreHeader";
import { StoreFooter } from "@/components/store/StoreFooter";
import { useCart } from "@/lib/cart";
import { supabase } from "@/lib/supabase";

interface ShippingRate {
  method: string;
  cost: number;
  estimatedDays: string;
}

export default function CheckoutPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const cart = useCart();
  const [storeName, setStoreName] = useState("Store");
  const creditBalance = 15000; // TODO: pull from user session

  useEffect(() => {
    async function loadStore() {
      const { data: store } = await supabase.from("stores").select("company_name").eq("slug", slug).single();
      if (store) setStoreName(store.company_name || "Store");
    }
    loadStore();
  }, [slug]);

  // Address form
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");

  // Shipping
  const [shippingRate, setShippingRate] = useState<ShippingRate | null>(null);
  const [calculatingShipping, setCalculatingShipping] = useState(false);
  const [addressSaved, setAddressSaved] = useState(false);

  // Order
  const [submitting, setSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  const subtotal = cart.total;
  const shipping = shippingRate?.cost || 0;
  const total = subtotal + shipping;
  const remaining = creditBalance - total;
  const canCheckout = remaining >= 0 && addressSaved && firstName && lastName;

  const handleCalculateShipping = async () => {
    if (!address1 || !city || !state || !zip) {
      alert("Please fill in your full address");
      return;
    }

    setCalculatingShipping(true);

    // Estimate shipping based on item count and location
    // In production, this would call Printify/FE shipping APIs
    const itemCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);
    const baseShipping = 599; // $5.99 base
    const perItem = 199; // $1.99 per additional item
    const estimatedShipping = baseShipping + Math.max(0, itemCount - 1) * perItem;

    // Simulate API call
    await new Promise((r) => setTimeout(r, 1000));

    setShippingRate({
      method: "Standard Shipping",
      cost: estimatedShipping,
      estimatedDays: "5-7 business days",
    });
    setAddressSaved(true);
    setCalculatingShipping(false);
  };

  const handlePlaceOrder = async () => {
    if (!canCheckout) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "a0000001-0000-4000-a000-000000000002", // Demo user
          storeId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", // Demo store
          items: cart.items.map((i) => ({
            product_id: i.productId,
            quantity: i.quantity,
            size: i.size,
            color: i.color,
          })),
          shippingAddress: {
            name: `${firstName} ${lastName}`,
            line1: address1,
            line2: address2,
            city,
            state,
            zip,
            country: "US",
          },
        }),
      });

      if (res.ok) {
        cart.clearCart();
        setOrderComplete(true);
      } else {
        const data = await res.json();
        alert(data.error || "Order failed. Please try again.");
      }
    } catch {
      alert("Something went wrong. Please try again.");
    }
    setSubmitting(false);
  };

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-white">
        <StoreHeader
          companyName={storeName}
          logoUrl={null}
          creditBalance={remaining}
          cartCount={0}
          isAdmin={false}
          storeSlug={slug}
        />
        <div className="max-w-lg mx-auto px-6 py-24 text-center">
          <div className="w-16 h-16 bg-success/10 flex items-center justify-center mx-auto mb-6">
            <Package size={32} className="text-success" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-3">Order Placed!</h1>
          <p className="text-smoky mb-2">
            Your merch is being produced and will ship directly to you.
          </p>
          <p className="text-sm text-smoky mb-8">
            {firstName}, we&apos;ll send tracking info to your email once it ships.
          </p>
          <div className="flex gap-3 justify-center">
            <a
              href={`/store/${slug}/orders`}
              className="bg-black text-white px-6 py-3 text-sm tracking-[0.1em] uppercase font-medium hover:bg-brown transition-colors"
            >
              View Orders
            </a>
            <a
              href={`/store/${slug}`}
              className="border border-gray-200 px-6 py-3 text-sm tracking-[0.1em] uppercase font-medium hover:border-kraft transition-colors"
            >
              Keep Shopping
            </a>
          </div>
        </div>
        <StoreFooter companyName={storeName} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <StoreHeader
        companyName={storeName}
        logoUrl={null}
        creditBalance={creditBalance}
        cartCount={cart.count}
        isAdmin={false}
        storeSlug={slug}
      />

      <div className="max-w-4xl mx-auto px-6 py-10">
        <a
          href={`/store/${slug}/cart`}
          className="inline-flex items-center gap-2 text-smoky text-sm hover:text-black transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          Back to Cart
        </a>

        <h1 className="text-3xl font-bold tracking-tight mb-10">Checkout</h1>

        {cart.items.length === 0 ? (
          <div className="text-center py-16">
            <Package size={48} className="mx-auto text-kraft mb-4" />
            <p className="text-smoky">Your cart is empty</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Left — Address Form */}
            <div className="lg:col-span-2 space-y-8">
              {/* Shipping Address */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <MapPin size={18} className="text-kraft-dark" />
                  <h2 className="font-bold text-lg">Shipping Address</h2>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] tracking-[0.15em] uppercase text-smoky block mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Sarah"
                        className="w-full px-3 py-3 border border-gray-200 text-sm focus:outline-none focus:border-kraft"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] tracking-[0.15em] uppercase text-smoky block mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Johnson"
                        className="w-full px-3 py-3 border border-gray-200 text-sm focus:outline-none focus:border-kraft"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] tracking-[0.15em] uppercase text-smoky block mb-1">
                      Address *
                    </label>
                    <input
                      type="text"
                      value={address1}
                      onChange={(e) => setAddress1(e.target.value)}
                      placeholder="123 Main Street"
                      className="w-full px-3 py-3 border border-gray-200 text-sm focus:outline-none focus:border-kraft"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] tracking-[0.15em] uppercase text-smoky block mb-1">
                      Apartment, Suite, etc.
                    </label>
                    <input
                      type="text"
                      value={address2}
                      onChange={(e) => setAddress2(e.target.value)}
                      placeholder="Apt 4B"
                      className="w-full px-3 py-3 border border-gray-200 text-sm focus:outline-none focus:border-kraft"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] tracking-[0.15em] uppercase text-smoky block mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Scottsdale"
                        className="w-full px-3 py-3 border border-gray-200 text-sm focus:outline-none focus:border-kraft"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] tracking-[0.15em] uppercase text-smoky block mb-1">
                        State *
                      </label>
                      <select
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="w-full px-3 py-3 border border-gray-200 text-sm focus:outline-none focus:border-kraft"
                      >
                        <option value="">Select</option>
                        {["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"].map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] tracking-[0.15em] uppercase text-smoky block mb-1">
                        ZIP Code *
                      </label>
                      <input
                        type="text"
                        value={zip}
                        onChange={(e) => setZip(e.target.value)}
                        placeholder="85251"
                        className="w-full px-3 py-3 border border-gray-200 text-sm focus:outline-none focus:border-kraft"
                        maxLength={10}
                      />
                    </div>
                  </div>
                </div>

                {/* Calculate Shipping Button */}
                {!addressSaved && (
                  <button
                    onClick={handleCalculateShipping}
                    disabled={calculatingShipping || !address1 || !city || !state || !zip}
                    className="mt-6 bg-black text-white px-6 py-3 text-sm tracking-[0.1em] uppercase font-medium hover:bg-brown transition-colors disabled:opacity-40 flex items-center gap-2"
                  >
                    {calculatingShipping ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Calculating...
                      </>
                    ) : (
                      <>
                        <Truck size={16} />
                        Calculate Shipping
                      </>
                    )}
                  </button>
                )}

                {/* Shipping result */}
                {shippingRate && (
                  <div className="mt-4 bg-off-white p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Truck size={18} className="text-kraft-dark" />
                      <div>
                        <p className="text-sm font-medium">{shippingRate.method}</p>
                        <p className="text-[10px] text-smoky">{shippingRate.estimatedDays}</p>
                      </div>
                    </div>
                    <p className="font-bold">${(shippingRate.cost / 100).toFixed(2)}</p>
                  </div>
                )}
              </div>

              {/* Order Items Summary */}
              <div>
                <h2 className="font-bold text-lg mb-4">Items ({cart.count})</h2>
                <div className="space-y-3">
                  {cart.items.map((item) => (
                    <div
                      key={`${item.productId}-${item.size}-${item.color}`}
                      className="flex items-center gap-4 py-3 border-b border-gray-50"
                    >
                      <div className="w-14 h-14 bg-off-white flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package size={16} className="text-kraft" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-[10px] text-smoky">
                          {item.color} / {item.size} · Qty {item.quantity}
                        </p>
                      </div>
                      <p className="text-sm font-medium">
                        ${((item.price * item.quantity) / 100).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right — Order Summary */}
            <div>
              <div className="bg-off-white p-6 sticky top-24">
                <h3 className="font-bold tracking-wide uppercase text-sm mb-6">
                  Order Summary
                </h3>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-smoky">Subtotal ({cart.count} items)</span>
                    <span className="font-medium">${(subtotal / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-smoky">Shipping</span>
                    {shippingRate ? (
                      <span className="font-medium">${(shipping / 100).toFixed(2)}</span>
                    ) : (
                      <span className="text-smoky text-xs">Enter address</span>
                    )}
                  </div>
                  <div className="border-t border-kraft pt-3 flex justify-between">
                    <span className="font-bold">Total</span>
                    <span className="font-bold text-xl">${(total / 100).toFixed(2)}</span>
                  </div>
                </div>

                {/* Credit balance */}
                <div className="mt-6 p-4 bg-white border border-kraft/30">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-smoky">Your credits</span>
                    <span className="font-medium">${(creditBalance / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-smoky">After this order</span>
                    <span className={`font-medium ${remaining >= 0 ? "text-success" : "text-error"}`}>
                      ${(remaining / 100).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Place order */}
                <button
                  onClick={handlePlaceOrder}
                  disabled={!canCheckout || submitting}
                  className={`w-full mt-6 py-4 text-sm tracking-[0.15em] uppercase font-medium flex items-center justify-center gap-2 transition-all ${
                    !canCheckout
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : submitting
                        ? "bg-gray-300 text-gray-500"
                        : "bg-black text-white hover:bg-brown"
                  }`}
                >
                  {submitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    "Place Order"
                  )}
                </button>

                {!addressSaved && (
                  <p className="text-[10px] text-smoky text-center mt-3">
                    Enter your address to see shipping cost
                  </p>
                )}

                <div className="flex items-center justify-center gap-1 mt-4 text-[10px] text-smoky">
                  <Shield size={10} />
                  <span>Secure checkout · Ships direct to you</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <StoreFooter companyName={storeName} />
    </div>
  );
}
