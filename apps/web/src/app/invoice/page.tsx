"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { invFetch, fmtCurrency, fmtDate } from "../../lib/inv-api";

type DashData = {
  revenue: { total: number; thisMonth: number; lastMonth: number; growthPct: number };
  collections: { thisMonth: number; count: number };
  outstanding: { total: number; overdueCount: number };
  invoiceCounts: { draft: number; sent: number; paid: number; overdue: number };
  inventory: { lowStockCount: number };
  pendingPOs: number;
  recentInvoices: Array<{ _id: string; invoiceNo: string; customerName: string; status: string; grandTotal: number; balanceDue: number; invoiceDate: string }>;
  topCustomers: Array<{ _id: string; name: string; company: string; totalAmount: number; totalPaid: number; outstandingAmount: number }>;
  recentPayments: Array<{ _id: string; paymentNo: string; customerName: string; amount: number; paymentMode: string; paymentDate: string; invoiceNo: string }>;
};

const STATUS_COLORS: Record<string, string> = {
  draft:    "bg-gray-100 text-gray-600",
  sent:     "bg-blue-100 text-blue-700",
  partial:  "bg-amber-100 text-amber-700",
  paid:     "bg-green-100 text-green-700",
  overdue:  "bg-red-100 text-red-700",
  cancelled: "bg-gray-200 text-gray-500",
};

function Kpi({ label, value, sub, color = "text-text" }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-panel p-5">
      <div className="text-[10px] font-bold uppercase tracking-widest text-muted mb-2">{label}</div>
      <div className={`text-2xl font-extrabold tabular-nums ${color}`}>{value}</div>
      {sub && <div className="text-[11px] text-muted mt-1">{sub}</div>}
    </div>
  );
}

