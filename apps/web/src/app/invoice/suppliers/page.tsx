"use client";

import { useEffect, useState, useCallback } from "react";
import { invFetch, invPost, invPut, invDelete } from "../../../lib/inv-api";

type Supplier = {
  _id: string; name: string; email: string; phone: string;
  company: string; gstin: string; isActive: boolean;
  totalOrders: number; totalAmount: number;
  address: { city: string; state: string };
};

const EMPTY_FORM = {
  name: "", email: "", phone: "", company: "", gstin: "", pan: "",
  address: { line1: "", city: "", state: "", stateCode: "", pincode: "", country: "India" },
  bankName: "", bankAccount: "", bankIFSC: "", paymentTerms: 30, notes: "",
};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<null | "new" | Supplier>(null);
  const [form, setForm] = useState<typeof EMPTY_FORM>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (q = "") => {
    setLoading(true);
    try {
      const res = await invFetch<{ suppliers: Supplier[]; total: number }>(`/suppliers?limit=100${q ? `&search=${encodeURIComponent(q)}` : ""}`);
      setSuppliers(res.suppliers);
      setTotal(res.total);
    } catch { setError("Failed to load suppliers"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save() {
    if (!form.name.trim()) { setError("Supplier name is required"); return; }
    setSaving(true); setError("");
    try {
      if (modal === "new") await invPost("/suppliers", form);
      else await invPut(`/suppliers/${(modal as Supplier)._id}`, form);
      setModal(null); load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Save failed"); }
    finally { setSaving(false); }
  }

  async function del(id: string, name: string) {
    if (!confirm(`Delete supplier "${name}"?`)) return;
    try { await invDelete(`/suppliers/${id}`); load(); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : "Delete failed"); }
  }

  function openEdit(s: Supplier) {
    setForm({
      name: s.name, email: s.email, phone: s.phone, company: s.company, gstin: s.gstin, pan: "",
      address: { line1: "", city: s.address?.city || "", state: s.address?.state || "", stateCode: "", pincode: "", country: "India" },
      bankName: "", bankAccount: "", bankIFSC: "", paymentTerms: 30, notes: "",
    });
    setModal(s); setError("");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Suppliers</h1>
          <p className="text-xs text-muted mt-0.5">{total} total suppliers</p>
        </div>
        <button onClick={() => { setForm({ ...EMPTY_FORM, address: { ...EMPTY_FORM.address } }); setModal("new"); setError(""); }}
          className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white hover:opacity-90">
          + Add Supplier
        </button>
      </div>

      <div className="mb-4">
        <input type="text" placeholder="Search suppliers…" value={search}
          onChange={(e) => { setSearch(e.target.value); load(e.target.value); }}
          className="w-full rounded-xl border border-border bg-panel px-4 py-2.5 text-sm focus:outline-none focus:border-accent/60" />
      </div>

      <div className="rounded-2xl border border-border bg-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-border/60 bg-surface/50">
                {["Name / Company", "Contact", "GSTIN", "City", "Orders", "Total Purchases", "Actions"].map(h => (
                  <th key={h} className={`px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted ${h === "Actions" ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-border/20">
                    {[...Array(7)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 skeleton rounded" /></td>)}
                  </tr>
                ))
              ) : suppliers.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-muted">No suppliers found</td></tr>
              ) : suppliers.map((s) => (
                <tr key={s._id} className="border-b border-border/20 hover:bg-surface/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold">{s.name}</div>
                    {s.company && <div className="text-xs text-muted">{s.company}</div>}
                  </td>
                  <td className="px-4 py-3"><div className="text-xs">{s.phone || "—"}</div><div className="text-xs text-muted">{s.email || "—"}</div></td>
                  <td className="px-4 py-3 font-mono text-xs">{s.gstin || "—"}</td>
                  <td className="px-4 py-3 text-xs">{s.address?.city || "—"}</td>
                  <td className="px-4 py-3 text-xs">{s.totalOrders}</td>
                  <td className="px-4 py-3 text-xs font-semibold">₹{s.totalAmount.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button onClick={() => openEdit(s)}
                        className="rounded-lg border border-border px-2.5 py-1 text-[11px] hover:border-accent/40 hover:text-accent transition-colors">Edit</button>
                      <button onClick={() => del(s._id, s.name)}
                        className="rounded-lg border border-red-200 px-2.5 py-1 text-[11px] text-red-600 hover:bg-red-50 transition-colors">Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-panel rounded-2xl border border-border w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <h2 className="text-lg font-bold mb-4">{modal === "new" ? "Add Supplier" : `Edit: ${(modal as Supplier).name}`}</h2>
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
                  <label className="text-xs font-semibold text-muted mb-1 block">Payment Terms (days)</label>
                  <input type="number" value={form.paymentTerms} onChange={e => setForm(f => ({ ...f, paymentTerms: Number(e.target.value) }))}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60" />
                </div>
              </div>

              <div className="border-t border-border/40 pt-3">
                <div className="text-xs font-bold text-muted mb-2">Bank Details</div>
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="Bank Name" value={form.bankName} onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))}
                    className="rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60" />
                  <input placeholder="Account Number" value={form.bankAccount} onChange={e => setForm(f => ({ ...f, bankAccount: e.target.value }))}
                    className="rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60" />
                  <input placeholder="IFSC Code" value={form.bankIFSC} onChange={e => setForm(f => ({ ...f, bankIFSC: e.target.value.toUpperCase() }))}
                    className="rounded-xl border border-border bg-surface px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent/60" />
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-5 justify-end">
              <button onClick={() => setModal(null)} disabled={saving}
                className="rounded-full border border-border px-4 py-2 text-xs font-semibold hover:border-accent/40 transition-colors disabled:opacity-50">
                Cancel
              </button>
              <button onClick={save} disabled={saving}
                className="rounded-full bg-accent px-5 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50">
                {saving ? "Saving…" : (modal === "new" ? "Add Supplier" : "Save Changes")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
