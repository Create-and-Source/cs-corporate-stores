"use client";

import {
  Home,
  Store,
  ShoppingBag,
  Package,
  ShoppingCart,
  CreditCard,
  Users,
  BarChart3,
  Settings,
  LogIn,
  Layers,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

const SECTIONS = [
  {
    title: "Public",
    description: "What visitors see",
    pages: [
      { name: "Landing Page", href: "/", icon: Home, description: "Main marketing page — sells the platform" },
    ],
  },
  {
    title: "Client Store (Employee View)",
    description: "What employees see when shopping",
    pages: [
      { name: "Store Home", href: "/store/acme-corp", icon: Store, description: "Branded store with products, hero, categories" },
      { name: "Product Detail", href: "/store/acme-corp/products/2a3e9815-3179-433e-a6c4-ee01b6f87cf8", icon: ShoppingBag, description: "Individual product — sizes, colors, add to cart" },
      { name: "Cart", href: "/store/acme-corp/cart", icon: ShoppingCart, description: "Shopping cart with credit balance" },
      { name: "Checkout", href: "/store/acme-corp/checkout", icon: CreditCard, description: "Shipping address + shipping cost + place order" },
      { name: "Order History", href: "/store/acme-corp/orders", icon: Package, description: "Employee's order tracking" },
      { name: "Login", href: "/store/acme-corp/login", icon: LogIn, description: "Employee sign-in page" },
    ],
  },
  {
    title: "Client Store (Admin View)",
    description: "What the company manager sees",
    pages: [
      { name: "Admin Dashboard", href: "/store/acme-corp/admin", icon: BarChart3, description: "Stats, orders, credits, top products" },
      { name: "Product Catalog", href: "/store/acme-corp/admin/catalog", icon: ShoppingBag, description: "Browse 8,000+ products, configure, add to store" },
      { name: "Employees", href: "/store/acme-corp/admin/employees", icon: Users, description: "Add employees, assign credits, manage team" },
      { name: "All Orders", href: "/store/acme-corp/admin/orders", icon: Package, description: "View all employee orders" },
      { name: "Credit History", href: "/store/acme-corp/admin/credits", icon: CreditCard, description: "Transaction log — credits added and spent" },
      { name: "Store Setup", href: "/store/acme-corp/setup", icon: Layers, description: "Guided 4-step onboarding wizard" },
    ],
  },
  {
    title: "C&S Operations (Your View)",
    description: "Your back office — revenue, margins, all stores",
    pages: [
      { name: "Ops Dashboard", href: "/ops", icon: BarChart3, description: "Revenue, profit, order pipeline, top products" },
      { name: "All Orders", href: "/ops/orders", icon: Package, description: "Orders across all stores with search/filter" },
      { name: "All Stores", href: "/ops/stores", icon: Store, description: "Client store overview — employees, revenue, credits" },
    ],
  },
];

export default function AllPagesPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-black text-white">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <a href="/" className="text-sm text-kraft hover:text-kraft-light transition-colors mb-4 inline-block">
            &larr; Back to Landing Page
          </a>
          <h1 className="text-4xl font-bold tracking-tight">All Pages</h1>
          <p className="text-gray-400 mt-2">
            Every page in the Create & Source Corporate Stores platform. Click to explore.
          </p>
          <div className="flex items-center gap-6 mt-6 text-sm text-gray-500">
            <span>{SECTIONS.reduce((s, sec) => s + sec.pages.length, 0)} pages total</span>
            <span>{SECTIONS.length} sections</span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-12 space-y-12">
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <div className="mb-6">
              <h2 className="text-xl font-bold tracking-tight">{section.title}</h2>
              <p className="text-sm text-smoky mt-1">{section.description}</p>
              <div className="w-10 h-[2px] bg-kraft mt-3" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {section.pages.map((page) => (
                <a
                  key={page.href}
                  href={page.href}
                  className="group flex items-start gap-4 p-4 border border-gray-100 hover:border-kraft hover:bg-off-white/50 transition-all"
                >
                  <div className="w-10 h-10 bg-off-white flex items-center justify-center flex-shrink-0 group-hover:bg-kraft/10 transition-colors">
                    <page.icon size={18} className="text-kraft-dark" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{page.name}</p>
                      <ArrowRight size={12} className="text-smoky opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-xs text-smoky mt-0.5">{page.description}</p>
                    <p className="text-[10px] text-kraft-dark mt-1 font-mono">{page.href}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 mt-8">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-sm text-smoky">
            Powered by <span className="text-kraft-dark font-semibold">Create & Source</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
