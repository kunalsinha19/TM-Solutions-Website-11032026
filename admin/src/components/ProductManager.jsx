import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import ImageUploader from "./ImageUploader";

const emptyProduct = {
  name: "", slug: "", sku: "", shortDescription: "", description: "",
  price: 0, category: "", status: "draft", isFeatured: false,
  seoTitle: "", seoDescription: "", images: []
};

function slugify(value) {
  return value.toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 220);
}

function validateProduct(form) {
  if (!form.name.trim() || form.name.trim().length < 2)
    return "Product name must be at least 2 characters.";
  if (!form.slug.trim() || !/^[a-z0-9-]+$/.test(form.slug.trim()))
    return "Slug must contain only lowercase letters, numbers, and hyphens.";
  if (!form.sku.trim() || form.sku.trim().length < 2)
    return "SKU must be at least 2 characters.";
  if (!form.category) return "Please select a category.";
  if (form.shortDescription.length > 300) return "Short description max 300 chars.";
  if (form.description.length > 10000) return "Description max 10000 chars.";
  if (form.seoTitle.length > 70) return "SEO title max 70 chars.";
  if (form.seoDescription.length > 160) return "SEO description max 160 chars.";
  if (Number(form.price) < 0) return "Price cannot be negative.";
  return "";
}

const SEARCH_ICON = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
  </svg>
);
const CHEVRON_L = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M15 18l-6-6 6-6" />
  </svg>
);
const CHEVRON_R = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M9 18l6-6-6-6" />
  </svg>
);

function StatusBadge({ status, isFeatured }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
      <span className={`badge badge-${status}`}>{status}</span>
      {isFeatured && <span className="badge badge-featured">★ Featured</span>}
    </span>
  );
}

