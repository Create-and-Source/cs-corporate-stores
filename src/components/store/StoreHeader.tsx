"use client";

import { ShoppingBag, User, Package, Settings } from "lucide-react";
import { CreditBadge } from "../ui/CreditBadge";

interface StoreHeaderProps {
  companyName: string;
  logoUrl?: string | null;
  creditBalance: number;
  cartCount: number;
  isAdmin?: boolean;
  storeSlug: string;
}

export function StoreHeader({
  companyName,
  logoUrl,
  creditBalance,
  cartCount,
  isAdmin,
  storeSlug,
}: StoreHeaderProps) {
  return (
    <header className="border-b border-gray-100 sticky top-0 z-50 bg-white">
      {/* Top bar */}
      <div className="bg-black text-white text-center py-2.5">
        <p className="text-[10px] tracking-[0.25em] uppercase font-light">
          Corporate Merchandise &mdash; Powered by Create & Source
        </p>
      </div>

      {/* Main header */}
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo / Company Name */}
        <a href={`/store/${storeSlug}`} className="flex items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt={companyName} className="h-10 object-contain" />
          ) : (
            <span className="text-xl font-bold tracking-tight uppercase">{companyName}</span>
          )}
        </a>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <a
            href={`/store/${storeSlug}#products`}
            className="text-[11px] tracking-[0.15em] uppercase text-smoky hover:text-black transition-colors"
          >
            Shop
          </a>
          <a
            href={`/store/${storeSlug}/orders`}
            className="text-[11px] tracking-[0.15em] uppercase text-smoky hover:text-black transition-colors flex items-center gap-1.5"
          >
            <Package size={15} />
            Orders
          </a>
          {isAdmin && (
            <a
              href={`/store/${storeSlug}/admin`}
              className="text-[11px] tracking-[0.15em] uppercase text-smoky hover:text-black transition-colors flex items-center gap-1.5"
            >
              <Settings size={15} />
              Admin
            </a>
          )}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-4">
          <CreditBadge balance={creditBalance} />

          <a
            href={`/store/${storeSlug}/cart`}
            className="relative p-2 hover:bg-off-white transition-colors"
          >
            <ShoppingBag size={20} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-kraft text-black text-[10px] font-bold w-5 h-5 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </a>

          <a href={`/store/${storeSlug}/account`} className="p-2 hover:bg-off-white transition-colors">
            <User size={20} />
          </a>
        </div>
      </div>
    </header>
  );
}
