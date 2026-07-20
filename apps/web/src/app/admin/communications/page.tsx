"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getAccessToken } from "../../../lib/auth";

// ── Types ──────────────────────────────────────────────────────────────────────
type Msg = { role: "user" | "bot"; text: string; timestamp?: string };

type Session = {
  _id: string;
  sessionId: string;
  messages: Msg[];
  leadScore: number;
  leadSignals: string[];
  productsDiscussed: string[];
  emailCaptured: string;
  phoneCaptured: string;
  hasQuoteRequest: boolean;
  hasPriceInquiry: boolean;
  hasUrgency: boolean;
  quoteSubmitted: boolean;
  startedAt: string;
  lastActivityAt: string;
};

// ── Helpers ────────────────────────────────────────────────────────────────────
function apiBase() {
  const raw = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api").replace(/\/+$/, "");
  return raw.endsWith("/api") ? raw : `${raw}/api`;
}
async function adminFetch<T>(path: string): Promise<T | null> {
  const token = getAccessToken();
  if (!token) return null;
  try {
    const r = await fetch(`${apiBase()}${path}`, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    if (!r.ok) return null;
    return r.json() as Promise<T>;
  } catch { return null; }
}

function timeAgo(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

// ── Lead score badge ───────────────────────────────────────────────────────────
function ScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? "bg-red-500/15 text-red-400 ring-red-500/30"
              : score >= 40 ? "bg-amber-500/15 text-amber-400 ring-amber-500/30"
              : "bg-surface text-muted ring-border";
  const label = score >= 70 ? "🔥 Hot" : score >= 40 ? "⚡ Warm" : "❄️ Cold";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${color}`}>
      {label} · {score}
    </span>
  );
}

// ── Lead signal pill ───────────────────────────────────────────────────────────
const SIGNAL_META: Record<string, { label: string; color: string }> = {
  product_interest: { label: "Product Interest",  color: "bg-blue-500/10 text-blue-400 ring-blue-400/30" },
  price_inquiry:    { label: "Price Inquiry",      color: "bg-green-500/10 text-green-400 ring-green-400/30" },
  quote_requested:  { label: "Quote Requested",    color: "bg-purple-500/10 text-purple-400 ring-purple-400/30" },
  urgency:          { label: "⚡ Urgent",           color: "bg-red-500/10 text-red-400 ring-red-400/30" },
  email_captured:   { label: "📧 Email",           color: "bg-teal-500/10 text-teal-400 ring-teal-400/30" },
  phone_captured:   { label: "📞 Phone",           color: "bg-teal-500/10 text-teal-400 ring-teal-400/30" },
  high_engagement:  { label: "High Engagement",    color: "bg-amber-500/10 text-amber-400 ring-amber-400/30" },
};

function SignalPill({ signal }: { signal: string }) {
  const meta = SIGNAL_META[signal] ?? { label: signal.replace(/_/g, " "), color: "bg-surface text-muted ring-border" };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${meta.color}`}>
      {meta.label}
    </span>
  );
}

