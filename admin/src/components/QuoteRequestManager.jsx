import { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function QuoteRequestManager({ token }) {
  const [quotes, setQuotes] = useState([]);
  const [status, setStatus] = useState("");

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
        {quotes.map((quote) => (
          <article key={quote._id} className="quote-card">
            <div className="quote-main">
              <strong>{quote.name}</strong>
              <p className="muted small">{quote.email} · {quote.phone || "No phone"} · {quote.company || "No company"}</p>
              <p>{quote.message}</p>
            </div>
            <div className="quote-actions">
              <select value={quote.status} onChange={(e) => updateStatus(quote._id, e.target.value)}>
                <option value="new">New</option>
                <option value="reviewed">Reviewed</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </article>
        ))}
        {!quotes.length ? <p className="muted">No quote requests found.</p> : null}
        {status ? <p className="muted small">{status}</p> : null}
      </div>
    </section>
  );
}
