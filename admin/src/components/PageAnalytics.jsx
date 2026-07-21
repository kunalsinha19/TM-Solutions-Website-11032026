import { useState, useEffect } from "react";
import { api } from "../lib/api.js";

/* ─── Tiny helpers ────────────────────────────────────────────────── */
function timeAgo(iso) {
  if (!iso) return "—";
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
function fmt(n) { return (n ?? 0).toLocaleString(); }
function pct(a, b) { return b ? `${Math.round((a / b) * 100)}%` : "0%"; }

const SIGNAL_META = {
  product_interest: { label: "Product Interest", color: "#6366f1" },
  price_inquiry:    { label: "Price Inquiry",    color: "#f59e0b" },
  quote_requested:  { label: "Quote Intent",     color: "#10b981" },
  urgency:          { label: "Urgent Buyer",     color: "#ef4444" },
  email_captured:   { label: "Email Captured",   color: "#8b5cf6" },
  phone_captured:   { label: "Phone Captured",   color: "#ec4899" },
  high_engagement:  { label: "High Engagement",  color: "#06b6d4" },
};

function ScoreBadge({ score }) {
  const color = score >= 70 ? "#ef4444" : score >= 40 ? "#f59e0b" : "#6b7280";
  const label = score >= 70 ? "HOT" : score >= 40 ? "WARM" : "COOL";
  return (
    <span style={{
      background: color + "22", color, border: `1px solid ${color}44`,
      padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 700,
      letterSpacing: 1,
    }}>{label} {score}</span>
  );
}

function SignalPill({ signal }) {
  const meta = SIGNAL_META[signal] || { label: signal, color: "#6b7280" };
  return (
    <span style={{
      background: meta.color + "18", color: meta.color,
      border: `1px solid ${meta.color}33`,
      padding: "2px 7px", borderRadius: 99, fontSize: 10, fontWeight: 600,
    }}>{meta.label}</span>
  );
}

/* ─── Mini bar chart ─────────────────────────────────────────────── */
function MiniBarChart({ data = [], color = "#6366f1" }) {
  if (!data.length) return <div className="muted" style={{ fontSize: 12 }}>No data</div>;
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 48 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <div
            title={`${d._id}: ${d.count}`}
            style={{
              width: "100%", background: color,
              height: `${Math.max(3, Math.round((d.count / max) * 40))}px`,
              borderRadius: 2, opacity: 0.85,
            }}
          />
        </div>
      ))}
    </div>
  );
}