export default function InvDashboard() {
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await invFetch<{ success: boolean; dashboard: DashData }>("/dashboard");
      setData(res.dashboard);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Invoice Dashboard</h1>
          <p className="text-xs text-muted mt-0.5">Business overview · Revenue · Collections · Inventory</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} disabled={loading}
            className="rounded-full border border-border px-4 py-2 text-xs font-semibold hover:border-accent/40 hover:text-accent transition-colors disabled:opacity-40">
            {loading ? "Loading…" : "Refresh"}
          </button>
          <Link href="/invoice/invoices/new"
            className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white hover:opacity-90">
            + New Invoice
          </Link>
        </div>
      </div>

      {error && <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 mb-6">{error}</div>}

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <Kpi label="Total Revenue" value={loading ? "—" : fmtCurrency(data?.revenue.total ?? 0)} sub="All invoices" color="text-accent" />
        <Kpi label="This Month" value={loading ? "—" : fmtCurrency(data?.revenue.thisMonth ?? 0)}
          sub={data ? (data.revenue.growthPct >= 0 ? `↑ ${data.revenue.growthPct}%` : `↓ ${Math.abs(data.revenue.growthPct)}%`) : undefined} />
        <Kpi label="Collected" value={loading ? "—" : fmtCurrency(data?.collections.thisMonth ?? 0)} sub="This month" />
        <Kpi label="Outstanding" value={loading ? "—" : fmtCurrency(data?.outstanding.total ?? 0)}
          sub={data ? `${data.outstanding.overdueCount} overdue` : undefined} color={data?.outstanding.overdueCount ? "text-red-600" : "text-text"} />
        <Kpi label="Low Stock" value={loading ? "—" : String(data?.inventory.lowStockCount ?? 0)} sub="Products" color={data?.inventory.lowStockCount ? "text-amber-600" : "text-text"} />
        <Kpi label="Pending POs" value={loading ? "—" : String(data?.pendingPOs ?? 0)} sub="Purchase orders" />
      </div>

      {/* Invoice Status Counts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { key: "draft",  label: "Drafts",  icon: "📝" },
          { key: "sent",   label: "Sent",    icon: "📤" },
          { key: "paid",   label: "Paid",    icon: "✅" },
          { key: "overdue", label: "Overdue", icon: "⚠️" },
        ].map(({ key, label, icon }) => (
          <Link key={key} href={`/invoice/invoices?status=${key}`}
            className="rounded-2xl border border-border bg-panel p-4 hover:border-accent/30 transition-all text-center">
            <div className="text-2xl mb-1">{icon}</div>
            <div className="text-2xl font-extrabold tabular-nums">{loading ? "—" : (data?.invoiceCounts[key as keyof typeof data.invoiceCounts] ?? 0)}</div>
            <div className="text-xs text-muted mt-0.5">{label}</div>
          </Link>
        ))}
      </div>

      {/* Recent Invoices + Top Customers */}
      <div className="grid lg:grid-cols-[3fr_2fr] gap-6 mb-6">
        <div className="rounded-2xl border border-border bg-panel p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider">Recent Invoices</h2>
            <Link href="/invoice/invoices" className="text-xs text-accent hover:underline">View all →</Link>
          </div>
          {loading ? <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-10 skeleton rounded-xl" />)}</div>
            : !data?.recentInvoices.length ? <p className="text-sm text-muted py-4 text-center">No invoices yet</p>
            : (
              <div className="space-y-1.5 overflow-x-auto">
                <table className="w-full text-xs min-w-[400px]">
                  <thead>
                    <tr className="text-muted border-b border-border/40">
                      <th className="text-left pb-2 font-semibold">Invoice #</th>
                      <th className="text-left pb-2 font-semibold">Customer</th>
                      <th className="text-right pb-2 font-semibold">Amount</th>
                      <th className="text-right pb-2 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentInvoices.map((inv) => (
                      <tr key={inv._id} className="border-b border-border/20 hover:bg-surface/50 transition-colors">
                        <td className="py-2">
                          <Link href={`/invoice/invoices/${inv._id}`} className="text-accent hover:underline font-mono">{inv.invoiceNo}</Link>
                        </td>
                        <td className="py-2 truncate max-w-[120px]">{inv.customerName}</td>
                        <td className="py-2 text-right font-semibold">{fmtCurrency(inv.grandTotal)}</td>
                        <td className="py-2 text-right">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_COLORS[inv.status] ?? "bg-gray-100 text-gray-600"}`}>{inv.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </div>

        <div className="rounded-2xl border border-border bg-panel p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider">Top Customers</h2>
            <Link href="/invoice/customers" className="text-xs text-accent hover:underline">View all →</Link>
          </div>
          {loading ? <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-10 skeleton rounded-xl" />)}</div>
            : !data?.topCustomers.length ? <p className="text-sm text-muted py-4 text-center">No customers yet</p>
            : (
              <div className="space-y-2">
                {data.topCustomers.map((c, i) => (
                  <div key={c._id} className="flex items-center gap-3 rounded-xl bg-surface/50 border border-border/30 px-3 py-2">
                    <span className="text-xs font-black text-muted w-4 text-right">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold truncate">{c.name}</div>
                      {c.company && <div className="text-[10px] text-muted truncate">{c.company}</div>}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-accent">{fmtCurrency(c.totalAmount)}</div>
                      {c.outstandingAmount > 0 && <div className="text-[10px] text-red-500">Due: {fmtCurrency(c.outstandingAmount)}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>

      {/* Recent Payments */}
      <div className="rounded-2xl border border-border bg-panel p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider">Recent Payments</h2>
          <Link href="/invoice/payments" className="text-xs text-accent hover:underline">View all →</Link>
        </div>
        {loading ? <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-8 skeleton rounded-xl" />)}</div>
          : !data?.recentPayments.length ? <p className="text-sm text-muted py-4 text-center">No payments yet</p>
          : (
            <div className="overflow-x-auto -mx-2 px-2">
              <table className="w-full text-xs min-w-[400px]">
                <thead>
                  <tr className="text-muted border-b border-border/40">
                    <th className="text-left pb-2 font-semibold">Receipt #</th>
                    <th className="text-left pb-2 font-semibold">Customer</th>
                    <th className="text-left pb-2 font-semibold">Invoice</th>
                    <th className="text-right pb-2 font-semibold">Amount</th>
                    <th className="text-right pb-2 font-semibold">Mode</th>
                    <th className="text-right pb-2 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentPayments.map((p) => (
                    <tr key={p._id} className="border-b border-border/20 hover:bg-surface/50 transition-colors">
                      <td className="py-2 font-mono text-accent">{p.paymentNo}</td>
                      <td className="py-2 truncate max-w-[100px]">{p.customerName}</td>
                      <td className="py-2 font-mono">{p.invoiceNo}</td>
                      <td className="py-2 text-right font-semibold">{fmtCurrency(p.amount)}</td>
                      <td className="py-2 text-right capitalize">{p.paymentMode.replace("_", " ")}</td>
                      <td className="py-2 text-right text-muted">{fmtDate(p.paymentDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </div>
  );
}
