import { useEffect, useState } from "react";
import { api } from "../lib/api";

function buildDefaultReply(quote) {
  return `Thank you for your enquiry regarding ${quote.product?.name || "the requested product"}. We have received your request and will share the details with you shortly.`;
}

export default function QuoteRequestManager({ token }) {
  const [quotes, setQuotes] = useState([]);
  const [status, setStatus] = useState("");
  const [replyState, setReplyState] = useState({});

  async function loadQuotes() {
    try {
      const response = await api.getQuotes(token);
      setQuotes(response.quoteRequests || []);
    } catch (error) {
      setStatus(error.message);
    }
  }

  useEffect(() => {
    loadQuotes();
  }, [token]);

  async function updateStatus(id, nextStatus) {
    try {
      await api.updateQuote(token, id, { status: nextStatus });
      await loadQuotes();
      setStatus("Quote request updated.");
    } catch (error) {
      setStatus(error.message);
    }
  }

  function toggleReply(quote) {
    setReplyState((current) => {
      if (current[quote._id]?.open) {
        return {
          ...current,
          [quote._id]: {
            ...current[quote._id],
            open: false
          }
        };
      }

      return {
        ...current,
        [quote._id]: {
          open: true,
          subject: current[quote._id]?.subject || `Response to your enquiry from Tara Maa Solutions`,
          message: current[quote._id]?.message || buildDefaultReply(quote),
          sending: false
        }
      };
    });
  }

  function updateReplyField(id, field, value) {
    setReplyState((current) => ({
      ...current,
      [id]: {
        ...current[id],
        [field]: value
      }
    }));
  }

  async function sendReply(quote) {
    const reply = replyState[quote._id];
    if (!reply?.message?.trim()) {
      setStatus("Reply message is required.");
      return;
    }

    updateReplyField(quote._id, "sending", true);

    try {
      const response = await api.replyToQuote(token, quote._id, {
        subject: reply.subject,
        message: reply.message
      });

      if (response.delivery === "draft" && response.mailto) {
        window.open(response.mailto, "_blank");
        setStatus("Your email app draft was opened. The customer will not receive anything until you click Send in that mail app, or until SMTP is configured for direct sending.");
      } else {
        setStatus("Reply sent successfully.");
      }

      await loadQuotes();
      setReplyState((current) => ({
        ...current,
        [quote._id]: {
          ...current[quote._id],
          open: false,
          sending: false
        }
      }));
    } catch (error) {
      setStatus(error.message);
      updateReplyField(quote._id, "sending", false);
    }
  }

  return (
    <section className="panel list-panel full-span">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Quote Requests</p>
          <h3>Incoming Leads</h3>
        </div>
        <button type="button" className="secondary" onClick={loadQuotes}>Refresh</button>
      </div>
      <div className="stack">
        {quotes.map((quote) => {
          const reply = replyState[quote._id] || { open: false, subject: "", message: "", sending: false };

          return (
            <article key={quote._id} className="quote-card quote-card-expanded">
              <div className="quote-main quote-main-expanded">
                <strong>{quote.name}</strong>
                <p className="muted small">{quote.email} · {quote.phone || "No phone"} · {quote.company || "No company"}</p>
                {quote.product?.name ? <p className="muted small">Product: {quote.product.name}</p> : null}
                <p>{quote.message}</p>
                {quote.repliedAt ? <p className="muted small">Last reply: {new Date(quote.repliedAt).toLocaleString()}</p> : null}

                {reply.open ? (
                  <div className="reply-panel">
                    <label>
                      <span>Subject</span>
                      <input value={reply.subject} onChange={(e) => updateReplyField(quote._id, "subject", e.target.value)} />
                    </label>
                    <label>
                      <span>Reply message</span>
                      <textarea rows="8" value={reply.message} onChange={(e) => updateReplyField(quote._id, "message", e.target.value)} />
                    </label>
                    <div className="row gap-sm wrap">
                      <button type="button" onClick={() => sendReply(quote)} disabled={reply.sending}>
                        {reply.sending ? "Preparing..." : "Send Reply"}
                      </button>
                      <button type="button" className="secondary" onClick={() => toggleReply(quote)}>Cancel</button>
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="quote-actions quote-actions-expanded">
                <select value={quote.status} onChange={(e) => updateStatus(quote._id, e.target.value)}>
                  <option value="new">New</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="closed">Closed</option>
                </select>
                <button type="button" className="secondary full-width" onClick={() => toggleReply(quote)}>
                  {reply.open ? "Hide Reply" : "Reply to Lead"}
                </button>
              </div>
            </article>
          );
        })}
        {!quotes.length ? <p className="muted">No quote requests found.</p> : null}
        {status ? <p className="muted small">{status}</p> : null}
      </div>
    </section>
  );
}

