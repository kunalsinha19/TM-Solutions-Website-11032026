"use client";

import { useState, type FormEvent, type ChangeEvent } from "react";
import type { QuoteRequest } from "@tara-maa/shared-types";
import { apiClient } from "../../lib/api-client";

const EMPTY: QuoteRequest = {
  name: "",
  email: "",
  phone: "",
  company: "",
  message: "",
  captchaToken: "demo-captcha-token",
};

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

export function QuoteForm({ productId }: { productId?: string }) {
  const [form, setForm] = useState<QuoteRequest>({ ...EMPTY, productId });
  const [errors, setErrors] = useState<Partial<Record<keyof QuoteRequest, string>>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  function set(field: keyof QuoteRequest) {
    return (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
      if (errors[field]) setErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
    };
  }

  function validate(): boolean {
    const next: Partial<Record<keyof QuoteRequest, string>> = {};
    if (!form.name.trim() || form.name.trim().length < 2) next.name = "Please enter your full name.";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = "Please enter a valid email address.";
    if (!form.message.trim() || form.message.trim().length < 10) next.message = "Please describe your requirement (at least 10 characters).";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validate()) return;
    setStatus("submitting");
    try {
      await apiClient.submitQuote(form);
      setStatus("success");
    } catch {
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
          onClick={() => { setForm({ ...EMPTY, productId }); setStatus("idle"); }}
          className="mt-2 rounded-full border border-border px-5 py-2 text-xs font-semibold hover:border-accent/40 hover:text-accent transition-colors"
        >
          Submit another request
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 p-4">
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

      <div className="grid grid-cols-2 gap-3">
        <Field label="Phone" error={errors.phone}>
          <input
            type="tel"
            autoComplete="tel"
            placeholder="+91 98765 43210"
            value={form.phone}
            onChange={set("phone")}
            className={inputCls}
          />
        </Field>
        <Field label="Company" error={errors.company}>
          <input
            type="text"
            autoComplete="organization"
            placeholder="Your company"
            value={form.company}
            onChange={set("company")}
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="Requirement *" error={errors.message}>
        <textarea
          placeholder="Describe the product, quantity, specifications, or any other details…"
          value={form.message}
          onChange={set("message")}
          rows={4}
          className={inputCls + " resize-none" + (errors.message ? " border-red-400" : "")}
        />
      </Field>

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
          Something went wrong. Please try again or{" "}
          <a href="mailto:kunal.nic10@gmail.com" className="underline">email us directly</a>.
        </p>
      )}

      <p className="text-center text-[10px] text-muted">
        Your details are confidential. No spam, no cold calls.
      </p>
    </form>
  );
}
