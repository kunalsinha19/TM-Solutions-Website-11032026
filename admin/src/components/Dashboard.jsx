import { useState, useEffect, useRef } from "react";
import { api } from "../lib/api.js";

/* ─── Animated counter ──────────────────────────────────────────────── */
function useCountUp(target, duration = 1200) {
  const [count, setCount] = useState(0);
  const rafRef = useRef(null);
  useEffect(() => {
    if (!target) { setCount(0); return; }
    const start = Date.now();
    function step() {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    }
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);
  return count;
}

/* ─── Mini sparkline ────────────────────────────────────────────────── */
function Sparkline({ data = [], color = "#f59e0b", h = 36 }) {
  if (!data.length) return null;
  const vals = data.map(d => (typeof d === "object" ? d.count : d));
  const max = Math.max(...vals, 1);
  const w = 100;
  const pts = vals.map((v, i) => [
    (i / Math.max(vals.length - 1, 1)) * w,
    h - (v / max) * h * 0.9,
  ]);
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const fill = `${line} L${w},${h} L0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: "100%", height: h }}>
      <defs>
        <linearGradient id={`sg-${color.replace("#","")}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#sg-${color.replace("#","")})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Stat card ─────────────────────────────────────────────────────── */
function StatCard({ label, value, icon, color = "#f59e0b", chartData, suffix = "", description }) {
  const count = useCountUp(typeof value === "number" ? value : 0);
  return (
    <div className="dash-card">
      <div className="dash-card-header">
        <div className="dash-card-icon" style={{ background: `${color}18`, color }}>
          {icon}
        </div>
        <div className="dash-card-info">
          <p className="dash-card-label">{label}</p>
          <p className="dash-card-value">{count.toLocaleString()}{suffix}</p>
          {description && <p className="dash-card-desc">{description}</p>}
        </div>
      </div>
      {chartData?.length > 1 && (
        <div className="dash-card-chart">
          <Sparkline data={chartData} color={color} />
        </div>
      )}
    </div>
  );
}

/* ─── Country flag by code ───────────────────────────────────────────── */
function Flag({ code }) {
  if (!code || code === "LO") return <span className="dash-flag">🌐</span>;
  const codePoints = [...code.toUpperCase()].map(c => 0x1F1E6 + c.charCodeAt(0) - 65);
  return <span className="dash-flag">{String.fromCodePoint(...codePoints)}</span>;
}

/* ─── Bar chart ─────────────────────────────────────────────────────── */
function BarChart({ data = [], labelKey = "_id", valueKey = "count", color = "#f59e0b" }) {
  if (!data.length) return <p className="muted small">No data yet.</p>;
  const max = Math.max(...data.map(d => d[valueKey]), 1);
  return (
    <div className="dash-bar-chart">
      {data.map((row, i) => (
        <div key={i} className="dash-bar-row">
          <span className="dash-bar-label">{row[labelKey] || "—"}</span>
          <div className="dash-bar-track">
            <div
              className="dash-bar-fill"
              style={{ width: `${(row[valueKey] / max) * 100}%`, background: color }}
            />
          </div>
          <span className="dash-bar-count">{row[valueKey]}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Main Dashboard ─────────────────────────────────────────────────── */
export default function Dashboard({ token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    api.getAnalyticsSummary(token)
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="dash-loading">
        <div className="dash-spinner" />
        <p>Loading dashboard…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="feedback error">
        Failed to load dashboard data: {error}
      </div>
    );
  }

  const s = data?.summary || {};
  const daily = data?.dailyVisitors || [];
  const countries = data?.topCountries || [];
  const pages = data?.topPages || [];
  const devices = data?.deviceBreakdown || [];

  const formatDuration = (secs) => {
    if (!secs) return "0s";
    if (secs < 60) return `${secs}s`;
    return `${Math.floor(secs / 60)}m ${secs % 60}s`;
  };

  const statCards = [
    { label: "Total Visitors",    value: s.totalVisitors,    icon: "👥", color: "#6366f1", chartData: daily },
    { label: "Today's Visitors",  value: s.todayVisitors,    icon: "📅", color: "#f59e0b" },
    { label: "Weekly Visitors",   value: s.weekVisitors,     icon: "📈", color: "#10b981" },
    { label: "Monthly Visitors",  value: s.monthVisitors,    icon: "🗓️", color: "#3b82f6" },
    { label: "Live Visitors",     value: s.liveVisitors,     icon: "🟢", color: "#22c55e", description: "Active in last 5 min" },
    { label: "Total Quotes",      value: s.totalQuotes,      icon: "📧", color: "#f43f5e" },
    { label: "Products",          value: s.totalProducts,    icon: "📦", color: "#8b5cf6" },
    { label: "Categories",        value: s.totalCategories,  icon: "🗂️", color: "#0ea5e9" },
    { label: "Avg Session",       value: 0,                  icon: "⏱️", color: "#f97316",
      description: formatDuration(s.avgDuration) },
    { label: "Bounce Rate",       value: s.bounceRate,       icon: "↩️", color: "#64748b", suffix: "%" },
    { label: "Returning",         value: s.returningVisitors,icon: "🔁", color: "#a855f7" },
    { label: "New Visitors",      value: s.newVisitors,      icon: "✨", color: "#06b6d4" },
  ];

  return (
    <div className="dash-root">
      {/* Stats grid */}
      <div className="dash-stats-grid">
        {statCards.map((card, i) => (
          <StatCard key={i} {...card} />
        ))}
      </div>

      {/* Charts row */}
      <div className="dash-charts-row">
        {/* Daily visitors */}
        <div className="panel dash-chart-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Visitors</p>
              <h3>Daily Traffic — Last 30 Days</h3>
            </div>
          </div>
          {daily.length ? (
            <div className="dash-line-chart">
              <Sparkline data={daily} color="#6366f1" h={80} />
              <div className="dash-line-labels">
                {daily.length > 0 && <span>{daily[0]?._id?.slice(5)}</span>}
                {daily.length > 1 && <span>{daily[daily.length - 1]?._id?.slice(5)}</span>}
              </div>
            </div>
          ) : (
            <p className="muted small">No visitor data yet. Tracking will start once visitors arrive.</p>
          )}
        </div>

        {/* Top pages */}
        <div className="panel dash-chart-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Pages</p>
              <h3>Most Visited Pages</h3>
            </div>
          </div>
          <BarChart data={pages} labelKey="_id" valueKey="count" color="#f59e0b" />
        </div>
      </div>

      {/* Bottom row */}
      <div className="dash-charts-row">
        {/* Top countries */}
        <div className="panel dash-chart-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Geo</p>
              <h3>Top Countries</h3>
            </div>
          </div>
          {countries.length ? (
            <div className="dash-country-list">
              {countries.map((c, i) => (
                <div key={i} className="dash-country-row">
                  <Flag code={c.countryCode} />
                  <span className="dash-country-name">{c._id || "Unknown"}</span>
                  <span className="dash-country-bar-wrap">
                    <span
                      className="dash-country-bar"
                      style={{ width: `${(c.count / Math.max(...countries.map(x => x.count), 1)) * 100}%` }}
                    />
                  </span>
                  <span className="dash-country-count">{c.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted small">No location data yet.</p>
          )}
        </div>

        {/* Device breakdown */}
        <div className="panel dash-chart-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Devices</p>
              <h3>Device Breakdown</h3>
            </div>
          </div>
          {devices.length ? (
            <div className="dash-device-list">
              {devices.map((d, i) => {
                const emoji = d._id === "mobile" ? "📱" : d._id === "tablet" ? "💻" : "🖥️";
                return (
                  <div key={i} className="dash-device-row">
                    <span className="dash-device-icon">{emoji}</span>
                    <span className="dash-device-name">{d._id || "Unknown"}</span>
                    <span className="dash-device-count">{d.count}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="muted small">No device data yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