/* ─── Sparkline ───────────────────────────────────────────────────── */
function Sparkline({ data = [], color = "#6366f1" }) {
  const vals = data.map(d => (typeof d === "object" ? (d.count ?? 0) : d));
  if (vals.length < 2) return null;
  const max = Math.max(...vals, 1);
  const W = 200, H = 40;
  const pts = vals.map((v, i) => [
    (i / (vals.length - 1)) * W,
    H - (v / max) * H * 0.85 + 2,
  ]);
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const fill = `${line} L${W},${H} L0,${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: H }}>
      <path d={fill} fill={color} fillOpacity={0.12} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Visitor stat card ───────────────────────────────────────────── */
function StatCard({ label, value, sub, color = "#6366f1", spark }) {
  return (
    <div className="panel" style={{ padding: "1rem 1.25rem" }}>
      <div className="muted" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color, marginBottom: 2 }}>{value}</div>
      {sub && <div className="muted" style={{ fontSize: 12 }}>{sub}</div>}
      {spark && <div style={{ marginTop: 8 }}><Sparkline data={spark} color={color} /></div>}
    </div>
  );
}

/* ─── Chat session row ────────────────────────────────────────────── */
function ChatRow({ session }) {
  const [open, setOpen] = useState(false);

  const keywordsRe = /\b(price|cost|quote|urgent|asap|buy|order|machine|product|equipment|delivery|email|phone|₹|rupee)\b/gi;
  function highlight(text) {
    return (text ?? "").replace(keywordsRe, m => `<mark style="background:#fef08a;color:#854d0e;border-radius:2px;padding:0 2px">${m}</mark>`);
  }

  return (
    <div style={{ borderBottom: "1px solid var(--border)", padding: "10px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <ScoreBadge score={session.leadScore ?? 0} />
        <span style={{ fontSize: 12, color: "var(--text)", fontWeight: 500 }}>
          {session.emailCaptured || session.phoneCaptured || session.visitorIp || "Anonymous"}
        </span>
        {session.emailCaptured && (
          <a href={`mailto:${session.emailCaptured}`} style={{ fontSize: 11, color: "#6366f1" }}>{session.emailCaptured}</a>
        )}
        {session.phoneCaptured && (
          <span style={{ fontSize: 11, color: "#10b981" }}>{session.phoneCaptured}</span>
        )}
        <span className="muted" style={{ fontSize: 11, marginLeft: "auto" }}>{timeAgo(session.updatedAt)}</span>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          style={{ fontSize: 11, color: "#6366f1", background: "none", border: "none", cursor: "pointer" }}
        >
          {open ? "▲ Hide" : "▼ View transcript"}
        </button>
      </div>

      {/* Signals */}
      {session.leadSignals?.length > 0 && (
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6 }}>
          {session.leadSignals.map(s => <SignalPill key={s} signal={s} />)}
        </div>
      )}

      {/* Products discussed */}
      {session.productsDiscussed?.length > 0 && (
        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
          Products: {session.productsDiscussed.join(", ")}
        </div>
      )}

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
              <span
                style={{ fontSize: 12, lineHeight: 1.5 }}
                dangerouslySetInnerHTML={{ __html: highlight(m.text) }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Action row */}
      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        {session.emailCaptured && (
          <a
            href={`mailto:${session.emailCaptured}?subject=Following up on your enquiry - TM Solutions`}
            style={{ fontSize: 11, padding: "3px 10px", borderRadius: 6, background: "#6366f1", color: "#fff", textDecoration: "none" }}
          >
            Email Follow-up
          </a>
        )}
        {session.phoneCaptured && (
          <a
            href={`tel:${session.phoneCaptured}`}
            style={{ fontSize: 11, padding: "3px 10px", borderRadius: 6, background: "#10b981", color: "#fff", textDecoration: "none" }}
          >
            Call Now
          </a>
        )}
      </div>
    </div>
  );
}

/* ─── Main PageAnalytics component ───────────────────────────────── */
export default function PageAnalytics({ token }) {
  const [summary,  setSummary]  = useState(null);
  const [insights, setInsights] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [sessionPage, setSessionPage] = useState(1);
  const [sessionTotal, setSessionTotal] = useState(0);
  const [sessionFilter, setSessionFilter] = useState("");
  const [loading, setLoading]  = useState(true);
  const [tab, setTab] = useState("overview"); // "overview" | "chat"

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getAnalyticsSummary(token),
      api.getAnalyticsQuoteInsights(token),
    ]).then(([s, ins]) => {
      setSummary(s?.summary ?? null);
      setInsights(ins?.insights ?? null);
    }).catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    api.getChatSessions(token, { page: sessionPage, filter: sessionFilter })
      .then(d => {
        setSessions(d?.sessions ?? []);
        setSessionTotal(d?.pagination?.total ?? 0);
      })
      .catch(() => {});
  }, [token, sessionPage, sessionFilter]);

  const dailyData  = insights?.quoteTrend ?? [];

  /* device breakdown */
  const devices = insights ? [] : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Tab switcher */}
      <div style={{ display: "flex", gap: 8, borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
        {[["overview", "Visitor Overview"], ["chat", "Tara Chat Leads"]].map(([key, label]) => (
          <button
            key={key} type="button"
            onClick={() => setTab(key)}
            style={{
              padding: "6px 16px", borderRadius: 8, border: "none", cursor: "pointer",
              fontWeight: 600, fontSize: 13,
              background: tab === key ? "var(--accent)" : "var(--surface)",
              color: tab === key ? "#fff" : "var(--muted)",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && <div className="muted" style={{ padding: "2rem", textAlign: "center" }}>Loading analytics…</div>}

      {/* ── OVERVIEW TAB ── */}
      {!loading && tab === "overview" && (
        <>
          {/* KPI row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 12 }}>
            <StatCard label="Total Visitors" value={fmt(summary?.totalVisitors)} color="#6366f1"
              sub={`${fmt(summary?.newVisitors ?? 0)} new`}
              spark={insights?.quoteTrend ?? []} />
            <StatCard label="Today" value={fmt(summary?.todayVisitors)} color="#10b981" sub="unique sessions" />
            <StatCard label="This Week" value={fmt(summary?.weekVisitors)} color="#f59e0b" sub="7-day window" />
            <StatCard label="Live Now" value={fmt(summary?.liveVisitors)} color="#ef4444" sub="active sessions" />
            <StatCard label="Bounce Rate" value={`${summary?.bounceRate ?? 0}%`} color="#8b5cf6" sub="single-page visits" />
            <StatCard label="Avg. Duration" value={summary?.avgDuration ? `${summary.avgDuration}s` : "—"} color="#06b6d4" sub="per session" />
            <StatCard label="Quote Requests" value={fmt(summary?.totalQuotes)} color="#ec4899" sub="all time" />
          </div>

          {/* 30-day trend */}
          {insights?.quoteTrend?.length > 0 && (
            <div className="panel" style={{ padding: "1rem 1.25rem" }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>30-Day Quote Trend</div>
              <MiniBarChart data={insights.quoteTrend} color="#6366f1" />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--muted)", marginTop: 4 }}>
                <span>{insights.quoteTrend[0]?._id}</span>
                <span>{insights.quoteTrend[insights.quoteTrend.length - 1]?._id}</span>
              </div>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {/* Top pages */}
            {insights?.mostQuotedProducts?.length > 0 && (
              <div className="panel" style={{ padding: "1rem 1.25rem" }}>
                <div style={{ fontWeight: 600, marginBottom: 10 }}>Most Quoted Products</div>
                {insights.mostQuotedProducts.slice(0, 6).map((p, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "75%" }}>{p.name}</span>
                    <strong>{p.count}</strong>
                  </div>
                ))}
              </div>
            )}

            {/* Top companies */}
            {insights?.topCompanies?.length > 0 && (
              <div className="panel" style={{ padding: "1rem 1.25rem" }}>
                <div style={{ fontWeight: 600, marginBottom: 10 }}>Top Companies</div>
                {insights.topCompanies.slice(0, 6).map((c, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: "1px solid var(--border)" }}>
                    <span>{c._id}</span>
                    <a href={`mailto:${c.latestEmail}`} style={{ color: "#6366f1", fontSize: 11 }}>{c.count} quotes</a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Demand vs Supply */}
          {insights?.demandSupply?.length > 0 && (
            <div className="panel" style={{ padding: "1rem 1.25rem" }}>
              <div style={{ fontWeight: 600, marginBottom: 10 }}>Category Demand vs. Supply</div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ color: "var(--muted)", textTransform: "uppercase", fontSize: 10 }}>
                      <th style={{ textAlign: "left", padding: "4px 0" }}>Category</th>
                      <th style={{ textAlign: "right", padding: "4px 8px" }}>Demand</th>
                      <th style={{ textAlign: "right", padding: "4px 0" }}>Supply</th>
                      <th style={{ textAlign: "right", padding: "4px 0" }}>Gap</th>
                    </tr>
                  </thead>
                  <tbody>
                    {insights.demandSupply.map((r, i) => {
                      const gap = r.demand - r.supply;
                      return (
                        <tr key={i} style={{ borderTop: "1px solid var(--border)" }}>
                          <td style={{ padding: "5px 0" }}>{r.category}</td>
                          <td style={{ textAlign: "right", padding: "5px 8px", color: "#6366f1", fontWeight: 600 }}>{r.demand}</td>
                          <td style={{ textAlign: "right", padding: "5px 0", color: "#10b981", fontWeight: 600 }}>{r.supply}</td>
                          <td style={{ textAlign: "right", padding: "5px 0", color: gap > 0 ? "#ef4444" : "#10b981", fontWeight: 700 }}>
                            {gap > 0 ? `+${gap} unmet` : "OK"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="muted" style={{ fontSize: 10, marginTop: 8 }}>
                Gap = Demand − Supply. Red = opportunity to add more products.
              </div>
            </div>
          )}
        </>
      )}

      {/* ── CHAT LEADS TAB ── */}
      {tab === "chat" && (
        <>
          {/* Filter bar */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)" }}>Filter:</span>
            {[["", "All"], ["hot", "Hot Leads ≥70"], ["warm", "Warm Leads ≥40"], ["quote", "Quote Intent"]].map(([key, label]) => (
              <button key={key} type="button"
                onClick={() => { setSessionFilter(key); setSessionPage(1); }}
                style={{
                  padding: "4px 12px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12,
                  background: sessionFilter === key ? "var(--accent)" : "var(--surface)",
                  color: sessionFilter === key ? "#fff" : "var(--muted)",
                  fontWeight: sessionFilter === key ? 600 : 400,
                }}
              >
                {label}
              </button>
            ))}
            <span className="muted" style={{ fontSize: 11, marginLeft: "auto" }}>{sessionTotal} sessions (last 30 days)</span>
          </div>

          {/* Session list */}
          <div className="panel" style={{ padding: "1rem 1.25rem" }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Tara Chat Sessions — Last 30 Days</div>
            {sessions.length === 0 ? (
              <p className="muted" style={{ fontSize: 12 }}>No chat sessions found for this filter.</p>
            ) : (
              sessions.map(s => <ChatRow key={s._id ?? s.sessionId} session={s} />)
            )}
          </div>

          {/* Pagination */}
          {sessionTotal > 20 && (
            <div style={{ display: "flex", gap: 8, justifyContent: "center", alignItems: "center" }}>
              <button type="button" disabled={sessionPage <= 1}
                onClick={() => setSessionPage(p => p - 1)}
                style={{ padding: "4px 12px", borderRadius: 6, cursor: "pointer", border: "1px solid var(--border)" }}
              >Prev</button>
              <span style={{ fontSize: 12 }}>Page {sessionPage} of {Math.ceil(sessionTotal / 20)}</span>
              <button type="button" disabled={sessionPage >= Math.ceil(sessionTotal / 20)}
                onClick={() => setSessionPage(p => p + 1)}
                style={{ padding: "4px 12px", borderRadius: 6, cursor: "pointer", border: "1px solid var(--border)" }}
              >Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