// ── Transcript viewer ──────────────────────────────────────────────────────────
function TranscriptViewer({ msgs }: { msgs: Msg[] }) {
  const KEYWORDS = [
    /\b(price|cost|rate|budget|how much|quote|quotation|rupee|₹|rs\.?\s*\d)/gi,
    /\b(urgent|asap|immediately|quickly|this week|jaldi|abhi)/gi,
    /\b(buy|purchase|order|want to get|interested in)/gi,
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    /(\+91[\s-]?)?[6-9]\d{9}/g,
  ];

  function highlight(text: string) {
    let out = text;
    KEYWORDS.forEach(re => {
      out = out.replace(new RegExp(re.source, re.flags), m =>
        `<mark style="background:rgba(217,119,6,0.25);color:#F59E0B;border-radius:2px;padding:0 2px">${m}</mark>`
      );
    });
    return out;
  }

  return (
    <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
      {msgs.map((m, i) => (
        <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
          <div
            className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
              m.role === "user"
                ? "bg-amber-600/20 text-amber-100 rounded-br-sm"
                : "bg-surface text-text rounded-bl-sm border border-border"
            }`}
            dangerouslySetInnerHTML={{ __html: highlight(m.text) }}
          />
        </div>
      ))}
    </div>
  );
}

// ── Stat card ──────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-panel p-4">
      <p className="text-xs text-muted font-medium">{label}</p>
      <p className="mt-1 text-2xl font-bold text-text">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function CommunicationsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter]     = useState<"all" | "hot" | "warm" | "quote">("all");
  const [page, setPage]         = useState(1);
  const [pages, setPages]       = useState(1);

  const load = useCallback(async (p = 1, f = filter) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: "15" });
    if (f === "hot")   params.set("minScore", "70");
    if (f === "warm")  params.set("minScore", "40");
    if (f === "quote") params.set("hasQuote", "true");

    const data = await adminFetch<{ success: boolean; sessions: Session[]; total: number; pages: number }>(
      `/chat-sessions?${params}`
    );
    if (data?.success) {
      setSessions(data.sessions);
      setTotal(data.total);
      setPages(data.pages);
      setPage(p);
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(1, filter); }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Derived stats
  const hotCount   = sessions.filter(s => s.leadScore >= 70).length;
  const warmCount  = sessions.filter(s => s.leadScore >= 40 && s.leadScore < 70).length;
  const quoteCount = sessions.filter(s => s.quoteSubmitted).length;
  const avgScore   = sessions.length ? Math.round(sessions.reduce((a, s) => a + s.leadScore, 0) / sessions.length) : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted">
        <Link href="/admin/dashboard" className="hover:text-accent transition-colors">Dashboard</Link>
        <span>/</span>
        <span className="text-text font-medium">Chat Communications</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Chat Communications</h1>
          <p className="text-sm text-muted mt-1">Last 30 days · {total} conversations captured from Tara AI</p>
        </div>
        <button
          onClick={() => load(page)}
          className="self-start sm:self-auto rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-amber-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Sessions" value={total} sub="Last 30 days" />
        <StatCard label="🔥 Hot Leads" value={hotCount} sub="Score ≥ 70" />
        <StatCard label="⚡ Warm Leads" value={warmCount} sub="Score 40–69" />
        <StatCard label="Quotes Submitted" value={quoteCount} sub="Via Tara AI" />
      </div>

      {/* How lead scoring works */}
      <div className="rounded-2xl border border-border bg-panel p-4">
        <p className="text-xs font-bold text-text mb-2">How Lead Scoring Works</p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "+20 Product Interest", c: "bg-blue-500/10 text-blue-400" },
            { label: "+20 Price Inquiry", c: "bg-green-500/10 text-green-400" },
            { label: "+15 Quote Requested", c: "bg-purple-500/10 text-purple-400" },
            { label: "+15 Urgency Signal", c: "bg-red-500/10 text-red-400" },
            { label: "+10 Email Captured", c: "bg-teal-500/10 text-teal-400" },
            { label: "+10 High Engagement (5+ msgs)", c: "bg-amber-500/10 text-amber-400" },
            { label: "+5 Phone Captured", c: "bg-teal-500/10 text-teal-400" },
          ].map(x => (
            <span key={x.label} className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${x.c}`}>{x.label}</span>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-muted">
          🔥 Hot (≥70) — call within 1 hour · ⚡ Warm (40–69) — follow up today · ❄️ Cold (&lt;40) — nurture via email
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "hot", "warm", "quote"] as const).map(f => (
          <button
            key={f}
            onClick={() => { setFilter(f); }}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              filter === f ? "bg-accent text-white" : "bg-panel border border-border text-muted hover:text-text"
            }`}
          >
            {f === "all" ? "All" : f === "hot" ? "🔥 Hot Leads" : f === "warm" ? "⚡ Warm Leads" : "📋 Quote Submitted"}
          </button>
        ))}
        {total > 0 && <span className="ml-auto self-center text-xs text-muted">Avg score: {avgScore}/100</span>}
      </div>

      {/* Session list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl border border-border bg-panel animate-pulse" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="rounded-2xl border border-border bg-panel py-16 text-center">
          <p className="text-4xl mb-3">💬</p>
          <p className="font-semibold text-text">No conversations yet</p>
          <p className="text-sm text-muted mt-1">Sessions appear here as visitors chat with Tara</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map(s => {
            const isExpanded = expandedId === s._id;
            const userMsgs = s.messages.filter(m => m.role === "user").length;
            return (
              <div
                key={s._id}
                className="rounded-2xl border bg-panel transition-all duration-200"
                style={{ borderColor: s.leadScore >= 70 ? "rgba(239,68,68,0.3)" : s.leadScore >= 40 ? "rgba(245,158,11,0.3)" : "var(--color-border)" }}
              >
                {/* Row header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : s._id)}
                  className="w-full text-left px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Score circle */}
                    <div
                      className="h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-xs font-black"
                      style={{
                        background: s.leadScore >= 70 ? "rgba(239,68,68,0.15)" : s.leadScore >= 40 ? "rgba(245,158,11,0.15)" : "var(--color-surface)",
                        color: s.leadScore >= 70 ? "#EF4444" : s.leadScore >= 40 ? "#F59E0B" : "var(--color-muted)",
                        border: `2px solid ${s.leadScore >= 70 ? "#EF4444" : s.leadScore >= 40 ? "#F59E0B" : "var(--color-border)"}`,
                      }}
                    >
                      {s.leadScore}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <ScoreBadge score={s.leadScore} />
                        {s.quoteSubmitted && (
                          <span className="text-[11px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full ring-1 ring-green-400/30">
                            ✅ Quote Submitted
                          </span>
                        )}
                      </div>
                      {/* Contact captured */}
                      {(s.emailCaptured || s.phoneCaptured) && (
                        <div className="mt-1 flex items-center gap-3 text-xs">
                          {s.emailCaptured && <span className="text-teal-400 font-medium">📧 {s.emailCaptured}</span>}
                          {s.phoneCaptured && <span className="text-teal-400 font-medium">📞 {s.phoneCaptured}</span>}
                        </div>
                      )}
                      {/* Signal pills */}
                      {s.leadSignals.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {s.leadSignals.map(sig => <SignalPill key={sig} signal={sig} />)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 sm:text-right">
                    <div className="text-xs text-muted">
                      <div>{userMsgs} msg{userMsgs !== 1 ? "s" : ""}</div>
                      <div>{timeAgo(s.lastActivityAt)}</div>
                    </div>
                    <svg
                      width="14" height="14" viewBox="0 0 14 14" fill="none"
                      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                      className={`text-muted transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                    >
                      <path d="M2 4l5 6 5-6" />
                    </svg>
                  </div>
                </button>

                {/* Expanded: transcript + metadata */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-border/50">
                    {/* Metadata strip */}
                    <div className="flex flex-wrap gap-x-6 gap-y-1 py-3 text-xs text-muted">
                      <span>Started: <strong className="text-text">{fmtDate(s.startedAt)}</strong></span>
                      <span>Last active: <strong className="text-text">{fmtDate(s.lastActivityAt)}</strong></span>
                      <span>Messages: <strong className="text-text">{s.messages.length}</strong></span>
                      {s.productsDiscussed.length > 0 && (
                        <span>Products: <strong className="text-text">{s.productsDiscussed.slice(0, 3).join(", ")}</strong></span>
                      )}
                    </div>

                    {/* Action row */}
                    <div className="flex gap-2 mb-3">
                      {s.emailCaptured && (
                        <a
                          href={`mailto:${s.emailCaptured}?subject=Follow-up from Tara Maa Solutions&body=Hello, thank you for chatting with us today.`}
                          target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-1.5 text-xs font-bold text-white hover:bg-amber-700 transition-colors"
                        >
                          <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="1.5"><rect x="1" y="2.5" width="12" height="9" rx="1.5"/><path d="M1 4l6 4.5L13 4"/></svg>
                          Follow Up via Email
                        </a>
                      )}
                      {s.phoneCaptured && (
                        <a
                          href={`tel:${s.phoneCaptured.replace(/\s/g, "")}`}
                          className="inline-flex items-center gap-1.5 rounded-full bg-green-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-green-700 transition-colors"
                        >
                          <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="1.5"><path d="M2 2h3l1.5 3.5-1.8 1.1c.9 1.8 2.2 3.1 4 4l1.1-1.8L13 10v3a1 1 0 01-1 1C5.4 13.3 1 8.3 1 3a1 1 0 011-1z" strokeLinejoin="round"/></svg>
                          Call Now
                        </a>
                      )}
                    </div>

                    {/* Transcript with highlighted keywords */}
                    <div className="rounded-xl border border-border bg-surface p-3">
                      <p className="text-[11px] font-bold text-muted mb-2 uppercase tracking-wider">
                        Conversation · <span style={{ color: "#F59E0B" }}>highlighted = lead signals</span>
                      </p>
                      {s.messages.length > 0
                        ? <TranscriptViewer msgs={s.messages} />
                        : <p className="text-xs text-muted text-center py-4">No messages recorded</p>
                      }
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => load(page - 1)}
            disabled={page === 1}
            className="rounded-full border border-border px-4 py-1.5 text-sm font-medium disabled:opacity-40 hover:bg-border/50 transition-colors"
          >
            ← Prev
          </button>
          <span className="text-sm text-muted">Page {page} of {pages}</span>
          <button
            onClick={() => load(page + 1)}
            disabled={page === pages}
            className="rounded-full border border-border px-4 py-1.5 text-sm font-medium disabled:opacity-40 hover:bg-border/50 transition-colors"
          >
            Next →
          </button>
        </div>
      )}

      {/* Nav to dashboard */}
      <div className="pt-4 border-t border-border/50 text-center">
        <Link href="/admin/dashboard" className="text-sm text-muted hover:text-accent transition-colors">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
