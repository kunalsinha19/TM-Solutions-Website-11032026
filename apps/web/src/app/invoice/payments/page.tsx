"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { invFetch, invPost, fmtCurrency, fmtDate } from "../../../lib/inv-api";

type Payment = {
  _id: string; paymentNo: string; customerName: string; invoiceNo: string;
  amount: number; paymentMode: string; paymentDate: string; referenceNo: string;
  status: string; notes: string;
  customer?: { name: string; phone: string };
  invoice?: { invoiceNo: string; grandTotal: number };
};

type Invoice = { _id: string; invoiceNo: string; customerName: string; balanceDue: number };

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [form, setForm] = useState({ invoice: "", amount: "", paymentMode: "bank_transfer", referenceNo: "", paymentDate: new Date().toISOString().slice(0, 10), notes: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await invFetch<{ payments: Payment[]; total: number }>("/payments?limit=100");
      setPayments(res.payments); setTotal(res.total);
    } catch { setError("Failed to load"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function openModal() {
    try {
      const res = await invFetch<{ invoices: Invoice[] }>("/invoices?status=sent&limit=200");
      const res2 = await invFetch<{ invoices: Invoice[] }>("/invoices?status=partial&limit=200");
      setInvoices([...res.invoices, ...res2.invoices]);
    } catch { setInvoices([]); }
    setModal(true); setError("");
  }

  async function save() {
    if (!form.invoice || !form.amount) { setError("Invoice and amount are required"); return; }
    setSaving(true); setError("");
    try {
      await invPost("/payments", { ...form, amount: Number(form.amount) });
      setModal(false); load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Save failed"); }
    finally { setSaving(false); }
  }

  const selectedInv = invoices.find(i => i._id === form.invoice);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Payments</h1>
          <p className="text-xs text-muted mt-0.5">{total} total payments</p>
        </div>
        <button onClick={openModal}
          className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white hover:opacity-90">
          + Record Payment
        </button>
      </div>

      {error && <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 mb-4">{error}</div>}

      <div className="rounded-2xl border border-border bg-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-border/60 bg-surface/50">
                {["Receipt #", "Customer", "Invoice", "Amount", "Mode", "Reference", "Date", "Status"].map(h => (
                  <th key={h} className={`px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted ${h === "Amount" ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="border-b border-border/20">
                    {[...Array(8)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 skeleton rounded" /></td>)}
                  </tr>
                ))
              ) : payments.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-muted">No payments recorded yet</td></tr>
              ) : payments.map((p) => (
                <tr key={p._id} className="border-b border-border/20 hover:bg-surface/40 transition-colors">
                  <td className="px-4 py-3 font-mono font-semibold text-xs text-accent">{p.paymentNo}</td>
                  <td className="px-4 py-3 text-xs">{p.customerName}</td>
                  <td className="px-4 py-3 text-xs font-mono">{p.invoiceNo}</td>
                  <td className="px-4 py-3 text-right text-xs font-bold text-green-600">{fmtCurrency(p.amount)}</td>
                  <td className="px-4 py-3 text-xs capitalize">{p.paymentMode.replace("_", " ")}</td>
                  <td className="px-4 py-3 text-xs text-muted font-mono">{p.referenceNo || "—"}</td>
                  <td className="px-4 py-3 text-xs">{fmtDate(p.paymentDate)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${p.status === "received" ? "bg-green-100 text-green-700" : p.status === "cancelled" ? "bg-gray-200 text-gray-500" : "bg-amber-100 text-amber-700"}`}>{p.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-panel rounded-2xl border border-border w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-lg font-bold mb-4">Record Payment</h2>
            {error && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg mb-4 border border-red-200">{error}</div>}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted mb-1 block">Invoice *</label>
                <select value={form.invoice} onChange={e => {
                  const inv = invoices.find(i => i._id === e.target.value);
                  setForm(f => ({ ...f, invoice: e.target.value, amount: inv ? String(inv.balanceDue.toFixed(2)) : f.amount }));
                }} className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60">
                  <option value="">Select invoice…</option>
                  {invoices.map(i => <option key={i._id} value={i._id}>{i.invoiceNo} — {i.customerName} (Due: {fmtCurrency(i.balanceDue)})</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted mb-1 block">Amount (₹) *</label>
                <input type="number" min="0.01" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60" />
                {selectedInv && <p className="text-[10px] text-muted mt-0.5">Balance due: {fmtCurrency(selectedInv.balanceDue)}</p>}
              </div>
              <div>
                <label className="text-xs font-semibold text-muted mb-1 block">Payment Mode *</label>
                <select value={form.paymentMode} onChange={e => setForm(f => ({ ...f, paymentMode: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60">
                  {["cash", "bank_transfer", "upi", "cheque", "card", "neft", "rtgs", "imps", "other"].map(m => <option key={m} value={m}>{m.replace("_", " ").toUpperCase()}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted mb-1 block">Payment Date</label>
                <input type="date" value={form.paymentDate} onChange={e => setForm(f => ({ ...f, paymentDate: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted mb-1 block">Reference / UTR</label>
                <input value={form.referenceNo} onChange={e => setForm(f => ({ ...f, referenceNo: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60" />
              </div>
            </div>
            <div className="flex gap-2 mt-5 justify-end">
              <button onClick={() => setModal(false)} disabled={saving}
                className="rounded-full border border-border px-4 py-2 text-xs font-semibold">Cancel</button>
              <button onClick={save} disabled={saving}
                className="rounded-full bg-accent px-5 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50">
                {saving ? "Saving…" : "Record Payment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
