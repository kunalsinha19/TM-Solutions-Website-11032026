"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { invFetch, invPost, fmtCurrency, fmtDate } from "../../../lib/inv-api";

type PO = {
  _id: string; poNumber: string; supplierName: string; status: string;
  poDate: string; grandTotal: number;
  supplier?: { name: string; phone: string };
};

type Supplier = { _id: string; name: string; company: string };
type InvProduct = { _id: string; name: string; unit: string; purchasePrice: number; gstRate: number; hsnCode: string };

const EMPTY_FORM = {
  supplier: "", poDate: new Date().toISOString().slice(0, 10), deliveryDate: "",
  notes: "", termsConditions: "",
  items: [{ product: "", name: "", unit: "Pcs", qty: 1, rate: 0, gstRate: 18, hsnCode: "" }],
};

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PO[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<InvProduct[]>([]);
  const [form, setForm] = useState<typeof EMPTY_FORM>({ ...EMPTY_FORM, items: [{ ...EMPTY_FORM.items[0] }] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [receiving, setReceiving] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await invFetch<{ orders: PO[]; total: number }>("/purchase-orders?limit=100");
      setOrders(res.orders); setTotal(res.total);
    } catch { setError("Failed to load"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function openModal() {
    try {
      const [sRes, pRes] = await Promise.all([
        invFetch<{ suppliers: Supplier[] }>("/suppliers?limit=200"),
        invFetch<{ products: InvProduct[] }>("/products?limit=500"),
      ]);
      setSuppliers(sRes.suppliers); setProducts(pRes.products);
    } catch { /* noop */ }
    setForm({ ...EMPTY_FORM, items: [{ product: "", name: "", unit: "Pcs", qty: 1, rate: 0, gstRate: 18, hsnCode: "" }] });
    setModal(true); setError("");
  }

  function updateItem(i: number, field: string, val: string | number) {
    setForm(f => ({
      ...f,
      items: f.items.map((item, j) => {
        if (j !== i) return item;
        const updated = { ...item, [field]: val };
        if (field === "product") {
          const prod = products.find(p => p._id === String(val));
          if (prod) return { ...updated, name: prod.name, unit: prod.unit, rate: prod.purchasePrice, gstRate: prod.gstRate, hsnCode: prod.hsnCode || "" };
        }
        return updated;
      }),
    }));
  }

  async function save() {
    if (!form.supplier) { setError("Select a supplier"); return; }
    if (!form.items[0].name) { setError("Add at least one item"); return; }
    setSaving(true); setError("");
    try {
      await invPost("/purchase-orders", form);
      setModal(false); load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed"); }
    finally { setSaving(false); }
  }

  async function receive(id: string, poNumber: string) {
    if (!confirm(`Mark PO ${poNumber} as received? This will update inventory.`)) return;
    setReceiving(id);
    try {
      await invPost(`/purchase-orders/${id}/receive`, {});
      load();
    } catch (e: unknown) { alert(e instanceof Error ? e.message : "Failed"); }
    finally { setReceiving(null); }
  }

  const STATUS_COLORS: Record<string, string> = {
    draft: "bg-gray-100 text-gray-600", sent: "bg-blue-100 text-blue-700",
    partial: "bg-amber-100 text-amber-700", received: "bg-green-100 text-green-700", cancelled: "bg-gray-200 text-gray-500",
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Purchase Orders</h1>
          <p className="text-xs text-muted mt-0.5">{total} total orders</p>
        </div>
        <button onClick={openModal}
          className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white hover:opacity-90">
          + New Purchase Order
        </button>
      </div>

      {error && <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 mb-4">{error}</div>}

      <div className="rounded-2xl border border-border bg-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-border/60 bg-surface/50">
                {["PO #", "Supplier", "Date", "Amount", "Status", "Actions"].map(h => (
                  <th key={h} className={`px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted ${h === "Amount" ? "text-right" : h === "Actions" ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-border/20">
                    {[...Array(6)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 skeleton rounded" /></td>)}
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-muted">No purchase orders yet</td></tr>
              ) : orders.map((o) => (
                <tr key={o._id} className="border-b border-border/20 hover:bg-surface/40 transition-colors">
                  <td className="px-4 py-3 font-mono font-semibold text-xs text-accent">{o.poNumber}</td>
                  <td className="px-4 py-3 text-xs">{o.supplierName}</td>
                  <td className="px-4 py-3 text-xs">{fmtDate(o.poDate)}</td>
                  <td className="px-4 py-3 text-right text-xs font-semibold">{fmtCurrency(o.grandTotal)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_COLORS[o.status] || "bg-gray-100"}`}>{o.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {o.status !== "received" && o.status !== "cancelled" && (
                      <button onClick={() => receive(o._id, o.poNumber)} disabled={receiving === o._id}
                        className="rounded-lg bg-green-100 text-green-700 border border-green-200 px-2.5 py-1 text-[11px] hover:bg-green-200 transition-colors disabled:opacity-50">
                        {receiving === o._id ? "…" : "Mark Received"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-panel rounded-2xl border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <h2 className="text-lg font-bold mb-4">New Purchase Order</h2>
            {error && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg mb-4 border border-red-200">{error}</div>}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="col-span-2">
                <label className="text-xs font-semibold text-muted mb-1 block">Supplier *</label>
                <select value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60">
                  <option value="">Select supplier…</option>
                  {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}{s.company ? ` — ${s.company}` : ""}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted mb-1 block">PO Date</label>
                <input type="date" value={form.poDate} onChange={e => setForm(f => ({ ...f, poDate: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted mb-1 block">Expected Delivery</label>
                <input type="date" value={form.deliveryDate} onChange={e => setForm(f => ({ ...f, deliveryDate: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60" />
              </div>
            </div>

            <div className="space-y-2 mb-3">
              <div className="text-xs font-semibold text-muted">Items</div>
              {form.items.map((item, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <select value={item.product} onChange={e => updateItem(i, "product", e.target.value)}
                    className="flex-1 rounded-xl border border-border bg-surface px-2 py-1.5 text-xs focus:outline-none focus:border-accent/60">
                    <option value="">Select product or type name below</option>
                    {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                  </select>
                  <input placeholder="Name" value={item.name} onChange={e => updateItem(i, "name", e.target.value)}
                    className="flex-1 rounded-xl border border-border bg-surface px-2 py-1.5 text-xs focus:outline-none focus:border-accent/60" />
                  <input type="number" min="1" value={item.qty} onChange={e => updateItem(i, "qty", Number(e.target.value))}
                    placeholder="Qty" className="w-16 rounded-xl border border-border bg-surface px-2 py-1.5 text-xs focus:outline-none focus:border-accent/60" />
                  <input type="number" min="0" step="0.01" value={item.rate} onChange={e => updateItem(i, "rate", Number(e.target.value))}
                    placeholder="Rate" className="w-24 rounded-xl border border-border bg-surface px-2 py-1.5 text-xs focus:outline-none focus:border-accent/60" />
                  {form.items.length > 1 && (
                    <button onClick={() => setForm(f => ({ ...f, items: f.items.filter((_, j) => j !== i) }))} className="text-red-500 text-sm px-1">✕</button>
                  )}
                </div>
              ))}
            </div>
            <button onClick={() => setForm(f => ({ ...f, items: [...f.items, { product: "", name: "", unit: "Pcs", qty: 1, rate: 0, gstRate: 18, hsnCode: "" }] }))}
              className="text-xs text-accent hover:underline mb-4">+ Add Item</button>

            <div>
              <label className="text-xs font-semibold text-muted mb-1 block">Notes</label>
              <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60 resize-none" />
            </div>

            <div className="flex gap-2 mt-5 justify-end">
              <button onClick={() => setModal(false)} disabled={saving}
                className="rounded-full border border-border px-4 py-2 text-xs font-semibold">Cancel</button>
              <button onClick={save} disabled={saving}
                className="rounded-full bg-accent px-5 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50">
                {saving ? "Saving…" : "Create PO"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
