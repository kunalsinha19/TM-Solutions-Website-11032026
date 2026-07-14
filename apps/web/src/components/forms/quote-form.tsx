"use client";

import { useState, type FormEvent, type ChangeEvent } from "react";
import type { QuoteRequest } from "@tara-maa/shared-types";

// ── Country codes ────────────────────────────────────────────────────────────
const COUNTRIES = [
  { code: "+91",  flag: "🇮🇳", label: "IN",  min: 10, max: 10, placeholder: "98765 43210" },
  { code: "+971", flag: "🇦🇪", label: "AE",  min: 8,  max: 9,  placeholder: "50 123 4567" },
  { code: "+966", flag: "🇸🇦", label: "SA",  min: 8,  max: 9,  placeholder: "55 123 4567" },
  { code: "+1",   flag: "🇺🇸", label: "US",  min: 10, max: 10, placeholder: "201 555 0123" },
  { code: "+44",  flag: "🇬🇧", label: "GB",  min: 9,  max: 10, placeholder: "7400 123456" },
  { code: "+65",  flag: "🇸🇬", label: "SG",  min: 8,  max: 8,  placeholder: "8123 4567" },
  { code: "+61",  flag: "🇦🇺", label: "AU",  min: 8,  max: 9,  placeholder: "412 345 678" },
  { code: "+60",  flag: "🇲🇾", label: "MY",  min: 9,  max: 10, placeholder: "12 345 6789" },
  { code: "+49",  flag: "🇩🇪", label: "DE",  min: 10, max: 12, placeholder: "1512 3456789" },
  { code: "+81",  flag: "🇯🇵", label: "JP",  min: 10, max: 11, placeholder: "90 1234 5678" },
] as const;

type Country = (typeof COUNTRIES)[number];

// ── Field wrapper ────────────────────────────────────────────────────────────
function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-muted uppercase tracking-wide">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

const inputCls =
  "rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent/50 focus:ring-2 focus:ring-accent/10 placeholder:text-muted/60";

// ── Empty form default ───────────────────────────────────────────────────────
const EMPTY: Omit<QuoteRequest, "phone"> = {
  name: "",
  email: "",
  company: "",
  message: "",
  captchaToken: "demo-captcha-token",
};

