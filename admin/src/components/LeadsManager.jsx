import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";

const SCORE_COLORS = {
  high: "#22c55e",
  medium: "#f59e0b",
  low: "#94a3b8",
};

function scoreColor(score) {
  if (score >= 60) return SCORE_COLORS.high;
  if (score >= 30) return SCORE_COLORS.medium;
  return SCORE_COLORS.low;
}

function ScoreBadge({ score }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "2px 10px",
        borderRadius: "999px",
        fontSize: "0.75rem",
        fontWeight: 700,
        background: `${scoreColor(score)}22`,
        color: scoreColor(score),
        border: `1px solid ${scoreColor(score)}44`,
      }}
    >
      {score}
    </span>
  );
}

function Signal({ label }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "1px 8px",
        borderRadius: "999px",
        fontSize: "0.7rem",
        fontWeight: 600,
        background: "var(--accent, #3b82f6)22",
        color: "var(--accent, #3b82f6)",
        border: "1px solid var(--accent, #3b82f6)33",
        marginRight: "4px",
        marginBottom: "4px",
      }}
    >
      {label.replace(/_/g, " ")}
    </span>
  );
}

function SessionCard({ session, onSelect }) {
  const lastMsg = session.messages?.[session.messages.length - 1];
  return (
    <div
      className="panel"
      style={{ cursor: "pointer", padding: "1rem 1.25rem", marginBottom: "0.75rem" }}
      onClick={() => onSelect(session)}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Contact info */}
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap", marginBottom: "0.5rem" }}>
            {session.emailCaptured && (
              <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>✉ {session.emailCaptured}</span>
            )}
            {session.phoneCaptured && (
              <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>📞 {session.phoneCaptured}</span>
            )}
            {!session.emailCaptured && !session.phoneCaptured && (
              <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Anonymous visitor</span>
            )}
          </div>

          {/* Qualification data */}
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
            {session.quantityMentioned && (
              <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>📦 {session.quantityMentioned}</span>
            )}
            {session.timelineMentioned && (
              <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>📅 {session.timelineMentioned}</span>
            )}
            {session.industryMentioned && (
              <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>🏭 {session.industryMentioned}</span>
            )}
          </div>

          {/* Signal badges */}
          {session.leadSignals?.length > 0 && (
            <div style={{ marginBottom: "0.4rem" }}>
              {session.leadSignals.map(s => <Signal key={s} label={s} />)}
            </div>
          )}

          {/* Products */}
          {session.productsDiscussed?.length > 0 && (
            <p style={{ fontSize: "0.75rem", color: "var(--muted)", marginBottom: "0.25rem" }}>
              Products: {session.productsDiscussed.join(", ")}
            </p>
          )}

          {/* Last message preview */}
          {lastMsg && (
            <p style={{ fontSize: "0.75rem", color: "var(--muted)", fontStyle: "italic" }} className="line-clamp-1">
              &ldquo;{lastMsg.text}&rdquo;
            </p>
          )}
        </div>

        {/* Score + flags */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.35rem", flexShrink: 0 }}>
          <ScoreBadge score={session.leadScore ?? 0} />
          {session.hasQuoteRequest && (
            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#f59e0b", background: "#f59e0b22", padding: "2px 7px", borderRadius: "999px", border: "1px solid #f59e0b44" }}>
              QUOTE
            </span>
          )}
          {session.quoteSubmitted && (
            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#22c55e", background: "#22c55e22", padding: "2px 7px", borderRadius: "999px", border: "1px solid #22c55e44" }}>
              SUBMITTED
            </span>
          )}
          <span style={{ fontSize: "0.65rem", color: "var(--muted)" }}>
            {new Date(session.lastActivityAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
          </span>
        </div>
      </div>
    </div>
  );
}

function SessionDetail({ session, onClose }) {
  if (!session) return null;
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        className="panel"
        style={{ width: "100%", maxWidth: "600px", maxHeight: "85vh", overflow: "auto", padding: "1.5rem" }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h3 style={{ margin: 0 }}>Chat Session</h3>
          <button type="button" className="btn btn-sm" onClick={onClose}>Close</button>
        </div>

        {/* Details */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "1rem", fontSize: "0.8rem" }}>
          {[
            ["Email", session.emailCaptured],
            ["Phone", session.phoneCaptured],
            ["Lead Score", session.leadScore],
            ["Quantity", session.quantityMentioned],
            ["Timeline", session.timelineMentioned],
            ["Industry", session.industryMentioned],
            ["Products", session.productsDiscussed?.join(", ")],
            ["Signals", session.leadSignals?.join(", ")],
          ].filter(([, v]) => v).map(([k, v]) => (
            <div key={k}>
              <span style={{ color: "var(--muted)", fontWeight: 600 }}>{k}: </span>
              <span>{String(v)}</span>
            </div>
          ))}
        </div>

        {/* Messages */}
        <h4 style={{ marginBottom: "0.5rem", fontSize: "0.85rem", fontWeight: 700 }}>Conversation</h4>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {(session.messages || []).map((m, i) => (
            <div
              key={i}
              style={{
                padding: "0.6rem 0.9rem",
                borderRadius: "12px",
                fontSize: "0.8rem",
                maxWidth: "90%",
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                background: m.role === "user" ? "var(--accent, #3b82f6)22" : "var(--surface, #1e293b)",
                border: "1px solid var(--border, #334155)",
              }}
            >
              <span style={{ fontWeight: 600, fontSize: "0.65rem", color: "var(--muted)", display: "block", marginBottom: "2px" }}>
                {m.role === "user" ? "Visitor" : "Tara"}
              </span>
              {m.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LeadsManager({ token }) {
  const [sessions, setSessions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page, limit: 20, ...(filter && { hasQuote: filter }) });
      const data = await api.getChatSessions(token, { page, filter });
      setSessions(data.sessions ?? []);
      setTotal(data.total ?? 0);
      setPages(data.pages ?? 1);
    } catch (e) {
      setError(e.message || "Failed to load leads");
    } finally {
      setLoading(false);
    }
  }, [token, page, filter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: "200px" }}>
          <p className="muted" style={{ fontSize: "0.8rem" }}>
            {total} lead{total !== 1 ? "s" : ""} tracked by Tara · sorted by lead score
          </p>
        </div>
        <select
          className="input"
          style={{ width: "auto" }}
          value={filter}
          onChange={e => { setFilter(e.target.value); setPage(1); }}
        >
          <option value="">All sessions</option>
          <option value="true">Quote requested</option>
          <option value="false">No quote yet</option>
        </select>
        <button type="button" className="btn btn-sm" onClick={load} disabled={loading}>
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {error && <p className="error-msg" style={{ marginBottom: "1rem" }}>{error}</p>}

      {/* List */}
      {loading && sessions.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--muted)" }}>Loading leads…</div>
      ) : sessions.length === 0 ? (
        <div className="panel" style={{ textAlign: "center", padding: "3rem" }}>
          <p style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>💬</p>
          <p className="muted">No chat sessions yet. Once visitors chat with Tara, leads will appear here.</p>
        </div>
      ) : (
        sessions.map(s => <SessionCard key={s._id} session={s} onSelect={setSelected} />)
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", marginTop: "1rem" }}>
          <button type="button" className="btn btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            ← Prev
          </button>
          <span className="muted" style={{ fontSize: "0.8rem", padding: "0.35rem 0.75rem" }}>
            {page} / {pages}
          </span>
          <button type="button" className="btn btn-sm" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>
            Next →
          </button>
        </div>
      )}

      {selected && <SessionDetail session={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
