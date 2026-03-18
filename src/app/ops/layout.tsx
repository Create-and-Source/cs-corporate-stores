"use client";

import { ReactNode } from "react";
import {
  LayoutDashboard,
  Package,
  Store,
  DollarSign,
  Users,
  Settings,
  ArrowLeft,
} from "lucide-react";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/ops", label: "Dashboard", icon: LayoutDashboard },
  { href: "/ops/orders", label: "Orders", icon: Package },
  { href: "/ops/stores", label: "Stores", icon: Store },
];

export default function OpsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-off-white flex">
      {/* Sidebar */}
      <aside className="w-56 bg-black text-white flex-shrink-0 flex flex-col">
        <div className="p-5 border-b border-white/10">
          <span className="text-sm font-bold tracking-tight">
            Create<span className="text-kraft">&</span>Source
          </span>
          <p className="text-[9px] tracking-[0.2em] uppercase text-gray-500 mt-1">
            Operations
          </p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/ops" && pathname.startsWith(item.href));
            return (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <item.icon size={16} />
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/10">
          <a
            href="/"
            className="flex items-center gap-2 px-3 py-2 text-xs text-gray-500 hover:text-white transition-colors"
          >
            <ArrowLeft size={14} />
            Back to Site
          </a>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
