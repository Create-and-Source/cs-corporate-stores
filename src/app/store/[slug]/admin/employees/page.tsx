"use client";

import { Search, UserPlus, MoreHorizontal, Mail, Gift } from "lucide-react";
import { StoreHeader } from "@/components/store/StoreHeader";
import { StoreFooter } from "@/components/store/StoreFooter";
import { Button } from "@/components/ui/Button";
import { CreditBadge } from "@/components/ui/CreditBadge";

const EMPLOYEES = [
  {
    name: "Sarah Johnson",
    email: "sarah.j@acmecorp.com",
    department: "Marketing",
    balance: 7500,
    totalSpent: 12500,
    orders: 5,
    status: "active",
  },
  {
    name: "Mike Chen",
    email: "mike.c@acmecorp.com",
    department: "Engineering",
    balance: 15000,
    totalSpent: 5500,
    orders: 2,
    status: "active",
  },
  {
    name: "Lisa Park",
    email: "lisa.p@acmecorp.com",
    department: "Design",
    balance: 3200,
    totalSpent: 16800,
    orders: 8,
    status: "active",
  },
  {
    name: "James Wilson",
    email: "james.w@acmecorp.com",
    department: "Sales",
    balance: 10000,
    totalSpent: 0,
    orders: 0,
    status: "invited",
  },
  {
    name: "Ana Rodriguez",
    email: "ana.r@acmecorp.com",
    department: "HR",
    balance: 8500,
    totalSpent: 11500,
    orders: 4,
    status: "active",
  },
];

export default function EmployeesPage() {
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

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-[11px] tracking-[0.2em] uppercase text-kraft-dark mb-1">
              Administration
            </p>
            <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm">
              <Mail size={16} className="mr-2" />
              Invite via Email
            </Button>
            <Button variant="primary" size="sm">
              <UserPlus size={16} className="mr-2" />
              Add Employee
            </Button>
          </div>
        </div>

        {/* Search and filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-smoky"
            />
            <input
              type="text"
              placeholder="Search employees..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-kraft transition-colors"
            />
          </div>
          <select className="border border-gray-200 px-4 py-2.5 text-sm text-smoky focus:outline-none focus:border-kraft">
            <option>All Departments</option>
            <option>Marketing</option>
            <option>Engineering</option>
            <option>Design</option>
            <option>Sales</option>
            <option>HR</option>
          </select>
        </div>

        {/* Bulk actions bar */}
        <div className="bg-off-white border border-kraft/20 p-3 flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="accent-kraft" />
              Select All
            </label>
            <span className="text-smoky text-sm">
              {EMPLOYEES.length} employees
            </span>
          </div>
          <Button variant="secondary" size="sm">
            <Gift size={14} className="mr-2" />
            Bulk Assign Credits
          </Button>
        </div>

        {/* Employee list */}
        <div className="border border-gray-100">
          {EMPLOYEES.map((emp, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 border-b border-gray-50 hover:bg-off-white/30 transition-colors"
            >
              <div className="flex items-center gap-4">
                <input type="checkbox" className="accent-kraft" />
                <div className="w-10 h-10 bg-kraft/20 flex items-center justify-center text-kraft-dark font-bold text-sm">
                  {emp.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{emp.name}</p>
                    {emp.status === "invited" && (
                      <span className="text-[9px] tracking-[0.15em] uppercase bg-warning/10 text-warning px-2 py-0.5">
                        Invited
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-smoky">
                    {emp.email} · {emp.department}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div className="text-right">
                  <CreditBadge balance={emp.balance} />
                  <p className="text-[10px] text-smoky mt-1">
                    ${(emp.totalSpent / 100).toFixed(2)} spent ·{" "}
                    {emp.orders} orders
                  </p>
                </div>
                <button className="p-2 hover:bg-off-white transition-colors">
                  <MoreHorizontal size={16} className="text-smoky" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <StoreFooter companyName="ACME Corporation" />
    </div>
  );
}
