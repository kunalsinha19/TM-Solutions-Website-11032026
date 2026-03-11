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

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 220);
}

function validateProduct(form) {
  if (!form.name.trim() || form.name.trim().length < 2) {
    return "Product name must be at least 2 characters.";
  }

  if (!form.slug.trim() || !/^[a-z0-9-]+$/.test(form.slug.trim())) {
    return "Slug is required and can contain only lowercase letters, numbers, and hyphens.";
  }

  if (!form.sku.trim() || form.sku.trim().length < 2) {
    return "SKU must be at least 2 characters.";
  }

  if (!form.category) {
    return "Please select a category.";
  }

  if (form.shortDescription.length > 300) {
    return "Short description cannot exceed 300 characters.";
  }

  if (form.description.length > 10000) {
    return "Description cannot exceed 10000 characters.";
  }

  if (form.seoTitle.length > 70) {
    return "SEO title cannot exceed 70 characters.";
  }

  if (form.seoDescription.length > 160) {
    return "SEO description cannot exceed 160 characters.";
  }

  if (Number(form.price) < 0) {
    return "Price cannot be negative.";
  }

  return "";
}

export default function ProductManager({ token }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyProduct);
  const [editingId, setEditingId] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [productPage, setProductPage] = useState(0);
  const pageSize = 10;

  const categoryOptions = useMemo(() => categories || [], [categories]);
  const hasCategories = categoryOptions.length > 0;

  const paginatedProducts = useMemo(() => {
    const start = productPage * pageSize;
    return products.slice(start, start + pageSize);
  }, [products, productPage, pageSize]);

  const productPageCount = Math.max(1, Math.ceil(products.length / pageSize));

  useEffect(() => {
    setProductPage(0);
  }, [products]);

  async function loadData() {
    setLoading(true);
    try {
      const [productsResponse, categoriesResponse] = await Promise.all([
        api.getProducts(),
        api.getCategories()
      ]);
      setProducts(productsResponse.products || []);
      setCategories(categoriesResponse.categories || []);
      setStatus("");
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
      sku: product.sku || "",
      category: product.category?._id || product.category || "",
      images: product.images || []
    });
    setStatus("");
  }

  function resetForm() {
    setEditingId("");
    setForm(emptyProduct);
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

      if (field === "sku") {
        next.sku = value.toUpperCase();
      }

      return next;
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationError = validateProduct({
      ...form,
      name: form.name.trim(),
      slug: slugify(form.slug),
      sku: form.sku.trim().toUpperCase(),
      shortDescription: form.shortDescription.trim(),
      description: form.description.trim(),
      seoTitle: form.seoTitle.trim(),
      seoDescription: form.seoDescription.trim()
    });

    if (validationError) {
      setStatus(validationError);
      return;
    }

    setStatus(editingId ? "Updating product..." : "Creating product...");

    const payload = {
      ...form,
      name: form.name.trim(),
      slug: slugify(form.slug),
      sku: form.sku.trim().toUpperCase(),
      shortDescription: form.shortDescription.trim(),
      description: form.description.trim(),
      seoTitle: form.seoTitle.trim(),
      seoDescription: form.seoDescription.trim(),
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

  function prevPage() {
    setProductPage((current) => Math.max(current - 1, 0));
  }

  function nextPage() {
    setProductPage((current) => Math.min(current + 1, productPageCount - 1));
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
          <label><span>Name</span><input value={form.name} onChange={(e) => updateField("name", e.target.value)} /></label>
          <label>
            <span>Slug</span>
            <input value={form.slug} onChange={(e) => updateField("slug", e.target.value)} />
            <small className="muted">Lowercase letters, numbers, and hyphens only.</small>
          </label>
          <div className="grid-two">
            <label>
              <span>SKU</span>
              <input value={form.sku} onChange={(e) => updateField("sku", e.target.value)} />
              <small className="muted">Minimum 2 characters.</small>
            </label>
            <label><span>Price</span><input type="number" min="0" value={form.price} onChange={(e) => updateField("price", e.target.value)} /></label>
          </div>
          <label>
            <span>Category</span>
            <select value={form.category} onChange={(e) => updateField("category", e.target.value)} disabled={!hasCategories}>
              <option value="">{hasCategories ? "Select category" : "Create a category first"}</option>
              {categoryOptions.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
            </select>
            {!hasCategories ? <small className="muted">No categories exist yet. Add one in the Categories section first.</small> : null}
          </label>
          <div className="grid-two">
            <label><span>Status</span>
              <select value={form.status} onChange={(e) => updateField("status", e.target.value)}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </label>
            <label className="checkbox-row"><input type="checkbox" checked={form.isFeatured} onChange={(e) => updateField("isFeatured", e.target.checked)} /><span>Featured product</span></label>
          </div>
          <label>
            <span>Short description</span>
            <textarea rows="3" maxLength="300" value={form.shortDescription} onChange={(e) => updateField("shortDescription", e.target.value)} />
            <small className="muted">{form.shortDescription.length}/300</small>
          </label>
          <label>
            <span>Description</span>
            <textarea rows="5" maxLength="10000" value={form.description} onChange={(e) => updateField("description", e.target.value)} />
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
          <div>
            <span className="label">Images</span>
            <ImageUploader images={form.images} setImages={(images) => setForm({ ...form, images })} />
          </div>
          <button type="submit" disabled={!hasCategories && !editingId}>{editingId ? "Update Product" : "Add Product"}</button>
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
          <>
            <div className="pagination-controls">
              <button type="button" className="secondary" onClick={prevPage} disabled={productPage === 0}>Previous</button>
              <span className="muted small">Page {productPage + 1} of {productPageCount}</span>
              <button type="button" className="secondary" onClick={nextPage} disabled={productPage >= productPageCount - 1}>Next</button>
            </div>
            <div className="stack">
              {paginatedProducts.map((product) => (
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
          </>
        )}
      </section>
    </div>
  );
}
