"use client";

/**
 * SupplierForm — parameterised, fully-validated supplier add/edit form.
 *
 * Renders the complete modal card (sticky header + scrollable body + sticky
 * footer).  The caller just wraps it in a full-screen backdrop.
 *
 * Features:
 *  • Field-level validation — shows errors on blur (not on every keystroke)
 *  • On submit — validates ALL fields and scrolls the card to the first error
 *  • Pincode auto-fetch — calls India Post API with 600 ms debounce;
 *    auto-fills City and State; shows spinner / success / not-found status
 *  • GSTIN ↔ PAN cross-validation
 *  • IFSC + bank account number validation
 *  • Monospace inputs for GSTIN / PAN / IFSC with maxLength guards
 *  • Error count badge in footer before first successful save
 */

import { useState, useEffect, useRef, useCallback } from "react";
import {
  validateSupplierForm,
  STATE_CODE_MAP,
  type SupplierFormData,
  type FieldErrors,
} from "../../../lib/inv-validations";

// ── Small design-system helpers ──────────────────────────────────────────────

const BASE_INPUT =
  "w-full rounded-xl border px-3 py-2 text-sm bg-surface focus:outline-none transition-colors";

function ic(err?: string) {
  return `${BASE_INPUT} ${
    err ? "border-red-400 focus:border-red-400" : "border-border focus:border-accent/60"
  }`;
}

function FieldErr({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p role="alert" className="flex items-center gap-1 text-[11px] text-red-400 mt-1">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2a10 10 0 110 20A10 10 0 0112 2zm0 5a1 1 0 00-1 1v4a1 1 0 002 0V8a1 1 0 00-1-1zm0 8a1.25 1.25 0 110 2.5 1.25 1.25 0 010-2.5z" />
      </svg>
      {msg}
    </p>
  );
}

function Label({
  text,
  required,
  hint,
}: {
  text: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label className="text-xs font-semibold text-muted mb-1 flex items-center gap-1">
      {text}
      {required && <span className="text-red-400">*</span>}
      {hint && (
        <span className="text-[10px] font-normal text-muted/60 ml-auto">{hint}</span>
      )}
    </label>
  );
}

// ── Pincode status indicator ─────────────────────────────────────────────────

type PinStatus = "idle" | "loading" | "ok" | "notfound" | "err";

function PinIndicator({ status }: { status: PinStatus }) {
  if (status === "loading")
    return (
      <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-accent border-t-transparent animate-spin" />
    );
  if (status === "ok")
    return (
      <svg
        className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-green-500"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        viewBox="0 0 24 24"
      >
        <path d="M5 13l4 4L19 7" />
      </svg>
    );
  if (status === "notfound" || status === "err")
    return (
      <svg
        className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-400"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
    );
  return null;
}

// ── Main component ───────────────────────────────────────────────────────────

interface SupplierFormProps {
  title: string;
  submitLabel: string;
  initialData: SupplierFormData;
  /** Must resolve on success, throw on failure. */
  onSave: (data: SupplierFormData) => Promise<void>;
  onCancel: () => void;
}

