"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { invFetch, invPost, fmtCurrency } from "../../../../lib/inv-api";

type Customer = { _id: string; name: string; company: string; gstin: string; billingAddress: { city: string; state: string; stateCode: string } };
type InvProduct = { _id: string; name: string; sku: string; unit: string; sellingPrice: number; gstRate: number; hsnCode: string; isService: boolean };
type Settings = { defaultNotes: string; defaultTerms: string; defaultStateCode: string; enableRoundOff: boolean };

type LineItem = {
  product: string; name: string; description: string; hsnCode: string; unit: string;
  qty: number; rate: number; discountPercent: number; gstRate: number; cessRate: number;
  isTaxable: boolean;
};

const EMPTY_LINE: LineItem = {
  product: "", name: "", description: "", hsnCode: "", unit: "Pcs",
  qty: 1, rate: 0, discountPercent: 0, gstRate: 18, cessRate: 0, isTaxable: true,
};

function calcLine(line: LineItem, isInterState: boolean) {
  const gross = line.rate * line.qty;
  const discAmt = (gross * (line.discountPercent || 0)) / 100;
  const taxable = gross - discAmt;
  const gstRate = line.isTaxable ? (line.gstRate || 0) : 0;
  const cgstRate = isInterState ? 0 : gstRate / 2;
  const sgstRate = isInterState ? 0 : gstRate / 2;
  const igstRate = isInterState ? gstRate : 0;
  const cgstAmt = (taxable * cgstRate) / 100;
  const sgstAmt = (taxable * sgstRate) / 100;
  const igstAmt = (taxable * igstRate) / 100;
  const totalTax = cgstAmt + sgstAmt + igstAmt;
  return { gross, discAmt, taxable, cgstRate, sgstRate, igstRate, cgstAmt, sgstAmt, igstAmt, totalTax, total: taxable + totalTax };
}

