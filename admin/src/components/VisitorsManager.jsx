import { useState, useEffect } from "react";
import { api } from "../lib/api.js";

function Flag({ code }) {
  if (!code || code === "LO") return <span>🌐</span>;
  try {
    const codePoints = [...code.toUpperCase()].map(c => 0x1F1E6 + c.charCodeAt(0) - 65);
    return <span>{String.fromCodePoint(...codePoints)}</span>;
  } catch { return <span>🌐</span>; }
}

function DeviceIcon({ d }) {
  if (d === "mobile") return <span title="Mobile">📱</span>;
  if (d === "tablet") return <span title="Tablet">💻</span>;
  return <span title="Desktop">🖥️</span>;
}

function fmtDuration(s) {
  if (!s) return "—";
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString();
}

export default function VisitorsManager({ token }) {
  const [visitors, setVisitors] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [device, setDevice] = useState("");
  const [country, setCountry] = useState("");

  function load(p = 1) {
    setLoading(true);
    api.getVisitors(token, { page: p, search, device, country })
      .then(d => { setVisitors(d.visitors || []); setPagination(d.pagination || {}); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(1); setPage(1); }, [search, device, country]);
  useEffect(() => { load(page); }, [page]);

  function exportCsv() {
    const headers = ["Date", "Visitor ID", "Country", "State", "City", "Lat", "Lon", "Browser", "OS", "Device", "Screen", "Entry Page", "Exit Page", "Duration", "Pages"];
    const rows = visitors.map(v => [
      fmtDate(v.sessionStart), v.visitorId?.slice(0, 8), v.country, v.state, v.city,
      v.lat, v.lon, v.browser, v.os, v.device, v.screenResolution,
      v.entryPage, v.exitPage, fmtDuration(v.duration), v.pageCount,
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c || ""}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "visitors.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      {/* Filters */}
      <div className="visitors-filters">
        <input
          type="search"
          placeholder="Search country, city, browser…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="visitors-search"
        />
        <select value={device} onChange={e => setDevice(e.target.value)}>
          <option value="">All Devices</option>
          <option value="desktop">Desktop</option>
          <option value="mobile">Mobile</option>
          <option value="tablet">Tablet</option>
        </select>
        <input
          type="text"
          placeholder="Filter by country…"
          value={country}
          onChange={e => setCountry(e.target.value)}
        />
        <button type="button" className="secondary" onClick={exportCsv}>Export CSV</button>
      </div>

      {/* Summary */}
      <p className="muted small" style={{ marginBottom: "0.75rem" }}>
        {pagination.total?.toLocaleString()} total visitors
      </p>

      {/* Table */}
      <div className="visitors-table-wrap">
        <table className="visitors-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Location</th>
              <th>Browser / OS</th>
              <th>Device</th>
              <th>Screen</th>
              <th>Entry Page</th>
              <th>Pages</th>
              <th>Duration</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="visitors-loading">Loading…</td></tr>
            ) : visitors.length === 0 ? (
              <tr><td colSpan={9} className="visitors-loading">No visitors found.</td></tr>
            ) : visitors.map((v, i) => (
              <tr key={i} className="visitors-row">
                <td className="visitors-td">
                  <span className="visitors-date">{fmtDate(v.sessionStart)}</span>
                </td>
                <td className="visitors-td">
                  <div className="visitors-location">
                    <Flag code={v.countryCode} />
                    <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                      <span>{[v.city, v.state].filter(Boolean).join(", ") || v.country || "—"}</span>
                      {v.country && (v.city || v.state) && (
                        <span style={{ fontSize: "0.7rem", opacity: 0.6 }}>{v.country}</span>
                      )}
                      {(v.lat && v.lon) && (
                        <span style={{ fontSize: "0.65rem", opacity: 0.45, fontVariantNumeric: "tabular-nums" }}>
                          {Number(v.lat).toFixed(2)}, {Number(v.lon).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="visitors-td">
                  <span className="visitors-browser">{v.browser || "—"}</span>
                  {v.os && <span className="visitors-os"> / {v.os}</span>}
                </td>
                <td className="visitors-td">
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                    <DeviceIcon d={v.device} />
                  </div>
                </td>
                <td className="visitors-td">
                  <span style={{ fontSize: "0.75rem", fontVariantNumeric: "tabular-nums", opacity: 0.8 }}>
                    {v.screenResolution || "—"}
                  </span>
                </td>
                <td className="visitors-td">
                  <span className="visitors-page" title={v.entryPage}>{v.entryPage || "/"}</span>
                </td>
                <td className="visitors-td">{v.pageCount || 1}</td>
                <td className="visitors-td">{fmtDuration(v.duration)}</td>
                <td className="visitors-td">
                  <span className={`visitors-status visitors-status--${v.isActive ? "live" : "done"}`}>
                    {v.isActive ? "🟢 Live" : "Done"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
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
