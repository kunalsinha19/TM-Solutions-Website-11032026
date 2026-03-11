"use client";

import { useEffect } from "react";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "2rem" }}>
      <div style={{ maxWidth: 640, width: "100%", padding: "2rem", borderRadius: 24, background: "rgba(255,255,255,0.9)", border: "1px solid rgba(15,23,42,0.08)", boxShadow: "0 20px 60px rgba(15, 23, 42, 0.08)" }}>
        <p style={{ textTransform: "uppercase", letterSpacing: "0.2em", fontSize: 12, color: "#b45309", marginBottom: 12 }}>Tara Maa Solutions</p>
        <h2 style={{ fontSize: 28, marginBottom: 12 }}>Page error</h2>
        <p style={{ color: "#475569", marginBottom: 20 }}>The page could not finish loading. Try rendering it again.</p>
        <button onClick={() => reset()} style={{ border: 0, borderRadius: 999, padding: "0.9rem 1.25rem", background: "#b45309", color: "#fff", cursor: "pointer" }}>
          Reload page
        </button>
      </div>
    </div>
  );
}
