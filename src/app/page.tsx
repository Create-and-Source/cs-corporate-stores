"use client";

import { ArrowRight, Package, Users, Palette } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight">
              Create & Source
            </span>
            <span className="text-[10px] tracking-[0.2em] uppercase text-kraft-dark bg-off-white px-2 py-1">
              Corporate
            </span>
          </div>
          <a href="/store/acme-corp">
            <Button variant="primary" size="sm">
              View Demo Store
              <ArrowRight size={14} className="ml-2" />
            </Button>
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-black text-white">
        <div className="max-w-7xl mx-auto px-6 py-28">
          <p className="text-kraft text-[11px] tracking-[0.3em] uppercase mb-4">
            Corporate Merchandise Platform
          </p>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight max-w-3xl leading-tight">
            Premium merch stores for your{" "}
            <span className="text-kraft">best clients</span>
          </h1>
          <p className="text-gray-400 text-lg mt-6 max-w-xl">
            Branded employee stores with credit-based shopping. Connected to
            Fulfill Engine and Printify for seamless production and shipping.
          </p>
          <div className="flex gap-4 mt-10">
            <a href="/store/acme-corp">
              <Button variant="secondary" size="lg">
                See It In Action
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <div className="w-12 h-12 bg-off-white flex items-center justify-center mb-4">
              <Palette size={24} className="text-kraft-dark" />
            </div>
            <h3 className="text-lg font-bold mb-2">Custom Branded Stores</h3>
            <p className="text-smoky text-sm leading-relaxed">
              Each client gets a beautiful, fully branded store with their logo,
              colors, and curated product selection.
            </p>
          </div>

          <div>
            <div className="w-12 h-12 bg-off-white flex items-center justify-center mb-4">
              <Users size={24} className="text-kraft-dark" />
            </div>
            <h3 className="text-lg font-bold mb-2">Credit System</h3>
            <p className="text-smoky text-sm leading-relaxed">
              Companies load credits for employees — bonuses, new hires,
              holidays. Employees shop without needing a credit card.
            </p>
          </div>

          <div>
            <div className="w-12 h-12 bg-off-white flex items-center justify-center mb-4">
              <Package size={24} className="text-kraft-dark" />
            </div>
            <h3 className="text-lg font-bold mb-2">Auto Fulfillment</h3>
            <p className="text-smoky text-sm leading-relaxed">
              Orders automatically route to Fulfill Engine or Printify for
              production and direct-to-door shipping.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm text-smoky">
            Powered by{" "}
            <span className="text-kraft-dark font-semibold">
              Create & Source
            </span>
          </p>
        </div>
      </footer>
    </div>
  );
}
