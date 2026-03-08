import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import ImageUploader from "./ImageUploader";

const emptyProduct = {
  name: "",
  slug: "",
  sku: "",
  shortDescription: "",
  description: "",
  price: 0,
  category: "",
  status: "draft",
  isFeatured: false,
  seoTitle: "",
  seoDescription: "",
  images: []
};

export default function ProductManager({ token }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyProduct);
  const [editingId, setEditingId] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const categoryOptions = useMemo(() => categories || [], [categories]);

  async function loadData() {
    setLoading(true);
    try {
      const [productsResponse, categoriesResponse] = await Promise.all([
        api.getProducts(),
        api.getCategories()
      ]);
      setProducts(productsResponse.products || []);
      setCategories(categoriesResponse.categories || []);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function startEdit(product) {
    setEditingId(product._id);
    setForm({
      ...emptyProduct,
      ...product,
      category: product.category?._id || product.category || "",
      images: product.images || []
    });
  }

  function resetForm() {
    setEditingId("");
    setForm(emptyProduct);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus(editingId ? "Updating product..." : "Creating product...");

    const payload = {
      ...form,
      price: Number(form.price) || 0
    };

    try {
      if (editingId) {
        await api.updateProduct(token, editingId, payload);
      } else {
        await api.createProduct(token, payload);
      }
      resetForm();
      await loadData();
      setStatus("Product saved successfully.");
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this product?")) {
      return;
    }

    try {
      await api.deleteProduct(token, id);
      await loadData();
      if (editingId === id) {
        resetForm();
      }
      setStatus("Product deleted.");
    } catch (error) {
      setStatus(error.message);
    }
  }

  return (
    <div className="module-grid">
      <section className="panel form-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Products</p>
            <h3>{editingId ? "Edit product" : "Add product"}</h3>
          </div>
          {editingId ? <button type="button" className="secondary" onClick={resetForm}>New Product</button> : null}
        </div>
        <form className="stack" onSubmit={handleSubmit}>
          <label><span>Name</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label><span>Slug</span><input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></label>
          <div className="grid-two">
            <label><span>SKU</span><input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></label>
            <label><span>Price</span><input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></label>
          </div>
          <label><span>Category</span>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="">Select category</option>
              {categoryOptions.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
            </select>
          </label>
          <div className="grid-two">
            <label><span>Status</span>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </label>
            <label className="checkbox-row"><input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} /><span>Featured product</span></label>
          </div>
          <label><span>Short description</span><textarea rows="3" value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} /></label>
          <label><span>Description</span><textarea rows="5" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
          <div className="grid-two">
            <label><span>SEO title</span><input value={form.seoTitle} onChange={(e) => setForm({ ...form, seoTitle: e.target.value })} /></label>
            <label><span>SEO description</span><input value={form.seoDescription} onChange={(e) => setForm({ ...form, seoDescription: e.target.value })} /></label>
          </div>
          <div>
            <span className="label">Images</span>
            <ImageUploader images={form.images} setImages={(images) => setForm({ ...form, images })} />
          </div>
          <button type="submit">{editingId ? "Update Product" : "Add Product"}</button>
          {status ? <p className="muted small">{status}</p> : null}
        </form>
      </section>

      <section className="panel list-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Catalog</p>
            <h3>Products</h3>
          </div>
          <button type="button" className="secondary" onClick={loadData}>Refresh</button>
        </div>
        {loading ? <p className="muted">Loading products...</p> : (
          <div className="stack">
            {products.map((product) => (
              <article key={product._id} className="list-card">
                <div>
                  <strong>{product.name}</strong>
                  <p className="muted small">{product.sku} · {product.status} · {product.category?.name || "No category"}</p>
                </div>
                <div className="row gap-sm">
                  <button type="button" className="secondary" onClick={() => startEdit(product)}>Edit</button>
                  <button type="button" className="danger" onClick={() => handleDelete(product._id)}>Delete</button>
                </div>
              </article>
            ))}
            {!products.length ? <p className="muted">No products yet.</p> : null}
          </div>
        )}
      </section>
    </div>
  );
}
