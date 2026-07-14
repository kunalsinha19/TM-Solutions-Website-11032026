import { useEffect, useState } from "react";
import { api } from "../lib/api";

// ── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_CFG = {
  new:      { label: "New",       color: "#2563eb", bg: "#eff6ff", border: "#93c5fd" },
  reviewed: { label: "In Review", color: "#b45309", bg: "#fffbeb", border: "#fcd34d" },
  closed:   { label: "Closed",    color: "#475569", bg: "#f1f5f9", border: "#cbd5e1" },
};

const AVATAR_PALETTE = [
  ["#4f46e5", "#ede9fe"],
  ["#0369a1", "#e0f2fe"],
  ["#059669", "#d1fae5"],
  ["#b45309", "#fef3c7"],
  ["#be185d", "#fce7f3"],
  ["#7c3aed", "#f5f3ff"],
];

function nameHash(name = "") {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return Math.abs(h) % AVATAR_PALETTE.length;
}

function initials(name = "") {
  return name.split(" ").map(w => w[0] || "").slice(0, 2).join("").toUpperCase() || "?";
}

function timeAgo(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function buildDefaultReply(quote) {
  const product = quote.product?.name ? ` regarding the ${quote.product.name}` : "";
  return `Dear ${quote.name.split(" ")[0]},\n\nThank you for reaching out to Tara Maa Solutions${product}.\n\nWe have received your enquiry and our team will review your requirements shortly. We will get back to you with pricing, availability, and further details within 24 business hours.\n\nFor urgent queries, feel free to call us at +91 75950 56476.\n\nWarm regards,\nTara Maa Solutions Team`;
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`lm-toast lm-toast--${toast.type}`}>
      <span className="lm-toast-icon">{toast.type === "success" ? "✓" : "✕"}</span>
      {toast.message}
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.new;
  return (
    <span
      className="lc-badge"
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      {cfg.label}
    </span>
  );
}