// ── Main component ───────────────────────────────────────────────────────────
export function QuoteForm({ productId }: { productId?: string }) {
  const [form, setForm] = useState<Omit<QuoteRequest, "phone">>({ ...EMPTY, productId });
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneDigits, setPhoneDigits] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof QuoteRequest, string>>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorDetail, setErrorDetail] = useState("");

  const country = COUNTRIES.find((c) => c.code === countryCode) ?? COUNTRIES[0];

  function set(field: keyof Omit<QuoteRequest, "phone">) {
    return (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
      if (errors[field]) setErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
    };
  }

  function handlePhoneDigits(e: ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "");
    const capped = raw.slice(0, country.max);
    setPhoneDigits(capped);
    if (errors.phone) setErrors((prev) => { const next = { ...prev }; delete next.phone; return next; });
  }

  function handleCountryChange(e: ChangeEvent<HTMLSelectElement>) {
    setCountryCode(e.target.value);
    setPhoneDigits("");
    setErrors((prev) => { const next = { ...prev }; delete next.phone; return next; });
  }

  function validate(): boolean {
    const next: Partial<Record<keyof QuoteRequest, string>> = {};
    if (!form.name.trim() || form.name.trim().length < 2) {
      next.name = "Please enter your full name.";
    }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = "Please enter a valid email address.";
    }
    if (phoneDigits) {
      if (country.min === country.max && phoneDigits.length !== country.min) {
        next.phone = `Enter exactly ${country.min} digits for ${country.flag} ${country.code}.`;
      } else if (phoneDigits.length < country.min) {
        next.phone = `Enter at least ${country.min} digits for ${country.flag} ${country.code}.`;
      }
    }
    if (!form.message.trim() || form.message.trim().length < 10) {
      next.message = "Please describe your requirement (at least 10 characters).";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validate()) return;
    setStatus("submitting");
    setErrorDetail("");
    try {
      const phone = phoneDigits ? `${countryCode} ${phoneDigits}` : "";
      const payload: QuoteRequest = { ...form, phone };
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as Record<string, unknown>;
        const msg = (data.message ?? data.error ?? `Error ${res.status}`) as string;
        setErrorDetail(msg);
        setStatus("error");
        return;
      }
      setStatus("success");
    } catch (err) {
      setErrorDetail(err instanceof Error ? err.message : "Network error");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 text-green-500">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="12" stroke="currentColor" strokeWidth="1.5" />
            <path d="M9 14l3.5 3.5 6.5-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <h3 className="text-base font-bold">Quote Request Sent!</h3>
          <p className="mt-1.5 text-sm text-muted max-w-xs">
            We&apos;ve received your request and will get back to you within 24 business hours.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setForm({ ...EMPTY, productId });
            setPhoneDigits("");
            setCountryCode("+91");
            setStatus("idle");
          }}
          className="mt-2 rounded-full border border-border px-5 py-2 text-xs font-semibold hover:border-accent/40 hover:text-accent transition-colors"
        >
          Submit another request
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 p-4">
      {/* Name */}
      <Field label="Full Name *" error={errors.name}>
        <input
          type="text"
          autoComplete="name"
          placeholder="e.g. Rajesh Kumar"
          value={form.name}
          onChange={set("name")}
          className={inputCls + (errors.name ? " border-red-400" : "")}
        />
      </Field>

      {/* Email */}
      <Field label="Work Email *" error={errors.email}>
        <input
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={form.email}
          onChange={set("email")}
          className={inputCls + (errors.email ? " border-red-400" : "")}
        />
      </Field>

      {/* Phone + Company row */}
      <div className="grid grid-cols-2 gap-3">
        {/* Phone with country code */}
        <Field label="Phone" error={errors.phone}>
          <div
            className={[
              "flex items-stretch overflow-hidden rounded-xl border bg-surface transition-colors",
              "focus-within:border-accent/50 focus-within:ring-2 focus-within:ring-accent/10",
              errors.phone ? "border-red-400" : "border-border",
            ].join(" ")}
          >
            {/* Country code selector */}
            <select
              value={countryCode}
              onChange={handleCountryChange}
              aria-label="Country code"
              className="shrink-0 bg-transparent py-2.5 pl-2.5 pr-1 text-xs font-semibold text-muted focus:outline-none border-r border-border/60"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.code}
                </option>
              ))}
            </select>

            {/* Digits input */}
            <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="tel-national"
              maxLength={country.max}
              placeholder={country.placeholder}
              value={phoneDigits}
              onChange={handlePhoneDigits}
              className="min-w-0 flex-1 bg-transparent px-2.5 py-2.5 text-sm outline-none placeholder:text-muted/40"
            />
          </div>
        </Field>

        {/* Company */}
        <Field label="Company" error={errors.company}>
          <input
            type="text"
            autoComplete="organization"
            placeholder="Your company"
            value={form.company ?? ""}
            onChange={set("company" as keyof Omit<QuoteRequest, "phone">)}
            className={inputCls}
          />
        </Field>
      </div>

      {/* Requirement */}
      <Field label="Requirement *" error={errors.message}>
        <textarea
          placeholder="Describe the product, quantity, specifications, or any other details…"
          value={form.message}
          onChange={set("message")}
          rows={4}
          className={inputCls + " resize-none" + (errors.message ? " border-red-400" : "")}
        />
      </Field>

      {/* Submit */}
      <button
        type="submit"
        disabled={status === "submitting"}
        className="flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-glow-sm hover:shadow-glow hover:bg-amber-700 transition-all duration-200 disabled:opacity-70"
      >
        {status === "submitting" ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Sending…
          </>
        ) : (
          <>
            Request Quote
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 7h12M7 1l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </>
        )}
      </button>

      {status === "error" && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-center text-xs text-red-600 dark:bg-red-950/30 dark:text-red-400">
          {errorDetail || "Something went wrong."}{" "}
          Please try again or{" "}
          <a href="mailto:taramaasolutions2025@gmail.com" className="underline">
            email us directly
          </a>
          .
        </p>
      )}

      <p className="text-center text-[10px] text-muted">
        Your details are confidential. No spam, no cold calls.
      </p>
    </form>
  );
}
