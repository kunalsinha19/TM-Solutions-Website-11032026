"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { setAccessToken } from "../../../lib/auth";

export default function AdminLoginPage() {
  const router = useRouter();
  const [target, setTarget] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"request" | "verify">("request");
  const [message, setMessage] = useState("");

  async function requestOtp() {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1"}/auth/request-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target, purpose: "admin_login" })
    });
    const data = await response.json();
    setMessage(data.debugCode ? `OTP: ${data.debugCode}` : "OTP sent");
    if (response.ok) {
      setStep("verify");
    }
  }

  async function verifyOtp() {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1"}/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target, code })
    });
    const data = await response.json();
    if (response.ok) {
      setAccessToken(data.accessToken);
      router.push("/admin/dashboard");
      router.refresh();
    } else {
      setMessage(data.message ?? "Verification failed");
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <div className="rounded-[2rem] border border-border bg-panel p-6">
        <h1 className="text-3xl font-semibold">Admin OTP Login</h1>
        <p className="mt-2 text-sm text-muted">Single-admin authentication flow.</p>
        <input
          className="mt-6 w-full rounded-2xl border border-border bg-surface px-4 py-3"
          placeholder="Email or phone"
          value={target}
          onChange={(event) => setTarget(event.target.value)}
        />
        {step === "verify" ? (
          <input
            className="mt-4 w-full rounded-2xl border border-border bg-surface px-4 py-3"
            placeholder="OTP code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
          />
        ) : null}
        <button
          type="button"
          className="mt-6 w-full rounded-full bg-accent px-5 py-3 font-semibold text-white"
          onClick={step === "request" ? requestOtp : verifyOtp}
        >
          {step === "request" ? "Request OTP" : "Verify OTP"}
        </button>
        {message ? <p className="mt-4 text-sm text-muted">{message}</p> : null}
      </div>
    </div>
  );
}
