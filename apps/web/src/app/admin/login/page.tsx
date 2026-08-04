"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { setAccessToken } from "../../../lib/auth";

function resolveApiBase(): string {
  const raw = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api").replace(/\/+$/, "");
  return raw.endsWith("/api") ? raw : `${raw}/api`;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/admin/dashboard";

  const [target, setTarget] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"request" | "verify">("request");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function requestOtp() {
    if (!target.trim()) { setMessage("Enter your email or phone number"); return; }
    setLoading(true); setMessage("");
    try {
      const res = await fetch(`${resolveApiBase()}/auth/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: target.trim(), purpose: "admin_login" }),
      });
      const data = await res.json();
      if (res.ok) {
        setStep("verify");
        setMessage(data.debugCode ? `Debug OTP: ${data.debugCode}` : "OTP sent to your email/phone.");
      } else {
        setMessage(data.message ?? `Request failed (${res.status})`);
      }
    } catch (err) {
      setMessage(`Could not reach server. Check your connection or contact support. (${err instanceof Error ? err.message : "network error"})`);
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    if (!code.trim()) { setMessage("Enter the OTP code"); return; }
    setLoading(true); setMessage("");
    try {
      const res = await fetch(`${resolveApiBase()}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: target.trim(), code: code.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setAccessToken(data.accessToken);
        router.push(callbackUrl);
        router.refresh();
      } else {
        setMessage(data.message ?? `Verification failed (${res.status})`);
      }
    } catch (err) {
      setMessage(`Could not reach server. (${err instanceof Error ? err.message : "network error"})`);
    } finally {
      setLoading(false);
    }
  }

  const isError = message && !message.startsWith("OTP sent") && !message.startsWith("Debug OTP");

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <div className="rounded-[2rem] border border-border bg-panel p-6">
        <h1 className="text-3xl font-semibold">Admin OTP Login</h1>
        <p className="mt-2 text-sm text-muted">Single-admin authentication flow.</p>

        <input
          className="mt-6 w-full rounded-2xl border border-border bg-surface px-4 py-3"
          placeholder="Email or phone"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && step === "request" && requestOtp()}
          disabled={loading || step === "verify"}
        />

        {step === "verify" && (
          <>
            <input
              className="mt-4 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-center tracking-widest text-lg font-mono"
              placeholder="Enter OTP"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && verifyOtp()}
              autoFocus
              maxLength={6}
              disabled={loading}
            />
            <button
              type="button"
              className="mt-2 text-xs text-muted underline"
              onClick={() => { setStep("request"); setCode(""); setMessage(""); }}
            >
              ← Use a different email/phone
            </button>
          </>
        )}

        <button
          type="button"
          className="mt-5 w-full rounded-full bg-accent px-5 py-3 font-semibold text-white disabled:opacity-60"
          onClick={step === "request" ? requestOtp : verifyOtp}
          disabled={loading}
        >
          {loading ? "Please wait…" : step === "request" ? "Request OTP" : "Verify OTP"}
        </button>

        {message && (
          <p className={`mt-4 text-sm rounded-xl px-3 py-2 ${isError ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
