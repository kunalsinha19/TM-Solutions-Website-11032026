"use client";

import { useEffect, useState, useCallback } from "react";
import { getAccessToken } from "../../../lib/auth";

// ── Types ──────────────────────────────────────────────────────────────────────
type TranscriptMsg = { role: "user" | "bot"; text: string };
type QuoteRow = {
  _id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  message: string;
  source?: "form" | "chat";
  status: "new" | "reviewed" | "closed";
  product?: { _id: string; name: string; slug: string } | null;
  sourcePage?: string;
  captchaVerified?: boolean;
  createdAt: string;
  repliedAt?: string | null;
  replySubject?: string;
  replyMessage?: string;
  chatTranscript?: TranscriptMsg[];
};
type Filter = "all" | "new" | "reviewed" | "closed";

// ── API helpers ────────────────────────────────────────────────────────────────
function apiBase() {
  const raw = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api").replace(/\/+$/, "");
  return raw.endsWith("/api") ? raw : `${raw}/api`;
}
async function adminFetch<T>(path: string): Promise<T | null> {
  const token = getAccessToken();
  if (!token) return null;
  try {
    const r = await fetch(`${apiBase()}${path}`, {
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    });
    if (!r.ok) return null;
    return r.json() as Promise<T>;
  } catch { return null; }
}
async function adminMutate<T>(path: string, body: object, method = "POST"): Promise<T | null> {
  const token = getAccessToken();
  if (!token) return null;
  try {
    const r = await fetch(`${apiBase()}${path}`, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    if (!r.ok) return null;
    return r.json() as Promise<T>;
  } catch { return null; }
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function timeAgo(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
function statusColor(s: string) {
  if (s === "new")      return "bg-accent/15 text-accent border border-accent/30";
  if (s === "reviewed") return "bg-amber-500/15 text-amber-600 border border-amber-500/30";
  if (s === "closed")   return "bg-green-600/15 text-green-700 border border-green-600/30";
  return "bg-border text-muted";
}
function sourceColor(s?: string) {
  if (s === "chat") return "bg-purple-500/15 text-purple-600 border border-purple-500/30";
  return "bg-border/50 text-muted border border-border";
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function Badge({ cls, label }: { cls: string; label: string }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${cls}`}>{label}</span>;
}

function SkeletonRows() {
  return (
    <>
      {[...Array(5)].map((_, i) => (
        <tr key={i} className="border-b border-border animate-pulse">
          {[...Array(7)].map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 bg-border rounded w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// Transcript bubble viewer with key highlights
function TranscriptViewer({ quote }: { quote: QuoteRow }) {
  const transcript = quote.chatTranscript ?? [];
  if (transcript.length === 0) return null;

  // Key info extracted from the submitted quote data
  const highlights = [
    { label: "Name",    value: quote.name },
    { label: "Email",   value: quote.email },
    quote.company ? { label: "Company", value: quote.company } : null,
    quote.phone   ? { label: "Phone",   value: quote.phone }   : null,
    quote.product ? { label: "Product", value: quote.product.name } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="mt-4 rounded-2xl border border-border bg-surface overflow-hidden">
      <div className="px-4 py-2 border-b border-border flex items-center gap-2">
        <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4 shrink-0" style={{ color: "var(--color-accent)" }}>
          <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v7a2 2 0 01-2 2H6l-4 4V5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--color-accent)" }}>
          Chat Transcript · {transcript.length} messages
        </span>
      </div>

      {/* Key highlights strip */}
      {highlights.length > 0 && (
        <div className="px-4 py-3 border-b border-border flex flex-wrap gap-2">
          {highlights.map(h => (
            <span key={h.label} className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
              style={{ background: "var(--color-accent-light)", border: "1px solid var(--color-gold)", color: "var(--color-warm)" }}>
              <span className="opacity-70">{h.label}:</span>
              <span>{h.value}</span>
            </span>
          ))}
        </div>
      )}

      {/* Bubbles */}
      <div className="p-4 flex flex-col gap-2 max-h-72 overflow-y-auto">
        {transcript.map((msg, i) => {
          const isUser = msg.role === "user";
          // Highlight messages that contain the email (key identifier)
          const isKeyMsg = msg.text.toLowerCase().includes(quote.email.toLowerCase());
          return (
            <div key={i} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                isKeyMsg
                  ? "ring-2 ring-offset-1"
                  : ""
              } ${isUser
                  ? "rounded-br-sm"
                  : "rounded-bl-sm"
              }`}
                style={
                  isUser
                    ? { background: "linear-gradient(135deg,var(--color-accent),var(--color-warm))", color: "#fff",
                        ...(isKeyMsg ? { outlineColor: "var(--color-warm)" } : {}) }
                    : { background: "var(--color-panel)", color: "var(--color-text)", border: "1px solid var(--color-border)",
                        ...(isKeyMsg ? { borderColor: "var(--color-accent)" } : {}) }
                }>
                {msg.text}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Expanded quote detail panel
function QuoteDetail({
  quote,
  onStatusChange,
  onReply,
}: {
  quote: QuoteRow;
  onStatusChange: (id: string, status: string) => Promise<void>;
  onReply: (id: string, subject: string, message: string) => Promise<{ mailto?: string } | null>;
}) {
  const [statusLoading, setStatusLoading] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [subject, setSubject]   = useState(`Re: Your quote request - ${quote.name}`);
  const [message, setMessage]   = useState("");
  const [replySending, setReplySending] = useState(false);
  const [replyResult, setReplyResult]   = useState<{ ok: boolean; mailto?: string; msg?: string } | null>(null);

  async function handleStatus(newStatus: string) {
    setStatusLoading(true);
    await onStatusChange(quote._id, newStatus);
    setStatusLoading(false);
  }

  async function handleReply() {
    if (!message.trim()) return;
    setReplySending(true);
    const res = await onReply(quote._id, subject, message);
    if (res) {
      setReplyResult({ ok: true, mailto: (res as { mailto?: string }).mailto, msg: "Reply saved." });
    } else {
      setReplyResult({ ok: false, msg: "Failed to send reply." });
    }
    setReplySending(false);
  }

  return (
    <div className="mt-4 space-y-4">
      {/* Key info row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: "Name",    v: quote.name },
          { l: "Email",   v: quote.email, link: `mailto:${quote.email}` },
          { l: "Company", v: quote.company || "—" },
          { l: "Phone",   v: quote.phone  || "—" },
        ].map(({ l, v, link }) => (
          <div key={l} className="rounded-xl p-3" style={{ background: "var(--color-accent-light)", border: "1px solid var(--color-gold)" }}>
            <div className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "var(--color-warm)" }}>{l}</div>
            {link
              ? <a href={link} className="text-sm font-semibold break-all" style={{ color: "var(--color-accent)" }}>{v}</a>
              : <div className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>{v}</div>
            }
          </div>
        ))}
      </div>

      {/* Message */}
      <div className="rounded-2xl border border-border bg-panel p-4">
        <div className="text-[10px] font-bold uppercase tracking-widest text-muted mb-2">Message / Requirement</div>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{quote.message}</p>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap gap-3 text-xs text-muted">
        {quote.product && (
          <span>Product: <strong className="text-text">{quote.product.name}</strong></span>
        )}
        {quote.sourcePage && (
          <span>From page: <strong className="text-text">{quote.sourcePage}</strong></span>
        )}
        <span>Submitted: <strong className="text-text">{fmtDate(quote.createdAt)}</strong></span>
        {quote.repliedAt && (
          <span>Replied: <strong className="text-text">{fmtDate(quote.repliedAt)}</strong></span>
        )}
        {quote.replyMessage && (
          <span className="text-green-600">✓ Reply on record</span>
        )}
      </div>

      {/* Chat transcript */}
      <TranscriptViewer quote={quote} />

      {/* Action bar */}
      <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-border">
        <span className="text-xs text-muted mr-1">Change status:</span>
        {(["new", "reviewed", "closed"] as const).filter(s => s !== quote.status).map(s => (
          <button key={s} disabled={statusLoading}
            onClick={() => handleStatus(s)}
            className="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-opacity disabled:opacity-50"
            style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text)" }}>
            {statusLoading ? "…" : `Mark ${s}`}
          </button>
        ))}
        <button onClick={() => { setReplyOpen(o => !o); setReplyResult(null); }}
          className="ml-auto px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide"
          style={{ background: "linear-gradient(135deg,var(--color-accent),var(--color-warm))", color: "#fff" }}>
          {replyOpen ? "Close Reply" : "↩ Reply"}
        </button>
      </div>

      {/* Reply panel */}
      {replyOpen && (
        <div className="rounded-2xl border border-border bg-panel p-4 space-y-3">
          <div className="text-xs font-bold uppercase tracking-widest text-muted">Reply to {quote.email}</div>
          <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject"
            className="w-full rounded-xl px-3 py-2 text-sm border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-accent/40" />
          <textarea value={message} onChange={e => setMessage(e.target.value)}
            placeholder="Write your reply…" rows={5}
            className="w-full rounded-xl px-3 py-2 text-sm border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-accent/40 resize-none" />
          <div className="flex gap-2 items-center">
            <button onClick={handleReply} disabled={replySending || !message.trim()}
              className="px-5 py-2 rounded-full text-sm font-bold disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,var(--color-accent),var(--color-warm))", color: "#fff" }}>
              {replySending ? "Sending…" : "Send Reply"}
            </button>
            {replyResult && (
              <span className={`text-xs font-semibold ${replyResult.ok ? "text-green-600" : "text-red-500"}`}>
                {replyResult.msg}
                {replyResult.mailto && (
                  <a href={replyResult.mailto} className="ml-2 underline" target="_blank" rel="noopener">
                    Open in email client
                  </a>
                )}
              </span>
            )}
          </div>
          {quote.replyMessage && (
            <div className="text-xs text-muted border-t border-border pt-2 mt-1">
              <div className="font-bold mb-1">Previous reply:</div>
              <div className="whitespace-pre-wrap">{quote.replyMessage}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function AdminQuotesPage() {
  const [quotes, setQuotes]     = useState<QuoteRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState<Filter>("all");
  const [search, setSearch]     = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [tick, setTick]         = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await adminFetch<{ success: boolean; quoteRequests: QuoteRow[] }>("/quotes");
    if (res?.success) setQuotes(res.quoteRequests);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load, tick]);

  const handleStatusChange = useCallback(async (id: string, status: string) => {
    const res = await adminMutate<{ success: boolean; quoteRequest: QuoteRow }>(`/quotes/${id}`, { status }, "PUT");
    if (res?.success) {
      setQuotes(qs => qs.map(q => q._id === id ? { ...q, status: res.quoteRequest.status } : q));
    }
  }, []);

  const handleReply = useCallback(async (id: string, subject: string, message: string) => {
    const res = await adminMutate<{ success: boolean; quoteRequest: QuoteRow; mailto?: string }>(
      `/quotes/${id}/reply`, { subject, message }
    );
    if (res?.success) {
      setQuotes(qs => qs.map(q => q._id === id ? { ...q, ...res.quoteRequest } : q));
    }
    return res;
  }, []);

  // Filter + search
  const visible = quotes.filter(q => {
    if (filter !== "all" && q.status !== filter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        q.name.toLowerCase().includes(s) ||
        q.email.toLowerCase().includes(s) ||
        (q.company ?? "").toLowerCase().includes(s) ||
        q.message.toLowerCase().includes(s)
      );
    }
    return true;
  });

  // Counts for filter tabs
  const counts: Record<string, number> = { all: quotes.length };
  for (const q of quotes) counts[q.status] = (counts[q.status] || 0) + 1;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Quote Requests</h1>
          <p className="text-sm text-muted mt-0.5">All customer inquiries, chat and form submissions</p>
        </div>
        <button onClick={() => setTick(t => t + 1)}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border border-border bg-panel hover:border-accent/40 transition-colors">
          <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth="2">
            <path d="M13.65 2.35A8 8 0 1 0 15 8h-2"/>
            <path d="M13 2h2v2"/>
          </svg>
          Refresh
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total",    value: counts.all || 0, cls: "text-accent" },
          { label: "New",      value: counts.new || 0, cls: "text-blue-500" },
          { label: "Reviewed", value: counts.reviewed || 0, cls: "text-amber-500" },
          { label: "Closed",   value: counts.closed || 0, cls: "text-green-600" },
        ].map(({ label, value, cls }) => (
          <div key={label} className="rounded-2xl border border-border bg-panel p-4 text-center">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1">{label}</div>
            <div className={`text-2xl font-extrabold tabular-nums ${cls}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Filters + search */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex gap-1 p-1 rounded-2xl border border-border bg-panel">
          {(["all", "new", "reviewed", "closed"] as Filter[]).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${
                filter === f
                  ? "text-white"
                  : "text-muted hover:text-text"
              }`}
              style={filter === f ? { background: "linear-gradient(135deg,var(--color-accent),var(--color-warm))" } : {}}>
              {f} {counts[f] != null ? <span className="opacity-70">({counts[f] ?? 0})</span> : ""}
            </button>
          ))}
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search name, email, company…"
          className="ml-auto rounded-xl px-3 py-1.5 text-sm border border-border bg-panel focus:outline-none focus:ring-2 focus:ring-accent/40 w-56" />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface text-left">
                {["Name", "Email / Company", "Product", "Source", "Status", "Date", ""].map(h => (
                  <th key={h} className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows />
              ) : visible.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-muted">
                    {search ? "No quotes match your search." : "No quotes yet."}
                  </td>
                </tr>
              ) : (
                visible.map(q => (
                  <>
                    <tr key={q._id}
                      className={`border-b border-border transition-colors ${
                        expanded === q._id ? "bg-accent/5" : "hover:bg-surface/60"
                      }`}>
                      <td className="px-4 py-3 font-semibold whitespace-nowrap">{q.name}</td>
                      <td className="px-4 py-3 max-w-[180px]">
                        <div className="text-accent truncate">{q.email}</div>
                        {q.company && <div className="text-xs text-muted truncate">{q.company}</div>}
                      </td>
                      <td className="px-4 py-3 text-muted max-w-[140px] truncate">
                        {q.product?.name ?? <span className="italic opacity-50">General</span>}
                      </td>
                      <td className="px-4 py-3">
                        <Badge cls={sourceColor(q.source)} label={q.source ?? "form"} />
                      </td>
                      <td className="px-4 py-3">
                        <Badge cls={statusColor(q.status)} label={q.status} />
                      </td>
                      <td className="px-4 py-3 text-muted whitespace-nowrap text-xs">
                        <div>{timeAgo(q.createdAt)}</div>
                        <div className="opacity-60">{fmtDate(q.createdAt).split(",")[0]}</div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setExpanded(e => e === q._id ? null : q._id)}
                          className="px-3 py-1 rounded-full text-xs font-bold transition-all"
                          style={expanded === q._id
                            ? { background: "var(--color-accent)", color: "#fff" }
                            : { background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text)" }
                          }>
                          {expanded === q._id ? "Close" : "View"}
                        </button>
                      </td>
                    </tr>

                    {expanded === q._id && (
                      <tr key={`${q._id}-detail`} className="border-b border-border bg-accent/5">
                        <td colSpan={7} className="px-6 py-4">
                          <QuoteDetail
                            quote={q}
                            onStatusChange={handleStatusChange}
                            onReply={handleReply}
                          />
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {!loading && visible.length > 0 && (
          <div className="px-4 py-3 border-t border-border text-xs text-muted text-right">
            Showing {visible.length} of {quotes.length} quote{quotes.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  );
}
