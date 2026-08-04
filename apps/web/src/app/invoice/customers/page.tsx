"use client";

import { useEffect, useState, useCallback } from "react";
import { invFetch, invPost, invPut, invDelete, fmtCurrency } from "../../../lib/inv-api";

type Customer = {
  _id: string; name: string; displayName?: string; email: string; phone: string;
  company: string; gstin: string; customerType: string;
  totalAmount: number; outstandingAmount: number; isActive: boolean;
  billingAddress: { city: string; state: string };
};

const EMPTY_FORM = {
  name: "", email: "", phone: "", altPhone: "", company: "", gstin: "", pan: "",
  customerType: "retail", creditLimit: 0, creditDays: 30,
  billingAddress: { line1: "", line2: "", city: "", state: "", stateCode: "", pincode: "", country: "India" },
  notes: "",
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<null | "new" | Customer>(null);
  const [form, setForm] = useState<typeof EMPTY_FORM>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (q = "") => {
    setLoading(true);
    try {
      const res = await invFetch<{ customers: Customer[]; total: number }>(`/customers?limit=100${q ? `&search=${encodeURIComponent(q)}` : ""}`);
      setCustomers(res.customers);
      setTotal(res.total);
    } catch {
      setError("Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openNew() {
    setForm({ ...EMPTY_FORM, billingAddress: { ...EMPTY_FORM.billingAddress } });
    setModal("new");
    setError("");
  }

  function openEdit(c: Customer) {
    setForm({
      name: c.name, email: c.email, phone: c.phone, altPhone: "", company: c.company,
      gstin: c.gstin, pan: "", customerType: c.customerType, creditLimit: 0, creditDays: 30,
      billingAddress: { line1: "", line2: "", city: c.billingAddress?.city || "", state: c.billingAddress?.state || "", stateCode: "", pincode: "", country: "India" },
      notes: "",
    });
    setModal(c);
    setError("");
  }

  async function save() {
    if (!form.name.trim()) { setError("Customer name is required"); return; }
    setSaving(true);
    setError("");
    try {
      if (modal === "new") {
        await invPost("/customers", form);
      } else if (modal) {
        await invPut(`/customers/${(modal as Customer)._id}`, form);
      }
      setModal(null);
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function del(id: string, name: string) {
    if (!confirm(`Delete customer "${name}"? This cannot be undone.`)) return;
    try {
      await invDelete(`/customers/${id}`);
      load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Delete failed");
    }
  }

  function updateAddr(field: string, val: string) {
    setForm(f => ({ ...f, billingAddress: { ...f.billingAddress, [field]: val } }));
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Customers</h1>
          <p className="text-xs text-muted mt-0.5">{total} total customers</p>
        </div>
        <button onClick={openNew}
          className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white hover:opacity-90">
          + Add Customer
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input type="text" placeholder="Search by name, company, GSTIN, phone…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); load(e.target.value); }}
          className="w-full rounded-xl border border-border bg-panel px-4 py-2.5 text-sm focus:outline-none focus:border-accent/60" />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-border/60 bg-surface/50">
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted">Name / Company</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted">Contact</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted">GSTIN</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted">City</th>
                <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted">Total</th>
                <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted">Outstanding</th>
                <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-border/20">
                    {[...Array(7)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 skeleton rounded" /></td>)}
                  </tr>
                ))
              ) : customers.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-muted">No customers found</td></tr>
              ) : customers.map((c) => (
                <tr key={c._id} className="border-b border-border/20 hover:bg-surface/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold">{c.name}</div>
                    {c.company && <div className="text-xs text-muted">{c.company}</div>}
                    <span className={`text-[10px] capitalize px-1.5 py-0.5 rounded-full ${c.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{c.customerType}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs">{c.phone || "—"}</div>
                    <div className="text-xs text-muted">{c.email || "—"}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{c.gstin || "—"}</td>
                  <td className="px-4 py-3 text-xs">{c.billingAddress?.city || "—"}</td>
                  <td className="px-4 py-3 text-right font-semibold text-xs">{fmtCurrency(c.totalAmount)}</td>
                  <td className="px-4 py-3 text-right text-xs">
                    <span className={c.outstandingAmount > 0 ? "text-red-600 font-bold" : "text-muted"}>{fmtCurrency(c.outstandingAmount)}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button onClick={() => openEdit(c)}
                        className="rounded-lg border border-border px-2.5 py-1 text-[11px] hover:border-accent/40 hover:text-accent transition-colors">Edit</button>
                      <button onClick={() => del(c._id, c.name)}
                        className="rounded-lg border border-red-200 px-2.5 py-1 text-[11px] text-red-600 hover:bg-red-50 transition-colors">Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-panel rounded-2xl border border-border w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <h2 className="text-lg font-bold mb-4">{modal === "new" ? "Add Customer" : `Edit: ${(modal as Customer).name}`}</h2>

            {error && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg mb-4 border border-red-200">{error}</div>}

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-muted mb-1 block">Name *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted mb-1 block">Company</label>
                  <input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted mb-1 block">Type</label>
                  <select value={form.customerType} onChange={e => setForm(f => ({ ...f, customerType: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60">
                    {["retail", "wholesale", "dealer", "distributor", "other"].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted mb-1 block">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted mb-1 block">Phone</label>
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted mb-1 block">GSTIN</label>
                  <input value={form.gstin} onChange={e => setForm(f => ({ ...f, gstin: e.target.value.toUpperCase() }))}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent/60" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted mb-1 block">PAN</label>
                  <input value={form.pan} onChange={e => setForm(f => ({ ...f, pan: e.target.value.toUpperCase() }))}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent/60" />
                </div>
              </div>

              <div className="border-t border-border/40 pt-3">
                <div className="text-xs font-bold text-muted mb-2">Billing Address</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <input placeholder="Address Line 1" value={form.billingAddress.line1} onChange={e => updateAddr("line1", e.target.value)}
                      className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60" />
                  </div>
                  <input placeholder="City" value={form.billingAddress.city} onChange={e => updateAddr("city", e.target.value)}
                    className="rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60" />
                  <input placeholder="State" value={form.billingAddress.state} onChange={e => updateAddr("state", e.target.value)}
                    className="rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60" />
                  <input placeholder="State Code (e.g. 27)" value={form.billingAddress.stateCode} onChange={e => updateAddr("stateCode", e.target.value)}
                    className="rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60" />
                  <input placeholder="Pincode" value={form.billingAddress.pincode} onChange={e => updateAddr("pincode", e.target.value)}
                    className="rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted mb-1 block">Notes</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60 resize-none" />
              </div>
            </div>

            <div className="flex gap-2 mt-5 justify-end">
              <button onClick={() => setModal(null)} disabled={saving}
                className="rounded-full border border-border px-4 py-2 text-xs font-semibold hover:border-accent/40 transition-colors disabled:opacity-50">
                Cancel
              </button>
              <button onClick={save} disabled={saving}
                className="rounded-full bg-accent px-5 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50">
                {saving ? "Saving…" : (modal === "new" ? "Add Customer" : "Save Changes")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
