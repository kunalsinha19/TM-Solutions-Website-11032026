"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const rawApiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/$/, "");
const API_BASE = rawApiBase
  .replace(/^https:\/\/(localhost|127\.0\.0\.1)(?::\d+)?/i, (match) => match.replace("https://", "http://"));

export default function SiteHeader() {
  const [compact, setCompact] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 56);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      try {
        const response = await fetch(`${API_BASE}/settings`).then((res) => res.ok ? res.json() : null);
        const settingsLogo = response?.settings?.logoUrl || "";
        if (active) {
          setLogoUrl(settingsLogo);
        }
      } catch {
        if (active) {
          setLogoUrl("");
        }
      }
    }

    loadSettings();
    return () => {
      active = false;
    };
  }, []);

  return (
    <motion.header
      className={`site-header${compact ? " compact" : ""}`}
      animate={{
        scale: compact ? 0.94 : 1,
        y: compact ? -2 : 0
      }}
      transition={{ duration: 0.28, ease: "easeOut" }}
    >
      <div className="site-header-inner">
        <div className={`site-header-mark${logoUrl ? " has-logo" : ""}`}>
          {logoUrl ? <img src={logoUrl} alt="Tara Maa Solutions logo" /> : "TMS"}
        </div>
        <div className="site-header-copy">
          <p className="site-header-title">Tara Maa Solutions</p>
          <p className="site-header-subtitle">Trusted industrial supplier</p>
        </div>
      </div>
    </motion.header>
  );
}
