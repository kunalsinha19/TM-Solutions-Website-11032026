import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";

/* ─── Score badge ────────────────────────────────────────────────── */
function ScoreBadge({ score }) {
  const color = score >= 70 ? "#ef4444" : score >= 40 ? "#f59e0b" : "#94a3b8";
  const label = score >= 70 ? "HOT" : score >= 40 ? "WARM" : "COOL";
  return (
    <span style={{
      background: color + "22", color, border: `1px solid ${color}44`,
      padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
    }}>{label} {score}</span>
  );
}

/* ─── Signal pill ────────────────────────────────────────────────── */
const SIG_COLORS = {
  product_interest: "#6366f1", price_inquiry: "#f59e0b", quote_requested: "#10b981",
  urgency: "#ef4444", email_captured: "#8b5cf6", phone_captured: "#ec4899",
  high_engagement: "#06b6d4", quantity_mentioned: "#f97316", timeline_mentioned: "#14b8a6",
  industry_mentioned: "#a78bfa",
};
function Signal({ label }) {
  const color = SIG_COLORS[label] ?? "#6b7280";
  return (
    <span style={{
      background: color + "18", color, border: `1px solid ${color}33`,
      padding: "2px 7px", borderRadius: 99, fontSize: 10, fontWeight: 600,
      marginRight: 4, marginBottom: 4, display: "inline-block",
    }}>
      {label.replace(/_/g, " ")}
    </span>
  );
}

/* ─── Summary bar ─────────────────────────────────────────────────── */
function SummaryBar({ stats }) {
  if (!stats) return null;
  const { hot, warm, cool } = stats.scoreDistribution ?? {};
  return (
    <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
      {[
        { label: "Hot", count: hot ?? 0, color: "#ef4444" },
        { label: "Warm", count: warm ?? 0, color: "#f59e0b" },
        { label: "Cool", count: cool ?? 0, color: "#94a3b8" },
        { label: "Emails", count: stats.emailCaptures ?? 0, color: "#8b5cf6", icon: "✉️" },
        { label: "Phones", count: stats.phoneCaptures ?? 0, color: "#ec4899", icon: "📞" },
        { label: "Quotes", count: stats.quoteRequests ?? 0, color: "#10b981", icon: "📋" },
      ].map(s => (
        <div key={s.label} style={{
          padding: "8px 14px", borderRadius: 12, background: s.color + "12",
          border: `1px solid ${s.color}33`, textAlign: "center", minWidth: 72,
        }}>
          <p style={{ fontSize: 20, fontWeight: 700, color: s.color, margin: 0 }}>{s.count}</p>
          <p style={{ fontSize: 10, color: s.color, margin: 0, fontWeight: 600 }}>
            {s.icon ? `${s.icon} ` : ""}{s.label}
          </p>
        </div>
      ))}
    </div>
  );
}

