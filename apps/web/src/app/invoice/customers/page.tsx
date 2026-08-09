"use client";

import { useEffect, useState, useCallback } from "react";
import { invFetch, invPost, invPut, invDelete, fmtCurrency } from "../../../lib/inv-api";
import { EMPTY_CUSTOMER, type CustomerFormData } from "../../../lib/inv-validations";
import CustomerForm from "../_components/CustomerForm";

type Customer = {
  _id: string; name: string; displayName?: string; email: string; phone: string;
  company: string; gstin: string; customerType: string;
  totalAmount: number; outstandingAmount: number; isActive: boolean;
  billingAddress: { city: string; state: string };
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [modal, setModal]         = useState<null | "new" | Customer>(null);
  const [error, setError]         = useState("");

  const load = useCallback(async (q = "") => {
    setLoading(true);
    try {
      const res = await invFetch<{ customers: Customer[]; total: number }>(
        `/customers?limit=100${q ? `&search=${encodeURIComponent(q)}` : ""}`
      );
      setCustomers(res.customers);
      setTotal(res.total);
    } catch {
      setError("Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openNew() { setModal("new"); }
  function openEdit(c: Customer) { setModal(c); }

  /** Called by CustomerForm on a valid, confirmed save. */
  async function handleSave(data: CustomerFormData) {
    if (modal === "new") {
      await invPost("/customers", data);
    } else if (modal) {
      await invPut(`/customers/${(modal as Customer)._id}`, data);
    }
    setModal(null);
    load();
  }

  /** Build initialData from a Customer record for the edit case. */
  function toFormData(c: Customer): CustomerFormData {
    return {
      ...EMPTY_CUSTOMER,
      name: c.name,
      email: c.email,
      phone: c.phone,
      company: c.company,
      gstin: c.gstin,
      customerType: c.customerType,
      billingAddress: {
        ...EMPTY_CUSTOMER.billingAddress,
        city: c.billingAddress?.city ?? "",
        state: c.billingAddress?.state ?? "",
      },
    };
  }

  async function del(id: string, name: string) {
    if (!confirm(`Delete customer "${name}"? This cannot be undone.`)) return;
    try {
      await invDelete(`/customers/${id}`);
      load();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Customers</h1>
          <p className="text-xs text-muted mt-0.5">{total} total customers</p>
        </div>
        <button
          onClick={openNew}
          className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
        >
          + Add Customer
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 text-red-700 text-sm px-4 py-2.5 rounded-xl border border-red-200">
          {error}
        </div>
      )}

      {/* ── Search ── */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name, company, GSTIN, phone…"
          value={search}
          onChange={ev => { setSearch(ev.target.value); load(ev.target.value); }}
          className="w-full rounded-xl border border-border bg-panel px-4 py-2.5 text-sm focus:outline-none focus:border-accent/60"
        />
      </div>

      {/* ── Table ── */}
      <div className="rounded-2xl border border-border bg-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-border/60 bg-surface/50">
                {[
                  ["Name / Company", ""],
                  ["Contact", ""],
                  ["GSTIN", ""],
                  ["City", ""],
                  ["Total", "text-right"],
                  ["Outstanding", "text-right"],
                  ["Actions", "text-right"],
                ].map(([label, align]) => (
                  <th
                    key={label}
                    className={`px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted ${align}`}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-border/20">
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 skeleton rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted">
                    No customers found
                  </td>
                </tr>
              ) : (
                customers.map(c => (
                  <tr key={c._id} className="border-b border-border/20 hover:bg-surface/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold">{c.name}</div>
                      {c.company && <div className="text-xs text-muted">{c.company}</div>}
                      <span
                        className={`text-[10px] capitalize px-1.5 py-0.5 rounded-full ${
                          c.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {c.customerType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs">{c.phone || "—"}</div>
                      <div className="text-xs text-muted">{c.email || "—"}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{c.gstin || "—"}</td>
                    <td className="px-4 py-3 text-xs">{c.billingAddress?.city || "—"}</td>
                    <td className="px-4 py-3 text-right font-semibold text-xs">
                      {fmtCurrency(c.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-right text-xs">
                      <span className={c.outstandingAmount > 0 ? "text-red-600 font-bold" : "text-muted"}>
                        {fmtCurrency(c.outstandingAmount)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => openEdit(c)}
                          className="rounded-lg border border-border px-2.5 py-1 text-[11px] hover:border-accent/40 hover:text-accent transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => del(c._id, c.name)}
                          className="rounded-lg border border-red-200 px-2.5 py-1 text-[11px] text-red-600 hover:bg-red-50 transition-colors"
                        >
                          Del
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal ── */}
      {modal !== null && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <CustomerForm
            title={modal === "new" ? "Add Customer" : `Edit: ${(modal as Customer).name}`}
            submitLabel={modal === "new" ? "Add Customer" : "Save Changes"}
            initialData={modal === "new" ? { ...EMPTY_CUSTOMER, billingAddress: { ...EMPTY_CUSTOMER.billingAddress } } : toFormData(modal as Customer)}
            onSave={handleSave}
            onCancel={() => setModal(null)}
          />
        </div>
      )}
    </div>
  );
}
