"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { invFetch, invPost, fmtCurrency, fmtDate } from "../../../../lib/inv-api";

type Invoice = {
  _id: string; invoiceNo: string; invoiceType: string; status: string;
  invoiceDate: string; dueDate: string; poNumber: string;
  customerName: string; customerGSTIN: string;
  billingAddress: { line1: string; line2: string; city: string; state: string; stateCode: string; pincode: string };
  items: Array<{ name: string; hsnCode: string; qty: number; unit: string; rate: number; discountPercent: number; gstRate: number; cgstAmt: number; sgstAmt: number; igstAmt: number; taxableAmt: number; totalAmt: number }>;
  subtotal: number; totalDiscount: number; totalTaxableAmt: number;
  totalCGST: number; totalSGST: number; totalIGST: number; totalTax: number;
  roundOff: number; grandTotal: number; amountPaid: number; balanceDue: number;
  amountInWords: string; isInterState: boolean;
  notes: string; termsConditions: string;
  createdBy: { name: string };
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600", sent: "bg-blue-100 text-blue-700",
  partial: "bg-amber-100 text-amber-700", paid: "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700", cancelled: "bg-gray-200 text-gray-500",
};

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [payModal, setPayModal] = useState(false);
  const [payForm, setPayForm] = useState({ amount: "", paymentMode: "bank_transfer", referenceNo: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    invFetch<{ invoice: Invoice }>(`/invoices/${id}`)
      .then(r => setInvoice(r.invoice))
      .catch(() => setError("Invoice not found"))
      .finally(() => setLoading(false));
  }, [id]);

  async function addPayment() {
    if (!payForm.amount || Number(payForm.amount) <= 0) { setError("Enter valid amount"); return; }
    setSaving(true); setError("");
    try {
      await invPost("/payments", {
        invoice: id,
        amount: Number(payForm.amount),
        paymentMode: payForm.paymentMode,
        referenceNo: payForm.referenceNo,
        notes: payForm.notes,
      });
      setPayModal(false);
      const res = await invFetch<{ invoice: Invoice }>(`/invoices/${id}`);
      setInvoice(res.invoice);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Payment failed"); }
    finally { setSaving(false); }
  }

  async function downloadPdf() {
    const token = localStorage.getItem("tara-maa-admin-access-token");
    try {
      const res = await fetch(`/api/inv/invoices/${id}/pdf`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("PDF failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${invoice?.invoiceNo}.pdf`;
      a.click(); URL.revokeObjectURL(url);
    } catch { alert("PDF generation failed"); }
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-muted text-sm">Loading…</div>;
  if (!invoice) return <div className="flex flex-col items-center justify-center h-64 gap-3"><p className="text-muted">{error}</p><Link href="/invoice/invoices" className="text-accent hover:underline text-sm">← Back to Invoices</Link></div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      {/* Topbar */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/invoice/invoices" className="text-muted hover:text-text text-sm">← Invoices</Link>
          <h1 className="text-xl font-extrabold font-mono">{invoice.invoiceNo}</h1>
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${STATUS_COLORS[invoice.status] || "bg-gray-100"}`}>{invoice.status}</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={downloadPdf} className="rounded-full border border-border px-3 py-2 text-xs font-semibold hover:border-accent/40 hover:text-accent">
            📄 PDF
          </button>
          {invoice.status !== "cancelled" && invoice.status !== "paid" && invoice.balanceDue > 0 && (
            <button onClick={() => { setPayModal(true); setPayForm(f => ({ ...f, amount: String(invoice.balanceDue.toFixed(2)) })); setError(""); }}
              className="rounded-full bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:opacity-90">
              + Record Payment
            </button>
          )}
        </div>
      </div>

      {/* Invoice Preview Card */}
      <div className="rounded-2xl border border-border bg-panel p-6 mb-5 print:shadow-none">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="text-xs text-muted uppercase tracking-widest font-bold mb-1">{invoice.invoiceType.replace("_", " ")}</div>
            <div className="text-2xl font-extrabold font-mono">{invoice.invoiceNo}</div>
            <div className="text-xs text-muted mt-1">Date: {fmtDate(invoice.invoiceDate)}{invoice.dueDate ? ` · Due: ${fmtDate(invoice.dueDate)}` : ""}</div>
            {invoice.poNumber && <div className="text-xs text-muted">PO#: {invoice.poNumber}</div>}
          </div>
          <div className="text-right">
            <div className="text-xs font-bold text-muted uppercase mb-1">Bill To</div>
            <div className="font-bold">{invoice.customerName}</div>
            {invoice.customerGSTIN && <div className="text-xs font-mono text-muted">{invoice.customerGSTIN}</div>}
            {invoice.billingAddress && (
              <div className="text-xs text-muted mt-1">
                {[invoice.billingAddress.line1, invoice.billingAddress.city, invoice.billingAddress.state].filter(Boolean).join(", ")}
                {invoice.billingAddress.pincode ? " - " + invoice.billingAddress.pincode : ""}
              </div>
            )}
          </div>
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto -mx-2 px-2 mb-4">
          <table className="w-full text-xs min-w-[600px]">
            <thead>
              <tr className="border-b-2 border-border text-muted">
                <th className="text-left pb-2 font-bold">#</th>
                <th className="text-left pb-2 font-bold">Item / HSN</th>
                <th className="text-right pb-2 font-bold">Qty</th>
                <th className="text-right pb-2 font-bold">Rate</th>
                <th className="text-right pb-2 font-bold">Disc%</th>
                <th className="text-right pb-2 font-bold">Taxable</th>
                {invoice.isInterState ? <th className="text-right pb-2 font-bold">IGST</th> : <>
                  <th className="text-right pb-2 font-bold">CGST</th>
                  <th className="text-right pb-2 font-bold">SGST</th>
                </>}
                <th className="text-right pb-2 font-bold">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, i) => (
                <tr key={i} className={`border-b border-border/30 ${i % 2 === 1 ? "bg-surface/30" : ""}`}>
                  <td className="py-2 pr-2">{i + 1}</td>
                  <td className="py-2">
                    <div className="font-semibold">{item.name}</div>
                    {item.hsnCode && <div className="text-muted font-mono">HSN: {item.hsnCode}</div>}
                  </td>
                  <td className="py-2 text-right">{item.qty} {item.unit}</td>
                  <td className="py-2 text-right">{fmtCurrency(item.rate)}</td>
                  <td className="py-2 text-right">{item.discountPercent || 0}%</td>
                  <td className="py-2 text-right">{fmtCurrency(item.taxableAmt)}</td>
                  {invoice.isInterState ? (
                    <td className="py-2 text-right">{fmtCurrency(item.igstAmt)} ({item.gstRate}%)</td>
                  ) : (<>
                    <td className="py-2 text-right">{fmtCurrency(item.cgstAmt)}</td>
                    <td className="py-2 text-right">{fmtCurrency(item.sgstAmt)}</td>
                  </>)}
                  <td className="py-2 text-right font-semibold">{fmtCurrency(item.totalAmt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-60 space-y-1.5 text-xs">
            {[
              ["Subtotal:", fmtCurrency(invoice.subtotal)],
              invoice.totalDiscount > 0 ? ["Discount:", `- ${fmtCurrency(invoice.totalDiscount)}`] : null,
              ["Taxable Amt:", fmtCurrency(invoice.totalTaxableAmt)],
              !invoice.isInterState && invoice.totalCGST > 0 ? ["CGST:", fmtCurrency(invoice.totalCGST)] : null,
              !invoice.isInterState && invoice.totalSGST > 0 ? ["SGST:", fmtCurrency(invoice.totalSGST)] : null,
              invoice.isInterState && invoice.totalIGST > 0 ? ["IGST:", fmtCurrency(invoice.totalIGST)] : null,
              Math.abs(invoice.roundOff) > 0.001 ? ["Round Off:", fmtCurrency(invoice.roundOff)] : null,
            ].filter(Boolean).map((row, i) => (
              <div key={i} className="flex justify-between text-muted">
                <span>{row![0]}</span><span>{row![1]}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold text-sm border-t border-border pt-2">
              <span>Grand Total</span><span className="text-accent">{fmtCurrency(invoice.grandTotal)}</span>
            </div>
            {invoice.amountPaid > 0 && (
              <>
                <div className="flex justify-between text-green-600"><span>Paid:</span><span>{fmtCurrency(invoice.amountPaid)}</span></div>
                <div className={`flex justify-between font-bold ${invoice.balanceDue > 0 ? "text-red-600" : "text-green-600"}`}>
                  <span>Balance:</span><span>{fmtCurrency(invoice.balanceDue)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {invoice.amountInWords && (
          <div className="mt-4 text-xs text-muted border-t border-border/40 pt-3">
            <span className="font-semibold">Amount in words:</span> {invoice.amountInWords}
          </div>
        )}

        {invoice.notes && (
          <div className="mt-3 text-xs">
            <span className="font-semibold text-muted">Notes:</span> {invoice.notes}
          </div>
        )}
        {invoice.termsConditions && (
          <div className="mt-3 text-xs">
            <span className="font-semibold text-muted">Terms:</span> {invoice.termsConditions}
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-border/40 text-[10px] text-muted">
          Created by {invoice.createdBy?.name || "—"}
        </div>
      </div>

      {/* Payment Modal */}
      {payModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-panel rounded-2xl border border-border w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-lg font-bold mb-1">Record Payment</h2>
            <p className="text-xs text-muted mb-4">Invoice: {invoice.invoiceNo} · Balance Due: {fmtCurrency(invoice.balanceDue)}</p>
            {error && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg mb-4 border border-red-200">{error}</div>}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted mb-1 block">Amount (₹) *</label>
                <input type="number" min="0.01" step="0.01" value={payForm.amount}
                  onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted mb-1 block">Payment Mode *</label>
                <select value={payForm.paymentMode} onChange={e => setPayForm(f => ({ ...f, paymentMode: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60">
                  {["cash", "bank_transfer", "upi", "cheque", "card", "neft", "rtgs", "imps", "other"].map(m => (
                    <option key={m} value={m}>{m.replace("_", " ").toUpperCase()}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted mb-1 block">Reference / UTR / Cheque#</label>
                <input value={payForm.referenceNo} onChange={e => setPayForm(f => ({ ...f, referenceNo: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted mb-1 block">Notes</label>
                <textarea rows={2} value={payForm.notes} onChange={e => setPayForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60 resize-none" />
              </div>
            </div>
            <div className="flex gap-2 mt-4 justify-end">
              <button onClick={() => setPayModal(false)} disabled={saving}
                className="rounded-full border border-border px-4 py-2 text-xs font-semibold">Cancel</button>
              <button onClick={addPayment} disabled={saving}
                className="rounded-full bg-green-600 px-5 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50">
                {saving ? "Saving…" : "Record Payment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
