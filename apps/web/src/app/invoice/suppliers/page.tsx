"use client";

import { useEffect, useState, useCallback } from "react";
import { invFetch, invPost, invPut, invDelete } from "../../../lib/inv-api";
import { EMPTY_SUPPLIER, type SupplierFormData } from "../../../lib/inv-validations";
import SupplierForm from "../_components/SupplierForm";

type Supplier = {
  _id: string; name: string; email: string; phone: string;
  company: string; gstin: string; isActive: boolean;
  totalOrders: number; totalAmount: number;
  address: { city: string; state: string };
};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [modal, setModal]         = useState<null | "new" | Supplier>(null);
  const [error, setError]         = useState("");

  const load = useCallback(async (q = "") => {
    setLoading(true);
    try {
      const res = await invFetch<{ suppliers: Supplier[]; total: number }>(
        `/suppliers?limit=100${q ? `&search=${encodeURIComponent(q)}` : ""}`
      );
      setSuppliers(res.suppliers);
      setTotal(res.total);
    } catch {
      setError("Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openNew()          { setModal("new"); }
  function openEdit(s: Supplier) { setModal(s); }

  async function handleSave(data: SupplierFormData) {
    if (modal === "new") {
      await invPost("/suppliers", data);
    } else if (modal) {
      await invPut(`/suppliers/${(modal as Supplier)._id}`, data);
    }
    setModal(null);
    load();
  }

  function toFormData(s: Supplier): SupplierFormData {
    return {
      ...EMPTY_SUPPLIER,
      name: s.name,
      email: s.email,
      phone: s.phone,
      company: s.company,
      gstin: s.gstin,
      address: {
        ...EMPTY_SUPPLIER.address,
        city: s.address?.city ?? "",
        state: s.address?.state ?? "",
      },
    };
  }

  async function del(id: string, name: string) {
    if (!confirm(`Delete supplier "${name}"? This cannot be undone.`)) return;
    try {
      await invDelete(`/suppliers/${id}`);
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
          <h1 className="text-2xl font-extrabold">Suppliers</h1>
          <p className="text-xs text-muted mt-0.5">{total} total suppliers</p>
        </div>
        <button
          onClick={openNew}
          className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
        >
          + Add Supplier
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
          placeholder="Search suppliers…"
          value={search}
          onChange={ev => { setSearch(ev.target.value); load(ev.target.value); }}
          className="w-full rounded-xl border border-border bg-panel px-4 py-2.5 text-sm focus:outline-none focus:border-accent/60"
        />
      </div>

      {/* ── Table ── */}
      <div className="rounded-2xl border border-border bg-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-border/60 bg-surface/50">
                {[
                  ["Name / Company", ""],
                  ["Contact", ""],
                  ["GSTIN", ""],
                  ["City", ""],
                  ["Orders", ""],
                  ["Total Purchases", "text-right"],
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
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted">
                    No suppliers found
                  </td>
                </tr>
              ) : (
                suppliers.map(s => (
                  <tr key={s._id} className="border-b border-border/20 hover:bg-surface/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold">{s.name}</div>
                      {s.company && <div className="text-xs text-muted">{s.company}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs">{s.phone || "—"}</div>
                      <div className="text-xs text-muted">{s.email || "—"}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{s.gstin || "—"}</td>
                    <td className="px-4 py-3 text-xs">{s.address?.city || "—"}</td>
                    <td className="px-4 py-3 text-xs">{s.totalOrders}</td>
                    <td className="px-4 py-3 text-right text-xs font-semibold">
                      ₹{s.totalAmount.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => openEdit(s)}
                          className="rounded-lg border border-border px-2.5 py-1 text-[11px] hover:border-accent/40 hover:text-accent transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => del(s._id, s.name)}
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
          <SupplierForm
            title={modal === "new" ? "Add Supplier" : `Edit: ${(modal as Supplier).name}`}
            submitLabel={modal === "new" ? "Add Supplier" : "Save Changes"}
            initialData={
              modal === "new"
                ? { ...EMPTY_SUPPLIER, address: { ...EMPTY_SUPPLIER.address } }
                : toFormData(modal as Supplier)
            }
            onSave={handleSave}
            onCancel={() => setModal(null)}
          />
        </div>
      )}
    </div>
  );
}
