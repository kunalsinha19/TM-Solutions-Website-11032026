"use client";

import { useEffect, useState, useCallback } from "react";
import { invFetch, invPut } from "../../../lib/inv-api";

type BankDetail = { bankName: string; accountName: string; accountNo: string; ifsc: string; branch: string; upiId: string };

type Settings = {
  businessName: string; tagline: string;
  address: { line1: string; line2: string; city: string; state: string; stateCode: string; pincode: string; country: string };
  gstin: string; pan: string; cin: string; msmeNo: string;
  phone: string; email: string; website: string;
  logoUrl: string; signatureUrl: string; stampUrl: string;
  invoicePrefix: string; proformaPrefix: string; creditNotePrefix: string;
  debitNotePrefix: string; poPrefix: string; paymentPrefix: string; adjustmentPrefix: string;
  financialYearStart: string; defaultStateCode: string; enableRoundOff: boolean;
  defaultPaymentTerms: number; defaultNotes: string; defaultTermsConditions: string;
  bankDetails: BankDetail[];
};

const EMPTY_BANK: BankDetail = { bankName: "", accountName: "", accountNo: "", ifsc: "", branch: "", upiId: "" };

const INDIAN_STATES = [
  { code: "01", name: "Jammu & Kashmir" }, { code: "02", name: "Himachal Pradesh" },
  { code: "03", name: "Punjab" }, { code: "04", name: "Chandigarh" },
  { code: "05", name: "Uttarakhand" }, { code: "06", name: "Haryana" },
  { code: "07", name: "Delhi" }, { code: "08", name: "Rajasthan" },
  { code: "09", name: "Uttar Pradesh" }, { code: "10", name: "Bihar" },
  { code: "11", name: "Sikkim" }, { code: "12", name: "Arunachal Pradesh" },
  { code: "13", name: "Nagaland" }, { code: "14", name: "Manipur" },
  { code: "15", name: "Mizoram" }, { code: "16", name: "Tripura" },
  { code: "17", name: "Meghalaya" }, { code: "18", name: "Assam" },
  { code: "19", name: "West Bengal" }, { code: "20", name: "Jharkhand" },
  { code: "21", name: "Odisha" }, { code: "22", name: "Chhattisgarh" },
  { code: "23", name: "Madhya Pradesh" }, { code: "24", name: "Gujarat" },
  { code: "26", name: "Dadra & Nagar Haveli and Daman & Diu" }, { code: "27", name: "Maharashtra" },
  { code: "28", name: "Andhra Pradesh (Old)" }, { code: "29", name: "Karnataka" },
  { code: "30", name: "Goa" }, { code: "31", name: "Lakshadweep" },
  { code: "32", name: "Kerala" }, { code: "33", name: "Tamil Nadu" },
  { code: "34", name: "Puducherry" }, { code: "35", name: "Andaman & Nicobar Islands" },
  { code: "36", name: "Telangana" }, { code: "37", name: "Andhra Pradesh (New)" },
];

type TabKey = "business" | "numbering" | "bank" | "defaults";