export default function ProductManager({ token }) {
  const [products, setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm]           = useState(emptyProduct);
  const [editingId, setEditingId] = useState("");
  const [status, setStatus]       = useState({ text: "", type: "" });
  const [loading, setLoading]     = useState(true);
  const [productPage, setProductPage] = useState(0);
  const [search, setSearch]       = useState("");
  const pageSize = 10;

  const categoryOptions = useMemo(() => categories || [], [categories]);
  const hasCategories = categoryOptions.length > 0;

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.trim().toLowerCase();
    return products.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q) ||
      p.category?.name?.toLowerCase().includes(q)
    );
  }, [products, search]);

  const productPageCount = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const safeProductPage = Math.min(productPage, productPageCount - 1);

  const paginatedProducts = useMemo(() => {
    const start = safeProductPage * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, safeProductPage]);

  useEffect(() => { setProductPage(0); }, [search, products]);

  async function loadData() {
    setLoading(true);
    try {
      const [pr, cr] = await Promise.all([api.getProducts(), api.getCategories()]);
      setProducts(pr.products || []);
      setCategories(cr.categories || []);
      setStatus({ text: "", type: "" });
    } catch (err) {
      setStatus({ text: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  function startEdit(product) {
    setEditingId(product._id);
    setForm({ ...emptyProduct, ...product, sku: product.sku || "",
      category: product.category?._id || product.category || "",
      images: product.images || [] });
    setStatus({ text: "", type: "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId("");
    setForm(emptyProduct);
    setStatus({ text: "", type: "" });
  }

  function updateField(field, value) {
    setForm(cur => {
      const next = { ...cur, [field]: value };
      if (field === "name" && (!cur.slug || cur.slug === slugify(cur.name)))
        next.slug = slugify(value);
      if (field === "slug") next.slug = slugify(value);
      if (field === "sku")  next.sku  = value.toUpperCase();
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const err = validateProduct({ ...form, name: form.name.trim(),
      slug: slugify(form.slug), sku: form.sku.trim().toUpperCase(),
      shortDescription: form.shortDescription.trim(),
      description: form.description.trim(),
      seoTitle: form.seoTitle.trim(), seoDescription: form.seoDescription.trim() });
    if (err) { setStatus({ text: err, type: "error" }); return; }

    setStatus({ text: editingId ? "Updating…" : "Creating…", type: "loading" });
    const payload = { ...form, name: form.name.trim(), slug: slugify(form.slug),
      sku: form.sku.trim().toUpperCase(), shortDescription: form.shortDescription.trim(),
      description: form.description.trim(), seoTitle: form.seoTitle.trim(),
      seoDescription: form.seoDescription.trim(), price: Number(form.price) || 0 };

    try {
      if (editingId) await api.updateProduct(token, editingId, payload);
      else           await api.createProduct(token, payload);
      resetForm();
      await loadData();
      setStatus({ text: "Product saved successfully.", type: "success" });
    } catch (err) {
      setStatus({ text: err.message, type: "error" });
    }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await api.deleteProduct(token, id);
      await loadData();
      if (editingId === id) resetForm();
      setStatus({ text: "Product deleted.", type: "info" });
    } catch (err) {
      setStatus({ text: err.message, type: "error" });
    }
  }

  const statusClass = { error: "status-line--error", success: "status-line--success",
    loading: "status-line--info", info: "status-line--info" };

  return (
    <div className="module-grid">
      {/* ── Form panel ── */}
      <section className="panel form-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Products</p>
            <h3 style={{ margin: 0 }}>{editingId ? "Edit product" : "Add product"}</h3>
          </div>
          {editingId && (
            <button type="button" className="secondary" onClick={resetForm}
              style={{ fontSize: "0.82rem", padding: "0.45rem 0.9rem", borderRadius: "9px" }}>
              + New
            </button>
          )}
        </div>

        {editingId && (
          <div className="editing-banner" style={{ marginBottom: "1rem" }}>
            <span>✏️</span> Editing — changes will overwrite the live product
          </div>
        )}

        <form className="stack" onSubmit={handleSubmit}>
          <label>
            <span>Name</span>
            <input value={form.name} onChange={e => updateField("name", e.target.value)} placeholder="e.g. TMS-8025D Foil Stamping Machine" />
          </label>

          <label>
            <span>Slug</span>
            <input value={form.slug} onChange={e => updateField("slug", e.target.value)} />
            <small className="muted">URL-safe identifier — auto-generated from name</small>
          </label>

          <div className="grid-two">
            <label>
              <span>SKU</span>
              <input value={form.sku} onChange={e => updateField("sku", e.target.value)} placeholder="TMS-XXXX" style={{ fontFamily: "Consolas, monospace", letterSpacing: "0.03em" }} />
              <small className="muted">Min 2 characters</small>
            </label>
            <label>
              <span>Price (₹)</span>
              <input type="number" min="0" value={form.price} onChange={e => updateField("price", e.target.value)} />
            </label>
          </div>

          <label>
            <span>Category</span>
            <select value={form.category} onChange={e => updateField("category", e.target.value)} disabled={!hasCategories}>
              <option value="">{hasCategories ? "Select category" : "Create a category first"}</option>
              {categoryOptions.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </label>

          <div className="grid-two">
            <label>
              <span>Status</span>
              <select value={form.status} onChange={e => updateField("status", e.target.value)}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </label>
            <label className="checkbox-row" style={{ justifyContent: "flex-start", alignSelf: "end", paddingBottom: "0.55rem" }}>
              <input type="checkbox" checked={form.isFeatured} onChange={e => updateField("isFeatured", e.target.checked)} />
              <span>Featured product ★</span>
            </label>
          </div>

          <label>
            <span>Short description <span style={{ color: "#94a3b8", fontWeight: 400 }}>{form.shortDescription.length}/300</span></span>
            <textarea rows="3" maxLength="300" value={form.shortDescription} onChange={e => updateField("shortDescription", e.target.value)} placeholder="Brief product summary visible in listings…" />
          </label>

          <label>
            <span>Full description</span>
            <textarea rows="5" maxLength="10000" value={form.description} onChange={e => updateField("description", e.target.value)} placeholder="Detailed product information, specs, use cases…" />
          </label>

          <p className="form-section-label">SEO</p>
          <div className="grid-two">
            <label>
              <span>Meta title <span style={{ color: "#94a3b8", fontWeight: 400 }}>{form.seoTitle.length}/70</span></span>
              <input maxLength="70" value={form.seoTitle} onChange={e => updateField("seoTitle", e.target.value)} />
            </label>
            <label>
              <span>Meta description <span style={{ color: "#94a3b8", fontWeight: 400 }}>{form.seoDescription.length}/160</span></span>
              <input maxLength="160" value={form.seoDescription} onChange={e => updateField("seoDescription", e.target.value)} />
            </label>
          </div>

          <p className="form-section-label">Images</p>
          <div>
            <ImageUploader images={form.images} setImages={imgs => setForm({ ...form, images: imgs })} />
          </div>

          <button type="submit" disabled={!hasCategories && !editingId}
            style={{ marginTop: "0.25rem" }}>
            {editingId ? "Update Product" : "Add Product"}
          </button>

          {status.text && (
            <p className={`status-line ${statusClass[status.type] || "status-line--info"}`}>
              {status.type === "loading" ? "⏳" : status.type === "success" ? "✓" : status.type === "error" ? "✕" : "ℹ"}
              {" "}{status.text}
            </p>
          )}
        </form>
      </section>

      {/* ── List panel ── */}
      <section className="panel list-panel">
        <div className="panel-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
            <div>
              <p className="eyebrow">Catalog</p>
              <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                Products
                <span className="panel-count">{products.length}</span>
              </h3>
            </div>
          </div>
          <button type="button" className="secondary" onClick={loadData}
            style={{ fontSize: "0.8rem", padding: "0.45rem 0.9rem", borderRadius: "9px" }}>
            ↻ Refresh
          </button>
        </div>

        {/* Search */}
        <div className="search-wrap" style={{ marginBottom: "1rem" }}>
          <span className="search-icon">{SEARCH_ICON}</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, SKU or category…"
            style={{ fontSize: "0.86rem" }}
          />
        </div>

        {loading ? (
          <div className="empty-state">
            <div className="dash-spinner" style={{ margin: "0 auto 0.5rem" }} />
            <p>Loading products…</p>
          </div>
        ) : (
          <>
            {/* Pagination */}
            <div className="pg-controls">
              <button type="button" className="secondary pg-btn" onClick={() => setProductPage(p => Math.max(p - 1, 0))} disabled={safeProductPage === 0}>
                {CHEVRON_L} Prev
              </button>
              <span className="pg-info">Page {safeProductPage + 1} / {productPageCount}</span>
              <button type="button" className="secondary pg-btn" onClick={() => setProductPage(p => Math.min(p + 1, productPageCount - 1))} disabled={safeProductPage >= productPageCount - 1}>
                Next {CHEVRON_R}
              </button>
            </div>

            {/* Product cards */}
            <div className="stack" style={{ gap: "0.5rem" }}>
              {paginatedProducts.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📦</div>
                  <h4>{search ? "No matches found" : "No products yet"}</h4>
                  <p>{search ? `Try a different search term` : "Add your first product using the form"}</p>
                </div>
              ) : paginatedProducts.map(product => (
                <article key={product._id} className={`pm-card${editingId === product._id ? " pm-card--editing" : ""}`}>
                  <div className="pm-card-body">
                    <p className="pm-card-name">{product.name}</p>
                    <div className="pm-card-meta">
                      <span className="pm-card-sku">{product.sku}</span>
                      <StatusBadge status={product.status} isFeatured={product.isFeatured} />
                      {product.category?.name && (
                        <span className="tag tag-amber">{product.category.name}</span>
                      )}
                    </div>
                  </div>
                  <div className="pm-card-actions">
                    <button type="button" className="secondary" onClick={() => startEdit(product)}>Edit</button>
                    <button type="button" className="danger" onClick={() => handleDelete(product._id, product.name)}>Delete</button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
