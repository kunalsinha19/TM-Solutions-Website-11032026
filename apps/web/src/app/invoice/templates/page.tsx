"use client";

import { useEffect, useState, useCallback } from "react";
import { invFetch, invPost, invPut, invDelete } from "../../../lib/inv-api";

type ColorScheme = {
  primary: string; secondary: string; accent: string; text: string;
  headerBg: string; headerText: string; tableBg: string; borderColor: string;
};

type Layout = {
  showLogo: boolean; showSignature: boolean; showWatermark: boolean;
  showQRCode: boolean; showBankDetails: boolean; showNotes: boolean;
  showTerms: boolean; showHSN: boolean; showDiscount: boolean;
  showTaxBreakup: boolean; showAmountWords: boolean; logoPosition: string;
  columns: string[];
};

type Template = {
  _id: string; name: string; description: string; paperSize: string;
  isDefault: boolean; colorScheme: ColorScheme; layout: Layout;
  font: string; fontSize: number;
};

const DEFAULT_COLOR: ColorScheme = {
  primary: "#1e40af", secondary: "#93c5fd", accent: "#3b82f6",
  text: "#111827", headerBg: "#1e40af", headerText: "#ffffff",
  tableBg: "#eff6ff", borderColor: "#bfdbfe",
};

const DEFAULT_LAYOUT: Layout = {
  showLogo: true, showSignature: true, showWatermark: false,
  showQRCode: false, showBankDetails: true, showNotes: true,
  showTerms: true, showHSN: true, showDiscount: true,
  showTaxBreakup: true, showAmountWords: true, logoPosition: "left",
  columns: ["item", "hsn", "qty", "rate", "discount", "taxable", "gst", "total"],
};

const PRESETS = [
  { name: "Professional Blue", colors: { primary: "#1e40af", secondary: "#93c5fd", accent: "#3b82f6", text: "#111827", headerBg: "#1e40af", headerText: "#ffffff", tableBg: "#eff6ff", borderColor: "#bfdbfe" } },
  { name: "Corporate Black", colors: { primary: "#111827", secondary: "#6b7280", accent: "#374151", text: "#111827", headerBg: "#111827", headerText: "#ffffff", tableBg: "#f9fafb", borderColor: "#d1d5db" } },
  { name: "Green Finance", colors: { primary: "#065f46", secondary: "#6ee7b7", accent: "#059669", text: "#064e3b", headerBg: "#065f46", headerText: "#ffffff", tableBg: "#ecfdf5", borderColor: "#a7f3d0" } },
  { name: "Warm Orange", colors: { primary: "#92400e", secondary: "#fcd34d", accent: "#d97706", text: "#1c1917", headerBg: "#92400e", headerText: "#ffffff", tableBg: "#fffbeb", borderColor: "#fde68a" } },
  { name: "Purple Modern", colors: { primary: "#4c1d95", secondary: "#c4b5fd", accent: "#7c3aed", text: "#1e1b4b", headerBg: "#4c1d95", headerText: "#ffffff", tableBg: "#f5f3ff", borderColor: "#ddd6fe" } },
  { name: "Classic Red", colors: { primary: "#991b1b", secondary: "#fca5a5", accent: "#dc2626", text: "#1c1917", headerBg: "#991b1b", headerText: "#ffffff", tableBg: "#fef2f2", borderColor: "#fecaca" } },
];

const FONTS = ["Helvetica", "Times-Roman", "Courier"];
const PAPER_SIZES = [
  { value: "A4", label: "A4 (210 × 297 mm)" },
  { value: "A5", label: "A5 (148 × 210 mm)" },
  { value: "thermal80", label: "Thermal 80mm" },
  { value: "thermal58", label: "Thermal 58mm" },
];

