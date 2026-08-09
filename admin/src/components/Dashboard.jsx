import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "../lib/api.js";

/* ─── Animated counter ──────────────────────────────────────────────── */
function useCountUp(target, duration = 1200) {
  const [count, setCount] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    if (!target) { setCount(0); return; }
    const start = Date.now();
    function step() {
      const p = Math.min((Date.now() - start) / duration, 1);
      setCount(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) raf.current = requestAnimationFrame(step);
    }
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return count;
}

/* ─── Sparkline SVG ─────────────────────────────────────────────────── */
function Sparkline({ data = [], color = "#6366f1", h = 40 }) {
  if (data.length < 2) return null;
  const vals = data.map(d => (typeof d === "object" ? d.count : d));
  const max = Math.max(...vals, 1);
  const w = 120;
  const pts = vals.map((v, i) => [
    (i / (vals.length - 1)) * w,
    h - (v / max) * h * 0.85 + 2,
  ]);
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const fill = `${line} L${w},${h} L0,${h} Z`;
  const gid = `sg${color.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="dash-sparkline">
      <defs>
        <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Country flag emoji ─────────────────────────────────────────────── */
function Flag({ code }) {
  if (!code || code === "LO") return <span>🌐</span>;
  try {
    const pts = [...code.toUpperCase()].map(c => 0x1F1E6 + c.charCodeAt(0) - 65);
    return <span>{String.fromCodePoint(...pts)}</span>;
  } catch { return <span>🌐</span>; }
}

/* ─── Hero KPI card ─────────────────────────────────────────────────── */
function HeroKpi({ label, value, suffix = "", sub, color, sparkline, isFloat, pulse }) {
  const num = isFloat ? value : Math.round(value || 0);
  const animated = useCountUp(isFloat ? Math.round(num * 10) : num);
  const display = isFloat ? (animated / 10).toFixed(1) : animated.toLocaleString();
  return (
    <div className="dash-hero-card">
      <div className="dash-hero-accent" style={{ background: color }} />
      <p className="dash-hero-label">{label}</p>
      <p className="dash-hero-value" style={{ color }}>
        {display}{suffix}
        {pulse && <span className="dash-pulse" style={{ background: color }} />}
      </p>
      {sub && <p className="dash-hero-sub">{sub}</p>}
      {sparkline?.length > 1 && (
        <div className="dash-hero-spark">
          <Sparkline data={sparkline} color={color} h={38} />
        </div>
      )}
    </div>
  );
}

/* ─── Compact metric tile ────────────────────────────────────────────── */
function MetricTile({ label, value, rawValue, suffix = "", color = "#64748b", icon }) {
  const num = Math.round(value || 0);
  const animated = useCountUp(num);
  return (
    <div className="dash-metric-tile">
      <span className="dash-metric-icon">{icon}</span>
      <div>
        <p className="dash-metric-value">{rawValue ?? `${animated.toLocaleString()}${suffix}`}</p>
        <p className="dash-metric-label">{label}</p>
      </div>
    </div>
  );
}

/* ─── Horizontal bar chart ───────────────────────────────────────────── */
function BarChart({ data = [], labelKey = "_id", valueKey = "count", color = "#b45309", truncate = 24 }) {
  if (!data.length) return <p className="dash-empty">No data yet.</p>;
  const max = Math.max(...data.map(d => d[valueKey]), 1);
  return (
    <div className="dash-bar-chart">
      {data.map((row, i) => {
        const lbl = (row[labelKey] || "—").toString();
        const short = lbl.length > truncate ? lbl.slice(0, truncate) + "…" : lbl;
        return (
          <div key={i} className="dash-bar-row">
            <span className="dash-bar-label" title={lbl}>{short}</span>
            <div className="dash-bar-track">
              <div className="dash-bar-fill" style={{ width: `${(row[valueKey] / max) * 100}%`, background: color }} />
            </div>
            <span className="dash-bar-count">{row[valueKey]}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Device + Browser / OS panels ──────────────────────────────────── */
const DEVICE_CFG = { mobile: { icon: "📱", color: "#6366f1" }, tablet: { icon: "💻", color: "#f59e0b" }, desktop: { icon: "🖥️", color: "#10b981" } };
const BROWSER_ICONS = { Chrome: "🌐", Firefox: "🦊", Safari: "🧭", Edge: "🔵", Opera: "🔴", Samsung: "📲" };
const OS_ICONS = { Windows: "🪟", macOS: "🍎", iOS: "📱", Android: "🤖", Linux: "🐧" };

function DevicePanel({ devices = [] }) {
  const total = devices.reduce((s, d) => s + d.count, 0) || 1;
  if (!devices.length) return <p className="dash-empty">No device data yet.</p>;
  return (
    <div className="dash-device-panel">
      {devices.map((d, i) => {
        const cfg = DEVICE_CFG[d._id] || { icon: "💻", color: "#94a3b8" };
        const pct = Math.round((d.count / total) * 100);
        return (
          <div key={i} className="dash-device-row">
            <span className="dash-device-icon">{cfg.icon}</span>
            <div className="dash-device-info">
              <div className="dash-device-meta">
                <span className="dash-device-name">{d._id || "Unknown"}</span>
                <span className="dash-device-pct">{pct}%</span>
              </div>
              <div className="dash-device-track">
                <div className="dash-device-fill" style={{ width: `${pct}%`, background: cfg.color }} />
              </div>
              <span className="dash-device-count">{d.count.toLocaleString()} sessions</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PillList({ items, iconMap, color }) {
  if (!items.length) return <p className="dash-empty">No data yet.</p>;
  const max = items[0]?.count || 1;
  return (
    <div className="dash-pill-list">
      {items.map((item, i) => {
        const icon = iconMap[item._id] || "•";
        const pct = Math.round((item.count / max) * 100);
        return (
          <div key={i} className="dash-pill-row">
            <span className="dash-pill-icon">{icon}</span>
            <span className="dash-pill-label">{item._id || "Other"}</span>
            <div className="dash-pill-bar">
              <div style={{ width: `${pct}%`, background: color, height: "100%", borderRadius: "2px", transition: "width 0.6s ease" }} />
            </div>
            <span className="dash-pill-count">{item.count}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Quote pipeline ─────────────────────────────────────────────────── */
const STATUS_META = {
  pending:  { label: "New Leads",   color: "#f59e0b", bg: "#fef3c7", icon: "🔔" },
  reviewed: { label: "In Review",   color: "#6366f1", bg: "#ede9fe", icon: "🔍" },
  closed:   { label: "Closed",      color: "#10b981", bg: "#d1fae5", icon: "✅" },
};

function QuotePipeline({ statuses = [], total }) {
  if (!total) return <p className="dash-empty">No quote data yet.</p>;
  const byStatus = {};
  statuses.forEach(s => { byStatus[s._id] = s.count; });
  const stages = ["pending", "reviewed", "closed"];
  return (
    <div className="dash-pipeline">
      {stages.map(key => {
        const meta = STATUS_META[key] || { label: key, color: "#94a3b8", bg: "#f1f5f9", icon: "•" };
        const count = byStatus[key] || 0;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div key={key} className="dash-pipeline-stage">
            <div className="dash-pipeline-icon" style={{ background: meta.bg, color: meta.color }}>{meta.icon}</div>
            <div className="dash-pipeline-info">
              <p className="dash-pipeline-label">{meta.label}</p>
              <p className="dash-pipeline-count" style={{ color: meta.color }}>{count}</p>
            </div>
            <div className="dash-pipeline-bar-wrap">
              <div className="dash-pipeline-bar" style={{ width: `${pct}%`, background: meta.color }} />
              <span className="dash-pipeline-pct">{pct}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── New vs Returning visual ────────────────────────────────────────── */
function AudienceSplit({ newV, returning }) {
  const total = (newV + returning) || 1;
  const newPct = Math.round((newV / total) * 100);
  const retPct = 100 - newPct;
  return (
    <div className="dash-audience-split">
      <div className="dash-split-bar">
        <div style={{ width: `${newPct}%`, background: "#6366f1", height: "100%", borderRadius: "4px 0 0 4px", transition: "width 0.8s ease" }} />
        <div style={{ width: `${retPct}%`, background: "#f59e0b", height: "100%", borderRadius: "0 4px 4px 0", transition: "width 0.8s ease" }} />
      </div>
      <div className="dash-split-legend">
        <span><span className="dash-split-dot" style={{ background: "#6366f1" }} />New <strong>{newPct}%</strong></span>
        <span><span className="dash-split-dot" style={{ background: "#f59e0b" }} />Returning <strong>{retPct}%</strong></span>
      </div>
    </div>
  );
}

/* ─── Recent activity list ───────────────────────────────────────────── */
function ActivityList({ items = [] }) {
  if (!items.length) return <p className="dash-empty">No recent activity.</p>;
  const ICONS = { auth: "🔐", product: "📦", category: "🗂️", seo: "🔍", settings: "⚙️", quote: "📧", brochure: "📄", admin: "👤", youtube: "▶️" };
  return (
    <ul className="dash-activity-list">
      {items.map((a, i) => (
        <li key={i} className="dash-activity-item">
          <span className="dash-activity-icon">{ICONS[a.category] || "📝"}</span>
          <div className="dash-activity-body">
            <p className="dash-activity-action">{a.action.replace(/_/g, " ")}</p>
            <p className="dash-activity-detail">{a.adminName || "System"} · {a.details || ""}</p>
          </div>
          <span className="dash-activity-time">
            {new Date(a.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </li>
      ))}
    </ul>
  );
}

/* ─── Helpers ────────────────────────────────────────────────────────── */
function fmtDuration(secs) {
  if (!secs) return "0s";
  if (secs < 60) return `${secs}s`;
  return `${Math.floor(secs / 60)}m ${secs % 60}s`;
}
function timeAgo(date) {
  if (!date) return "";
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60)    return `${s}s ago`;
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
function Panel({ eyebrow, title, children, action }) {
  return (
    <div className="panel dash-panel">
      <div className="dash-panel-header">
        <div>
          {eyebrow && <p className="dash-eyebrow">{eyebrow}</p>}
          <h3 className="dash-panel-title">{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

/* ─── Tara mini stats ─────────────────────────────────────────────────── */
function TaraMiniStats({ taraStats }) {
  if (!taraStats) return null;
  const { totalSessions, emailCaptures, quoteRequests, avgLeadScore, scoreDistribution } = taraStats;
  const tiles = [
    { label: "Chat Sessions",  value: totalSessions, color: "#6366f1", icon: "💬" },
    { label: "Emails Captured",value: emailCaptures,  color: "#8b5cf6", icon: "✉️" },
    { label: "Quote Requests", value: quoteRequests,  color: "#10b981", icon: "📋" },
    { label: "Avg Lead Score", value: `${avgLeadScore ?? 0}`, color: "#f59e0b", icon: "⭐", raw: true },
  ];
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px,1fr))", gap: 10 }}>
        {tiles.map(t => (
          <div key={t.label} className="dash-metric-tile" style={{ borderLeft: `3px solid ${t.color}` }}>
            <span className="dash-metric-icon">{t.icon}</span>
            <div>
              <p className="dash-metric-value" style={{ color: t.color }}>{t.raw ? t.value : (t.value ?? 0).toLocaleString()}</p>
              <p className="dash-metric-label">{t.label}</p>
            </div>
          </div>
        ))}
      </div>
      {scoreDistribution && (
        <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
          {[
            { label: "Hot leads",  count: scoreDistribution.hot,  color: "#ef4444" },
            { label: "Warm leads", count: scoreDistribution.warm, color: "#f59e0b" },
            { label: "Cool leads", count: scoreDistribution.cool, color: "#94a3b8" },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, padding: "8px 10px", borderRadius: 8, background: s.color + "12", border: `1px solid ${s.color}33`, textAlign: "center" }}>
              <p style={{ fontSize: 20, fontWeight: 700, color: s.color, margin: 0 }}>{s.count ?? 0}</p>
              <p style={{ fontSize: 10, color: s.color, margin: 0, fontWeight: 600 }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Sales Alert Banner + Main Dashboard ─────────────────────────────── */
function SalesAlert({ count, onClick }) {
  if (!count) return null;
  return (
    <div className="dash-sales-alert" onClick={onClick} role="button" tabIndex={0} onKeyDown={e => e.key === "Enter" && onClick()}>
      <span className="dash-alert-dot" />
      <span className="dash-alert-text">
        <strong>{count} lead{count !== 1 ? "s" : ""} awaiting response</strong>
        <span className="dash-alert-sub"> — click to open Lead Inbox</span>
      </span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
    </div>
  );
}

export default function Dashboard({ token, onNavigate }) {
  const [data, setData] = useState(null);
  const [taraStats, setTaraStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastRefreshed, setLastRefreshed] = useState(null);

  function loadAll() {
    Promise.all([
      api.getAnalyticsSummary(token),
      api.getTaraStats(token).catch(() => null),
    ])
      .then(([analytics, tara]) => {
        setData(analytics);
        setTaraStats(tara?.stats ?? null);
        setLastRefreshed(new Date());
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    setLoading(true);
    loadAll();
    const id = setInterval(loadAll, 5 * 60_000);
    return () => clearInterval(id);
  }, [token]);

  if (loading) return (
    <div className="dash-loading"><div className="dash-spinner" /><p>Loading dashboard…</p></div>
  );
  if (error) return (
    <div className="feedback error">Failed to load dashboard data: {error}</div>
  );

  const s        = data?.summary || {};
  const daily    = data?.dailyVisitors || [];
  const countries= data?.topCountries || [];
  const pages    = data?.topPages || [];
  const devices  = data?.deviceBreakdown || [];
  const qStatus  = data?.quoteStatusBreakdown || [];
  const activity = data?.latestActivity || [];
  const logins   = data?.recentLogins || [];
  const topBrochure  = data?.topBrochure;
  const latestQuote  = data?.latestQuote;

  const convRate   = s.totalVisitors > 0 ? ((s.totalQuotes / s.totalVisitors) * 100) : 0;
  const responseRate = s.totalQuotes > 0 ? (((s.totalQuotes - (s.unrepliedQuotes || 0)) / s.totalQuotes) * 100) : 0;

  return (
    <div className="dash-root">

      {/* ── Dashboard header with refresh ── */}
      <div className="dash-topbar">
        <div>
          <h2 className="dash-topbar-title">Business Dashboard</h2>
          {lastRefreshed && (
            <p className="dash-topbar-sub">Updated {timeAgo(lastRefreshed)}</p>
          )}
        </div>
        <button className="secondary dash-refresh-btn" onClick={loadAll} title="Refresh data">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
          Refresh
        </button>
      </div>

      {/* ── Sales Alert ── */}
      <SalesAlert count={s.unrepliedQuotes || 0} onClick={() => onNavigate?.("quotes")} />

      {/* ── Hero KPIs (critical business metrics) ── */}
      <div className="dash-hero-grid">
        <HeroKpi
          label="⭐ New Leads Today"
          value={s.todayQuotes || 0}
          color="#f43f5e"
          sub={`${(s.totalQuotes || 0).toLocaleString()} total all-time`}
        />
        <HeroKpi
          label="⭐ Awaiting Response"
          value={s.unrepliedQuotes || 0}
          color="#f59e0b"
          sub="Leads not yet replied to"
          pulse={(s.unrepliedQuotes || 0) > 0}
        />
        <HeroKpi
          label="⭐ Response Rate"
          value={responseRate}
          suffix="%"
          color="#10b981"
          sub="Leads successfully replied"
          isFloat
        />
        <HeroKpi
          label="⭐ Conversion Rate"
          value={convRate}
          suffix="%"
          color="#6366f1"
          sub="Visitors who enquired"
          isFloat
        />
      </div>

      {/* ── Traffic + Live pulse ── */}
      <div className="dash-hero-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <HeroKpi
          label="Live Visitors"
          value={s.liveVisitors}
          color="#22c55e"
          sub="Active in last 5 min"
          pulse
        />
        <HeroKpi
          label="Total Visitors"
          value={s.totalVisitors}
          color="#8b5cf6"
          sub={`${(s.newVisitors || 0).toLocaleString()} new`}
          sparkline={daily}
        />
        <HeroKpi
          label="This Week"
          value={s.weekVisitors}
          color="#0ea5e9"
          sub="Visitors last 7 days"
        />
        <HeroKpi
          label="This Month"
          value={s.monthVisitors}
          color="#64748b"
          sub="Visitors this month"
        />
      </div>

      {/* ── Secondary metrics (compact) ── */}
      <div className="dash-metric-row">
        <MetricTile label="Today's Visitors" value={s.todayVisitors} icon="📅" />
        <MetricTile label="Avg Session"      value={0} rawValue={fmtDuration(s.avgDuration)} icon="⏱️" />
        <MetricTile label="Bounce Rate"      value={s.bounceRate} suffix="%" icon="↩️" />
        <MetricTile label="Total Products"   value={s.totalProducts} icon="📦" />
        <MetricTile label="Categories"       value={s.totalCategories} icon="🗂️" />
        <MetricTile label="Total Leads"      value={s.totalQuotes} icon="📋" />
      </div>

      {/* ── Lead Pipeline + Traffic ── */}
      <div className="dash-row-2">
        <Panel eyebrow="⭐ Sales" title="Lead Pipeline">
          <QuotePipeline statuses={qStatus} total={s.totalQuotes} />
          {latestQuote && (
            <div className="dash-latest-lead">
              <p className="dash-sub-section-label">Latest Enquiry</p>
              <div className="dash-lead-row">
                <div className="dash-lead-avatar">{latestQuote.name?.[0]?.toUpperCase() || "?"}</div>
                <div>
                  <p className="dash-lead-name">{latestQuote.name}</p>
                  <p className="dash-lead-meta">{latestQuote.company || latestQuote.email} · {timeAgo(latestQuote.createdAt)}</p>
                </div>
                <span className="dash-lead-status" style={{
                  background: latestQuote.status === "new" ? "#fef3c7" : latestQuote.status === "closed" ? "#d1fae5" : "#ede9fe",
                  color: latestQuote.status === "new" ? "#b45309" : latestQuote.status === "closed" ? "#059669" : "#6366f1",
                }}>
                  {latestQuote.status}
                </span>
              </div>
            </div>
          )}
        </Panel>

        <Panel eyebrow="Analytics" title="Daily Traffic — Last 30 Days">
          {daily.length ? (
            <div className="dash-traffic-chart">
              <Sparkline data={daily} color="#6366f1" h={90} />
              <div className="dash-traffic-labels">
                <span>{daily[0]?._id?.slice(5)}</span>
                <span>{daily[daily.length - 1]?._id?.slice(5)}</span>
              </div>
            </div>
          ) : <p className="dash-empty">No traffic data yet. Tracking starts once visitors arrive.</p>}
        </Panel>
      </div>

      {/* ── Tara AI Stats (moved up — key sales intelligence) ── */}
      {taraStats && (
        <Panel eyebrow="⭐ Tara AI" title="Chatbot Lead Performance">
          <TaraMiniStats taraStats={taraStats} />
        </Panel>
      )}

      {/* ── Geo + Devices ── */}
      <div className="dash-row-2">
        <Panel eyebrow="Geo" title="Top Countries">
          {countries.length ? (
            <div className="dash-country-list">
              {countries.map((c, i) => (
                <div key={i} className="dash-country-row">
                  <Flag code={c.countryCode} />
                  <span className="dash-country-name">{c._id || "Unknown"}</span>
                  <div className="dash-country-bar-wrap">
                    <div className="dash-country-bar" style={{ width: `${(c.count / Math.max(...countries.map(x => x.count), 1)) * 100}%` }} />
                  </div>
                  <span className="dash-country-count">{c.count}</span>
                </div>
              ))}
            </div>
          ) : <p className="dash-empty">No location data yet.</p>}
        </Panel>

        <Panel eyebrow="Content" title="Most Visited Pages">
          <BarChart data={pages} labelKey="_id" valueKey="count" color="#b45309" />
        </Panel>
      </div>

      {/* ── Audience split + Device breakdown ── */}
      <div className="dash-row-2">
        <Panel eyebrow="Audience" title="Visitor Insights">
          <p className="dash-sub-section-label">New vs Returning</p>
          <AudienceSplit newV={s.newVisitors || 0} returning={s.returningVisitors || 0} />
          <div className="dash-insight-tiles">
            <div className="dash-insight-tile">
              <p className="dash-insight-val">{(s.newVisitors || 0).toLocaleString()}</p>
              <p className="dash-insight-key">New Visitors</p>
            </div>
            <div className="dash-insight-tile">
              <p className="dash-insight-val">{(s.returningVisitors || 0).toLocaleString()}</p>
              <p className="dash-insight-key">Returning</p>
            </div>
          </div>
          {topBrochure && (
            <div className="dash-brochure-tile" style={{ marginTop: "1rem" }}>
              <span className="dash-brochure-icon">📄</span>
              <div>
                <p className="dash-brochure-title">{topBrochure.title}</p>
                <p className="dash-brochure-count">{topBrochure.downloadCount} downloads · Top brochure</p>
              </div>
            </div>
          )}
        </Panel>

        <Panel eyebrow="Devices" title="Device Breakdown">
          <DevicePanel devices={devices} />
        </Panel>
      </div>

      {/* ── Activity + Logins ── */}
      <div className="dash-row-2">
        <Panel eyebrow="Logs" title="Recent Activity">
          <ActivityList items={activity} />
        </Panel>

        <Panel eyebrow="Security" title="Recent Admin Logins">
          {logins.length ? (
            <ul className="dash-login-list">
              {logins.map((l, i) => (
                <li key={i} className="dash-login-item">
                  <div className="dash-login-avatar">{(l.adminName || l.adminEmail || "A")[0].toUpperCase()}</div>
                  <div className="dash-login-info">
                    <p className="dash-login-name">{l.adminName || l.adminEmail || "Admin"}</p>
                    {l.ip && <p className="dash-login-ip">IP: {l.ip}</p>}
                  </div>
                  <span className="dash-login-time">{timeAgo(l.createdAt)}</span>
                </li>
              ))}
            </ul>
          ) : <p className="dash-empty">No login history.</p>}
        </Panel>
      </div>

    </div>
  );
}
