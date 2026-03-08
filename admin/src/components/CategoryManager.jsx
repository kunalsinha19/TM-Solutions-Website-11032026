import { useEffect, useState } from "react";
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

export default function CategoryManager({ token }) {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyCategory);
  const [editingId, setEditingId] = useState("");
  const [status, setStatus] = useState("");

  async function loadCategories() {
    try {
      const response = await api.getCategories();
      setCategories(response.categories || []);
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
  }

  function resetForm() {
    setEditingId("");
    setForm(emptyCategory);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      if (editingId) {
        await api.updateCategory(token, editingId, { ...form, sortOrder: Number(form.sortOrder) || 0 });
      } else {
        await api.createCategory(token, { ...form, sortOrder: Number(form.sortOrder) || 0 });
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
          <label><span>Name</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label><span>Slug</span><input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></label>
          <label><span>Description</span><textarea rows="4" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
          <div className="grid-two">
            <label><span>SEO title</span><input value={form.seoTitle} onChange={(e) => setForm({ ...form, seoTitle: e.target.value })} /></label>
            <label><span>SEO description</span><input value={form.seoDescription} onChange={(e) => setForm({ ...form, seoDescription: e.target.value })} /></label>
          </div>
          <div className="grid-two">
            <label><span>Sort order</span><input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} /></label>
            <label className="checkbox-row"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /><span>Active</span></label>
          </div>
          <button type="submit">{editingId ? "Update Category" : "Add Category"}</button>
          {status ? <p className="muted small">{status}</p> : null}
        </form>
      </section>
      <section className="panel list-panel">
        <div className="panel-header"><h3>Categories</h3><button type="button" className="secondary" onClick={loadCategories}>Refresh</button></div>
        <div className="stack">
          {categories.map((category) => (
            <article key={category._id} className="list-card">
              <div>
                <strong>{category.name}</strong>
                <p className="muted small">{category.slug} · {category.isActive ? "Active" : "Inactive"}</p>
              </div>
              <div className="row gap-sm">
                <button type="button" className="secondary" onClick={() => startEdit(category)}>Edit</button>
                <button type="button" className="danger" onClick={() => handleDelete(category._id)}>Delete</button>
              </div>
            </article>
          ))}
          {!categories.length ? <p className="muted">No categories yet.</p> : null}
        </div>
      </section>
    </div>
  );
}
