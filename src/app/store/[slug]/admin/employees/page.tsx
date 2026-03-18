"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Search,
  UserPlus,
  Mail,
  Gift,
  MoreHorizontal,
  X,
  Loader2,
  Check,
  Trash2,
} from "lucide-react";
import { StoreHeader } from "@/components/store/StoreHeader";
import { StoreFooter } from "@/components/store/StoreFooter";
import { CreditBadge } from "@/components/ui/CreditBadge";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";

interface Employee {
  id: string;
  email: string;
  full_name: string;
  role: string;
  department: string | null;
  is_active: boolean;
  created_at: string;
  balance: number;
  lifetime_received: number;
  lifetime_spent: number;
}

export default function EmployeesPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [storeName, setStoreName] = useState("Store");

  // Add employee form
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newDept, setNewDept] = useState("");
  const [newCredits, setNewCredits] = useState("");
  const [saving, setSaving] = useState(false);

  // Credit form
  const [creditAmount, setCreditAmount] = useState("");
  const [creditType, setCreditType] = useState("bonus");
  const [creditNote, setCreditNote] = useState("");
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  async function loadEmployees() {
    const { data: store } = await supabase
      .from("stores")
      .select("id, company_name")
      .eq("slug", slug)
      .single();

    if (!store) return;
    setStoreId(store.id);
    setStoreName(store.company_name || "Store");

    const { data: users } = await supabase
      .from("users")
      .select("*")
      .eq("store_id", store.id)
      .order("created_at", { ascending: false });

    const { data: credits } = await supabase
      .from("credit_balances")
      .select("*")
      .eq("store_id", store.id);

    if (users) {
      const enriched = users.map((u) => {
        const credit = credits?.find((c) => c.user_id === u.id);
        return {
          ...u,
          balance: credit?.balance || 0,
          lifetime_received: credit?.lifetime_received || 0,
          lifetime_spent: credit?.lifetime_spent || 0,
        };
      });
      setEmployees(enriched);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadEmployees();
  }, [slug]);

  const handleAddEmployee = async () => {
    if (!newName || !newEmail || !storeId) return;
    setSaving(true);

    // Create user
    const { data: user, error } = await supabase
      .from("users")
      .insert({
        full_name: newName,
        email: newEmail,
        role: "employee",
        store_id: storeId,
        department: newDept || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      alert("Error: " + error.message);
      setSaving(false);
      return;
    }

    // Add initial credits if specified
    if (user && newCredits) {
      const amount = Math.round(parseFloat(newCredits) * 100);
      await supabase.from("credit_balances").insert({
        user_id: user.id,
        store_id: storeId,
        balance: amount,
        lifetime_received: amount,
        lifetime_spent: 0,
      });

      await supabase.from("credit_transactions").insert({
        user_id: user.id,
        store_id: storeId,
        amount: amount,
        type: "new_hire",
        description: "Welcome credits",
        created_by: user.id,
      });
    }

    // Reset and reload
    setNewName("");
    setNewEmail("");
    setNewDept("");
    setNewCredits("");
    setShowAddModal(false);
    setSaving(false);
    loadEmployees();
  };

  const handleAssignCredits = async () => {
    if (!creditAmount || !storeId) return;
    setSaving(true);
    const amount = Math.round(parseFloat(creditAmount) * 100);
    const targets = bulkMode
      ? employees.filter((e) => selectedIds.has(e.id))
      : selectedEmployee
        ? [selectedEmployee]
        : [];

    for (const emp of targets) {
      // Upsert credit balance
      const existing = emp.balance > 0 || emp.lifetime_received > 0;
      if (existing) {
        await supabase
          .from("credit_balances")
          .update({
            balance: emp.balance + amount,
            lifetime_received: emp.lifetime_received + amount,
          })
          .eq("user_id", emp.id)
          .eq("store_id", storeId);
      } else {
        await supabase.from("credit_balances").insert({
          user_id: emp.id,
          store_id: storeId,
          balance: amount,
          lifetime_received: amount,
          lifetime_spent: 0,
        });
      }

      // Record transaction
      await supabase.from("credit_transactions").insert({
        user_id: emp.id,
        store_id: storeId,
        amount,
        type: creditType,
        description: creditNote || `${creditType.replace(/_/g, " ")} credit`,
        created_by: emp.id,
      });
    }

    setCreditAmount("");
    setCreditNote("");
    setShowCreditModal(false);
    setBulkMode(false);
    setSelectedIds(new Set());
    setSelectedEmployee(null);
    setSaving(false);
    loadEmployees();
  };

  const handleDeleteEmployee = async (empId: string) => {
    if (!confirm("Remove this employee?")) return;
    await supabase.from("users").update({ is_active: false }).eq("id", empId);
    loadEmployees();
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === employees.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(employees.map((e) => e.id)));
    }
  };

  const filtered = employees.filter((e) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      e.full_name.toLowerCase().includes(s) ||
      e.email.toLowerCase().includes(s) ||
      (e.department && e.department.toLowerCase().includes(s))
    );
  });

  return (
    <div className="min-h-screen bg-white">
      <StoreHeader
        companyName={storeName}
        logoUrl={null}
        creditBalance={0}
        cartCount={0}
        isAdmin={true}
        storeSlug={slug}
      />

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-[11px] tracking-[0.2em] uppercase text-kraft-dark mb-1">
              Administration
            </p>
            <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
            <p className="text-smoky text-sm mt-1">
              {employees.length} team members
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setBulkMode(true);
                setShowCreditModal(true);
              }}
            >
              <Gift size={16} className="mr-2" />
              Bulk Credits
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowAddModal(true)}
            >
              <UserPlus size={16} className="mr-2" />
              Add Employee
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-smoky"
            />
            <input
              type="text"
              placeholder="Search by name, email, or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-kraft"
            />
          </div>
        </div>

        {/* Select all bar */}
        <div className="bg-off-white border border-kraft/20 p-3 flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                className="accent-kraft"
                checked={selectedIds.size === employees.length && employees.length > 0}
                onChange={toggleSelectAll}
              />
              Select All
            </label>
            <span className="text-smoky text-sm">
              {selectedIds.size > 0
                ? `${selectedIds.size} selected`
                : `${filtered.length} employees`}
            </span>
          </div>
          {selectedIds.size > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setBulkMode(true);
                setShowCreditModal(true);
              }}
            >
              <Gift size={14} className="mr-2" />
              Assign Credits to {selectedIds.size}
            </Button>
          )}
        </div>

        {/* Employee list */}
        {loading ? (
          <div className="text-center py-12 text-smoky">Loading...</div>
        ) : (
          <div className="border border-gray-100">
            {filtered.map((emp) => (
              <div
                key={emp.id}
                className="flex items-center justify-between p-4 border-b border-gray-50 hover:bg-off-white/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    className="accent-kraft"
                    checked={selectedIds.has(emp.id)}
                    onChange={() => {
                      const next = new Set(selectedIds);
                      if (next.has(emp.id)) next.delete(emp.id);
                      else next.add(emp.id);
                      setSelectedIds(next);
                    }}
                  />
                  <div className="w-10 h-10 bg-kraft/20 flex items-center justify-center text-kraft-dark font-bold text-sm">
                    {emp.full_name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{emp.full_name}</p>
                      {emp.role === "company_admin" && (
                        <span className="text-[9px] tracking-[0.15em] uppercase bg-kraft/20 text-kraft-dark px-2 py-0.5">
                          Admin
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-smoky">
                      {emp.email}
                      {emp.department && ` · ${emp.department}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <CreditBadge balance={emp.balance} />
                    <p className="text-[10px] text-smoky mt-1">
                      ${(emp.lifetime_spent / 100).toFixed(2)} spent
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setSelectedEmployee(emp);
                        setBulkMode(false);
                        setShowCreditModal(true);
                      }}
                      className="p-2 hover:bg-off-white transition-colors"
                      title="Assign credits"
                    >
                      <Gift size={14} className="text-kraft-dark" />
                    </button>
                    <button
                      onClick={() => handleDeleteEmployee(emp.id)}
                      className="p-2 hover:bg-off-white transition-colors"
                      title="Remove"
                    >
                      <Trash2 size={14} className="text-smoky" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddModal(false);
          }}
        >
          <div className="bg-white max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-lg">Add Employee</h2>
              <button onClick={() => setShowAddModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] tracking-[0.15em] uppercase text-smoky block mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Sarah Johnson"
                  className="w-full px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-kraft"
                />
              </div>
              <div>
                <label className="text-[10px] tracking-[0.15em] uppercase text-smoky block mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="sarah@company.com"
                  className="w-full px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-kraft"
                />
              </div>
              <div>
                <label className="text-[10px] tracking-[0.15em] uppercase text-smoky block mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={newDept}
                  onChange={(e) => setNewDept(e.target.value)}
                  placeholder="Marketing"
                  className="w-full px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-kraft"
                />
              </div>
              <div>
                <label className="text-[10px] tracking-[0.15em] uppercase text-smoky block mb-1">
                  Starting Credits ($)
                </label>
                <input
                  type="number"
                  value={newCredits}
                  onChange={(e) => setNewCredits(e.target.value)}
                  placeholder="150.00"
                  className="w-full px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-kraft"
                  step="0.01"
                />
              </div>
            </div>

            <button
              onClick={handleAddEmployee}
              disabled={!newName || !newEmail || saving}
              className="w-full mt-6 bg-black text-white py-3 text-sm tracking-[0.12em] uppercase font-medium hover:bg-brown transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <UserPlus size={16} />
                  Add Employee
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Assign Credits Modal */}
      {showCreditModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCreditModal(false);
              setBulkMode(false);
              setSelectedEmployee(null);
            }
          }}
        >
          <div className="bg-white max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-lg">
                {bulkMode
                  ? `Assign Credits to ${selectedIds.size} Employees`
                  : `Assign Credits to ${selectedEmployee?.full_name}`}
              </h2>
              <button
                onClick={() => {
                  setShowCreditModal(false);
                  setBulkMode(false);
                  setSelectedEmployee(null);
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] tracking-[0.15em] uppercase text-smoky block mb-1">
                  Credit Amount ($)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">$</span>
                  <input
                    type="number"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                    placeholder="100.00"
                    className="flex-1 px-3 py-2.5 border border-gray-200 text-lg font-semibold focus:outline-none focus:border-kraft"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Quick amounts */}
              <div className="flex gap-2">
                {[50, 100, 150, 200, 500].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setCreditAmount(String(amt))}
                    className={`flex-1 py-2 text-xs font-medium border transition-colors ${
                      creditAmount === String(amt)
                        ? "bg-black text-white border-black"
                        : "border-gray-200 text-smoky hover:border-kraft"
                    }`}
                  >
                    ${amt}
                  </button>
                ))}
              </div>

              <div>
                <label className="text-[10px] tracking-[0.15em] uppercase text-smoky block mb-1">
                  Reason
                </label>
                <select
                  value={creditType}
                  onChange={(e) => setCreditType(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-kraft"
                >
                  <option value="bonus">Performance Bonus</option>
                  <option value="new_hire">New Hire Welcome</option>
                  <option value="holiday">Holiday Gift</option>
                  <option value="manual">Other</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] tracking-[0.15em] uppercase text-smoky block mb-1">
                  Note (optional)
                </label>
                <input
                  type="text"
                  value={creditNote}
                  onChange={(e) => setCreditNote(e.target.value)}
                  placeholder="Q1 performance bonus"
                  className="w-full px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-kraft"
                />
              </div>

              {/* Summary */}
              {creditAmount && (
                <div className="bg-off-white p-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-smoky">Amount per person</span>
                    <span className="font-bold">${parseFloat(creditAmount).toFixed(2)}</span>
                  </div>
                  {bulkMode && (
                    <div className="flex justify-between text-sm">
                      <span className="text-smoky">Total ({selectedIds.size} people)</span>
                      <span className="font-bold text-kraft-dark">
                        ${(parseFloat(creditAmount) * selectedIds.size).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={handleAssignCredits}
              disabled={!creditAmount || saving}
              className="w-full mt-6 bg-black text-white py-3 text-sm tracking-[0.12em] uppercase font-medium hover:bg-brown transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <Gift size={16} />
                  Assign ${creditAmount || "0"} Credits
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <StoreFooter companyName={storeName} />
    </div>
  );
}