export default function SupplierForm({
  title,
  submitLabel,
  initialData,
  onSave,
  onCancel,
}: SupplierFormProps) {
  const [form, setForm] = useState<SupplierFormData>(initialData);
  const [errs, setErrs] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [tried, setTried] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiErr, setApiErr] = useState("");

  // Pincode lookup state
  const [pinStatus, setPinStatus] = useState<PinStatus>("idle");
  const [pinMsg, setPinMsg] = useState("");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const bodyRef = useRef<HTMLDivElement>(null);

  // ── setters ───────────────────────────────────────────────────────────────

  function f<K extends keyof SupplierFormData>(key: K, val: SupplierFormData[K]) {
    setForm(prev => ({ ...prev, [key]: val }));
  }
  function addr(key: string, val: string) {
    setForm(prev => ({
      ...prev,
      address: { ...prev.address, [key]: val },
    }));
  }
  function touch(key: string) {
    setTouched(t => { const n = new Set(t); n.add(key); return n; });
  }

  // ── live validation (on blur or after first submit attempt) ───────────────

  const revalidate = useCallback(() => {
    const all = validateSupplierForm(form);
    if (tried) {
      setErrs(all);
    } else {
      const partial: FieldErrors = {};
      for (const k of touched) if (all[k]) partial[k] = all[k];
      setErrs(partial);
    }
  }, [form, touched, tried]);

  useEffect(() => { revalidate(); }, [revalidate]);

  function e(key: string) { return errs[key]; }
  function show(key: string) { return tried || touched.has(key); }

  // ── pincode auto-fetch ────────────────────────────────────────────────────

  const fetchPincode = useCallback(async (pin: string) => {
    setPinStatus("loading");
    setPinMsg("");
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      if (!res.ok) throw new Error("Network error");
      const data = await res.json();
      if (data[0]?.Status === "Success" && data[0].PostOffice?.length > 0) {
        const po = data[0].PostOffice[0];
        setForm(prev => ({
          ...prev,
          address: {
            ...prev.address,
            city: po.District ?? "",
            state: po.State ?? "",
          },
        }));
        setPinStatus("ok");
        setPinMsg(`${po.District}, ${po.State}`);
      } else {
        setPinStatus("notfound");
        setPinMsg("Pincode not found — please fill city/state manually");
      }
    } catch {
      setPinStatus("err");
      setPinMsg("Could not reach India Post API — please fill city/state manually");
    }
  }, []);

  function handlePincodeChange(val: string) {
    addr("pincode", val);
    clearTimeout(debounceRef.current);
    if (/^\d{6}$/.test(val)) {
      setPinStatus("loading");
      debounceRef.current = setTimeout(() => fetchPincode(val), 600);
    } else {
      setPinStatus("idle");
      setPinMsg("");
    }
  }

  // ── When state code is typed, try to auto-detect state name ──────────────

  function handleStateCodeChange(val: string) {
    addr("stateCode", val);
    const padded = val.padStart(2, "0");
    if (STATE_CODE_MAP[padded] && !form.address.state) {
      addr("state", STATE_CODE_MAP[padded]);
    }
  }

  // ── submit ────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    setTried(true);
    const all = validateSupplierForm(form);
    setErrs(all);

    if (Object.keys(all).length > 0) {
      setTimeout(() => {
        const firstErr = bodyRef.current?.querySelector("[data-field-error]");
        firstErr?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
      return;
    }

    setSubmitting(true);
    setApiErr("");
    try {
      await onSave(form);
    } catch (err: unknown) {
      setApiErr(err instanceof Error ? err.message : "Save failed — please try again");
    } finally {
      setSubmitting(false);
    }
  }

  const errorCount = Object.keys(errs).length;

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="bg-panel rounded-2xl border border-border w-full max-w-xl flex flex-col max-h-[90vh] shadow-2xl">

      {/* ── Sticky header ── */}
      <div className="flex items-center justify-between shrink-0 border-b border-border/60 px-6 py-4">
        <h2 className="text-base font-bold">{title}</h2>
        <button
          onClick={onCancel}
          aria-label="Close"
          className="rounded-lg p-1.5 text-muted hover:bg-surface hover:text-text transition-colors"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* ── Scrollable body ── */}
      <div ref={bodyRef} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        {apiErr && (
          <div className="bg-red-50 text-red-700 text-sm px-3 py-2.5 rounded-xl border border-red-200">
            {apiErr}
          </div>
        )}

        {/* ─ Name ─ */}
        <div data-field-error={show("name") && errs.name ? "" : undefined}>
          <Label text="Supplier Name" required />
          <input
            value={form.name}
            onChange={ev => f("name", ev.target.value)}
            onBlur={() => touch("name")}
            className={ic(show("name") ? e("name") : undefined)}
            placeholder="e.g. Raj Paper Mills"
          />
          <FieldErr msg={show("name") ? e("name") : undefined} />
        </div>

        {/* ─ Company + Payment Terms ─ */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label text="Company / Trade Name" />
            <input
              value={form.company}
              onChange={ev => f("company", ev.target.value)}
              className={ic()}
              placeholder="Legal entity name (optional)"
            />
          </div>
          <div data-field-error={show("paymentTerms") && errs.paymentTerms ? "" : undefined}>
            <Label text="Payment Terms (days)" hint="due in N days" />
            <input
              type="number"
              min="0"
              step="1"
              value={form.paymentTerms}
              onChange={ev => f("paymentTerms", Number(ev.target.value))}
              onBlur={() => touch("paymentTerms")}
              className={ic(show("paymentTerms") ? e("paymentTerms") : undefined)}
              placeholder="30"
            />
            <FieldErr msg={show("paymentTerms") ? e("paymentTerms") : undefined} />
          </div>
        </div>

        {/* ─ Email + Phone ─ */}
        <div className="grid grid-cols-2 gap-3">
          <div data-field-error={show("email") && errs.email ? "" : undefined}>
            <Label text="Email" />
            <input
              type="email"
              value={form.email}
              onChange={ev => f("email", ev.target.value)}
              onBlur={() => touch("email")}
              className={ic(show("email") ? e("email") : undefined)}
              placeholder="name@example.com"
            />
            <FieldErr msg={show("email") ? e("email") : undefined} />
          </div>
          <div data-field-error={show("phone") && errs.phone ? "" : undefined}>
            <Label text="Phone" />
            <input
              type="tel"
              value={form.phone}
              onChange={ev => f("phone", ev.target.value)}
              onBlur={() => touch("phone")}
              className={ic(show("phone") ? e("phone") : undefined)}
              placeholder="+91 9XXXXXXXXX"
            />
            <FieldErr msg={show("phone") ? e("phone") : undefined} />
          </div>
        </div>

        {/* ─ GSTIN + PAN ─ */}
        <div className="grid grid-cols-2 gap-3">
          <div data-field-error={show("gstin") && errs.gstin ? "" : undefined}>
            <Label text="GSTIN" hint="15 chars" />
            <input
              value={form.gstin}
              onChange={ev => f("gstin", ev.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
              onBlur={() => touch("gstin")}
              maxLength={15}
              className={`${ic(show("gstin") ? e("gstin") : undefined)} font-mono tracking-wider`}
              placeholder="22AAAAA0000A1Z5"
            />
            <FieldErr msg={show("gstin") ? e("gstin") : undefined} />
          </div>
          <div data-field-error={show("pan") && errs.pan ? "" : undefined}>
            <Label text="PAN" hint="10 chars" />
            <input
              value={form.pan}
              onChange={ev => f("pan", ev.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
              onBlur={() => { touch("pan"); touch("gstin"); }}
              maxLength={10}
              className={`${ic(show("pan") ? e("pan") : undefined)} font-mono tracking-wider`}
              placeholder="ABCDE1234F"
            />
            <FieldErr msg={show("pan") ? e("pan") : undefined} />
          </div>
        </div>

        {/* ─ Bank Details ─ */}
        <div className="border-t border-border/40 pt-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-3">
            Bank Details
          </p>
          <div className="space-y-3">
            <div>
              <Label text="Bank Name" />
              <input
                value={form.bankName}
                onChange={ev => f("bankName", ev.target.value)}
                className={ic()}
                placeholder="e.g. State Bank of India"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div data-field-error={show("bankAccount") && errs.bankAccount ? "" : undefined}>
                <Label text="Account Number" hint="9–18 digits" />
                <input
                  value={form.bankAccount}
                  onChange={ev => f("bankAccount", ev.target.value.replace(/\D/g, ""))}
                  onBlur={() => touch("bankAccount")}
                  maxLength={18}
                  className={`${ic(show("bankAccount") ? e("bankAccount") : undefined)} font-mono`}
                  placeholder="Account number"
                />
                <FieldErr msg={show("bankAccount") ? e("bankAccount") : undefined} />
              </div>
              <div data-field-error={show("bankIFSC") && errs.bankIFSC ? "" : undefined}>
                <Label text="IFSC Code" hint="11 chars" />
                <input
                  value={form.bankIFSC}
                  onChange={ev =>
                    f("bankIFSC", ev.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
                  }
                  onBlur={() => touch("bankIFSC")}
                  maxLength={11}
                  className={`${ic(show("bankIFSC") ? e("bankIFSC") : undefined)} font-mono tracking-wider`}
                  placeholder="SBIN0001234"
                />
                <FieldErr msg={show("bankIFSC") ? e("bankIFSC") : undefined} />
              </div>
            </div>
          </div>
        </div>

        {/* ─ Address ─ */}
        <div className="border-t border-border/40 pt-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-3">
            Address
          </p>

          {/* Pincode — triggers city/state auto-fill */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div data-field-error={show("addr.pincode") && errs["addr.pincode"] ? "" : undefined}>
              <Label text="Pincode" hint="auto-fills city & state" />
              <div className="relative">
                <input
                  value={form.address.pincode}
                  onChange={ev => handlePincodeChange(ev.target.value.replace(/\D/g, ""))}
                  onBlur={() => touch("addr.pincode")}
                  maxLength={6}
                  className={`${ic(show("addr.pincode") ? e("addr.pincode") : undefined)} pr-8 font-mono`}
                  placeholder="6-digit pincode"
                />
                <PinIndicator status={pinStatus} />
              </div>
              {pinMsg && (
                <p className={`text-[11px] mt-1 ${pinStatus === "ok" ? "text-green-500" : "text-amber-400"}`}>
                  {pinMsg}
                </p>
              )}
              {!pinMsg && <FieldErr msg={show("addr.pincode") ? e("addr.pincode") : undefined} />}
            </div>

            <div data-field-error={show("addr.stateCode") && errs["addr.stateCode"] ? "" : undefined}>
              <Label text="State Code (GST)" hint="e.g. 27 for MH" />
              <input
                value={form.address.stateCode}
                onChange={ev => handleStateCodeChange(ev.target.value.replace(/\D/g, ""))}
                onBlur={() => touch("addr.stateCode")}
                maxLength={2}
                className={`${ic(show("addr.stateCode") ? e("addr.stateCode") : undefined)} font-mono`}
                placeholder="01–38"
              />
              {form.address.stateCode && STATE_CODE_MAP[form.address.stateCode.padStart(2, "0")] && (
                <p className="text-[11px] text-green-500 mt-1">
                  {STATE_CODE_MAP[form.address.stateCode.padStart(2, "0")]}
                </p>
              )}
              <FieldErr msg={show("addr.stateCode") ? e("addr.stateCode") : undefined} />
            </div>
          </div>

          {/* City + State (auto-populated) */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <Label text="City / District" />
              <div className="relative">
                <input
                  value={form.address.city}
                  onChange={ev => addr("city", ev.target.value)}
                  className={`${ic()} ${pinStatus === "ok" && form.address.city ? "pr-12" : ""}`}
                  placeholder="Auto-filled from pincode"
                />
                {pinStatus === "ok" && form.address.city && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-green-500 uppercase tracking-wide">
                    auto
                  </span>
                )}
              </div>
            </div>
            <div>
              <Label text="State" />
              <div className="relative">
                <input
                  value={form.address.state}
                  onChange={ev => addr("state", ev.target.value)}
                  className={`${ic()} ${pinStatus === "ok" && form.address.state ? "pr-12" : ""}`}
                  placeholder="Auto-filled from pincode"
                />
                {pinStatus === "ok" && form.address.state && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-green-500 uppercase tracking-wide">
                    auto
                  </span>
                )}
              </div>
            </div>
          </div>

          <div>
            <Label text="Address Line" />
            <input
              value={form.address.line1}
              onChange={ev => addr("line1", ev.target.value)}
              className={ic()}
              placeholder="Street, building, area…"
            />
          </div>
        </div>

        {/* ─ Notes ─ */}
        <div>
          <Label text="Notes" />
          <textarea
            rows={2}
            value={form.notes}
            onChange={ev => f("notes", ev.target.value)}
            className={`${ic()} resize-none`}
            placeholder="Internal notes about this supplier…"
          />
        </div>
      </div>

      {/* ── Sticky footer ── */}
      <div className="shrink-0 border-t border-border/60 px-6 py-4 flex items-center justify-between gap-3">
        <div>
          {tried && errorCount > 0 ? (
            <span className="text-[11px] text-red-400 font-medium">
              {errorCount} error{errorCount > 1 ? "s" : ""} — please fix before saving
            </span>
          ) : (
            <span />
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onCancel}
            disabled={submitting}
            className="rounded-full border border-border px-4 py-2 text-xs font-semibold hover:border-accent/40 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-full bg-accent px-5 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
          >
            {submitting && (
              <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
            )}
            {submitting ? "Saving…" : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