/* ─── Session card (expandable) ──────────────────────────────────── */
function SessionCard({ session }) {
  const [open, setOpen] = useState(false);

  const kwRe = /\b(price|cost|quote|urgent|asap|buy|order|machine|product|delivery|email|phone|₹)\b/gi;
  const highlight = t => (t ?? "").replace(kwRe, m => `<mark style="background:#fef08a;color:#854d0e;border-radius:2px;padding:0 2px">${m}</mark>`);

  return (
    <div style={{ borderBottom: "1px solid var(--border)", padding: "12px 0" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
        <ScoreBadge score={session.leadScore ?? 0} />

        {/* Contact */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 4 }}>
            {session.emailCaptured
              ? <a href={`mailto:${session.emailCaptured}`} style={{ fontSize: 12, color: "#6366f1", fontWeight: 600 }}>{session.emailCaptured}</a>
              : null
            }
            {session.phoneCaptured
              ? <a href={`tel:${session.phoneCaptured}`} style={{ fontSize: 12, color: "#10b981", fontWeight: 600 }}>{session.phoneCaptured}</a>
              : null
            }
            {!session.emailCaptured && !session.phoneCaptured && (
              <span style={{ fontSize: 12, color: "var(--muted)" }}>Anonymous visitor</span>
            )}
          </div>

          {/* Qualification data */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
            {session.quantityMentioned && <span style={{ fontSize: 11, color: "var(--muted)" }}>📦 {session.quantityMentioned}</span>}
            {session.timelineMentioned && <span style={{ fontSize: 11, color: "var(--muted)" }}>📅 {session.timelineMentioned}</span>}
            {session.industryMentioned  && <span style={{ fontSize: 11, color: "var(--muted)" }}>🏭 {session.industryMentioned}</span>}
          </div>

          {/* Signals */}
          {session.leadSignals?.length > 0 && (
            <div style={{ marginBottom: 4 }}>
              {session.leadSignals.map(s => <Signal key={s} label={s} />)}
            </div>
          )}

          {/* Products */}
          {session.productsDiscussed?.length > 0 && (
            <p style={{ fontSize: 11, color: "var(--muted)", margin: "2px 0" }}>
              Products: {session.productsDiscussed.join(", ")}
            </p>
          )}
        </div>

        {/* Right side */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
          {session.hasQuoteRequest && (
            <span style={{ fontSize: 10, fontWeight: 700, color: "#f59e0b", background: "#f59e0b22", padding: "2px 7px", borderRadius: 99, border: "1px solid #f59e0b44" }}>QUOTE</span>
          )}
          {session.quoteSubmitted && (
            <span style={{ fontSize: 10, fontWeight: 700, color: "#22c55e", background: "#22c55e22", padding: "2px 7px", borderRadius: 99, border: "1px solid #22c55e44" }}>SENT</span>
          )}
          <span style={{ fontSize: 11, color: "var(--muted)" }}>
            {new Date(session.lastActivityAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
          </span>
          <button type="button" onClick={() => setOpen(!open)}
            style={{ fontSize: 11, color: "#6366f1", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            {open ? "▲ Hide" : "▼ Transcript"}
          </button>
        </div>
      </div>

      {/* Transcript */}
      {open && (
        <div style={{ marginTop: 10, background: "var(--surface)", borderRadius: 8, padding: "10px 12px", maxHeight: 260, overflowY: "auto" }}>
          {(session.messages ?? []).map((m, i) => (
            <div key={i} style={{ marginBottom: 6, display: "flex", gap: 8, alignItems: "flex-start" }}>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, flexShrink: 0, marginTop: 2,
                background: m.role === "user" ? "#6366f122" : "#10b98122",
                color: m.role === "user" ? "#6366f1" : "#10b981",
              }}>
                {m.role === "user" ? "Visitor" : "Tara"}
              </span>
              <span style={{ fontSize: 12, lineHeight: 1.5 }} dangerouslySetInnerHTML={{ __html: highlight(m.text) }} />
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        {session.emailCaptured && (
          <a href={`mailto:${session.emailCaptured}?subject=Following up on your enquiry - TM Solutions`}
            style={{ fontSize: 11, padding: "3px 10px", borderRadius: 6, background: "#6366f1", color: "#fff", textDecoration: "none" }}>
            Email Follow-up
          </a>
        )}
        {session.phoneCaptured && (
          <a href={`tel:${session.phoneCaptured}`}
            style={{ fontSize: 11, padding: "3px 10px", borderRadius: 6, background: "#10b981", color: "#fff", textDecoration: "none" }}>
            Call Now
          </a>
        )}
        {session.phoneCaptured && (
          <a
            href={`https://wa.me/${session.phoneCaptured.replace(/\D/g, "")}?text=${encodeURIComponent("Hi, this is TM Solutions following up on your chat enquiry.")}`}
            target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 11, padding: "3px 10px", borderRadius: 6, background: "#25D366", color: "#fff", textDecoration: "none" }}>
            WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}

/* ─── Main LeadsManager ───────────────────────────────────────────── */
export default function LeadsManager({ token }) {
  const [sessions, setSessions] = useState([]);
  const [total, setTotal]  = useState(0);
  const [page, setPage]    = useState(1);
  const [pages, setPages]  = useState(1);
  const [filter, setFilter] = useState("");
  const [taraStats, setTaraStats] = useState(null);
  const [loading, setLoading]  = useState(false);
  const [error, setError]      = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [sessData, statsData] = await Promise.all([
        api.getChatSessions(token, { page, filter }),
        page === 1 ? api.getTaraStats(token).catch(() => null) : Promise.resolve(null),
      ]);
      setSessions(sessData.sessions ?? []);
      setTotal(sessData.total ?? 0);
      setPages(sessData.pages ?? 1);
      if (statsData?.stats) setTaraStats(statsData.stats);
    } catch (e) {
      setError(e.message || "Failed to load leads");
    } finally {
      setLoading(false);
    }
  }, [token, page, filter]);

  useEffect(() => { load(); }, [load]);

  const FILTERS = [
    ["", "All Leads"],
    ["hot", "🔥 Hot (≥70)"],
    ["warm", "🌤 Warm (40–69)"],
    ["quote", "📋 Quote Intent"],
  ];

  return (
    <div>
      {/* Summary bar */}
      {page === 1 && <SummaryBar stats={taraStats} />}

      {/* Filter + toolbar */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6, flex: 1, flexWrap: "wrap" }}>
          {FILTERS.map(([key, label]) => (
            <button key={key} type="button"
              onClick={() => { setFilter(key); setPage(1); }}
              style={{
                padding: "5px 14px", borderRadius: 8, fontSize: 12, cursor: "pointer",
                background: filter === key ? "var(--accent, #b45309)" : "var(--surface)",
                color: filter === key ? "#fff" : "var(--muted)",
                fontWeight: filter === key ? 700 : 400, border: "1px solid var(--border)",
              }}>{label}</button>
          ))}
        </div>
        <span style={{ fontSize: 11, color: "var(--muted)" }}>{total} session{total !== 1 ? "s" : ""}</span>
        <button type="button" className="btn btn-sm" onClick={load} disabled={loading}>Refresh</button>
      </div>

      {error && <p className="error-msg" style={{ marginBottom: 12 }}>{error}</p>}

      {/* List */}
      <div className="panel" style={{ padding: "0.5rem 1.25rem" }}>
        {loading && sessions.length === 0 ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "var(--muted)" }}>
            <div className="dash-spinner" style={{ margin: "0 auto 0.5rem" }} />
            Loading leads…
          </div>
        ) : sessions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <p style={{ fontSize: "1.5rem", marginBottom: 6 }}>💬</p>
            <p className="muted">No chat sessions yet — once visitors talk to Tara, leads appear here.</p>
          </div>
        ) : (
          sessions.map(s => <SessionCard key={s._id} session={s} />)
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 12 }}>
          <button type="button" className="btn btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span style={{ fontSize: 12, color: "var(--muted)", padding: "4px 12px" }}>{page} / {pages}</span>
          <button type="button" className="btn btn-sm" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}
