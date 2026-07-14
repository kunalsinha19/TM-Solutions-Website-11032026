import { useState, useEffect } from "react";
import { api } from "../lib/api.js";

const EMPTY = { title: "", description: "", category: "", fileUrl: "", isActive: true };

export default function BrochureManager({ token }) {
  const [brochures, setBrochures] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", msg: "" });
  const [uploading, setUploading] = useState(false);

  function flash(type, msg) {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback({ type: "", msg: "" }), 4000);
  }

  function load() {
    api.getBrochures(token)
      .then(d => setBrochures(d.brochures || []))
      .catch(() => {});
  }

  useEffect(() => { load(); }, []);

  function reset() { setForm(EMPTY); setEditing(null); }

  function startEdit(b) {
    setForm({ title: b.title, description: b.description || "", category: b.category || "", fileUrl: b.fileUrl || "", isActive: b.isActive });
    setEditing(b._id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== "application/pdf") { flash("error", "Only PDF files are allowed."); return; }
    if (file.size > 10 * 1024 * 1024) { flash("error", "File must be under 10 MB."); return; }
    setUploading(true);
    try {
      const result = await api.uploadMedia(token, file);
      setForm(f => ({ ...f, fileUrl: result.url, fileName: file.name, fileSize: file.size }));
      flash("success", "PDF uploaded successfully.");
    } catch (err) {
      flash("error", err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) { flash("error", "Title is required."); return; }
    setLoading(true);
    try {
      if (editing) {
        await api.updateBrochure(token, editing, form);
        flash("success", "Brochure updated.");
      } else {
        await api.createBrochure(token, form);
        flash("success", "Brochure created.");
      }
      reset();
      load();
    } catch (err) {
      flash("error", err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id, title) {
    if (!confirm(`Delete "${title}"?`)) return;
    try {
      await api.deleteBrochure(token, id);
      flash("success", "Brochure deleted.");
      load();
    } catch (err) {
      flash("error", err.message);
    }
  }

  return (
    <div className="module-grid">
      {/* Form */}
      <div className="panel form-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Brochures</p>
            <h3>{editing ? "Edit Brochure" : "Add Brochure"}</h3>
          </div>
          {editing && <button type="button" className="secondary" onClick={reset}>Cancel</button>}
        </div>

        {feedback.msg && (
          <div className={`feedback ${feedback.type}`} style={{ marginBottom: "1rem" }}>
            {feedback.msg}
          </div>
        )}

        <form className="stack" onSubmit={handleSubmit}>
          <label>
            <span>Title *</span>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
          </label>
          <label>
            <span>Category</span>
            <input placeholder="e.g. Sticker Machines, General" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
          </label>
          <label>
            <span>Description</span>
            <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </label>

          {/* PDF Upload */}
          <div>
            <p className="label" style={{ marginBottom: "0.4rem" }}>PDF File</p>
            <div className="brochure-upload-block">
              {form.fileUrl ? (
                <div className="brochure-file-preview">
                  <span>📄</span>
                  <a href={form.fileUrl} target="_blank" rel="noopener noreferrer" className="brochure-file-link">
                    {form.fileName || "View PDF"}
                  </a>
                  <button
                    type="button"
                    className="secondary"
                    style={{ padding: "0.3rem 0.7rem", fontSize: "0.8rem" }}
                    onClick={() => setForm(f => ({ ...f, fileUrl: "", fileName: "", fileSize: 0 }))}
                  >
                    Replace
                  </button>
                </div>
              ) : (
                <label className="brochure-upload-label">
                  <input type="file" accept="application/pdf" onChange={handleUpload} style={{ display: "none" }} />
                  {uploading ? "Uploading…" : "📁 Click to upload PDF (max 10 MB)"}
                </label>
              )}
            </div>
            <p className="muted small" style={{ marginTop: "0.35rem" }}>
              Or paste a direct URL:
            </p>
            <input
              type="url"
              placeholder="https://…"
              value={form.fileUrl}
              onChange={e => setForm(f => ({ ...f, fileUrl: e.target.value }))}
            />
          </div>

          <div className="checkbox-row">
            <input type="checkbox" id="broch-active" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
            <label htmlFor="broch-active" style={{ display: "flex", cursor: "pointer" }}>Active (visible on website)</label>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Saving…" : editing ? "Update Brochure" : "Add Brochure"}
          </button>
        </form>
      </div>

      {/* List */}
      <div className="panel list-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Access Control</p>
            <h3>Brochure Library ({brochures.length})</h3>
          </div>
          <button type="button" className="secondary" onClick={load}>Refresh</button>
        </div>

        {brochures.length === 0 ? (
          <div className="feedback loading">No brochures yet. Add your first PDF above.</div>
        ) : (
          <div className="stack">
            {brochures.map(b => (
              <div key={b._id} className="list-card brochure-card">
                <div>
                  <strong>{b.title}</strong>
                  {b.category && <p className="muted small">📂 {b.category}</p>}
                  {b.description && <p className="muted small" style={{ marginTop: "0.2rem" }}>{b.description}</p>}
                  <div className="brochure-meta">
                    <span className={`visitors-status visitors-status--${b.isActive ? "live" : "done"}`}>
                      {b.isActive ? "Active" : "Inactive"}
                    </span>
                    <span className="muted small">⬇️ {b.downloadCount} downloads</span>
                    {b.lastDownloadedAt && (
                      <span className="muted small">Last: {new Date(b.lastDownloadedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                  {b.fileUrl && (
                    <a href={b.fileUrl} target="_blank" rel="noopener noreferrer" className="brochure-pdf-link">
                      📄 View PDF
                    </a>
                  )}
                </div>
                <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                  <button type="button" className="secondary" onClick={() => startEdit(b)}>Edit</button>
                  <button type="button" className="danger" onClick={() => handleDelete(b._id, b.title)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