export default function InvoiceSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("business");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await invFetch<{ settings: Settings }>("/settings");
      setSettings(res.settings);
    } catch { setError("Failed to load settings"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function set<K extends keyof Settings>(key: K, val: Settings[K]) {
    setSettings(s => s ? { ...s, [key]: val } : s);
  }

  function setAddr(key: keyof Settings["address"], val: string) {
    setSettings(s => s ? { ...s, address: { ...s.address, [key]: val } } : s);
  }

  function setBank(i: number, key: keyof BankDetail, val: string) {
    setSettings(s => {
      if (!s) return s;
      const banks = [...s.bankDetails];
      banks[i] = { ...banks[i], [key]: val };
      return { ...s, bankDetails: banks };
    });
  }

  function addBank() {
    setSettings(s => s ? { ...s, bankDetails: [...(s.bankDetails || []), { ...EMPTY_BANK }] } : s);
  }

  function removeBank(i: number) {
    setSettings(s => s ? { ...s, bankDetails: s.bankDetails.filter((_, j) => j !== i) } : s);
  }

  async function save() {
    if (!settings) return;
    setSaving(true); setError(""); setSuccess("");
    try {
      await invPut("/settings", settings);
      setSuccess("Settings saved successfully.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Save failed"); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-muted text-sm">Loading settings…</div>;
  if (!settings) return <div className="flex items-center justify-center h-64 text-red-600 text-sm">{error}</div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Invoice Settings</h1>
          <p className="text-xs text-muted mt-0.5">Configure your business details, GST, numbering, and defaults</p>
        </div>
        <button onClick={save} disabled={saving}
          className="rounded-full bg-accent px-5 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50">
          {saving ? "Saving…" : "Save Settings"}
        </button>
      </div>

      {error && <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 mb-4">{error}</div>}
      {success && <div className="rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 mb-4">{success}</div>}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-6 overflow-x-auto">
        {([
          { key: "business", label: "Business Info" },
          { key: "numbering", label: "Numbering" },
          { key: "bank", label: "Bank Details" },
          { key: "defaults", label: "Defaults" },
        ] as const).map(({ key, label }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors ${activeTab === key ? "border-accent text-accent" : "border-transparent text-muted hover:text-text"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Business Info */}
      {activeTab === "business" && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-border bg-panel p-5">
            <h3 className="text-sm font-bold mb-4">Company Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-muted uppercase mb-1 block">Business Name *</label>
                <input value={settings.businessName} onChange={e => set("businessName", e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60" />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-muted uppercase mb-1 block">Tagline / Description</label>
                <input value={settings.tagline} onChange={e => set("tagline", e.target.value)}
                  placeholder="e.g. Your trusted IT partner"
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted uppercase mb-1 block">Phone</label>
                <input value={settings.phone} onChange={e => set("phone", e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted uppercase mb-1 block">Email</label>
                <input type="email" value={settings.email} onChange={e => set("email", e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60" />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-muted uppercase mb-1 block">Website</label>
                <input value={settings.website} onChange={e => set("website", e.target.value)}
                  placeholder="https://www.example.com"
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-panel p-5">
            <h3 className="text-sm font-bold mb-4">Business Address</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-muted uppercase mb-1 block">Address Line 1</label>
                <input value={settings.address?.line1 ?? ""} onChange={e => setAddr("line1", e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60" />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-muted uppercase mb-1 block">Address Line 2</label>
                <input value={settings.address?.line2 ?? ""} onChange={e => setAddr("line2", e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted uppercase mb-1 block">City</label>
                <input value={settings.address?.city ?? ""} onChange={e => setAddr("city", e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted uppercase mb-1 block">Pincode</label>
                <input value={settings.address?.pincode ?? ""} onChange={e => setAddr("pincode", e.target.value)}
                  maxLength={6}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted uppercase mb-1 block">State</label>
                <select value={settings.address?.state ?? ""} onChange={e => {
                  const st = INDIAN_STATES.find(s => s.name === e.target.value);
                  setAddr("state", e.target.value);
                  if (st) { setAddr("stateCode", st.code); set("defaultStateCode", st.code); }
                }} className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60">
                  <option value="">Select state…</option>
                  {INDIAN_STATES.map(s => <option key={s.code} value={s.name}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted uppercase mb-1 block">State Code (for GST)</label>
                <input value={settings.address?.stateCode ?? ""} readOnly
                  className="w-full rounded-xl border border-border bg-surface/50 px-3 py-2 text-sm text-muted cursor-not-allowed" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-panel p-5">
            <h3 className="text-sm font-bold mb-4">Tax Registration</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-muted uppercase mb-1 block">GSTIN</label>
                <input value={settings.gstin} onChange={e => set("gstin", e.target.value.toUpperCase())}
                  maxLength={15} placeholder="29ABCDE1234F1Z5"
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent/60" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted uppercase mb-1 block">PAN</label>
                <input value={settings.pan} onChange={e => set("pan", e.target.value.toUpperCase())}
                  maxLength={10} placeholder="ABCDE1234F"
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent/60" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted uppercase mb-1 block">CIN (if applicable)</label>
                <input value={settings.cin} onChange={e => set("cin", e.target.value.toUpperCase())}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent/60" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted uppercase mb-1 block">MSME No.</label>
                <input value={settings.msmeNo} onChange={e => set("msmeNo", e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-panel p-5">
            <h3 className="text-sm font-bold mb-4">Branding URLs</h3>
            <p className="text-xs text-muted mb-3">Upload your logo, signature, and stamp images to cloud storage (e.g. Cloudinary, AWS S3) and paste the URLs below.</p>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-muted uppercase mb-1 block">Logo URL</label>
                <input value={settings.logoUrl} onChange={e => set("logoUrl", e.target.value)}
                  placeholder="https://cdn.example.com/logo.png"
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60" />
                {settings.logoUrl && (
                  <img src={settings.logoUrl} alt="Logo preview" className="mt-2 h-12 object-contain rounded border border-border" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                )}
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted uppercase mb-1 block">Signature URL</label>
                <input value={settings.signatureUrl} onChange={e => set("signatureUrl", e.target.value)}
                  placeholder="https://cdn.example.com/signature.png"
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted uppercase mb-1 block">Stamp URL</label>
                <input value={settings.stampUrl} onChange={e => set("stampUrl", e.target.value)}
                  placeholder="https://cdn.example.com/stamp.png"
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Numbering */}
      {activeTab === "numbering" && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-border bg-panel p-5">
            <h3 className="text-sm font-bold mb-1">Document Numbering</h3>
            <p className="text-xs text-muted mb-4">Prefixes are used to generate sequential document numbers. Format: <span className="font-mono bg-surface px-1 rounded">{"{PREFIX}-{FY}-{SEQUENCE}"}</span></p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { key: "invoicePrefix" as const, label: "Invoice Prefix", placeholder: "INV" },
                { key: "proformaPrefix" as const, label: "Proforma / Quotation Prefix", placeholder: "QTN" },
                { key: "creditNotePrefix" as const, label: "Credit Note Prefix", placeholder: "CN" },
                { key: "debitNotePrefix" as const, label: "Debit Note Prefix", placeholder: "DN" },
                { key: "poPrefix" as const, label: "Purchase Order Prefix", placeholder: "PO" },
                { key: "paymentPrefix" as const, label: "Payment Receipt Prefix", placeholder: "PAY" },
                { key: "adjustmentPrefix" as const, label: "Stock Adjustment Prefix", placeholder: "ADJ" },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="text-[10px] font-bold text-muted uppercase mb-1 block">{label}</label>
                  <input value={(settings as Record<string, unknown>)[key] as string || ""} onChange={e => set(key, e.target.value.toUpperCase())}
                    placeholder={placeholder} maxLength={8}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent/60" />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-panel p-5">
            <h3 className="text-sm font-bold mb-4">Financial Year</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-muted uppercase mb-1 block">Financial Year Start</label>
                <select value={settings.financialYearStart || "04-01"}
                  onChange={e => set("financialYearStart", e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60">
                  <option value="04-01">April 1 (Indian FY: Apr–Mar)</option>
                  <option value="01-01">January 1 (Calendar Year)</option>
                  <option value="07-01">July 1</option>
                </select>
              </div>
              <div className="flex items-center gap-3 pt-5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={settings.enableRoundOff ?? true}
                    onChange={e => set("enableRoundOff", e.target.checked)}
                    className="rounded" />
                  <span className="text-sm">Enable round-off on invoices</span>
                </label>
              </div>
            </div>
            <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-700">
              <strong>Note:</strong> Changing prefixes affects only new documents. Existing document numbers remain unchanged. To reset sequence counters, contact your administrator.
            </div>
          </div>
        </div>
      )}

      {/* Bank Details */}
      {activeTab === "bank" && (
        <div className="space-y-4">
          {(settings.bankDetails || []).map((bank, i) => (
            <div key={i} className="rounded-2xl border border-border bg-panel p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold">Bank Account {i + 1}</h3>
                {settings.bankDetails.length > 1 && (
                  <button onClick={() => removeBank(i)} className="text-red-500 text-xs hover:underline">Remove</button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-muted uppercase mb-1 block">Bank Name</label>
                  <input value={bank.bankName} onChange={e => setBank(i, "bankName", e.target.value)}
                    placeholder="HDFC Bank"
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted uppercase mb-1 block">Account Name</label>
                  <input value={bank.accountName} onChange={e => setBank(i, "accountName", e.target.value)}
                    placeholder="TM Solutions Pvt Ltd"
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted uppercase mb-1 block">Account Number</label>
                  <input value={bank.accountNo} onChange={e => setBank(i, "accountNo", e.target.value)}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent/60" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted uppercase mb-1 block">IFSC Code</label>
                  <input value={bank.ifsc} onChange={e => setBank(i, "ifsc", e.target.value.toUpperCase())}
                    maxLength={11} placeholder="HDFC0001234"
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent/60" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted uppercase mb-1 block">Branch</label>
                  <input value={bank.branch} onChange={e => setBank(i, "branch", e.target.value)}
                    placeholder="MG Road, Bangalore"
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted uppercase mb-1 block">UPI ID (optional)</label>
                  <input value={bank.upiId} onChange={e => setBank(i, "upiId", e.target.value)}
                    placeholder="business@upi"
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60" />
                </div>
              </div>
            </div>
          ))}

          {(settings.bankDetails || []).length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-panel p-8 text-center">
              <div className="text-muted text-sm mb-3">No bank accounts configured</div>
              <button onClick={addBank}
                className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white hover:opacity-90">
                + Add Bank Account
              </button>
            </div>
          )}

          {(settings.bankDetails || []).length > 0 && (
            <button onClick={addBank}
              className="text-xs text-accent hover:underline">
              + Add Another Bank Account
            </button>
          )}
        </div>
      )}

      {/* Defaults */}
      {activeTab === "defaults" && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-border bg-panel p-5">
            <h3 className="text-sm font-bold mb-4">Default Invoice Settings</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-muted uppercase mb-1 block">Default Payment Terms (days)</label>
                <input type="number" min="0" max="365" value={settings.defaultPaymentTerms ?? 30}
                  onChange={e => set("defaultPaymentTerms", Number(e.target.value))}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60" />
                <p className="text-[10px] text-muted mt-1">Set to 0 for immediate payment. Due date is auto-calculated from invoice date.</p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted uppercase mb-1 block">Default Supply State</label>
                <select value={settings.defaultStateCode ?? "29"}
                  onChange={e => set("defaultStateCode", e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60">
                  {INDIAN_STATES.map(s => <option key={s.code} value={s.code}>{s.code} — {s.name}</option>)}
                </select>
                <p className="text-[10px] text-muted mt-1">Used to determine IGST (inter-state) vs CGST+SGST (intra-state).</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-panel p-5">
            <h3 className="text-sm font-bold mb-4">Default Notes & Terms</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-muted uppercase mb-1 block">Default Invoice Notes</label>
                <textarea rows={3} value={settings.defaultNotes ?? ""} onChange={e => set("defaultNotes", e.target.value)}
                  placeholder="Thank you for your business! Please contact us for any queries."
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60 resize-none" />
                <p className="text-[10px] text-muted mt-1">Pre-filled in the Notes field when creating new invoices.</p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted uppercase mb-1 block">Default Terms & Conditions</label>
                <textarea rows={5} value={settings.defaultTermsConditions ?? ""} onChange={e => set("defaultTermsConditions", e.target.value)}
                  placeholder={`1. Payment is due within {payment_terms} days of invoice date.\n2. Cheques are subject to realisation.\n3. Goods once sold will not be taken back.\n4. Subject to local jurisdiction.`}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60 resize-none" />
                <p className="text-[10px] text-muted mt-1">Pre-filled in T&C when creating new invoices. Use <span className="font-mono bg-surface px-1 rounded">{"{payment_terms}"}</span> to insert the payment terms dynamically.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button onClick={save} disabled={saving}
          className="rounded-full bg-accent px-6 py-2.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50">
          {saving ? "Saving…" : "Save All Settings"}
        </button>
      </div>
    </div>
  );
}
