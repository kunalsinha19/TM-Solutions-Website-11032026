import { useEffect, useState } from "react";
import { api } from "../lib/api";

const emptySeoPage = {
  title: "",
  slug: "",
  metaTitle: "",
  metaDescription: "",
  canonicalUrl: "",
  schemaMarkup: "",
  ogImage: "",
  content: "{}",
  status: "draft"
};

export default function SeoPageManager({ token }) {
  const [pages, setPages] = useState([]);
  const [form, setForm] = useState(emptySeoPage);
  const [editingId, setEditingId] = useState("");
  const [status, setStatus] = useState("");

  async function loadPages() {
    try {
      const response = await api.getSeoPages();
      setPages(response.seoPages || []);
    } catch (error) {
      setStatus(error.message);
    }
  }

  useEffect(() => {
    loadPages();
  }, []);

  function startEdit(page) {
    setEditingId(page._id);
    setForm({
      ...emptySeoPage,
      ...page,
      content: typeof page.content === "string" ? page.content : JSON.stringify(page.content || {}, null, 2)
    });
  }

  function resetForm() {
    setEditingId("");
    setForm(emptySeoPage);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      const payload = {
        ...form,
        content: form.content ? JSON.parse(form.content) : {}
      };

      if (editingId) {
        await api.updateSeoPage(token, editingId, payload);
      } else {
        await api.createSeoPage(token, payload);
      }

      await loadPages();
      resetForm();
      setStatus("SEO page saved successfully.");
    } catch (error) {
      setStatus(error.message || "Invalid JSON content.");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this SEO page?")) {
      return;
    }

    try {
      await api.deleteSeoPage(token, id);
      await loadPages();
      setStatus("SEO page deleted.");
    } catch (error) {
      setStatus(error.message);
    }
  }

  return (
    <div className="module-grid">
      <section className="panel form-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">SEO Pages</p>
            <h3>{editingId ? "Edit SEO page" : "Create SEO page"}</h3>
          </div>
          {editingId ? <button type="button" className="secondary" onClick={resetForm}>New Page</button> : null}
        </div>
        <form className="stack" onSubmit={handleSubmit}>
          <label><span>Title</span><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
          <label><span>Slug</span><input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></label>
          <div className="grid-two">
            <label><span>Meta title</span><input value={form.metaTitle} onChange={(e) => setForm({ ...form, metaTitle: e.target.value })} /></label>
            <label><span>Meta description</span><input value={form.metaDescription} onChange={(e) => setForm({ ...form, metaDescription: e.target.value })} /></label>
          </div>
          <label><span>Canonical URL</span><input value={form.canonicalUrl} onChange={(e) => setForm({ ...form, canonicalUrl: e.target.value })} /></label>
          <label><span>OG image</span><input value={form.ogImage} onChange={(e) => setForm({ ...form, ogImage: e.target.value })} /></label>
          <label><span>Status</span>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </label>
          <label><span>Schema markup</span><textarea rows="5" value={form.schemaMarkup} onChange={(e) => setForm({ ...form, schemaMarkup: e.target.value })} /></label>
          <label><span>Page content JSON</span><textarea rows="10" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></label>
          <button type="submit">{editingId ? "Update SEO Page" : "Create SEO Page"}</button>
          {status ? <p className="muted small">{status}</p> : null}
        </form>
      </section>
      <section className="panel list-panel">
        <div className="panel-header"><h3>Landing Pages</h3><button type="button" className="secondary" onClick={loadPages}>Refresh</button></div>
        <div className="stack">
          {pages.map((page) => (
            <article key={page._id} className="list-card">
              <div>
                <strong>{page.title}</strong>
                <p className="muted small">/{page.slug} · {page.status}</p>
              </div>
              <div className="row gap-sm">
                <button type="button" className="secondary" onClick={() => startEdit(page)}>Edit</button>
                <button type="button" className="danger" onClick={() => handleDelete(page._id)}>Delete</button>
              </div>
            </article>
          ))}
          {!pages.length ? <p className="muted">No SEO pages yet.</p> : null}
        </div>
      </section>
    </div>
  );
}
