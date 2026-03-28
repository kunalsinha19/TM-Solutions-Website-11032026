import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

const emptyCategory = {
  name: "",
  slug: "",
  description: "",
  seoTitle: "",
  seoDescription: "",
  sortOrder: 0,
  isActive: true
};

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);
}

function validateCategory(form) {
  if (!form.name.trim() || form.name.trim().length < 2) {
    return "Category name must be at least 2 characters.";
  }

  if (!form.slug.trim() || !/^[a-z0-9-]+$/.test(form.slug.trim())) {
    return "Slug is required and can contain only lowercase letters, numbers, and hyphens.";
  }

  if (form.description.length > 500) {
    return "Description cannot exceed 500 characters.";
  }

  if (form.seoTitle.length > 70) {
    return "SEO title cannot exceed 70 characters.";
  }

  if (form.seoDescription.length > 160) {
    return "SEO description cannot exceed 160 characters.";
  }

  if (Number(form.sortOrder) < 0) {
    return "Sort order cannot be negative.";
  }

  return "";
}

export default function CategoryManager({ token }) {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyCategory);
  const [editingId, setEditingId] = useState("");
  const [status, setStatus] = useState("");
  const [categoryPage, setCategoryPage] = useState(0);
  const pageSize = 10;

  const paginatedCategories = useMemo(() => {
    const start = categoryPage * pageSize;
    return categories.slice(start, start + pageSize);
  }, [categories, categoryPage, pageSize]);

  const pageCount = Math.max(1, Math.ceil(categories.length / pageSize));

  useEffect(() => {
    setCategoryPage(0);
  }, [categories]);

  async function loadCategories() {
    try {
      const response = await api.getCategories();
      setCategories(response.categories || []);
      setStatus("");
    } catch (error) {
      setStatus(error.message);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  function startEdit(category) {
    setEditingId(category._id);
    setForm({ ...emptyCategory, ...category });
    setStatus("");
  }

  function resetForm() {
    setEditingId("");
    setForm(emptyCategory);
    setStatus("");
  }

  function updateField(field, value) {
    setForm((current) => {
      const next = { ...current, [field]: value };

      if (field === "name" && (!current.slug || current.slug === slugify(current.name))) {
        next.slug = slugify(value);
      }

      if (field === "slug") {
        next.slug = slugify(value);
      }

      return next;
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const payload = {
      ...form,
      name: form.name.trim(),
      slug: slugify(form.slug),
      description: form.description.trim(),
      seoTitle: form.seoTitle.trim(),
      seoDescription: form.seoDescription.trim(),
      sortOrder: Number(form.sortOrder) || 0
    };

    const validationError = validateCategory(payload);
    if (validationError) {
      setStatus(validationError);
      return;
    }

    try {
      if (editingId) {
        await api.updateCategory(token, editingId, payload);
      } else {
        await api.createCategory(token, payload);
      }
      await loadCategories();
      resetForm();
      setStatus("Category saved successfully.");
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this category?")) {
      return;
    }

    try {
      await api.deleteCategory(token, id);
      await loadCategories();
      setStatus("Category deleted.");
    } catch (error) {
      setStatus(error.message);
    }
  }

  function prevPage() {
    setCategoryPage((current) => Math.max(current - 1, 0));
  }

  function nextPage() {
    setCategoryPage((current) => Math.min(current + 1, pageCount - 1));
  }

  return (
    <div className="module-grid">
      <section className="panel form-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Categories</p>
            <h3>{editingId ? "Edit category" : "Add category"}</h3>
          </div>
          {editingId ? <button type="button" className="secondary" onClick={resetForm}>New Category</button> : null}
        </div>
        <form className="stack" onSubmit={handleSubmit}>
          <label><span>Name</span><input value={form.name} onChange={(e) => updateField("name", e.target.value)} /></label>
          <label>
            <span>Slug</span>
            <input value={form.slug} onChange={(e) => updateField("slug", e.target.value)} />
            <small className="muted">Lowercase letters, numbers, and hyphens only.</small>
          </label>
          <label>
            <span>Description</span>
            <textarea rows="4" maxLength="500" value={form.description} onChange={(e) => updateField("description", e.target.value)} />
            <small className="muted">{form.description.length}/500</small>
          </label>
          <div className="grid-two">
            <label>
              <span>SEO title</span>
              <input maxLength="70" value={form.seoTitle} onChange={(e) => updateField("seoTitle", e.target.value)} />
              <small className="muted">{form.seoTitle.length}/70</small>
            </label>
            <label>
              <span>SEO description</span>
              <input maxLength="160" value={form.seoDescription} onChange={(e) => updateField("seoDescription", e.target.value)} />
              <small className="muted">{form.seoDescription.length}/160</small>
            </label>
          </div>
          <div className="grid-two">
            <label><span>Sort order</span><input type="number" min="0" value={form.sortOrder} onChange={(e) => updateField("sortOrder", e.target.value)} /></label>
            <label className="checkbox-row"><input type="checkbox" checked={form.isActive} onChange={(e) => updateField("isActive", e.target.checked)} /><span>Active</span></label>
          </div>
          <button type="submit">{editingId ? "Update Category" : "Add Category"}</button>
          {status ? <p className="muted small">{status}</p> : null}
        </form>
      </section>
      <section className="panel list-panel">
        <div className="panel-header"><h3>Categories</h3><button type="button" className="secondary" onClick={loadCategories}>Refresh</button></div>
        {categories.length ? (
          <>
            <div className="pagination-controls">
              <button type="button" className="secondary" onClick={prevPage} disabled={categoryPage === 0}>Previous</button>
              <span className="muted small">Page {categoryPage + 1} of {pageCount}</span>
              <button type="button" className="secondary" onClick={nextPage} disabled={categoryPage >= pageCount - 1}>Next</button>
            </div>
            <div className="stack">
              {paginatedCategories.map((category) => (
                <article key={category._id} className="list-card">
                  <div>
                    <strong>{category.name}</strong>
                    <p className="muted small">{category.slug} | {category.isActive ? "Active" : "Inactive"}</p>
                  </div>
                  <div className="row gap-sm">
                    <button type="button" className="secondary" onClick={() => startEdit(category)}>Edit</button>
                    <button type="button" className="danger" onClick={() => handleDelete(category._id)}>Delete</button>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : (
          <div className="stack">
            <p className="muted">No categories yet.</p>
          </div>
        )}
      </section>
    </div>
  );
}