// ── Single lead card ──────────────────────────────────────────────────────────
function LeadCard({ quote, reply, onToggleReply, onUpdateField, onSendReply, onStatusChange }) {
  const cfg = STATUS_CFG[quote.status] || STATUS_CFG.new;
  const [ac, abg] = AVATAR_PALETTE[nameHash(quote.name)];

  return (
    <article className={`lc-card lc-card--${quote.status}`} style={{ "--lc-accent": cfg.color }}>
      {/* ── Top row: avatar + details + timestamp ── */}
      <div className="lc-top">
        <div className="lc-avatar" style={{ background: abg, color: ac }}>
          {initials(quote.name)}
        </div>

        <div className="lc-info">
          <div className="lc-name-row">
            <span className="lc-name">{quote.name}</span>
            <StatusBadge status={quote.status} />
            {quote.product?.name && (
              <span className="lc-product-tag">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>
                {quote.product.name}
              </span>
            )}
          </div>
          <div className="lc-meta">
            <a href={`mailto:${quote.email}`} className="lc-meta-link">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7"/></svg>
              {quote.email}
            </a>
            {quote.phone && (
              <a href={`tel:${quote.phone.replace(/\s/g, "")}`} className="lc-meta-link">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8 19.79 19.79 0 01.42 2.18 2 2 0 012.42 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.16 6.16l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92v2z"/></svg>
                {quote.phone}
              </a>
            )}
            {quote.company && (
              <span className="lc-meta-item">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                {quote.company}
              </span>
            )}
          </div>
        </div>

        <div className="lc-time">{timeAgo(quote.createdAt)}</div>
      </div>

      {/* ── Enquiry message ── */}
      <p className="lc-message">{quote.message}</p>

      {/* ── Replied indicator ── */}
      {quote.repliedAt && (
        <div className="lc-replied-row">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          Responded {timeAgo(quote.repliedAt)}
        </div>
      )}

      {/* ── Reply composer ── */}
      {reply.open && (
        <div className="lc-reply-panel">
          <div className="lc-reply-header">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 00-4-4H4"/></svg>
            Compose reply to {quote.name.split(" ")[0]}
          </div>
          <label className="lc-field">
            <span>Subject line</span>
            <input
              value={reply.subject}
              onChange={e => onUpdateField("subject", e.target.value)}
              placeholder="Response to your enquiry from Tara Maa Solutions"
            />
          </label>
          <label className="lc-field">
            <span>Message</span>
            <textarea
              rows={9}
              value={reply.message}
              onChange={e => onUpdateField("message", e.target.value)}
              placeholder="Type your response here…"
            />
            <span className="lc-char-count">{reply.message.length} / 5000 characters</span>
          </label>
          <div className="lc-reply-actions">
            <button onClick={onSendReply} disabled={reply.sending} className="lc-send-btn">
              {reply.sending ? (
                <>
                  <span className="lc-spinner" />
                  Preparing…
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  Send Reply
                </>
              )}
            </button>
            <button className="secondary" onClick={onToggleReply}>Cancel</button>
          </div>
          <p className="lc-reply-note">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Without SMTP configured, this will open a pre-filled draft in your email client — you'll need to click Send there.
          </p>
        </div>
      )}

      {/* ── Footer: status + reply toggle ── */}
      <div className="lc-footer">
        <div className="lc-status-wrap">
          <label className="lc-status-label">Status</label>
          <select
            value={quote.status}
            onChange={e => onStatusChange(e.target.value)}
            className="lc-status-select"
            style={{ borderColor: cfg.border, color: cfg.color, background: cfg.bg }}
          >
            <option value="new">New</option>
            <option value="reviewed">In Review</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <button
          className={reply.open ? "lc-reply-toggle lc-reply-toggle--cancel secondary" : "lc-reply-toggle"}
          onClick={onToggleReply}
        >
          {reply.open ? (
            <>✕ Discard Draft</>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 00-4-4H4"/></svg>
              Reply to Lead
            </>
          )}
        </button>
      </div>
    </article>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
const TABS = ["all", "new", "reviewed", "closed"];
const TAB_LABELS = { all: "All", new: "New", reviewed: "In Review", closed: "Closed" };

export default function QuoteRequestManager({ token }) {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [replyState, setReplyState] = useState({});
  const [toast, setToast] = useState(null);

  function showToast(type, message) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  }

  async function loadQuotes() {
    setLoading(true);
    try {
      const response = await api.getQuotes(token);
      setQuotes(response.quoteRequests || []);
    } catch (error) {
      showToast("error", error.message || "Failed to load enquiries.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadQuotes(); }, [token]);

  async function updateStatus(id, nextStatus) {
    try {
      await api.updateQuote(token, id, { status: nextStatus });
      setQuotes(prev => prev.map(q => q._id === id ? { ...q, status: nextStatus } : q));
      showToast("success", "Lead status updated.");
    } catch (error) {
      showToast("error", error.message || "Failed to update status.");
    }
  }

  function toggleReply(quote) {
    setReplyState(cur => ({
      ...cur,
      [quote._id]: cur[quote._id]?.open
        ? { ...cur[quote._id], open: false }
        : {
            open: true,
            subject: cur[quote._id]?.subject || "Response to your enquiry from Tara Maa Solutions",
            message: cur[quote._id]?.message || buildDefaultReply(quote),
            sending: false,
          },
    }));
  }

  function updateReplyField(id, field, value) {
    setReplyState(cur => ({ ...cur, [id]: { ...cur[id], [field]: value } }));
  }

  async function sendReply(quote) {
    const reply = replyState[quote._id];
    if (!reply?.message?.trim()) {
      showToast("error", "Please write a reply message before sending.");
      return;
    }
    updateReplyField(quote._id, "sending", true);
    try {
      const response = await api.replyToQuote(token, quote._id, {
        subject: reply.subject,
        message: reply.message,
      });
      if (response.delivery === "sent") {
        showToast("success", `Reply sent successfully to ${quote.email}.`);
      } else if (response.delivery === "failed") {
        if (response.mailto) window.open(response.mailto, "_blank");
        const detail = response.smtpError ? `: ${response.smtpError}` : "";
        showToast("error", `SMTP delivery failed${detail}. Mailto fallback opened — send from there.`);
      } else if (response.delivery === "draft" && response.mailto) {
        window.open(response.mailto, "_blank");
        showToast("success", "Draft opened in your email client — click Send there to deliver.");
      }
      await loadQuotes();
      setReplyState(cur => ({ ...cur, [quote._id]: { ...cur[quote._id], open: false, sending: false } }));
    } catch (error) {
      showToast("error", error.message || "Failed to send reply.");
      updateReplyField(quote._id, "sending", false);
    }
  }

  const counts = {
    all: quotes.length,
    new: quotes.filter(q => q.status === "new").length,
    reviewed: quotes.filter(q => q.status === "reviewed").length,
    closed: quotes.filter(q => q.status === "closed").length,
  };

  const displayed = filter === "all" ? quotes : quotes.filter(q => q.status === filter);

  return (
    <div className="lm-shell">
      <Toast toast={toast} />

      {/* ── Page header ── */}
      <div className="lm-header">
        <div className="lm-title-row">
          <div>
            <p className="eyebrow">Operations</p>
            <h2 className="lm-title">
              Lead Inbox
              {!loading && counts.new > 0 && (
                <span className="lm-new-pill">{counts.new} new</span>
              )}
            </h2>
          </div>
          <button type="button" className="secondary lm-refresh-btn" onClick={loadQuotes}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
            Refresh
          </button>
        </div>

        {/* Filter tabs */}
        <div className="lm-tabs">
          {TABS.map(tab => (
            <button
              key={tab}
              type="button"
              className={`lm-tab${filter === tab ? " lm-tab--active" : ""}`}
              onClick={() => setFilter(tab)}
            >
              {TAB_LABELS[tab]}
              <span className={`lm-tab-count${filter === tab ? " lm-tab-count--active" : ""}`}>
                {counts[tab]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Cards ── */}
      {loading ? (
        <div className="lm-loading">
          <span className="dash-spinner" />
          <span>Loading enquiries…</span>
        </div>
      ) : displayed.length === 0 ? (
        <div className="lm-empty">
          <div className="lm-empty-icon">📭</div>
          <p className="lm-empty-title">
            {filter === "all" ? "No enquiries yet" : `No ${TAB_LABELS[filter].toLowerCase()} enquiries`}
          </p>
          <p className="lm-empty-sub">
            {filter === "all"
              ? "Submitted quote requests from your website will appear here."
              : `Switch to a different tab to view other leads.`}
          </p>
        </div>
      ) : (
        <div className="lm-list">
          {displayed.map(quote => (
            <LeadCard
              key={quote._id}
              quote={quote}
              reply={replyState[quote._id] || { open: false, subject: "", message: "", sending: false }}
              onToggleReply={() => toggleReply(quote)}
              onUpdateField={(field, val) => updateReplyField(quote._id, field, val)}
              onSendReply={() => sendReply(quote)}
              onStatusChange={status => updateStatus(quote._id, status)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
