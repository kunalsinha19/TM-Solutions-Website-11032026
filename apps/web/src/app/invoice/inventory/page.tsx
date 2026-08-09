"use client";

import { useEffect, useState, useCallback } from "react";
import { invFetch, invPost, fmtDate } from "../../../lib/inv-api";

type Transaction = {
  _id: string; type: string; qtyBefore: number; qtyChange: number; qtyAfter: number;
  referenceNo: string; notes: string; createdAt: string;
  product: { name: string; sku: string; unit: string };
  createdBy: { name: string };
};

type InvProduct = { _id: string; name: string; sku: string; unit: string; stockQty: number; minStockQty: number };

const TYPE_COLORS: Record<string, string> = {
  sale: "bg-red-100 text-red-700",
  purchase: "bg-green-100 text-green-700",
  adjustment: "bg-amber-100 text-amber-700",
  return_in: "bg-blue-100 text-blue-700",
  return_out: "bg-orange-100 text-orange-700",
  opening: "bg-purple-100 text-purple-700",
};

export default function InventoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<InvProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [adjModal, setAdjModal] = useState(false);
  const [adjForm, setAdjForm] = useState({ type: "increase", reason: "count_correction", items: [{ product: "", qty: 1, reason: "" }], notes: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [txRes, prodRes] = await Promise.all([
        invFetch<{ transactions: Transaction[]; total: number }>("/inventory/transactions?limit=100"),
        invFetch<{ products: InvProduct[] }>("/products?limit=500&active=true"),
      ]);
      setTransactions(txRes.transactions);
      setTotal(txRes.total);
      setProducts(prodRes.products);
    } catch { setError("Failed to load"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function createAdjustment() {
    const validItems = adjForm.items.filter(i => i.product);
    if (!validItems.length) { setError("Add at least one product"); return; }
    setSaving(true); setError("");
    try {
      await invPost("/inventory/adjustments", { ...adjForm, items: validItems.map(i => ({ ...i, qty: Number(i.qty) })) });
      setAdjModal(false);
      setAdjForm({ type: "increase", reason: "count_correction", items: [{ product: "", qty: 1, reason: "" }], notes: "" });
      load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed"); }
    finally { setSaving(false); }
  }

  function addAdjItem() { setAdjForm(f => ({ ...f, items: [...f.items, { product: "", qty: 1, reason: "" }] })); }
  function removeAdjItem(i: number) { setAdjForm(f => ({ ...f, items: f.items.filter((_, j) => j !== i) })); }
  function updateAdjItem(i: number, field: string, val: string | number) {
    setAdjForm(f => ({ ...f, items: f.items.map((item, j) => j === i ? { ...item, [field]: val } : item) }));
  }

  const lowStockProducts = products.filter(p => p.stockQty <= p.minStockQty);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Inventory</h1>
          <p className="text-xs text-muted mt-0.5">{total} total transactions</p>
        </div>
        <button onClick={() => { setAdjModal(true); setError(""); }}
          className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white hover:opacity-90">
          + Stock Adjustment
        </button>
      </div>

      {/* Low stock alert */}
      {lowStockProducts.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 mb-6 flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <div className="font-bold text-amber-800 text-sm">{lowStockProducts.length} products at or below reorder level</div>
            <div className="text-xs text-amber-700 mt-1">{lowStockProducts.slice(0, 5).map(p => `${p.name} (${p.stockQty} ${p.unit})`).join(" · ")}{lowStockProducts.length > 5 ? " …" : ""}</div>
          </div>
        </div>
      )}

      {error && <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 mb-4">{error}</div>}

      {/* Transactions table */}
      <div className="rounded-2xl border border-border bg-panel overflow-hidden">
        <div className="px-5 py-3 border-b border-border/60 bg-surface/30">
          <h2 className="text-sm font-bold">Stock Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[700px]">
            <thead>
              <tr className="border-b border-border/40 bg-surface/30">
                {["Product", "Type", "Ref", "Before", "Change", "After", "By", "Date"].map(h => (
                  <th key={h} className={`px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted ${["Before", "Change", "After"].includes(h) ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="border-b border-border/20">
                    {[...Array(8)].map((_, j) => <td key={j} className="px-4 py-2.5"><div className="h-3.5 skeleton rounded" /></td>)}
                  </tr>
                ))
              ) : transactions.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-muted">No transactions yet</td></tr>
              ) : transactions.map((t) => (
                <tr key={t._id} className="border-b border-border/20 hover:bg-surface/40 transition-colors">
                  <td className="px-4 py-2.5">
                    <div className="font-semibold">{t.product?.name || "—"}</div>
                    <div className="text-muted font-mono">{t.product?.sku || ""}</div>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${TYPE_COLORS[t.type] || "bg-gray-100 text-gray-600"}`}>{t.type.replace("_", " ")}</span>
                  </td>
                  <td className="px-4 py-2.5 font-mono">{t.referenceNo || "—"}</td>
                  <td className="px-4 py-2.5 text-right">{t.qtyBefore} {t.product?.unit}</td>
                  <td className="px-4 py-2.5 text-right">
                    <span className={t.qtyChange >= 0 ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                      {t.qtyChange >= 0 ? "+" : ""}{t.qtyChange}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold">{t.qtyAfter} {t.product?.unit}</td>
                  <td className="px-4 py-2.5">{t.createdBy?.name || "—"}</td>
                  <td className="px-4 py-2.5 text-muted">{fmtDate(t.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjustment Modal */}
      {adjModal && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-panel rounded-2xl border border-border w-full max-w-2xl flex flex-col max-h-[90vh] shadow-2xl">

            {/* ── Sticky header ── */}
            <div className="flex items-center justify-between shrink-0 border-b border-border/60 px-6 py-4">
              <h2 className="text-base font-bold">Stock Adjustment</h2>
              <button onClick={() => setAdjModal(false)} aria-label="Close"
                className="rounded-lg p-1.5 text-muted hover:bg-surface hover:text-text transition-colors">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>

            {/* ── Scrollable body ── */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {error && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg border border-red-200">{error}</div>}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted mb-1 block">Adjustment Type</label>
                  <select value={adjForm.type} onChange={e => setAdjForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60">
                    <option value="increase">Increase (add stock)</option>
                    <option value="decrease">Decrease (remove stock)</option>
                    <option value="set">Set (set exact qty)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted mb-1 block">Reason</label>
                  <select value={adjForm.reason} onChange={e => setAdjForm(f => ({ ...f, reason: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60">
                    {[["count_correction", "Count Correction"], ["damaged", "Damaged"], ["expired", "Expired"], ["theft", "Theft"], ["opening_stock", "Opening Stock"], ["other", "Other"]].map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                {adjForm.items.map((item, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <select value={item.product} onChange={e => updateAdjItem(i, "product", e.target.value)}
                      className="flex-1 rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60">
                      <option value="">Select product…</option>
                      {products.filter(p => !p.stockQty === undefined).map(p => (
                        <option key={p._id} value={p._id}>{p.name} (Current: {p.stockQty} {p.unit})</option>
                      ))}
                    </select>
                    <input type="number" min="0" step="0.01" value={item.qty} onChange={e => updateAdjItem(i, "qty", e.target.value)}
                      className="w-24 rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60" />
                    {adjForm.items.length > 1 && (
                      <button onClick={() => removeAdjItem(i)} className="text-red-500 hover:text-red-700 text-lg leading-none px-1">✕</button>
                    )}
                  </div>
                ))}
              </div>

              <button onClick={addAdjItem} className="text-xs text-accent hover:underline">+ Add another product</button>

              <div>
                <label className="text-xs font-semibold text-muted mb-1 block">Notes</label>
                <textarea rows={2} value={adjForm.notes} onChange={e => setAdjForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60 resize-none" />
              </div>
            </div>

            {/* ── Sticky footer ── */}
            <div className="shrink-0 border-t border-border/60 px-6 py-4 flex items-center justify-end gap-2">
              <button onClick={() => setAdjModal(false)} disabled={saving}
                className="rounded-full border border-border px-4 py-2 text-xs font-semibold disabled:opacity-50">Cancel</button>
              <button onClick={createAdjustment} disabled={saving}
                className="rounded-full bg-accent px-5 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50">
                {saving ? "Saving…" : "Apply Adjustment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
