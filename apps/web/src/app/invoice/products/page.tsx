"use client";

import { useEffect, useState, useCallback } from "react";
import { invFetch, invPost, invPut, invDelete, fmtCurrency } from "../../../lib/inv-api";

type InvProduct = {
  _id: string; name: string; sku: string; category: string; unit: string;
  hsnCode: string; gstRate: number; purchasePrice: number; sellingPrice: number;
  stockQty: number; minStockQty: number; isService: boolean; isActive: boolean;
};

const GST_RATES = [0, 5, 12, 18, 28];
const UNITS = ["Pcs", "Kg", "Gm", "L", "Ml", "Mtr", "Ft", "Box", "Set", "Pair", "Roll", "Sheet", "Bag", "Ton", "Other"];
const EMPTY_FORM = {
  name: "", sku: "", category: "", brand: "", unit: "Pcs", hsnCode: "",
  gstRate: 18, cessRate: 0, purchasePrice: 0, sellingPrice: 0, mrp: 0,
  openingStock: 0, minStockQty: 0, maxStockQty: 0, isService: false, isTaxable: true,
  notes: "", description: "",
};

export default function InvProductsPage() {
  const [products, setProducts] = useState<InvProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [modal, setModal] = useState<null | "new" | InvProduct>(null);
  const [form, setForm] = useState<typeof EMPTY_FORM>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (q = "", cat = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "200" });
      if (q) params.set("search", q);
      if (cat) params.set("category", cat);
      const [res, catRes] = await Promise.all([
        invFetch<{ products: InvProduct[]; total: number }>(`/products?${params}`),
        invFetch<{ categories: string[] }>("/products/categories"),
      ]);
      setProducts(res.products); setTotal(res.total);
      setCategories(catRes.categories);
    } catch { setError("Failed to load"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function f(field: string, val: unknown) { setForm(prev => ({ ...prev, [field]: val })); }

  async function save() {
    if (!form.name.trim()) { setError("Product name is required"); return; }
    setSaving(true); setError("");
    try {
      if (modal === "new") await invPost("/products", form);
      else await invPut(`/products/${(modal as InvProduct)._id}`, form);
      setModal(null); load(search, filterCat);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Save failed"); }
    finally { setSaving(false); }
  }

  async function del(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return;
    try { await invDelete(`/products/${id}`); load(search, filterCat); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : "Delete failed"); }
  }

  function openEdit(p: InvProduct) {
    setForm({
      name: p.name, sku: p.sku || "", category: p.category || "", brand: "", unit: p.unit,
      hsnCode: p.hsnCode || "", gstRate: p.gstRate, cessRate: 0,
      purchasePrice: p.purchasePrice, sellingPrice: p.sellingPrice, mrp: 0,
      openingStock: 0, minStockQty: p.minStockQty, maxStockQty: 0,
      isService: p.isService, isTaxable: true, notes: "", description: "",
    });
    setModal(p); setError("");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Products & Services</h1>
          <p className="text-xs text-muted mt-0.5">{total} items</p>
        </div>
        <button onClick={() => { setForm({ ...EMPTY_FORM }); setModal("new"); setError(""); }}
          className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white hover:opacity-90">
          + Add Product
        </button>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <input type="text" placeholder="Search products…" value={search}
          onChange={e => { setSearch(e.target.value); load(e.target.value, filterCat); }}
          className="flex-1 min-w-48 rounded-xl border border-border bg-panel px-4 py-2.5 text-sm focus:outline-none focus:border-accent/60" />
        <select value={filterCat} onChange={e => { setFilterCat(e.target.value); load(search, e.target.value); }}
          className="rounded-xl border border-border bg-panel px-3 py-2.5 text-sm focus:outline-none focus:border-accent/60">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="rounded-2xl border border-border bg-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-border/60 bg-surface/50">
                {["Product", "SKU", "Category", "HSN", "GST%", "Purchase", "Selling", "Stock", "Actions"].map(h => (
                  <th key={h} className={`px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-muted ${["Purchase", "Selling", "Stock", "Actions"].includes(h) ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="border-b border-border/20">
                    {[...Array(9)].map((_, j) => <td key={j} className="px-3 py-3"><div className="h-4 skeleton rounded" /></td>)}
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-sm text-muted">No products found</td></tr>
              ) : products.map((p) => (
                <tr key={p._id} className="border-b border-border/20 hover:bg-surface/40 transition-colors">
                  <td className="px-3 py-3">
                    <div className="font-semibold text-xs">{p.name}</div>
                    <span className={`text-[10px] ${p.isService ? "text-blue-600" : "text-muted"}`}>{p.isService ? "Service" : p.unit}</span>
                  </td>
                  <td className="px-3 py-3 font-mono text-xs">{p.sku || "—"}</td>
                  <td className="px-3 py-3 text-xs">{p.category || "—"}</td>
                  <td className="px-3 py-3 font-mono text-xs">{p.hsnCode || "—"}</td>
                  <td className="px-3 py-3 text-xs">{p.gstRate}%</td>
                  <td className="px-3 py-3 text-xs text-right">{fmtCurrency(p.purchasePrice)}</td>
                  <td className="px-3 py-3 text-xs text-right font-semibold">{fmtCurrency(p.sellingPrice)}</td>
                  <td className="px-3 py-3 text-right">
                    {p.isService ? <span className="text-xs text-muted">—</span> : (
                      <span className={`text-xs font-bold ${p.stockQty <= p.minStockQty ? "text-red-600" : "text-text"}`}>
                        {p.stockQty} {p.unit}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(p)}
                        className="rounded-lg border border-border px-2 py-1 text-[11px] hover:border-accent/40 hover:text-accent transition-colors">Edit</button>
                      <button onClick={() => del(p._id, p.name)}
                        className="rounded-lg border border-red-200 px-2 py-1 text-[11px] text-red-600 hover:bg-red-50 transition-colors">Del</button>
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
          <div className="bg-panel rounded-2xl border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <h2 className="text-lg font-bold mb-4">{modal === "new" ? "Add Product" : `Edit: ${(modal as InvProduct).name}`}</h2>
            {error && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg mb-4 border border-red-200">{error}</div>}

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-semibold text-muted mb-1 block">Product Name *</label>
                <input value={form.name} onChange={e => f("name", e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted mb-1 block">SKU</label>
                <input value={form.sku} onChange={e => f("sku", e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted mb-1 block">Category</label>
                <input list="inv-cats" value={form.category} onChange={e => f("category", e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60" />
                <datalist id="inv-cats">{categories.map(c => <option key={c} value={c} />)}</datalist>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted mb-1 block">Unit</label>
                <select value={form.unit} onChange={e => f("unit", e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60">
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted mb-1 block">HSN Code</label>
                <input value={form.hsnCode} onChange={e => f("hsnCode", e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent/60" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted mb-1 block">GST Rate</label>
                <select value={form.gstRate} onChange={e => f("gstRate", Number(e.target.value))}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60">
                  {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted mb-1 block">Purchase Price (excl. GST)</label>
                <input type="number" min="0" step="0.01" value={form.purchasePrice} onChange={e => f("purchasePrice", Number(e.target.value))}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted mb-1 block">Selling Price (excl. GST)</label>
                <input type="number" min="0" step="0.01" value={form.sellingPrice} onChange={e => f("sellingPrice", Number(e.target.value))}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60" />
              </div>
              {!form.isService && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-muted mb-1 block">Opening Stock</label>
                    <input type="number" min="0" value={form.openingStock} onChange={e => f("openingStock", Number(e.target.value))}
                      className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted mb-1 block">Min Stock (reorder level)</label>
                    <input type="number" min="0" value={form.minStockQty} onChange={e => f("minStockQty", Number(e.target.value))}
                      className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60" />
                  </div>
                </>
              )}
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isSvc" checked={form.isService} onChange={e => f("isService", e.target.checked)}
                  className="w-4 h-4 accent-blue-600" />
                <label htmlFor="isSvc" className="text-sm">This is a service</label>
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-muted mb-1 block">Description</label>
                <textarea rows={2} value={form.description} onChange={e => f("description", e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60 resize-none" />
              </div>
            </div>

            <div className="flex gap-2 mt-5 justify-end">
              <button onClick={() => setModal(null)} disabled={saving}
                className="rounded-full border border-border px-4 py-2 text-xs font-semibold disabled:opacity-50">Cancel</button>
              <button onClick={save} disabled={saving}
                className="rounded-full bg-accent px-5 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50">
                {saving ? "Saving…" : (modal === "new" ? "Add Product" : "Save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
