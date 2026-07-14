import { useState, useEffect } from "react";
import { api } from "../lib/api.js";

function Flag({ code }) {
  if (!code || code === "LO") return <span>🌐</span>;
  try {
    const codePoints = [...code.toUpperCase()].map(c => 0x1F1E6 + c.charCodeAt(0) - 65);
    return <span>{String.fromCodePoint(...codePoints)}</span>;
  } catch { return <span>🌐</span>; }
}

function elapsed(date) {
  const secs = Math.floor((Date.now() - new Date(date)) / 1000);
  if (secs < 60) return `${secs}s`;
  return `${Math.floor(secs / 60)}m ${secs % 60}s`;
}

export default function LiveVisitors({ token }) {
  const [data, setData] = useState({ liveCount: 0, visitors: [] });
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);

  function load() {
    api.getLiveVisitors(token)
      .then(d => { setData(d); setLastRefresh(new Date()); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 15_000); // auto-refresh every 15s
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <div className="live-header">
        <div className="live-count-block">
          <div className="live-count-circle">
            <span className="live-count-num">{data.liveCount}</span>
            <span className="live-count-label">Live</span>
          </div>
          <div>
            <p className="live-count-title">Currently Online</p>
            <p className="muted small">Active in the last 5 minutes</p>
            {lastRefresh && <p className="muted small">Updated: {lastRefresh.toLocaleTimeString()}</p>}
          </div>
        </div>
        <button type="button" onClick={load} disabled={loading}>
          {loading ? "Refreshing…" : "🔄 Refresh"}
        </button>
      </div>

      {loading && !data.visitors.length ? (
        <div className="dash-loading"><div className="dash-spinner" /></div>
      ) : data.visitors.length === 0 ? (
        <div className="feedback loading" style={{ marginTop: "1rem" }}>
          No active visitors right now. Live visitors will appear here automatically.
        </div>
      ) : (
        <div className="live-list">
          {data.visitors.map((v, i) => (
            <div key={i} className="live-item">
              <div className="live-item-left">
                <div className="live-dot-indicator" />
                <div>
                  <div className="live-item-location">
                    <Flag code={v.countryCode} />
                    <span>{[v.city, v.country].filter(Boolean).join(", ") || "Unknown location"}</span>
                  </div>
                  <p className="live-item-page muted small">{v.exitPage || v.entryPage || "/"}</p>
                </div>
              </div>
              <div className="live-item-right">
                <span className="live-item-device">
                  {v.device === "mobile" ? "📱" : v.device === "tablet" ? "💻" : "🖥️"}
                  {" "}{v.browser || "—"}
                </span>
                <span className="muted small">{elapsed(v.sessionStart)} ago</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
