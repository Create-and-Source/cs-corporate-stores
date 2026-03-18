"use client";

import { Minus, Plus, Trash2, ArrowLeft, ShoppingBag, Package } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { StoreHeader } from "@/components/store/StoreHeader";
import { StoreFooter } from "@/components/store/StoreFooter";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/lib/cart";

export default function CartPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const cart = useCart();
  const creditBalance = 15000; // TODO: pull from user session
  const remaining = creditBalance - cart.total;

  const handleCheckout = async () => {
    if (remaining < 0) {
      alert("Not enough credits for this order");
      return;
    }

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
            name: "Sarah Johnson",
            line1: "123 Main St",
            city: "Scottsdale",
            state: "AZ",
            zip: "85251",
            country: "US",
          },
        }),
      });

      if (res.ok) {
        cart.clearCart();
        router.push(`/store/${slug}/orders`);
      } else {
        const data = await res.json();
        alert(data.error || "Order failed");
      }
    } catch {
      alert("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <StoreHeader
        companyName="ACME Corporation"
        logoUrl={null}
        creditBalance={creditBalance}
        cartCount={cart.count}
        isAdmin={true}
        storeSlug={slug}
      />

      <div className="max-w-4xl mx-auto px-6 py-12">
        <a
          href={`/store/${slug}`}
          className="inline-flex items-center gap-2 text-smoky text-sm hover:text-black transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          Continue Shopping
        </a>

        <h1 className="text-3xl font-bold tracking-tight mb-10">Your Cart</h1>

        {cart.items.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag size={48} className="mx-auto text-kraft mb-4" />
            <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
            <p className="text-smoky text-sm mb-6">Browse the store to add some merch</p>
            <a href={`/store/${slug}`}>
              <Button variant="primary">Shop Now</Button>
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              {cart.items.map((item) => (
                <div
                  key={`${item.productId}-${item.size}-${item.color}`}
                  className="flex gap-5 pb-6 border-b border-gray-100"
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

                  <div className="flex-1">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-sm text-smoky mt-0.5">
                          {item.color} / {item.size}
                        </p>
                      </div>
                      <p className="font-semibold">
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
                          <Minus size={14} />
                        </button>
                        <span className="px-4 text-sm font-medium">
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
                          <Plus size={14} />
                        </button>
                      </div>

                      <button
                        onClick={() =>
                          cart.removeItem(item.productId, item.size, item.color)
                        }
                        className="text-smoky hover:text-error transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="bg-off-white p-6 h-fit">
              <h3 className="font-bold tracking-wide uppercase text-sm mb-6">
                Order Summary
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-smoky">Subtotal</span>
                  <span className="font-medium">
                    ${(cart.total / 100).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-smoky">Shipping</span>
                  <span className="text-success font-medium">Free</span>
                </div>
                <div className="border-t border-kraft pt-3 flex justify-between">
                  <span className="font-bold">Total</span>
                  <span className="font-bold text-lg">
                    ${(cart.total / 100).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-white border border-kraft/30">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-smoky">Your credit balance</span>
                  <span className="font-medium">
                    ${(creditBalance / 100).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-smoky">After this order</span>
                  <span
                    className={`font-medium ${remaining >= 0 ? "text-success" : "text-error"}`}
                  >
                    ${(remaining / 100).toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={remaining < 0}
                className={`w-full mt-6 py-4 text-sm tracking-[0.15em] uppercase font-medium transition-all ${
                  remaining < 0
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-black text-white hover:bg-brown"
                }`}
              >
                Checkout with Credits
              </button>

              <p className="text-[10px] text-smoky text-center mt-3 tracking-wide">
                Ships directly to your address
              </p>
            </div>
          </div>
        )}
      </div>

      <StoreFooter companyName="ACME Corporation" />
    </div>
  );
}
