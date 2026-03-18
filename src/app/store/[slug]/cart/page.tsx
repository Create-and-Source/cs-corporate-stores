"use client";

import { Minus, Plus, Trash2, ArrowLeft } from "lucide-react";
import { StoreHeader } from "@/components/store/StoreHeader";
import { StoreFooter } from "@/components/store/StoreFooter";
import { Button } from "@/components/ui/Button";
import { CreditBadge } from "@/components/ui/CreditBadge";

// Demo cart items
const DEMO_CART = [
  {
    id: "1",
    name: "Classic Logo Tee",
    price: 2800,
    image: "/placeholder-tee.jpg",
    size: "L",
    color: "Black",
    quantity: 1,
  },
  {
    id: "3",
    name: "Structured Cap",
    price: 2200,
    image: "/placeholder-cap.jpg",
    size: "One Size",
    color: "Kraft",
    quantity: 1,
  },
];

export default function CartPage() {
  const subtotal = DEMO_CART.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const creditBalance = 15000;
  const remaining = creditBalance - subtotal;

  return (
    <div className="min-h-screen bg-white">
      <StoreHeader
        companyName="ACME Corporation"
        logoUrl={null}
        creditBalance={creditBalance}
        cartCount={DEMO_CART.length}
        isAdmin={true}
        storeSlug="acme-corp"
      />

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Back link */}
        <a
          href="/store/acme-corp"
          className="inline-flex items-center gap-2 text-smoky text-sm hover:text-black transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          Continue Shopping
        </a>

        <h1 className="text-3xl font-bold tracking-tight mb-10">Your Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {DEMO_CART.map((item) => (
              <div
                key={item.id}
                className="flex gap-5 pb-6 border-b border-gray-100"
              >
                <div className="w-28 h-28 bg-off-white flex-shrink-0">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
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
                      ${(item.price / 100).toFixed(2)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    {/* Quantity */}
                    <div className="flex items-center border border-gray-200">
                      <button className="p-2 hover:bg-off-white transition-colors">
                        <Minus size={14} />
                      </button>
                      <span className="px-4 text-sm font-medium">
                        {item.quantity}
                      </span>
                      <button className="p-2 hover:bg-off-white transition-colors">
                        <Plus size={14} />
                      </button>
                    </div>

                    <button className="text-smoky hover:text-error transition-colors">
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
                  ${(subtotal / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-smoky">Shipping</span>
                <span className="text-success font-medium">Free</span>
              </div>
              <div className="border-t border-kraft pt-3 flex justify-between">
                <span className="font-bold">Total</span>
                <span className="font-bold text-lg">
                  ${(subtotal / 100).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Credit balance info */}
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

            <Button variant="primary" size="lg" className="w-full mt-6">
              Checkout with Credits
            </Button>

            <p className="text-[10px] text-smoky text-center mt-3 tracking-wide">
              Ships directly to your address
            </p>
          </div>
        </div>
      </div>

      <StoreFooter companyName="ACME Corporation" />
    </div>
  );
}
