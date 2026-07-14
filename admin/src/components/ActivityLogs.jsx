import { useState, useEffect } from "react";
import { api } from "../lib/api.js";

const CATEGORY_COLORS = {
  auth:     "#6366f1",
  product:  "#f59e0b",
  category: "#10b981",
  admin:    "#ef4444",
  brochure: "#3b82f6",
  seo:      "#8b5cf6",
  quote:    "#ec4899",
  settings: "#0ea5e9",
};

const CATEGORY_ICONS = {
  auth:     "🔐",
  product:  "📦",
  category: "🗂️",
  admin:    "🛡️",
  brochure: "📄",
  seo:      "🔍",
  quote:    "📧",
  settings: "⚙️",
};

export default function ActivityLogs({ token }) {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("");

  function load(p = 1) {
    setLoading(true);
    api.getActivityLogs(token, { page: p, category })
      .then(d => { setLogs(d.logs || []); setPagination(d.pagination || {}); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(1); setPage(1); }, [category]);
  useEffect(() => { load(page); }, [page]);

  function exportCsv() {
    const headers = ["Date", "Admin", "Category", "Action", "Details", "Resource", "IP"];
    const rows = logs.map(l => [
      new Date(l.createdAt).toLocaleString(),
      `${l.adminName || ""} (${l.adminEmail || ""})`,
      l.category, l.action, l.details, l.resourceName, l.ip,
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c || ""}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "activity-logs.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  const categories = ["auth", "product", "category", "admin", "brochure", "seo", "quote", "settings"];

  return (
    <div>
      {/* Filters */}
      <div className="visitors-filters">
        <select value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => (
            <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
          ))}
        </select>
        <button type="button" className="secondary" onClick={exportCsv}>Export CSV</button>
      </div>

      <p className="muted small" style={{ marginBottom: "0.75rem" }}>
        {pagination.total?.toLocaleString()} total actions
      </p>

      {loading ? (
        <div className="dash-loading"><div className="dash-spinner" /></div>
      ) : logs.length === 0 ? (
        <div className="feedback loading">No activity logs yet. Actions will appear here as admins use the panel.</div>
      ) : (
        <div className="al-list">
          {logs.map((log, i) => {
            const cat = log.category || "admin";
            const color = CATEGORY_COLORS[cat] || "#64748b";
            const emoji = CATEGORY_ICONS[cat] || "📋";
            return (
              <div key={i} className="al-item">
                <div className="al-icon" style={{ background: `${color}18`, color }}>
                  {emoji}
                </div>
                <div className="al-body">
                  <div className="al-top">
                    <span className="al-action">{log.action?.replace(/_/g, " ")}</span>
                    <span className="al-badge" style={{ background: `${color}18`, color }}>
                      {log.category}
                    </span>
                  </div>
                  {log.details && <p className="al-details">{log.details}</p>}
                  <div className="al-meta">
                    <span>👤 {log.adminName || "—"}</span>
                    {log.resourceName && <span>📌 {log.resourceName}</span>}
                    {log.ip && <span>🌐 {log.ip}</span>}
                    <span>🕐 {new Date(log.createdAt).toLocaleString()}</span>
                  </div>
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
