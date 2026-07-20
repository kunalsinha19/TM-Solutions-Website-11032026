"use client";

import { useState, useEffect, useRef, type FormEvent, type ChangeEvent } from "react";
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

// ── Visitor profile saved in localStorage ────────────────────────────────────
const LS_KEY = "tms_visitor";

interface VisitorProfile {
  name: string;
  email: string;
  phone: string;
  countryCode: string;
  company: string;
  address: string;
  /** productKey (productId or "general") → unix ms of last submit */
  lastSubmitted: Record<string, number>;
}

function loadProfile(): VisitorProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as VisitorProfile) : null;
  } catch {
    return null;
  }
}

function saveProfile(p: VisitorProfile) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(p)); } catch {}
}

function clearProfile() {
  try { localStorage.removeItem(LS_KEY); } catch {}
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function Field({
  label, error, children,
}: { label: string; error?: string; children: React.ReactNode }) {
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

// ── Main component ───────────────────────────────────────────────────────────
export function QuoteForm({ productId }: { productId?: string }) {
  const productKey = productId ?? "general";

  const [profile, setProfile] = useState<VisitorProfile | null>(null);
  const [mode, setMode] = useState<"loading" | "new" | "returning" | "editing">("loading");

  // Form field state
  const [name,        setName]        = useState("");
  const [email,       setEmail]       = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneDigits, setPhoneDigits] = useState("");
  const [company,     setCompany]     = useState("");
  const [address,     setAddress]     = useState("");
  const [message,     setMessage]     = useState("");
  const [addressConfirmed, setAddressConfirmed] = useState<boolean | null>(null);

  const [errors,      setErrors]      = useState<Partial<Record<string, string>>>({});
  const [status,      setStatus]      = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorDetail, setErrorDetail] = useState("");

  // Prevent double-submit at the network level
  const submitting = useRef(false);

  const country = COUNTRIES.find((c) => c.code === countryCode) ?? COUNTRIES[0];

  // ── Load saved profile on mount ──────────────────────────────────────────
  useEffect(() => {
    const p = loadProfile();
    if (!p?.email) {
      setMode("new");
      return;
    }

    // Check client-side dedup — submitted for this product in last 30 seconds?
    const lastTs = p.lastSubmitted?.[productKey] ?? 0;
    if (Date.now() - lastTs < 30_000) {
      // Already submitted very recently — go straight to success
      setStatus("success");
      setMode("new");
      return;
    }

    setProfile(p);
    setName(p.name);
    setEmail(p.email);
    setCountryCode(p.countryCode || "+91");
    setPhoneDigits(p.phone || "");
    setCompany(p.company || "");
    setAddress(p.address || "");
    setMode("returning");
  }, [productKey]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  function handlePhoneDigits(e: ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "").slice(0, country.max);
    setPhoneDigits(raw);
    clearErr("phone");
  }

  function clearErr(field: string) {
    setErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!name.trim() || name.trim().length < 2) next.name = "Please enter your full name.";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      next.email = "Please enter a valid email address.";
    if (phoneDigits) {
      if (country.min === country.max && phoneDigits.length !== country.min)
        next.phone = `Enter exactly ${country.min} digits for ${country.flag} ${country.code}.`;
      else if (phoneDigits.length < country.min)
        next.phone = `Enter at least ${country.min} digits for ${country.flag} ${country.code}.`;
    }
    if (!message.trim() || message.trim().length < 10)
      next.message = "Please describe your requirement (at least 10 characters).";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function buildPayload(): QuoteRequest {
    const phone = phoneDigits ? `${countryCode} ${phoneDigits}` : "";
    return {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone,
      company: company.trim(),
      address: address.trim(),
      message: message.trim(),
      productId,
      captchaToken: "demo-captcha-token",
    };
  }

  function persistProfile(lastSubmit = false) {
    const updated: VisitorProfile = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phoneDigits,
      countryCode,
      company: company.trim(),
      address: address.trim(),
      lastSubmitted: {
        ...(profile?.lastSubmitted ?? {}),
        ...(lastSubmit ? { [productKey]: Date.now() } : {}),
      },
    };
    saveProfile(updated);
    setProfile(updated);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting.current) return;
    if (!validate()) return;

    submitting.current = true;
    setStatus("submitting");
    setErrorDetail("");

    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      const data = await res.json().catch(() => ({})) as Record<string, unknown>;

      if (!res.ok) {
        const msg = (data.message ?? data.error ?? `Error ${res.status}`) as string;
        setErrorDetail(msg);
        setStatus("error");
        submitting.current = false;
        return;
      }

      // Save/update profile with dedup timestamp
      persistProfile(true);
      setStatus("success");
    } catch (err) {
      setErrorDetail(err instanceof Error ? err.message : "Network error");
      setStatus("error");
      submitting.current = false;
    }
  }

  function startFresh() {
    clearProfile();
    setProfile(null);
    setName(""); setEmail(""); setPhoneDigits(""); setCompany(""); setAddress(""); setMessage("");
    setCountryCode("+91");
    setErrors({});
    setMode("new");
  }

  // ── Success screen ────────────────────────────────────────────────────────
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
            submitting.current = false;
            setMessage("");
            setErrors({});
            setStatus("idle");
            setMode(profile ? "returning" : "new");
          }}
          className="mt-2 rounded-full border border-border px-5 py-2 text-xs font-semibold hover:border-accent/40 hover:text-accent transition-colors"
        >
          Submit another request
        </button>
      </div>
    );
  }

  // ── Loading skeleton (avoids hydration flash) ─────────────────────────────
  if (mode === "loading") {
    return <div className="h-64 animate-pulse rounded-2xl bg-surface/60" />;
  }

  // ── RETURNING VISITOR — compact smart form ────────────────────────────────
  if (mode === "returning" && profile) {
    const hasAddress = !!profile.address;

    return (
      <form onSubmit={onSubmit} className="grid gap-4 p-4">
        {/* Welcome back banner */}
        <div className="flex items-center justify-between rounded-xl border border-accent/30 bg-accent/5 px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Welcome back, {profile.name.split(" ")[0]}!</p>
            <p className="text-xs text-muted mt-0.5">{profile.email} &middot; {profile.countryCode} {profile.phone}</p>
            {profile.company && (
              <p className="text-xs text-muted">{profile.company}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setMode("editing")}
            className="ml-3 shrink-0 text-xs text-accent underline underline-offset-2 hover:no-underline"
          >
            Update details
          </button>
        </div>

        {/* Address confirmation */}
        {hasAddress && (
          <div className="rounded-xl border border-border bg-surface/60 px-4 py-3">
            <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Shipping / Delivery Address</p>
            <p className="text-sm">{profile.address}</p>
            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={() => setAddressConfirmed(true)}
                className={[
                  "flex-1 rounded-lg border py-1.5 text-xs font-semibold transition-colors",
                  addressConfirmed === true
                    ? "border-green-500 bg-green-500/10 text-green-600"
                    : "border-border hover:border-accent/40 hover:text-accent",
                ].join(" ")}
              >
                Yes, same address
              </button>
              <button
                type="button"
                onClick={() => { setAddressConfirmed(false); setMode("editing"); }}
                className="flex-1 rounded-lg border border-border py-1.5 text-xs font-semibold hover:border-accent/40 hover:text-accent transition-colors"
              >
                Change address
              </button>
            </div>
          </div>
        )}

        {/* Only the requirement textarea for returning users */}
        <Field label="What do you need? *" error={errors.message}>
          <textarea
            placeholder="Product name, quantity, specs — e.g. 5 units of TMS-8025D Foil Stamping Machine"
            value={message}
            onChange={(e) => { setMessage(e.target.value); clearErr("message"); }}
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
            <a href="mailto:taramaasolutions2025@gmail.com" className="underline">Email us</a>
          </p>
        )}

        <p className="text-center text-[10px] text-muted">
          Not {profile.name.split(" ")[0]}?{" "}
          <button type="button" onClick={startFresh} className="underline hover:text-accent">
            Start fresh
          </button>
        </p>
      </form>
    );
  }

  // ── NEW / EDITING VISITOR — full form ─────────────────────────────────────
  return (
    <form onSubmit={onSubmit} className="grid gap-4 p-4">
      {mode === "editing" && (
        <p className="text-xs text-muted text-center -mb-1">
          Update your details below and submit.
        </p>
      )}

      {/* Name */}
      <Field label="Full Name *" error={errors.name}>
        <input
          type="text"
          autoComplete="name"
          placeholder="e.g. Rajesh Kumar"
          value={name}
          onChange={(e) => { setName(e.target.value); clearErr("name"); }}
          className={inputCls + (errors.name ? " border-red-400" : "")}
        />
      </Field>

      {/* Email */}
      <Field label="Work Email *" error={errors.email}>
        <input
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); clearErr("email"); }}
          className={inputCls + (errors.email ? " border-red-400" : "")}
        />
      </Field>

      {/* Phone + Company row */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Phone" error={errors.phone}>
          <div
            className={[
              "flex items-stretch overflow-hidden rounded-xl border bg-surface transition-colors",
              "focus-within:border-accent/50 focus-within:ring-2 focus-within:ring-accent/10",
              errors.phone ? "border-red-400" : "border-border",
            ].join(" ")}
          >
            <select
              value={countryCode}
              onChange={(e) => { setCountryCode(e.target.value); setPhoneDigits(""); clearErr("phone"); }}
              aria-label="Country code"
              className="shrink-0 bg-transparent py-2.5 pl-2.5 pr-1 text-xs font-semibold text-muted focus:outline-none border-r border-border/60"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
              ))}
            </select>
            <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="tel-national"
              maxLength={(COUNTRIES.find(c => c.code === countryCode) as Country | undefined)?.max ?? 12}
              placeholder={(COUNTRIES.find(c => c.code === countryCode) as Country | undefined)?.placeholder ?? ""}
              value={phoneDigits}
              onChange={handlePhoneDigits}
              className="min-w-0 flex-1 bg-transparent px-2.5 py-2.5 text-sm outline-none placeholder:text-muted/40"
            />
          </div>
        </Field>

        <Field label="Company" error={errors.company}>
          <input
            type="text"
            autoComplete="organization"
            placeholder="Your company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className={inputCls}
          />
        </Field>
      </div>

      {/* Address */}
      <Field label="Delivery Address" error={errors.address}>
        <input
          type="text"
          autoComplete="street-address"
          placeholder="City, State — e.g. Sector 18, Noida, UP"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className={inputCls}
        />
      </Field>

      {/* Requirement */}
      <Field label="Requirement *" error={errors.message}>
        <textarea
          placeholder="Product name, quantity, specs — e.g. 5 units of TMS-8025D Foil Stamping Machine"
          value={message}
          onChange={(e) => { setMessage(e.target.value); clearErr("message"); }}
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
          <a href="mailto:taramaasolutions2025@gmail.com" className="underline">email us directly</a>.
        </p>
      )}

      <p className="text-center text-[10px] text-muted">
        Your details are confidential. No spam, no cold calls.
      </p>
    </form>
  );
}
