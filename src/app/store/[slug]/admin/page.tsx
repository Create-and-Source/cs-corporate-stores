"use client";

import {
  Users,
  DollarSign,
  Package,
  TrendingUp,
  ArrowRight,
  UserPlus,
  Gift,
} from "lucide-react";
import { StoreHeader } from "@/components/store/StoreHeader";
import { StoreFooter } from "@/components/store/StoreFooter";
import { Button } from "@/components/ui/Button";

const STATS = [
  {
    label: "Active Employees",
    value: "48",
    icon: Users,
    change: "+3 this month",
  },
  {
    label: "Credits Distributed",
    value: "$12,400",
    icon: DollarSign,
    change: "$2,100 this month",
  },
  {
    label: "Orders This Month",
    value: "23",
    icon: Package,
    change: "+12% from last month",
  },
  {
    label: "Credits Remaining",
    value: "$6,850",
    icon: TrendingUp,
    change: "Across all employees",
  },
];

const RECENT_ORDERS = [
  {
    employee: "Sarah Johnson",
    items: "Classic Logo Tee, Structured Cap",
    total: "$50.00",
    status: "Shipped",
    date: "Mar 15",
  },
  {
    employee: "Mike Chen",
    items: "Performance Hoodie",
    total: "$55.00",
    status: "In Production",
    date: "Mar 14",
  },
  {
    employee: "Lisa Park",
    items: "Quarter Zip Pullover, Water Bottle",
    total: "$94.00",
    status: "Pending",
    date: "Mar 14",
  },
  {
    employee: "James Wilson",
    items: "Canvas Tote, Notebook Set",
    total: "$40.00",
    status: "Delivered",
    date: "Mar 12",
  },
];

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-white">
      <StoreHeader
        companyName="ACME Corporation"
        logoUrl={null}
        creditBalance={15000}
        cartCount={0}
        isAdmin={true}
        storeSlug="acme-corp"
      />

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Admin Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-[11px] tracking-[0.2em] uppercase text-kraft-dark mb-1">
              Store Administration
            </p>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm">
              <UserPlus size={16} className="mr-2" />
              Add Employee
            </Button>
            <Button variant="primary" size="sm">
              <Gift size={16} className="mr-2" />
              Assign Credits
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="border border-gray-100 p-5 hover:border-kraft transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <stat.icon size={20} className="text-kraft-dark" />
              </div>
              <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
              <p className="text-[11px] tracking-[0.1em] uppercase text-smoky mt-1">
                {stat.label}
              </p>
              <p className="text-xs text-kraft-dark mt-2">{stat.change}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions + Recent Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div>
            <h2 className="font-bold tracking-wide uppercase text-sm mb-4">
              Quick Actions
            </h2>
            <div className="space-y-2">
              {[
                {
                  label: "Manage Employees",
                  href: "/store/acme-corp/admin/employees",
                },
                {
                  label: "Credit History",
                  href: "/store/acme-corp/admin/credits",
                },
                {
                  label: "Product Catalog",
                  href: "/store/acme-corp/admin/catalog",
                },
                {
                  label: "All Orders",
                  href: "/store/acme-corp/admin/orders",
                },
              ].map((action) => (
                <a
                  key={action.label}
                  href={action.href}
                  className="flex items-center justify-between p-4 border border-gray-100 hover:border-kraft hover:bg-off-white transition-all group"
                >
                  <span className="text-sm font-medium">{action.label}</span>
                  <ArrowRight
                    size={16}
                    className="text-smoky group-hover:text-kraft-dark transition-colors"
                  />
                </a>
              ))}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold tracking-wide uppercase text-sm">
                Recent Orders
              </h2>
              <a
                href="/store/acme-corp/admin/orders"
                className="text-xs text-kraft-dark hover:text-black transition-colors tracking-wide uppercase"
              >
                View All
              </a>
            </div>

            <div className="border border-gray-100">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-off-white">
                    <th className="text-left p-3 text-[10px] tracking-[0.15em] uppercase text-smoky font-medium">
                      Employee
                    </th>
                    <th className="text-left p-3 text-[10px] tracking-[0.15em] uppercase text-smoky font-medium">
                      Items
                    </th>
                    <th className="text-left p-3 text-[10px] tracking-[0.15em] uppercase text-smoky font-medium">
                      Total
                    </th>
                    <th className="text-left p-3 text-[10px] tracking-[0.15em] uppercase text-smoky font-medium">
                      Status
                    </th>
                    <th className="text-left p-3 text-[10px] tracking-[0.15em] uppercase text-smoky font-medium">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {RECENT_ORDERS.map((order, i) => (
                    <tr
                      key={i}
                      className="border-b border-gray-50 hover:bg-off-white/50 transition-colors"
                    >
                      <td className="p-3 text-sm font-medium">
                        {order.employee}
                      </td>
                      <td className="p-3 text-sm text-smoky">{order.items}</td>
                      <td className="p-3 text-sm font-medium">{order.total}</td>
                      <td className="p-3">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="p-3 text-sm text-smoky">{order.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <StoreFooter companyName="ACME Corporation" />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Pending: "bg-warning/10 text-warning",
    "In Production": "bg-kraft/20 text-kraft-dark",
    Shipped: "bg-blue-50 text-blue-700",
    Delivered: "bg-success/10 text-success",
  };

  return (
    <span
      className={`text-[10px] tracking-[0.1em] uppercase font-medium px-2 py-1 ${styles[status] || "bg-gray-100 text-gray-600"}`}
    >
      {status}
    </span>
  );
}
