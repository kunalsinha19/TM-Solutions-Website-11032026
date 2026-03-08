"use client";

import { useState, type FormEvent } from "react";
import type { QuoteRequest } from "@tara-maa/shared-types";
import { quoteSchema } from "../../lib/validations";

const initialState: QuoteRequest = {
  name: "",
  email: "",
  phone: "",
  company: "",
  message: "",
  captchaToken: "demo-captcha-token"
};

export function QuoteForm({ productId }: { productId?: string }) {
  const [form, setForm] = useState<QuoteRequest>({ ...initialState, productId });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = quoteSchema.safeParse(form);
    if (!result.success) {
      setStatus("error");
      return;
    }

    setStatus("submitting");
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1"}/quotes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data)
      });
      setStatus(response.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 rounded-[2rem] border border-border bg-panel p-6">
      <input
        className="rounded-2xl border border-border bg-surface px-4 py-3"
        placeholder="Full name"
        value={form.name}
        onChange={(event) => setForm({ ...form, name: event.target.value })}
      />
      <input
        className="rounded-2xl border border-border bg-surface px-4 py-3"
        placeholder="Work email"
        value={form.email}
        onChange={(event) => setForm({ ...form, email: event.target.value })}
      />
      <input
        className="rounded-2xl border border-border bg-surface px-4 py-3"
        placeholder="Phone"
        value={form.phone}
        onChange={(event) => setForm({ ...form, phone: event.target.value })}
      />
      <input
        className="rounded-2xl border border-border bg-surface px-4 py-3"
        placeholder="Company"
        value={form.company}
        onChange={(event) => setForm({ ...form, company: event.target.value })}
      />
      <textarea
        className="min-h-36 rounded-2xl border border-border bg-surface px-4 py-3"
        placeholder="Tell us what you need"
        value={form.message}
        onChange={(event) => setForm({ ...form, message: event.target.value })}
      />
      <div className="rounded-2xl border border-dashed border-border px-4 py-3 text-sm text-muted">
        Captcha placeholder wired for server verification abstraction.
      </div>
      <button
        type="submit"
        className="rounded-full bg-accent px-5 py-3 font-semibold text-white"
        disabled={status === "submitting"}
      >
        {status === "submitting" ? "Submitting..." : "Request Quote"}
      </button>
      {status === "success" ? <p className="text-sm text-green-600">Quote request submitted.</p> : null}
      {status === "error" ? <p className="text-sm text-red-600">Please check the form and try again.</p> : null}
    </form>
  );
}
