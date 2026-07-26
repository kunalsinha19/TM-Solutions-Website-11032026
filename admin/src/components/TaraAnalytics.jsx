import { useState, useEffect, useRef } from "react";
import { api } from "../lib/api.js";

/* ─── Animated counter ───────────────────────────────────────────── */
function useCountUp(target, duration = 900) {
  const [v, setV] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    if (!target) { setV(0); return; }
    const start = Date.now();
    const step = () => {
      const p = Math.min((Date.now() - start) / duration, 1);
      setV(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return v;
}

/* ─── Micro sparkline ────────────────────────────────────────────── */
function Sparkline({ data = [], color = "#6366f1" }) {
  if (data.length < 2) return null;
  const vals = data.map(d => d.count ?? d);
  const max = Math.max(...vals, 1);
  const W = 160, H = 36;
  const pts = vals.map((v, i) => [
    (i / (vals.length - 1)) * W,
    H - (v / max) * H * 0.82 + 2,
  ]);
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const fill = `${line} L${W},${H} L0,${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: H }}>
      <path d={fill} fill={color} fillOpacity={0.12} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── KPI card ────────────────────────────────────────────────────── */
function KpiCard({ label, value, suffix = "", sub, color = "#6366f1", spark, icon }) {
  const num = typeof value === "number" ? value : 0;
  const animated = useCountUp(num);
  return (
    <div className="panel" style={{ padding: "1rem 1.25rem", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: 3, height: "100%", background: color, borderRadius: "8px 0 0 8px" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, color: "var(--muted)", margin: 0 }}>{label}</p>
          <p style={{ fontSize: 26, fontWeight: 700, color, margin: "4px 0 2px" }}>{animated.toLocaleString()}{suffix}</p>
          {sub && <p style={{ fontSize: 11, color: "var(--muted)", margin: 0 }}>{sub}</p>}
        </div>
        {icon && <span style={{ fontSize: 22, opacity: 0.7 }}>{icon}</span>}
      </div>
      {spark && <div style={{ marginTop: 8 }}><Sparkline data={spark} color={color} /></div>}
    </div>
  );
}

/* ─── Funnel bar ─────────────────────────────────────────────────── */
function FunnelBar({ label, count, total, color }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
        <span style={{ fontWeight: 600 }}>{label}</span>
        <span style={{ color: "var(--muted)" }}>{count.toLocaleString()} <span style={{ color }}>{pct}%</span></span>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: "var(--surface)", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 4, transition: "width 0.8s ease" }} />
      </div>
    </div>
  );
}

/* ─── Score donut ────────────────────────────────────────────────── */
function ScoreDonut({ hot = 0, warm = 0, cool = 0 }) {
  const total = hot + warm + cool || 1;
  const hotPct  = (hot  / total) * 100;
  const warmPct = (warm / total) * 100;
  const coolPct = (cool / total) * 100;

  // SVG donut
  const R = 40, C = 50, stroke = 16;
  const circ = 2 * Math.PI * R;
  const segments = [
    { pct: hotPct,  color: "#ef4444", label: "Hot", count: hot },
    { pct: warmPct, color: "#f59e0b", label: "Warm", count: warm },
    { pct: coolPct, color: "#94a3b8", label: "Cool", count: cool },
  ];

  let offset = 0;
  const paths = segments.map(seg => {
    const dash = (seg.pct / 100) * circ;
    const gap  = circ - dash;
    const path = { ...seg, dash, gap, offset };
    offset += dash;
    return path;
  });

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
      <svg viewBox="0 0 100 100" style={{ width: 90, height: 90, flexShrink: 0 }}>
        {paths.map((p, i) => (
          <circle
            key={i}
            cx={C} cy={C} r={R}
            fill="none"
            stroke={p.color}
            strokeWidth={stroke}
            strokeDasharray={`${p.dash} ${p.gap}`}
            strokeDashoffset={-p.offset}
            style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%", transition: "stroke-dasharray 0.8s ease" }}
          />
        ))}
        <text x="50" y="50" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 11, fontWeight: 700, fill: "var(--text)" }}>{total}</text>
        <text x="50" y="62" textAnchor="middle" style={{ fontSize: 7, fill: "var(--muted)" }}>leads</text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {segments.map(s => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: s.color, flexShrink: 0 }} />
            <span style={{ fontWeight: 600 }}>{s.label}</span>
            <span style={{ color: "var(--muted)" }}>{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Horizontal bar ─────────────────────────────────────────────── */
function HBar({ label, count, max, color }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, marginBottom: 6 }}>
      <span style={{ width: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flexShrink: 0, title: label }}>{label}</span>
      <div style={{ flex: 1, height: 8, borderRadius: 4, background: "var(--surface)", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 4, transition: "width 0.6s ease" }} />
      </div>
      <span style={{ color: "var(--muted)", minWidth: 24, textAlign: "right" }}>{count}</span>
    </div>
  );
}

/* ─── Signal chip ────────────────────────────────────────────────── */
const SIGNAL_COLORS = {
  product_interest: "#6366f1", price_inquiry: "#f59e0b", quote_requested: "#10b981",
  urgency: "#ef4444", email_captured: "#8b5cf6", phone_captured: "#ec4899",
  high_engagement: "#06b6d4", quantity_mentioned: "#f97316", timeline_mentioned: "#14b8a6",
  industry_mentioned: "#a78bfa",
};

/* ─── Main TaraAnalytics ─────────────────────────────────────────── */
export default function TaraAnalytics({ token }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    api.getTaraStats(token)
      .then(d => setStats(d?.stats ?? null))
      .catch(e => setError(e.message || "Failed to load Tara stats"))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return (
    <div style={{ textAlign: "center", padding: "3rem", color: "var(--muted)" }}>
      <div className="dash-spinner" style={{ margin: "0 auto 0.75rem" }} />
      Loading Tara analytics…
    </div>
  );

  if (error) return (
    <div className="feedback error">{error}</div>
  );

  if (!stats) return null;

  const { totalSessions, emailCaptures, phoneCaptures, quoteRequests, quoteSubmitted,
    avgLeadScore, maxLeadScore, emailCaptureRate, quoteRequestRate,
    scoreDistribution, topProducts, topSignals, dailyActivity } = stats;

  const maxProd = topProducts?.[0]?.count ?? 1;
  const maxSig  = topSignals?.[0]?.count  ?? 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── KPI row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
        <KpiCard label="Total Sessions"    value={totalSessions} color="#6366f1" icon="💬" spark={dailyActivity} />
        <KpiCard label="Emails Captured"   value={emailCaptures} suffix="" color="#8b5cf6" icon="✉️"
          sub={`${emailCaptureRate}% capture rate`} />
        <KpiCard label="Phone Captured"    value={phoneCaptures} color="#ec4899" icon="📞" />
        <KpiCard label="Quote Requested"   value={quoteRequests} color="#10b981" icon="📋"
          sub={`${quoteRequestRate}% of sessions`} />
        <KpiCard label="Quote Submitted"   value={quoteSubmitted} color="#22c55e" icon="✅" />
        <KpiCard label="Avg Lead Score"    value={Math.round(avgLeadScore)} suffix="/100" color="#f59e0b" icon="⭐"
          sub={`Peak: ${maxLeadScore}`} />
      </div>

      {/* ── Middle row: Funnel + Donut + Products ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>

        {/* Lead funnel */}
        <div className="panel" style={{ padding: "1rem 1.25rem" }}>
          <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Conversion Funnel</p>
          <FunnelBar label="Sessions"       count={totalSessions}  total={totalSessions} color="#6366f1" />
          <FunnelBar label="Email Captured" count={emailCaptures}  total={totalSessions} color="#8b5cf6" />
          <FunnelBar label="Phone Captured" count={phoneCaptures}  total={totalSessions} color="#ec4899" />
          <FunnelBar label="Quote Intent"   count={quoteRequests}  total={totalSessions} color="#f59e0b" />
          <FunnelBar label="Quote Sent"     count={quoteSubmitted} total={totalSessions} color="#10b981" />
        </div>

        {/* Score distribution */}
        <div className="panel" style={{ padding: "1rem 1.25rem" }}>
          <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Lead Score Distribution</p>
          <ScoreDonut
            hot={scoreDistribution?.hot ?? 0}
            warm={scoreDistribution?.warm ?? 0}
            cool={scoreDistribution?.cool ?? 0}
          />
          <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 8, background: "var(--surface)", fontSize: 11 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="muted">Avg Score</span>
              <strong style={{ color: "#f59e0b" }}>{avgLeadScore.toFixed(1)}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <span className="muted">Best Score</span>
              <strong style={{ color: "#ef4444" }}>{maxLeadScore}</strong>
            </div>
          </div>
        </div>

        {/* Top products discussed */}
        <div className="panel" style={{ padding: "1rem 1.25rem" }}>
          <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Top Products Discussed</p>
          {topProducts?.length > 0 ? (
            topProducts.map(p => (
              <HBar key={p._id} label={p._id} count={p.count} max={maxProd} color="#b45309" />
            ))
          ) : (
            <p style={{ fontSize: 12, color: "var(--muted)" }}>No product discussions yet.</p>
          )}
        </div>
      </div>

      {/* ── Bottom row: Signals + Daily activity ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>

        {/* Lead signals breakdown */}
        <div className="panel" style={{ padding: "1rem 1.25rem" }}>
          <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Intent Signals Fired</p>
          {topSignals?.length > 0 ? (
            topSignals.map(s => {
              const color = SIGNAL_COLORS[s._id] ?? "#6b7280";
              return (
                <div key={s._id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{
                    padding: "2px 8px", borderRadius: 99, fontSize: 10, fontWeight: 600,
                    background: color + "18", color, border: `1px solid ${color}33`,
                    flexShrink: 0,
                  }}>
                    {s._id.replace(/_/g, " ")}
                  </span>
                  <div style={{ flex: 1, height: 6, borderRadius: 3, background: "var(--surface)" }}>
                    <div style={{ width: `${(s.count / maxSig) * 100}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.6s ease" }} />
                  </div>
                  <span style={{ fontSize: 11, color: "var(--muted)", minWidth: 20, textAlign: "right" }}>{s.count}</span>
                </div>
              );
            })
          ) : (
            <p style={{ fontSize: 12, color: "var(--muted)" }}>No signals fired yet.</p>
          )}
        </div>

        {/* Daily activity sparkline */}
        <div className="panel" style={{ padding: "1rem 1.25rem" }}>
          <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>Daily Chat Activity — Last 30 Days</p>
          {dailyActivity?.length > 1 ? (
            <>
              <Sparkline data={dailyActivity} color="#6366f1" />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--muted)", marginTop: 4 }}>
                <span>{dailyActivity[0]?._id?.slice(5)}</span>
                <span>{dailyActivity[dailyActivity.length - 1]?._id?.slice(5)}</span>
              </div>
              <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {[
                  { label: "Total", v: totalSessions, c: "#6366f1" },
                  { label: "w/ Email", v: emailCaptures, c: "#8b5cf6" },
                  { label: "Quote", v: quoteRequests, c: "#10b981" },
                ].map(({ label, v, c }) => (
                  <div key={label} style={{ padding: "8px 10px", borderRadius: 8, background: "var(--surface)", textAlign: "center" }}>
                    <p style={{ fontSize: 18, fontWeight: 700, color: c, margin: 0 }}>{v}</p>
                    <p style={{ fontSize: 10, color: "var(--muted)", margin: 0 }}>{label}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>Chat activity will appear here once Tara starts receiving visitors.</p>
          )}
        </div>
      </div>
    </div>
  );
}