const LAYOUT_TOGGLES: { key: keyof Layout; label: string }[] = [
  { key: "showLogo", label: "Company Logo" },
  { key: "showBankDetails", label: "Bank Details" },
  { key: "showSignature", label: "Signature Line" },
  { key: "showTaxBreakup", label: "Tax Breakdown" },
  { key: "showAmountWords", label: "Amount in Words" },
  { key: "showHSN", label: "HSN Codes" },
  { key: "showDiscount", label: "Discount Column" },
  { key: "showNotes", label: "Notes Section" },
  { key: "showTerms", label: "Terms & Conditions" },
  { key: "showWatermark", label: "Watermark" },
  { key: "showQRCode", label: "QR Code" },
];

function InvoicePreview({ scheme, layout, font, paperSize, name }: { scheme: ColorScheme; layout: Layout; font: string; paperSize: string; name: string }) {
  const isThermal = paperSize.startsWith("thermal");
  const scale = isThermal ? 1.2 : 0.55;
  const w = paperSize === "thermal58" ? 163 : paperSize === "thermal80" ? 227 : paperSize === "A5" ? 420 : 595;
  const h = paperSize.startsWith("thermal") ? 600 : paperSize === "A5" ? 595 : 842;

  return (
    <div className="overflow-auto rounded-xl border border-border bg-white p-2 flex items-start justify-center" style={{ minHeight: 360 }}>
      <div style={{ transform: `scale(${scale})`, transformOrigin: "top center", width: w, minHeight: Math.min(h, 600), fontFamily: font, fontSize: 10, color: scheme.text, border: `1px solid ${scheme.borderColor}` }}>
        {/* Header */}
        <div style={{ background: scheme.headerBg, color: scheme.headerText, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            {layout.showLogo && layout.logoPosition === "left" && (
              <div style={{ width: 40, height: 40, background: "rgba(255,255,255,0.3)", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 6, fontSize: 8 }}>LOGO</div>
            )}
            <div style={{ fontWeight: 700, fontSize: 14 }}>TM Solutions</div>
            <div style={{ fontSize: 8, opacity: 0.8 }}>GSTIN: 29ABCDE1234F1Z5</div>
            <div style={{ fontSize: 8, opacity: 0.8 }}>contact@tmsolutions.in · +91 98765 43210</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>TAX INVOICE</div>
            <div style={{ fontSize: 9 }}>INV-2026-0001</div>
            <div style={{ fontSize: 8, opacity: 0.8 }}>Date: 04 Aug 2026</div>
            <div style={{ fontSize: 8, opacity: 0.8 }}>Due: 03 Sep 2026</div>
          </div>
        </div>

        {/* Bill To */}
        <div style={{ display: "flex", borderBottom: `1px solid ${scheme.borderColor}`, fontSize: 9 }}>
          <div style={{ flex: 1, padding: "8px 12px", borderRight: `1px solid ${scheme.borderColor}` }}>
            <div style={{ fontWeight: 700, fontSize: 8, color: scheme.primary, marginBottom: 3, textTransform: "uppercase" }}>Bill To</div>
            <div style={{ fontWeight: 600 }}>Sample Customer Pvt Ltd</div>
            <div style={{ color: "#6b7280" }}>123, MG Road, Bangalore</div>
            <div style={{ color: "#6b7280" }}>Karnataka - 560001</div>
            <div style={{ color: "#6b7280", fontFamily: "monospace" }}>GSTIN: 29ZZZZZ9999Z1Z1</div>
          </div>
          <div style={{ flex: 1, padding: "8px 12px" }}>
            <div style={{ fontWeight: 700, fontSize: 8, color: scheme.primary, marginBottom: 3, textTransform: "uppercase" }}>Ship To</div>
            <div style={{ color: "#6b7280" }}>Same as billing address</div>
          </div>
        </div>

        {/* Items Table */}
        <div style={{ padding: "0 0 6px 0" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 8 }}>
            <thead>
              <tr style={{ background: scheme.tableBg }}>
                <th style={{ padding: "5px 8px", textAlign: "left", borderBottom: `1px solid ${scheme.borderColor}` }}>#</th>
                <th style={{ padding: "5px 8px", textAlign: "left", borderBottom: `1px solid ${scheme.borderColor}` }}>Item Description{layout.showHSN ? " / HSN" : ""}</th>
                <th style={{ padding: "5px 8px", textAlign: "right", borderBottom: `1px solid ${scheme.borderColor}` }}>Qty</th>
                <th style={{ padding: "5px 8px", textAlign: "right", borderBottom: `1px solid ${scheme.borderColor}` }}>Rate</th>
                {layout.showDiscount && <th style={{ padding: "5px 8px", textAlign: "right", borderBottom: `1px solid ${scheme.borderColor}` }}>Disc%</th>}
                {layout.showTaxBreakup && <th style={{ padding: "5px 8px", textAlign: "right", borderBottom: `1px solid ${scheme.borderColor}` }}>CGST</th>}
                {layout.showTaxBreakup && <th style={{ padding: "5px 8px", textAlign: "right", borderBottom: `1px solid ${scheme.borderColor}` }}>SGST</th>}
                <th style={{ padding: "5px 8px", textAlign: "right", borderBottom: `1px solid ${scheme.borderColor}` }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: "Web Design Services", hsn: "998314", qty: 2, rate: 15000, disc: 5, cgst: 1350, sgst: 1350, total: 28350 },
                { name: "Hosting Annual Plan", hsn: "998316", qty: 1, rate: 8000, disc: 0, cgst: 720, sgst: 720, total: 9440 },
              ].map((item, i) => (
                <tr key={i} style={{ background: i % 2 === 1 ? scheme.tableBg : "white" }}>
                  <td style={{ padding: "4px 8px", borderBottom: `1px solid ${scheme.borderColor}` }}>{i + 1}</td>
                  <td style={{ padding: "4px 8px", borderBottom: `1px solid ${scheme.borderColor}` }}>
                    <div style={{ fontWeight: 500 }}>{item.name}</div>
                    {layout.showHSN && <div style={{ color: "#9ca3af", fontFamily: "monospace" }}>HSN: {item.hsn}</div>}
                  </td>
                  <td style={{ padding: "4px 8px", textAlign: "right", borderBottom: `1px solid ${scheme.borderColor}` }}>{item.qty}</td>
                  <td style={{ padding: "4px 8px", textAlign: "right", borderBottom: `1px solid ${scheme.borderColor}` }}>₹{item.rate.toLocaleString("en-IN")}</td>
                  {layout.showDiscount && <td style={{ padding: "4px 8px", textAlign: "right", borderBottom: `1px solid ${scheme.borderColor}` }}>{item.disc}%</td>}
                  {layout.showTaxBreakup && <td style={{ padding: "4px 8px", textAlign: "right", borderBottom: `1px solid ${scheme.borderColor}` }}>₹{item.cgst}</td>}
                  {layout.showTaxBreakup && <td style={{ padding: "4px 8px", textAlign: "right", borderBottom: `1px solid ${scheme.borderColor}` }}>₹{item.sgst}</td>}
                  <td style={{ padding: "4px 8px", textAlign: "right", fontWeight: 600, borderBottom: `1px solid ${scheme.borderColor}` }}>₹{item.total.toLocaleString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "6px 12px 8px" }}>
          <div style={{ width: 160, fontSize: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", color: "#6b7280" }}><span>Subtotal</span><span>₹37,790</span></div>
            {layout.showDiscount && <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", color: "#6b7280" }}><span>Discount</span><span>-₹1,500</span></div>}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", color: "#6b7280" }}><span>Taxable</span><span>₹36,290</span></div>
            {layout.showTaxBreakup && <>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", color: "#6b7280" }}><span>CGST</span><span>₹2,070</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", color: "#6b7280" }}><span>SGST</span><span>₹2,070</span></div>
            </>}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderTop: `1.5px solid ${scheme.borderColor}`, marginTop: 2, fontWeight: 700, fontSize: 10, color: scheme.primary }}><span>Grand Total</span><span>₹40,430</span></div>
          </div>
        </div>

        {/* Amount in Words */}
        {layout.showAmountWords && (
          <div style={{ padding: "4px 12px", borderTop: `1px dashed ${scheme.borderColor}`, fontSize: 8, color: "#6b7280" }}>
            <strong>Amount in Words:</strong> INR Forty Thousand Four Hundred Thirty Rupees Only
          </div>
        )}

        {/* Bank Details */}
        {layout.showBankDetails && (
          <div style={{ padding: "6px 12px", borderTop: `1px dashed ${scheme.borderColor}`, fontSize: 8 }}>
            <div style={{ fontWeight: 700, color: scheme.primary, marginBottom: 2 }}>Bank Details</div>
            <div style={{ color: "#6b7280" }}>Bank: HDFC Bank · A/C: 50100123456789 · IFSC: HDFC0001234</div>
          </div>
        )}

        {/* Notes & Terms */}
        {(layout.showNotes || layout.showTerms) && (
          <div style={{ padding: "6px 12px", borderTop: `1px dashed ${scheme.borderColor}`, fontSize: 7.5, color: "#6b7280" }}>
            {layout.showNotes && <div><strong>Notes:</strong> Thank you for your business!</div>}
            {layout.showTerms && <div><strong>Terms:</strong> Payment due within 30 days. Late fees may apply.</div>}
          </div>
        )}

        {/* Signature */}
        {layout.showSignature && (
          <div style={{ padding: "8px 12px 12px", borderTop: `1px dashed ${scheme.borderColor}`, textAlign: "right", fontSize: 8 }}>
            <div style={{ display: "inline-block", borderTop: `1px solid ${scheme.borderColor}`, paddingTop: 4, minWidth: 100, color: "#6b7280" }}>
              Authorised Signatory
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Partial<Template> | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"colors" | "layout" | "typography">("colors");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await invFetch<{ templates: Template[] }>("/templates");
      setTemplates(res.templates);
    } catch { setError("Failed to load templates"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function newTemplate() {
    setEditing({
      name: "My Template", description: "", paperSize: "A4",
      colorScheme: { ...DEFAULT_COLOR },
      layout: { ...DEFAULT_LAYOUT },
      font: "Helvetica", fontSize: 10,
    });
    setActiveTab("colors");
    setError("");
  }

  function editTemplate(t: Template) {
    setEditing({ ...t, colorScheme: { ...t.colorScheme }, layout: { ...t.layout } });
    setActiveTab("colors");
    setError("");
  }

  function applyPreset(preset: typeof PRESETS[0]) {
    if (!editing) return;
    setEditing(e => ({ ...e!, colorScheme: { ...preset.colors } }));
  }

  function updateColor(key: keyof ColorScheme, val: string) {
    setEditing(e => ({ ...e!, colorScheme: { ...e!.colorScheme!, [key]: val } }));
  }

  function toggleLayout(key: keyof Layout) {
    setEditing(e => ({ ...e!, layout: { ...e!.layout!, [key]: !e!.layout![key] } }));
  }

  async function save() {
    if (!editing || !editing.name) { setError("Template name is required"); return; }
    setSaving(true); setError("");
    try {
      if ((editing as Template)._id) {
        await invPut(`/templates/${(editing as Template)._id}`, editing);
      } else {
        await invPost("/templates", editing);
      }
      setEditing(null); load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Save failed"); }
    finally { setSaving(false); }
  }

  async function setDefault(id: string) {
    try {
      await invPost(`/templates/${id}/set-default`, {});
      load();
    } catch (e: unknown) { alert(e instanceof Error ? e.message : "Failed"); }
  }

  async function deleteTemplate(id: string, name: string) {
    if (!confirm(`Delete template "${name}"?`)) return;
    try {
      await invDelete(`/templates/${id}`);
      load();
    } catch (e: unknown) { alert(e instanceof Error ? e.message : "Failed"); }
  }

  const cs = editing?.colorScheme ?? DEFAULT_COLOR;
  const ly = editing?.layout ?? DEFAULT_LAYOUT;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Invoice Templates</h1>
          <p className="text-xs text-muted mt-0.5">Design and manage your invoice layouts</p>
        </div>
        <button onClick={newTemplate}
          className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white hover:opacity-90">
          + New Template
        </button>
      </div>

      {error && !editing && <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 mb-4">{error}</div>}

      {/* Template Cards */}
      {!editing && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? [...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-panel p-4">
              <div className="h-32 skeleton rounded-xl mb-3" />
              <div className="h-4 skeleton rounded w-2/3 mb-2" />
              <div className="h-3 skeleton rounded w-1/2" />
            </div>
          )) : templates.length === 0 ? (
            <div className="col-span-3 text-center py-16 text-muted text-sm">
              No templates yet. Create your first template.
            </div>
          ) : templates.map(t => (
            <div key={t._id} className="rounded-2xl border border-border bg-panel overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-2" style={{ background: t.colorScheme.primary }} />
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-bold text-sm">{t.name}</div>
                    <div className="text-xs text-muted">{PAPER_SIZES.find(p => p.value === t.paperSize)?.label || t.paperSize}</div>
                  </div>
                  {t.isDefault && <span className="rounded-full bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 uppercase">Default</span>}
                </div>
                <div className="flex gap-1 mb-3">
                  {Object.values(t.colorScheme).slice(0, 5).map((c, i) => (
                    <div key={i} className="w-5 h-5 rounded-full border border-border/40" style={{ background: c }} title={c} />
                  ))}
                </div>
                <div className="flex gap-1 flex-wrap text-[10px] text-muted mb-3">
                  {t.layout.showLogo && <span className="bg-surface rounded px-1.5 py-0.5">Logo</span>}
                  {t.layout.showBankDetails && <span className="bg-surface rounded px-1.5 py-0.5">Bank</span>}
                  {t.layout.showTaxBreakup && <span className="bg-surface rounded px-1.5 py-0.5">Tax Breakup</span>}
                  {t.layout.showSignature && <span className="bg-surface rounded px-1.5 py-0.5">Signature</span>}
                  {t.layout.showWatermark && <span className="bg-surface rounded px-1.5 py-0.5">Watermark</span>}
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => editTemplate(t)}
                    className="flex-1 rounded-lg border border-border text-xs px-2.5 py-1.5 hover:border-accent/40 hover:text-accent transition-colors">
                    Edit
                  </button>
                  {!t.isDefault && (
                    <button onClick={() => setDefault(t._id)}
                      className="flex-1 rounded-lg bg-green-50 border border-green-200 text-green-700 text-xs px-2.5 py-1.5 hover:bg-green-100 transition-colors">
                      Set Default
                    </button>
                  )}
                  {!t.isDefault && (
                    <button onClick={() => deleteTemplate(t._id, t.name)}
                      className="rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs px-2.5 py-1.5 hover:bg-red-100 transition-colors">
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor */}
      {editing && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Left: Controls */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-panel p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-base">
                  {(editing as Template)._id ? "Edit Template" : "New Template"}
                </h2>
                <button onClick={() => setEditing(null)} className="text-muted hover:text-text text-lg leading-none">✕</button>
              </div>
              {error && <div className="bg-red-50 text-red-700 text-xs px-3 py-2 rounded-lg mb-3 border border-red-200">{error}</div>}

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-muted uppercase mb-1 block">Template Name *</label>
                  <input value={editing.name ?? ""} onChange={e => setEditing(ed => ({ ...ed!, name: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted uppercase mb-1 block">Paper Size</label>
                  <select value={editing.paperSize ?? "A4"} onChange={e => setEditing(ed => ({ ...ed!, paperSize: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60">
                    {PAPER_SIZES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted uppercase mb-1 block">Font</label>
                  <select value={editing.font ?? "Helvetica"} onChange={e => setEditing(ed => ({ ...ed!, font: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent/60">
                    {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 border-b border-border mb-4">
                {(["colors", "layout", "typography"] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 text-xs font-semibold capitalize border-b-2 -mb-px transition-colors ${activeTab === tab ? "border-accent text-accent" : "border-transparent text-muted hover:text-text"}`}>
                    {tab}
                  </button>
                ))}
              </div>

              {/* Colors Tab */}
              {activeTab === "colors" && (
                <div>
                  <div className="text-[10px] font-bold text-muted uppercase mb-2">Color Presets</div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {PRESETS.map(p => (
                      <button key={p.name} onClick={() => applyPreset(p)} title={p.name}
                        className="flex gap-0.5 rounded-lg border border-border p-1.5 hover:border-accent/40 transition-colors">
                        {Object.values(p.colors).slice(0, 4).map((c, i) => (
                          <div key={i} className="w-3.5 h-3.5 rounded-sm" style={{ background: c }} />
                        ))}
                      </button>
                    ))}
                  </div>

                  <div className="text-[10px] font-bold text-muted uppercase mb-2">Custom Colors</div>
                  <div className="grid grid-cols-2 gap-3">
                    {(Object.keys(DEFAULT_COLOR) as (keyof ColorScheme)[]).map(key => (
                      <div key={key} className="flex items-center gap-2">
                        <input type="color" value={cs[key]} onChange={e => updateColor(key, e.target.value)}
                          className="w-8 h-8 rounded border border-border cursor-pointer p-0.5" />
                        <div>
                          <div className="text-xs font-semibold capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</div>
                          <div className="text-[10px] text-muted font-mono">{cs[key]}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Layout Tab */}
              {activeTab === "layout" && (
                <div>
                  <div className="text-[10px] font-bold text-muted uppercase mb-2">Sections to Display</div>
                  <div className="grid grid-cols-2 gap-2">
                    {LAYOUT_TOGGLES.map(({ key, label }) => (
                      <label key={key} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-surface/60 transition-colors">
                        <input type="checkbox" checked={!!ly[key]} onChange={() => toggleLayout(key)} className="rounded" />
                        <span className="text-xs">{label}</span>
                      </label>
                    ))}
                  </div>

                  {ly.showLogo && (
                    <div className="mt-3">
                      <div className="text-[10px] font-bold text-muted uppercase mb-1">Logo Position</div>
                      <div className="flex gap-2">
                        {["left", "center", "right"].map(pos => (
                          <button key={pos} onClick={() => setEditing(e => ({ ...e!, layout: { ...e!.layout!, logoPosition: pos } }))}
                            className={`flex-1 rounded-lg border px-2 py-1.5 text-xs capitalize transition-colors ${ly.logoPosition === pos ? "border-accent bg-accent/10 text-accent font-semibold" : "border-border hover:border-accent/40"}`}>
                            {pos}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Typography Tab */}
              {activeTab === "typography" && (
                <div>
                  <div className="text-[10px] font-bold text-muted uppercase mb-2">Base Font Size</div>
                  <div className="flex items-center gap-3">
                    <input type="range" min="8" max="12" step="1"
                      value={editing.fontSize ?? 10}
                      onChange={e => setEditing(ed => ({ ...ed!, fontSize: Number(e.target.value) }))}
                      className="flex-1" />
                    <span className="text-sm font-mono w-8 text-center">{editing.fontSize ?? 10}pt</span>
                  </div>
                  <div className="mt-4 text-[10px] text-muted">
                    Font choice affects PDF rendering. Helvetica is recommended for clean modern layouts; Times-Roman for traditional, Courier for monospace.
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-5 justify-end border-t border-border pt-4">
                <button onClick={() => setEditing(null)} disabled={saving}
                  className="rounded-full border border-border px-4 py-2 text-xs font-semibold">Cancel</button>
                <button onClick={save} disabled={saving}
                  className="rounded-full bg-accent px-5 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50">
                  {saving ? "Saving…" : (editing as Template)._id ? "Update Template" : "Create Template"}
                </button>
              </div>
            </div>
          </div>

          {/* Right: Live Preview */}
          <div className="sticky top-6 self-start">
            <div className="rounded-2xl border border-border bg-panel p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-bold">Live Preview</div>
                <div className="text-[10px] text-muted">{PAPER_SIZES.find(p => p.value === (editing.paperSize ?? "A4"))?.label}</div>
              </div>
              <InvoicePreview
                scheme={cs}
                layout={ly}
                font={editing.font ?? "Helvetica"}
                paperSize={editing.paperSize ?? "A4"}
                name={editing.name ?? ""}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
