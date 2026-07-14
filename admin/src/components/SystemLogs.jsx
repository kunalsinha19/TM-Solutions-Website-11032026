import { useState, useEffect } from "react";
import { api } from "../lib/api.js";

const LEVEL_COLORS = { info: "#6366f1", warn: "#f59e0b", error: "#ef4444", critical: "#991b1b" };
const LEVEL_ICONS  = { info: "ℹ️", warn: "⚠️", error: "❌", critical: "🚨" };

export default function SystemLogs({ token }) {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [level, setLevel] = useState("");
  const [expanded, setExpanded] = useState(null);

  function load(p = 1) {
    setLoading(true);
    api.getSystemLogs(token, { page: p, level })
      .then(d => { setLogs(d.logs || []); setPagination(d.pagination || {}); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(1); setPage(1); }, [level]);
  useEffect(() => { load(page); }, [page]);

  return (
    <div>
      <div className="visitors-filters">
        <select value={level} onChange={e => setLevel(e.target.value)}>
          <option value="">All Levels</option>
          <option value="info">Info</option>
          <option value="warn">Warning</option>
          <option value="error">Error</option>
          <option value="critical">Critical</option>
        </select>
        <button type="button" className="secondary" onClick={() => load(page)}>Refresh</button>
      </div>

      <p className="muted small" style={{ marginBottom: "0.75rem" }}>
        {pagination.total?.toLocaleString()} total entries
      </p>

      {loading ? (
        <div className="dash-loading"><div className="dash-spinner" /></div>
      ) : logs.length === 0 ? (
        <div className="feedback loading">No system logs yet. Errors will appear here automatically.</div>
      ) : (
        <div className="al-list">
          {logs.map((log, i) => {
            const color = LEVEL_COLORS[log.level] || "#64748b";
            const isOpen = expanded === i;
            return (
              <div key={i} className="al-item" style={{ cursor: "pointer" }} onClick={() => setExpanded(isOpen ? null : i)}>
                <div className="al-icon" style={{ background: `${color}18`, color }}>
                  {LEVEL_ICONS[log.level] || "📋"}
                </div>
                <div className="al-body">
                  <div className="al-top">
                    <span className="al-action">{log.message}</span>
                    <span className="al-badge" style={{ background: `${color}18`, color }}>{log.level}</span>
                    {log.category && <span className="al-badge">{log.category}</span>}
                  </div>
                  <div className="al-meta">
                    {log.method && <span>{log.method} {log.path}</span>}
                    {log.statusCode && <span>Status {log.statusCode}</span>}
                    {log.ip && <span>🌐 {log.ip}</span>}
                    <span>🕐 {new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                  {isOpen && log.stack && (
                    <pre className="syslog-stack">{log.stack}</pre>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="pagination-controls" style={{ marginTop: "1rem" }}>
          <button type="button" className="secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span className="muted">{page} / {pagination.pages}</span>
          <button type="button" className="secondary" disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}
