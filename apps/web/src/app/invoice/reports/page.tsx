"use client";

import { useEffect, useState, useCallback } from "react";
import { invFetch, fmtCurrency, fmtDate } from "../../../lib/inv-api";

type SalesRow = { _id: { year: number; month: number }; revenue: number; collected: number; outstanding: number; count: number; taxableAmt: number; totalTax: number };
type GSTRow = { _id: { hsnCode: string; gstRate: number }; taxableAmt: number; cgst: number; sgst: number; igst: number; totalTax: number };
type AgingBucket = { label: string; count: number; totalAmount: number; invoices: Array<{ invoiceNo: string; customerName: string; daysOld: number; balanceDue: number }> };
type InvReport = { products: Array<{ name: string; sku: string; category: string; unit: string; stockQty: number; minStockQty: number; purchasePrice: number; sellingPrice: number }>; summary: { total: number; lowStock: number; stockValue: number; sellingValue: number } };

const MONTHS = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function ReportsPage() {
  const [tab, setTab] = useState<"sales" | "gst" | "receivables" | "inventory">("sales");
  const [from, setFrom] = useState(() => { const d = new Date(); d.setMonth(d.getMonth() - 3); return d.toISOString().slice(0, 10); });
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);

  const [salesData, setSalesData] = useState<SalesRow[]>([]);
  const [gstData, setGSTData] = useState<GSTRow[]>([]);
  const [agingData, setAgingData] = useState<AgingBucket[]>([]);
  const [invData, setInvData] = useState<InvReport | null>(null);
  const [totalOutstanding, setTotalOutstanding] = useState(0);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      if (tab === "sales") {
        const res = await invFetch<{ data: SalesRow[] }>(`/reports/sales?from=${from}&to=${to}`);
        setSalesData(res.data);
      } else if (tab === "gst") {
        const res = await invFetch<{ data: GSTRow[] }>(`/reports/gst?from=${from}&to=${to}`);
        setGSTData(res.data);
      } else if (tab === "receivables") {
        const res = await invFetch<{ aging: AgingBucket[]; totalOutstanding: number }>("/reports/receivables");
        setAgingData(res.aging); setTotalOutstanding(res.totalOutstanding);
      } else if (tab === "inventory") {
        const res = await invFetch<InvReport>("/reports/inventory");
        setInvData(res);
      }
    } catch { setError("Failed to load report"); }
    finally { setLoading(false); }
  }, [tab, from, to]);

  useEffect(() => { load(); }, [load]);

  const salesTotal = salesData.reduce((s, r) => s + r.revenue, 0);
  const salesCollected = salesData.reduce((s, r) => s + r.collected, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-extrabold">Reports</h1>
        {(tab === "sales" || tab === "gst") && (
          <div className="flex gap-2 items-center">
            <input type="date" value={from} onChange={e => setFrom(e.target.value)}
              className="rounded-xl border border-border bg-panel px-3 py-2 text-xs focus:outline-none focus:border-accent/60" />
            <span className="text-xs text-muted">to</span>
            <input type="date" value={to} onChange={e => setTo(e.target.value)}
              className="rounded-xl border border-border bg-panel px-3 py-2 text-xs focus:outline-none focus:border-accent/60" />
            <button onClick={load} disabled={loading}
              className="rounded-full bg-accent px-3 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50">
              {loading ? "…" : "Apply"}
            </button>
          </div>
        )}
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 mb-6 border-b border-border/40">
        {[
          { key: "sales", label: "Sales Report" },
          { key: "gst", label: "GST Report" },
          { key: "receivables", label: "Receivables / Aging" },
          { key: "inventory", label: "Inventory Report" },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key as typeof tab)}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 -mb-px transition-colors ${tab === key ? "border-accent text-accent" : "border-transparent text-muted hover:text-text"}`}>
            {label}
          </button>
        ))}
      </div>

      {error && <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 mb-4">{error}</div>}

      {/* Sales Report */}
      {tab === "sales" && (
        <div>
          <div className="grid grid-cols-3 gap-4 mb-5">
            {[
              { label: "Total Revenue", value: fmtCurrency(salesTotal) },
              { label: "Collected", value: fmtCurrency(salesCollected) },
              { label: "Outstanding", value: fmtCurrency(salesTotal - salesCollected) },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-2xl border border-border bg-panel p-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted mb-1">{label}</div>
                <div className="text-xl font-extrabold text-accent">{value}</div>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-border bg-panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b border-border/60 bg-surface/50">
                    {["Period", "Invoices", "Revenue", "Taxable Amt", "Tax", "Collected", "Outstanding"].map(h => (
                      <th key={h} className={`px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted ${h === "Period" || h === "Invoices" ? "text-left" : "text-right"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? [...Array(6)].map((_, i) => <tr key={i} className="border-b border-border/20">{[...Array(7)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 skeleton rounded" /></td>)}</tr>)
                    : salesData.length === 0 ? <tr><td colSpan={7} className="px-4 py-10 text-center text-muted">No data for selected period</td></tr>
                    : salesData.map((row, i) => (
                      <tr key={i} className="border-b border-border/20 hover:bg-surface/40">
                        <td className="px-4 py-3 font-semibold text-xs">{MONTHS[row._id.month]} {row._id.year}</td>
                        <td className="px-4 py-3 text-xs">{row.count}</td>
                        <td className="px-4 py-3 text-right text-xs font-semibold">{fmtCurrency(row.revenue)}</td>
                        <td className="px-4 py-3 text-right text-xs">{fmtCurrency(row.taxableAmt)}</td>
                        <td className="px-4 py-3 text-right text-xs">{fmtCurrency(row.totalTax)}</td>
                        <td className="px-4 py-3 text-right text-xs text-green-600 font-semibold">{fmtCurrency(row.collected)}</td>
                        <td className="px-4 py-3 text-right text-xs text-red-600">{fmtCurrency(row.outstanding)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* GST Report */}
      {tab === "gst" && (
        <div className="rounded-2xl border border-border bg-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-border/60 bg-surface/50">
                  {["HSN Code", "GST Rate", "Taxable Amt", "CGST", "SGST", "IGST", "Total Tax"].map(h => (
                    <th key={h} className={`px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted ${h === "HSN Code" || h === "GST Rate" ? "text-left" : "text-right"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? [...Array(5)].map((_, i) => <tr key={i} className="border-b border-border/20">{[...Array(7)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 skeleton rounded" /></td>)}</tr>)
                  : gstData.length === 0 ? <tr><td colSpan={7} className="px-4 py-10 text-center text-muted">No data for selected period</td></tr>
                  : gstData.map((row, i) => (
                    <tr key={i} className="border-b border-border/20 hover:bg-surface/40">
                      <td className="px-4 py-3 font-mono text-xs">{row._id.hsnCode || "—"}</td>
                      <td className="px-4 py-3 text-xs font-bold">{row._id.gstRate}%</td>
                      <td className="px-4 py-3 text-right text-xs">{fmtCurrency(row.taxableAmt)}</td>
                      <td className="px-4 py-3 text-right text-xs">{fmtCurrency(row.cgst)}</td>
                      <td className="px-4 py-3 text-right text-xs">{fmtCurrency(row.sgst)}</td>
                      <td className="px-4 py-3 text-right text-xs">{fmtCurrency(row.igst)}</td>
                      <td className="px-4 py-3 text-right text-xs font-semibold text-accent">{fmtCurrency(row.totalTax)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Receivables / Aging */}
      {tab === "receivables" && (
        <div>
          <div className="rounded-2xl border border-border bg-amber-50 border-amber-200 px-4 py-3 mb-5 flex items-center justify-between">
            <div className="font-bold text-amber-800">Total Outstanding Receivables</div>
            <div className="text-2xl font-extrabold text-amber-700">{fmtCurrency(totalOutstanding)}</div>
          </div>
          {loading ? <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 skeleton rounded-2xl" />)}</div>
            : agingData.map((bucket) => (
              <div key={bucket.label} className="rounded-2xl border border-border bg-panel p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-sm">{bucket.label}</h3>
                  <div className="text-xs">
                    <span className="font-bold text-accent">{fmtCurrency(bucket.totalAmount)}</span>
                    <span className="text-muted ml-2">({bucket.count} invoice{bucket.count !== 1 ? "s" : ""})</span>
                  </div>
                </div>
                {bucket.invoices.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead><tr className="text-muted border-b border-border/40">
                        <th className="text-left pb-1.5 font-semibold">Invoice #</th>
                        <th className="text-left pb-1.5 font-semibold">Customer</th>
                        <th className="text-right pb-1.5 font-semibold">Days Overdue</th>
                        <th className="text-right pb-1.5 font-semibold">Balance Due</th>
                      </tr></thead>
                      <tbody>
                        {bucket.invoices.slice(0, 10).map((inv, i) => (
                          <tr key={i} className="border-b border-border/20">
                            <td className="py-1.5 font-mono text-accent">{inv.invoiceNo}</td>
                            <td className="py-1.5">{inv.customerName}</td>
                            <td className="py-1.5 text-right text-red-600 font-bold">{inv.daysOld}</td>
                            <td className="py-1.5 text-right font-semibold">{fmtCurrency(inv.balanceDue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
        </div>
      )}

      {/* Inventory Report */}
      {tab === "inventory" && invData && (
        <div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
            {[
              { label: "Total Products", value: String(invData.summary.total) },
              { label: "Low Stock", value: String(invData.summary.lowStock), danger: invData.summary.lowStock > 0 },
              { label: "Stock Value (Cost)", value: fmtCurrency(invData.summary.stockValue) },
              { label: "Stock Value (Selling)", value: fmtCurrency(invData.summary.sellingValue) },
            ].map(({ label, value, danger }) => (
              <div key={label} className="rounded-2xl border border-border bg-panel p-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted mb-1">{label}</div>
                <div className={`text-xl font-extrabold ${danger ? "text-red-600" : "text-text"}`}>{value}</div>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-border bg-panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[600px]">
                <thead>
                  <tr className="border-b border-border/60 bg-surface/50">
                    {["Product", "SKU", "Category", "Unit", "Stock Qty", "Min Qty", "Cost Price", "Sell Price", "Stock Value"].map(h => (
                      <th key={h} className={`px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted ${["Stock Qty", "Min Qty", "Cost Price", "Sell Price", "Stock Value"].includes(h) ? "text-right" : "text-left"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? [...Array(8)].map((_, i) => <tr key={i} className="border-b border-border/20">{[...Array(9)].map((_, j) => <td key={j} className="px-3 py-2.5"><div className="h-3.5 skeleton rounded" /></td>)}</tr>)
                    : invData.products.map((p, i) => (
                      <tr key={i} className={`border-b border-border/20 hover:bg-surface/40 ${p.stockQty <= p.minStockQty ? "bg-red-50" : ""}`}>
                        <td className="px-3 py-2.5 font-semibold">{p.name}</td>
                        <td className="px-3 py-2.5 font-mono">{p.sku || "—"}</td>
                        <td className="px-3 py-2.5">{p.category || "—"}</td>
                        <td className="px-3 py-2.5">{p.unit}</td>
                        <td className={`px-3 py-2.5 text-right font-bold ${p.stockQty <= p.minStockQty ? "text-red-600" : ""}`}>{p.stockQty}</td>
                        <td className="px-3 py-2.5 text-right text-muted">{p.minStockQty}</td>
                        <td className="px-3 py-2.5 text-right">{fmtCurrency(p.purchasePrice)}</td>
                        <td className="px-3 py-2.5 text-right">{fmtCurrency(p.sellingPrice)}</td>
                        <td className="px-3 py-2.5 text-right font-semibold">{fmtCurrency(p.stockQty * p.purchasePrice)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
