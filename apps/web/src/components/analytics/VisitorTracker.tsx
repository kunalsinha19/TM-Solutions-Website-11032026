"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// ─── API base resolution (mirrors api-client.ts) ────────────────────────────
const API_BASE = (() => {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
  const base = raw.replace(/\/$/, "");
  return base.endsWith("/api") ? base : `${base}/api`;
})();
const TRACK_URL = `${API_BASE}/analytics/track`;

// ─── Tiny helpers ────────────────────────────────────────────────────────────
function uuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function storage(type: "local" | "session"): Storage | null {
  try { return type === "local" ? localStorage : sessionStorage; }
  catch { return null; }
}

function getOrCreate(store: Storage, key: string, fn: () => string): string {
  const v = store.getItem(key);
  if (v) return v;
  const n = fn();
  store.setItem(key, n);
  return n;
}

function detectBrowser(ua: string): string {
  if (/Edg\//.test(ua))          return "Edge";
  if (/OPR\//.test(ua))          return "Opera";
  if (/SamsungBrowser\//.test(ua)) return "Samsung";
  if (/Chrome\//.test(ua))       return "Chrome";
  if (/Firefox\//.test(ua))      return "Firefox";
  if (/Safari\//.test(ua))       return "Safari";
  return "Other";
}

function detectOS(ua: string): string {
  if (/Windows NT/.test(ua))         return "Windows";
  if (/iPhone|iPad|iPod/.test(ua))   return "iOS";
  if (/Android/.test(ua))            return "Android";
  if (/Macintosh|Mac OS X/.test(ua)) return "macOS";
  if (/Linux/.test(ua))              return "Linux";
  return "Other";
}

function detectDevice(ua: string): "mobile" | "tablet" | "desktop" {
  if (/iPad|Tablet|Kindle/i.test(ua)) return "tablet";
  if (/Mobi|Android|iPhone|iPod|BlackBerry|Windows Phone/i.test(ua)) return "mobile";
  return "desktop";
}

// ─── Network utils (fire-and-forget, never throw) ───────────────────────────
async function silentPost(url: string, data: unknown, retries = 1): Promise<void> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok && retries > 0) {
      await new Promise(r => setTimeout(r, 2000));
      return silentPost(url, data, retries - 1);
    }
  } catch {
    if (retries > 0) {
      await new Promise(r => setTimeout(r, 2000));
      return silentPost(url, data, retries - 1);
    }
  }
}

async function silentPut(url: string, data: unknown): Promise<void> {
  try {
    await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch { /* intentionally silent */ }
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function VisitorTracker() {
  const pathname = usePathname();

  const sessionId    = useRef<string | null>(null);
  const visitorId    = useRef<string | null>(null);
  const initialized  = useRef(false);
  const lastPage     = useRef<string>("");
  const sessionStart = useRef<number>(Date.now());

  // ── Mount: generate IDs and fire initial track ──────────────────────────
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    try {
      const local   = storage("local");
      const session = storage("session");
      if (!local || !session) return;

      // visitorId is permanent across all sessions
      const vid = getOrCreate(local, "tm_visitor_id", uuid);
      visitorId.current = vid;

      // sessionId resets when the browser tab closes
      const sid = getOrCreate(session, "tm_session_id", uuid);
      sessionId.current = sid;
      sessionStart.current = Date.now();

      const ua      = navigator.userAgent;
      const page    = window.location.pathname;
      const search  = new URLSearchParams(window.location.search);
      lastPage.current = page;

      const isNewVisitor = !local.getItem("tm_returning");

      void silentPost(TRACK_URL, {
        sessionId:        sid,
        visitorId:        vid,
        page,
        browser:          detectBrowser(ua),
        os:               detectOS(ua),
        device:           detectDevice(ua),
        screenResolution: `${screen.width}x${screen.height}`,
        language:         navigator.language,
        referrer:         document.referrer,
        utmSource:        search.get("utm_source")   || undefined,
        utmMedium:        search.get("utm_medium")   || undefined,
        utmCampaign:      search.get("utm_campaign") || undefined,
        isNewVisitor,
      });

      // Mark as returning for future sessions
      local.setItem("tm_returning", "1");
    } catch { /* storage blocked */ }
  }, []);

  // ── Heartbeat every 30 s ─────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      const sid = sessionId.current;
      if (!sid) return;
      const duration = Math.round((Date.now() - sessionStart.current) / 1000);
      void silentPut(`${TRACK_URL}/${sid}`, {
        isActive: true,
        exitPage: lastPage.current,
        duration,
      });
    }, 30_000);

    return () => clearInterval(interval);
  }, []);

  // ── Exit beacon (tab hide / close) ───────────────────────────────────────
  useEffect(() => {
    function onHide() {
      const sid = sessionId.current;
      if (!sid) return;
      const duration = Math.round((Date.now() - sessionStart.current) / 1000);
      const payload = JSON.stringify({ isActive: false, exitPage: lastPage.current, duration });
      try {
        navigator.sendBeacon(`${TRACK_URL}/${sid}`, new Blob([payload], { type: "application/json" }));
      } catch {
        void silentPut(`${TRACK_URL}/${sid}`, { isActive: false, exitPage: lastPage.current, duration });
      }
    }

    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onHide);
    };
  }, []);

  // ── Route change tracking ─────────────────────────────────────────────────
  useEffect(() => {
    const sid = sessionId.current;
    const vid = visitorId.current;
    // Skip if not initialized yet or same page
    if (!sid || !vid || pathname === lastPage.current) return;
    lastPage.current = pathname;

    // POST notifies backend to add this page to pagesVisited
    void silentPost(TRACK_URL, { sessionId: sid, visitorId: vid, page: pathname });
  }, [pathname]);

  return null;
}
