"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ fontFamily: "Segoe UI, sans-serif", padding: "2rem", background: "#f8fafc", color: "#0f172a" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "2rem", borderRadius: 24, background: "#ffffff", boxShadow: "0 20px 60px rgba(15, 23, 42, 0.08)" }}>
          <p style={{ textTransform: "uppercase", letterSpacing: "0.2em", fontSize: 12, color: "#b45309", marginBottom: 12 }}>Tara Maa Solutions</p>
          <h1 style={{ fontSize: 32, marginBottom: 12 }}>Something went wrong</h1>
          <p style={{ color: "#475569", marginBottom: 20 }}>The page hit a runtime error. Try reloading once. If it keeps happening, the app needs another code fix.</p>
          <button onClick={() => reset()} style={{ border: 0, borderRadius: 999, padding: "0.9rem 1.25rem", background: "#b45309", color: "#fff", cursor: "pointer" }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
