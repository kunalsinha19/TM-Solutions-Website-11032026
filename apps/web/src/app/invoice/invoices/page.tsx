"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { invFetch, invPost, fmtCurrency, fmtDate } from "../../../lib/inv-api";

type Invoice = {
  _id: string; invoiceNo: string; invoiceType: string; status: string;
  customerName: string; invoiceDate: string; dueDate: string;
  grandTotal: number; amountPaid: number; balanceDue: number;
  customer?: { name: string; phone: string };
};

const STATUS_COLORS: Record<string, string> = {
  draft:     "bg-gray-100 text-gray-600",
  sent:      "bg-blue-100 text-blue-700",
  partial:   "bg-amber-100 text-amber-700",
  paid:      "bg-green-100 text-green-700",
  overdue:   "bg-red-100 text-red-700",
  cancelled: "bg-gray-200 text-gray-500",
  void:      "bg-gray-200 text-gray-400",
};

const STATUSES = ["", "draft", "sent", "partial", "paid", "overdue", "cancelled"];

export default function InvoicesPage() {
  const sp = useSearchParams();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(sp.get("status") || "");
  const [type, setType] = useState("");
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async (p = 1, s = search, st = status, tp = type) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: "30" });
      if (s) params.set("search", s);
      if (st) params.set("status", st);
      if (tp) params.set("type", tp);
      const res = await invFetch<{ invoices: Invoice[]; total: number; page: number; pages: number }>(`/invoices?${params}`);
      setInvoices(res.invoices);
      setTotal(res.total);
      setPage(p);
    } catch { setError("Failed to load invoices"); }
    finally { setLoading(false); }
  }, [search, status, type]);

  useEffect(() => { load(); }, [load]);

  async function cancelInvoice(id: string, invoiceNo: string) {
    const reason = prompt(`Cancel ${invoiceNo}? Enter reason (or press OK to cancel without reason):`);
    if (reason === null) return;
    setCancelling(id);
    try {
      await invPost(`/invoices/${id}/cancel`, { reason: reason || "" });
      load(page);
    } catch (e: unknown) { alert(e instanceof Error ? e.message : "Cancel failed"); }
    finally { setCancelling(null); }
  }

  async function downloadPdf(id: string, invoiceNo: string) {
    try {
      const token = localStorage.getItem("tara-maa-admin-access-token");
      const res = await fetch(`/api/inv/invoices/${id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("PDF generation failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${invoiceNo}.pdf`;
      a.click(); URL.revokeObjectURL(url);
    } catch (e: unknown) { alert(e instanceof Error ? e.message : "PDF failed"); }
  }

  const pages = Math.ceil(total / 30);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Invoices</h1>
          <p className="text-xs text-muted mt-0.5">{total} total</p>
        </div>
        <div className="flex gap-2">
          <Link href="/invoice/invoices/new"
            className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white hover:opacity-90">
            + New Invoice
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <input type="text" placeholder="Search by invoice #, customer…" value={search}
          onChange={e => { setSearch(e.target.value); load(1, e.target.value, status, type); }}
          className="flex-1 min-w-48 rounded-xl border border-border bg-panel px-4 py-2.5 text-sm focus:outline-none focus:border-accent/60" />
        <select value={status} onChange={e => { setStatus(e.target.value); load(1, search, e.target.value, type); }}
          className="rounded-xl border border-border bg-panel px-3 py-2.5 text-sm focus:outline-none focus:border-accent/60">
          {STATUSES.map(s => <option key={s} value={s}>{s || "All Status"}</option>)}
        </select>
        <select value={type} onChange={e => { setType(e.target.value); load(1, search, status, e.target.value); }}
          className="rounded-xl border border-border bg-panel px-3 py-2.5 text-sm focus:outline-none focus:border-accent/60">
          <option value="">All Types</option>
          <option value="invoice">Invoice</option>
          <option value="proforma">Proforma</option>
          <option value="quotation">Quotation</option>
          <option value="credit_note">Credit Note</option>
          <option value="debit_note">Debit Note</option>
        </select>
      </div>

      {error && <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 mb-4">{error}</div>}

      <div className="rounded-2xl border border-border bg-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="border-b border-border/60 bg-surface/50">
                {["Invoice #", "Type", "Customer", "Date", "Due", "Amount", "Paid", "Balance", "Status", "Actions"].map(h => (
                  <th key={h} className={`px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted ${["Amount", "Paid", "Balance"].includes(h) ? "text-right" : h === "Actions" ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="border-b border-border/20">
                    {[...Array(10)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 skeleton rounded" /></td>)}
                  </tr>
                ))
              ) : invoices.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-14 text-center text-muted">
                  No invoices found.{" "}
                  <Link href="/invoice/invoices/new" className="text-accent hover:underline">Create your first invoice →</Link>
                </td></tr>
              ) : invoices.map((inv) => (
                <tr key={inv._id} className="border-b border-border/20 hover:bg-surface/40 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/invoice/invoices/${inv._id}`} className="text-accent hover:underline font-mono font-semibold text-xs">
                      {inv.invoiceNo}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-xs capitalize">{inv.invoiceType.replace("_", " ")}</td>
                  <td className="px-4 py-3">
                    <div className="text-xs font-semibold">{inv.customerName}</div>
                    {inv.customer?.phone && <div className="text-[10px] text-muted">{inv.customer.phone}</div>}
                  </td>
                  <td className="px-4 py-3 text-xs">{fmtDate(inv.invoiceDate)}</td>
                  <td className="px-4 py-3 text-xs">{fmtDate(inv.dueDate)}</td>
                  <td className="px-4 py-3 text-right text-xs font-semibold">{fmtCurrency(inv.grandTotal)}</td>
                  <td className="px-4 py-3 text-right text-xs text-green-600">{fmtCurrency(inv.amountPaid)}</td>
                  <td className="px-4 py-3 text-right text-xs">
                    <span className={inv.balanceDue > 0 ? "text-red-600 font-bold" : "text-muted"}>{fmtCurrency(inv.balanceDue)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_COLORS[inv.status] || "bg-gray-100 text-gray-600"}`}>{inv.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Link href={`/invoice/invoices/${inv._id}`}
                        className="rounded-lg border border-border px-2 py-1 text-[11px] hover:border-accent/40 hover:text-accent transition-colors">View</Link>
                      <button onClick={() => downloadPdf(inv._id, inv.invoiceNo)}
                        className="rounded-lg border border-border px-2 py-1 text-[11px] hover:border-accent/40 hover:text-accent transition-colors">PDF</button>
                      {inv.status !== "cancelled" && inv.status !== "paid" && (
                        <button onClick={() => cancelInvoice(inv._id, inv.invoiceNo)} disabled={cancelling === inv._id}
                          className="rounded-lg border border-red-200 px-2 py-1 text-[11px] text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50">
                          {cancelling === inv._id ? "…" : "Cancel"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border/40">
            <p className="text-xs text-muted">Page {page} of {pages} ({total} invoices)</p>
            <div className="flex gap-2">
              <button onClick={() => load(page - 1)} disabled={page <= 1 || loading}
                className="rounded-lg border border-border px-3 py-1.5 text-xs disabled:opacity-40 hover:border-accent/40">← Prev</button>
              <button onClick={() => load(page + 1)} disabled={page >= pages || loading}
                className="rounded-lg border border-border px-3 py-1.5 text-xs disabled:opacity-40 hover:border-accent/40">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