export default function NewInvoicePage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<InvProduct[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [invoiceType, setInvoiceType] = useState("invoice");
  const [customerId, setCustomerId] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [lines, setLines] = useState<LineItem[]>([{ ...EMPTY_LINE }]);
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [status, setStatus] = useState("draft");
  const [isInterState, setIsInterState] = useState(false);

  const selectedCustomer = customers.find(c => c._id === customerId);

  useEffect(() => {
    if (selectedCustomer && settings) {
      const supplyCode = settings.defaultStateCode || "";
      const custCode = selectedCustomer.billingAddress?.stateCode || "";
      setIsInterState(!!supplyCode && !!custCode && supplyCode !== custCode);
    }
  }, [customerId, customers, settings, selectedCustomer]);

  const load = useCallback(async () => {
    try {
      const [custRes, prodRes, setRes] = await Promise.all([
        invFetch<{ customers: Customer[] }>("/customers?limit=500&active=true"),
        invFetch<{ products: InvProduct[] }>("/products?limit=500&active=true"),
        invFetch<{ settings: Settings }>("/settings"),
      ]);
      setCustomers(custRes.customers);
      setProducts(prodRes.products);
      setSettings(setRes.settings);
      setNotes(setRes.settings.defaultNotes || "");
      setTerms(setRes.settings.defaultTerms || "");
    } catch { setError("Failed to load"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function addLine() { setLines(l => [...l, { ...EMPTY_LINE }]); }
  function removeLine(i: number) { setLines(l => l.filter((_, j) => j !== i)); }

  function updateLine(i: number, field: keyof LineItem, val: unknown) {
    setLines(lines => lines.map((line, j) => {
      if (j !== i) return line;
      const updated = { ...line, [field]: val };
      if (field === "product") {
        const prod = products.find(p => p._id === String(val));
        if (prod) {
          return { ...updated, name: prod.name, unit: prod.unit, rate: prod.sellingPrice, gstRate: prod.gstRate, hsnCode: prod.hsnCode || "", isTaxable: !prod.isService };
        }
      }
      return updated;
    }));
  }

  // Totals
  const calcs = lines.map(l => calcLine(l, isInterState));
  const subtotal = calcs.reduce((s, c) => s + c.gross, 0);
  const totalDiscount = calcs.reduce((s, c) => s + c.discAmt, 0);
  const totalTaxable = calcs.reduce((s, c) => s + c.taxable, 0);
  const totalCGST = calcs.reduce((s, c) => s + c.cgstAmt, 0);
  const totalSGST = calcs.reduce((s, c) => s + c.sgstAmt, 0);
  const totalIGST = calcs.reduce((s, c) => s + c.igstAmt, 0);
  const totalTax = totalCGST + totalSGST + totalIGST;
  const preTax = totalTaxable + totalTax;
  const roundOff = settings?.enableRoundOff !== false ? Math.round(preTax) - preTax : 0;
  const grandTotal = preTax + roundOff;

  async function submit() {
    if (!customerId) { setError("Select a customer"); return; }
    if (lines.length === 0 || !lines[0].name) { setError("Add at least one item"); return; }
    setSaving(true); setError("");
    try {
      const payload = {
        invoiceType, customer: customerId, invoiceDate, dueDate: dueDate || null,
        poNumber, status, notes, termsConditions: terms,
        items: lines.map((line, i) => ({ ...line, ...calcs[i] })),
      };
      const res = await invPost<{ invoice: { _id: string } }>("/invoices", payload);
      router.push(`/invoice/invoices/${res.invoice._id}`);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Save failed"); setSaving(false); }
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-sm text-muted">Loading…</div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-extrabold">New Invoice</h1>
        <div className="flex gap-2">
          <button onClick={() => router.back()} className="rounded-full border border-border px-4 py-2 text-xs font-semibold">Cancel</button>
          <button onClick={() => { setStatus("draft"); submit(); }} disabled={saving}
            className="rounded-full border border-accent px-4 py-2 text-xs font-semibold text-accent disabled:opacity-50">
            Save Draft
          </button>
          <button onClick={() => { setStatus("sent"); submit(); }} disabled={saving}
            className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50">
            {saving ? "Saving…" : "Save & Send"}
          </button>
        </div>
      </div>

      {error && <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 mb-5">{error}</div>}

      {/* Invoice Header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="text-xs font-semibold text-muted mb-1 block">Invoice Type</label>
          <select value={invoiceType} onChange={e => setInvoiceType(e.target.value)}
            className="w-full rounded-xl border border-border bg-panel px-3 py-2 text-sm focus:outline-none focus:border-accent/60">
            <option value="invoice">Tax Invoice</option>
            <option value="proforma">Proforma Invoice</option>
            <option value="quotation">Quotation</option>
            <option value="credit_note">Credit Note</option>
            <option value="debit_note">Debit Note</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted mb-1 block">Invoice Date</label>
          <input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)}
            className="w-full rounded-xl border border-border bg-panel px-3 py-2 text-sm focus:outline-none focus:border-accent/60" />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted mb-1 block">Due Date</label>
          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
            className="w-full rounded-xl border border-border bg-panel px-3 py-2 text-sm focus:outline-none focus:border-accent/60" />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted mb-1 block">PO Number</label>
          <input value={poNumber} onChange={e => setPoNumber(e.target.value)} placeholder="Customer PO#"
            className="w-full rounded-xl border border-border bg-panel px-3 py-2 text-sm focus:outline-none focus:border-accent/60" />
        </div>
      </div>

      {/* Customer */}
      <div className="rounded-2xl border border-border bg-panel p-4 mb-5">
        <h2 className="text-sm font-bold mb-3">Bill To</h2>
        <select value={customerId} onChange={e => setCustomerId(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60 mb-2">
          <option value="">Select customer…</option>
          {customers.map(c => (
            <option key={c._id} value={c._id}>{c.name}{c.company ? ` — ${c.company}` : ""}</option>
          ))}
        </select>
        {selectedCustomer && (
          <div className="text-xs text-muted mt-2 space-y-0.5">
            {selectedCustomer.gstin && <div>GSTIN: <span className="font-mono">{selectedCustomer.gstin}</span></div>}
            <div>{[selectedCustomer.billingAddress?.city, selectedCustomer.billingAddress?.state].filter(Boolean).join(", ")}</div>
            <div className="flex items-center gap-2 mt-1">
              <input type="checkbox" id="interState" checked={isInterState} onChange={e => setIsInterState(e.target.checked)} className="w-4 h-4 accent-blue-600" />
              <label htmlFor="interState" className="text-xs">Inter-state supply (applies IGST instead of CGST+SGST)</label>
            </div>
          </div>
        )}
      </div>

      {/* Line Items */}
      <div className="rounded-2xl border border-border bg-panel p-4 mb-5">
        <h2 className="text-sm font-bold mb-3">Items</h2>
        <div className="space-y-3">
          {lines.map((line, i) => {
            const c = calcs[i];
            return (
              <div key={i} className="rounded-xl border border-border/50 bg-surface/50 p-3">
                <div className="grid grid-cols-12 gap-2 mb-2">
                  {/* Product picker */}
                  <div className="col-span-12 sm:col-span-5">
                    <select value={line.product} onChange={e => updateLine(i, "product", e.target.value)}
                      className="w-full rounded-lg border border-border bg-panel px-2 py-1.5 text-xs focus:outline-none focus:border-accent/60 mb-1">
                      <option value="">Select product…</option>
                      {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                    </select>
                    <input placeholder="Item name / description" value={line.name} onChange={e => updateLine(i, "name", e.target.value)}
                      className="w-full rounded-lg border border-border bg-panel px-2 py-1.5 text-xs focus:outline-none focus:border-accent/60" />
                  </div>

                  {/* HSN */}
                  <div className="col-span-4 sm:col-span-2">
                    <label className="text-[10px] text-muted block mb-0.5">HSN</label>
                    <input value={line.hsnCode} onChange={e => updateLine(i, "hsnCode", e.target.value)} placeholder="HSN"
                      className="w-full rounded-lg border border-border bg-panel px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-accent/60" />
                  </div>

                  {/* Qty */}
                  <div className="col-span-4 sm:col-span-1">
                    <label className="text-[10px] text-muted block mb-0.5">Qty</label>
                    <input type="number" min="0" step="0.01" value={line.qty} onChange={e => updateLine(i, "qty", Number(e.target.value))}
                      className="w-full rounded-lg border border-border bg-panel px-2 py-1.5 text-xs focus:outline-none focus:border-accent/60" />
                  </div>

                  {/* Rate */}
                  <div className="col-span-4 sm:col-span-2">
                    <label className="text-[10px] text-muted block mb-0.5">Rate (excl. GST)</label>
                    <input type="number" min="0" step="0.01" value={line.rate} onChange={e => updateLine(i, "rate", Number(e.target.value))}
                      className="w-full rounded-lg border border-border bg-panel px-2 py-1.5 text-xs focus:outline-none focus:border-accent/60" />
                  </div>

                  {/* GST */}
                  <div className="col-span-6 sm:col-span-1">
                    <label className="text-[10px] text-muted block mb-0.5">GST%</label>
                    <select value={line.gstRate} onChange={e => updateLine(i, "gstRate", Number(e.target.value))}
                      className="w-full rounded-lg border border-border bg-panel px-2 py-1.5 text-xs focus:outline-none focus:border-accent/60">
                      {[0, 5, 12, 18, 28].map(r => <option key={r} value={r}>{r}%</option>)}
                    </select>
                  </div>

                  {/* Disc% */}
                  <div className="col-span-6 sm:col-span-1">
                    <label className="text-[10px] text-muted block mb-0.5">Disc%</label>
                    <input type="number" min="0" max="100" step="0.01" value={line.discountPercent} onChange={e => updateLine(i, "discountPercent", Number(e.target.value))}
                      className="w-full rounded-lg border border-border bg-panel px-2 py-1.5 text-xs focus:outline-none focus:border-accent/60" />
                  </div>
                </div>

                {/* Line total */}
                <div className="flex items-center justify-between text-xs mt-1">
                  <div className="text-muted">
                    Taxable: {fmtCurrency(c.taxable)}
                    {isInterState ? ` · IGST(${line.gstRate}%): ${fmtCurrency(c.igstAmt)}` : ` · CGST: ${fmtCurrency(c.cgstAmt)} · SGST: ${fmtCurrency(c.sgstAmt)}`}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{fmtCurrency(c.total)}</span>
                    {lines.length > 1 && (
                      <button onClick={() => removeLine(i)} className="text-red-500 hover:text-red-700 text-sm">✕</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <button onClick={addLine} className="mt-3 text-xs text-accent hover:underline">+ Add Line Item</button>
      </div>

      {/* Totals + Notes */}
      <div className="grid sm:grid-cols-2 gap-5 mb-6">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-muted mb-1 block">Notes</label>
            <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)}
              className="w-full rounded-xl border border-border bg-panel px-3 py-2 text-sm focus:outline-none focus:border-accent/60 resize-none" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted mb-1 block">Terms & Conditions</label>
            <textarea rows={3} value={terms} onChange={e => setTerms(e.target.value)}
              className="w-full rounded-xl border border-border bg-panel px-3 py-2 text-sm focus:outline-none focus:border-accent/60 resize-none" />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-panel p-4 space-y-2 self-start">
          {[
            ["Subtotal:", fmtCurrency(subtotal)],
            totalDiscount > 0 ? ["Discount:", `- ${fmtCurrency(totalDiscount)}`] : null,
            ["Taxable Amount:", fmtCurrency(totalTaxable)],
            isInterState ? null : totalCGST > 0 ? ["CGST:", fmtCurrency(totalCGST)] : null,
            isInterState ? null : totalSGST > 0 ? ["SGST:", fmtCurrency(totalSGST)] : null,
            isInterState ? totalIGST > 0 ? ["IGST:", fmtCurrency(totalIGST)] : null : null,
            Math.abs(roundOff) > 0.001 ? ["Round Off:", (roundOff >= 0 ? "+ " : "") + fmtCurrency(roundOff)] : null,
          ].filter(Boolean).map((row, i) => (
            <div key={i} className="flex justify-between text-xs text-muted">
              <span>{row![0]}</span><span>{row![1]}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm font-bold border-t border-border/60 pt-2 mt-2">
            <span>Grand Total</span><span className="text-accent">{fmtCurrency(grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex justify-end gap-2">
        <button onClick={() => router.back()} className="rounded-full border border-border px-4 py-2 text-xs font-semibold">Cancel</button>
        <button onClick={() => { setStatus("draft"); submit(); }} disabled={saving}
          className="rounded-full border border-accent px-4 py-2 text-xs font-semibold text-accent disabled:opacity-50">
          Save Draft
        </button>
        <button onClick={() => { setStatus("sent"); submit(); }} disabled={saving}
          className="rounded-full bg-accent px-5 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50">
          {saving ? "Saving…" : "Save & Send"}
        </button>
      </div>
    </div>
  );
}
