import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";

const EMPTY_FORM = {
  title: "", slug: "", excerpt: "", content: "",
  coverImage: "", tags: "", seoTitle: "", seoDescription: "", status: "draft",
};

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function PostForm({ initial, onSave, onCancel, loading }) {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...initial });

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const onTitleChange = (e) => {
    const t = e.target.value;
    setForm(f => ({ ...f, title: t, slug: f.slug || slugify(t) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const tags = form.tags.split(",").map(t => t.trim()).filter(Boolean);
    onSave({ ...form, tags });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
      <div className="form-group">
        <label className="form-label">Title *</label>
        <input className="input" value={form.title} onChange={onTitleChange} required placeholder="Enter article title" />
      </div>
      <div className="form-group">
        <label className="form-label">Slug *</label>
        <input className="input" value={form.slug} onChange={set("slug")} required placeholder="url-friendly-slug" />
      </div>
      <div className="form-group">
        <label className="form-label">Excerpt</label>
        <textarea className="input" rows={2} value={form.excerpt} onChange={set("excerpt")} placeholder="Short summary (shown in listing)" />
      </div>
      <div className="form-group">
        <label className="form-label">Content (HTML)</label>
        <textarea className="input" rows={10} value={form.content} onChange={set("content")} placeholder="Article body — supports HTML" style={{ fontFamily: "monospace", fontSize: "0.8rem" }} />
      </div>
      <div className="form-group">
        <label className="form-label">Cover Image URL</label>
        <input className="input" value={form.coverImage} onChange={set("coverImage")} placeholder="https://…" />
      </div>
      <div className="form-group">
        <label className="form-label">Tags (comma-separated)</label>
        <input className="input" value={form.tags} onChange={set("tags")} placeholder="packaging, automation, printing" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        <div className="form-group">
          <label className="form-label">SEO Title</label>
          <input className="input" value={form.seoTitle} onChange={set("seoTitle")} placeholder="60–70 chars" />
        </div>
        <div className="form-group">
          <label className="form-label">SEO Description</label>
          <input className="input" value={form.seoDescription} onChange={set("seoDescription")} placeholder="150–160 chars" />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Status</label>
        <select className="input" value={form.status} onChange={set("status")}>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>
      <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", paddingTop: "0.5rem" }}>
        <button type="button" className="btn btn-sm" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Saving…" : "Save Post"}
        </button>
      </div>
    </form>
  );
}

export default function BlogManager({ token }) {
  const [posts, setPosts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null); // null | "new" | post object
  const [deleteId, setDeleteId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      const data = await fetch(
        `${import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:4000/api"}/blog/admin/all?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      ).then(r => r.json());
      setPosts(data.posts ?? []);
      setTotal(data.total ?? 0);
      setPages(data.pages ?? 1);
    } catch (e) {
      setError(e.message || "Failed to load posts");
    } finally {
      setLoading(false);
    }
  }, [token, page]);

  useEffect(() => { load(); }, [load]);

  const apiBase = `${import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:4000/api"}/blog`;

  const seedDemoPosts = async () => {
    setSeeding(true);
    setError("");
    try {
      const res = await fetch(`${apiBase}/seed-demo`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Seed failed");
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSeeding(false);
    }
  };

  const save = async (payload) => {
    setSaving(true);
    setError("");
    try {
      const isNew = editing === "new";
      const url = isNew ? apiBase : `${apiBase}/${editing._id}`;
      const method = isNew ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Save failed");
      setEditing(null);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    try {
      const res = await fetch(`${apiBase}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Delete failed");
      setDeleteId(null);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  if (editing !== null) {
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <h2 style={{ margin: 0 }}>{editing === "new" ? "New Article" : "Edit Article"}</h2>
        </div>
        <div className="panel" style={{ padding: "1.5rem" }}>
          {error && <p className="error-msg" style={{ marginBottom: "1rem" }}>{error}</p>}
          <PostForm
            initial={editing === "new" ? {} : {
              ...editing,
              tags: (editing.tags ?? []).join(", "),
            }}
            onSave={save}
            onCancel={() => { setEditing(null); setError(""); }}
            loading={saving}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <p className="muted" style={{ fontSize: "0.8rem" }}>{total} article{total !== 1 ? "s" : ""}</p>
        <button type="button" className="btn btn-primary" onClick={() => setEditing("new")}>
          + New Article
        </button>
      </div>

      {error && <p className="error-msg" style={{ marginBottom: "1rem" }}>{error}</p>}

      {loading && posts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--muted)" }}>Loading…</div>
      ) : posts.length === 0 ? (
        <div className="panel" style={{ textAlign: "center", padding: "3rem" }}>
          <p style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>✍️</p>
          <p className="muted" style={{ marginBottom: "1.25rem" }}>No articles yet. Click &quot;New Article&quot; to create one, or import the 5 demo posts.</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={seedDemoPosts}
            disabled={seeding}
            style={{ background: "#d97706", borderColor: "#d97706" }}
          >
            {seeding ? "Importing…" : "📥 Import 5 Demo Posts"}
          </button>
        </div>
      ) : (
        <div className="panel" style={{ overflow: "hidden", padding: 0 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Title", "Status", "Tags", "Published", ""].map(h => (
                  <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", color: "var(--muted)", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {posts.map(post => (
                <tr key={post._id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>{post.title}</td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <span style={{
                      padding: "2px 8px", borderRadius: "999px", fontSize: "0.7rem", fontWeight: 700,
                      background: post.status === "published" ? "#22c55e22" : "#f59e0b22",
                      color: post.status === "published" ? "#22c55e" : "#f59e0b",
                      border: `1px solid ${post.status === "published" ? "#22c55e44" : "#f59e0b44"}`,
                    }}>
                      {post.status}
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem 1rem", color: "var(--muted)" }}>
                    {(post.tags ?? []).join(", ") || "—"}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", color: "var(--muted)" }}>
                    {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button type="button" className="btn btn-sm" onClick={() => setEditing(post)}>Edit</button>
                      {deleteId === post._id ? (
                        <>
                          <button type="button" className="btn btn-sm btn-danger" onClick={() => remove(post._id)}>Confirm</button>
                          <button type="button" className="btn btn-sm" onClick={() => setDeleteId(null)}>Cancel</button>
                        </>
                      ) : (
                        <button type="button" className="btn btn-sm btn-danger" onClick={() => setDeleteId(post._id)}>Delete</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", marginTop: "1rem" }}>
          <button type="button" className="btn btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span className="muted" style={{ fontSize: "0.8rem", padding: "0.35rem 0.75rem" }}>{page} / {pages}</span>
          <button type="button" className="btn btn-sm" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}
