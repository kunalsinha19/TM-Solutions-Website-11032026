"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import AnimatedReveal from "./AnimatedReveal";
import SectionHeading from "./SectionHeading";

const staticCategories = [
  {
    id: "industrial-machines",
    title: "Industrial machines",
    description: "Machines and equipment used in day-to-day industrial work."
  },
  {
    id: "electrical-items",
    title: "Electrical items",
    description: "Products for power, control, and safe industrial connections."
  },
  {
    id: "automation-products",
    title: "Automation products",
    description: "Smart products that help improve speed, control, and accuracy."
  },
  {
    id: "custom-requirements",
    title: "Custom requirements",
    description: "If you need something specific, we can help you source the right product."
  }
];

const rawApiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/$/, "");
const API_BASE = rawApiBase
  .replace(/^https:\/\/(localhost|127\.0\.0\.1)(?::\d+)?/i, (match) => match.replace("https://", "http://"));
const quickQuoteInitial = {
  name: "",
  email: "",
  phone: "",
  quantity: ""
};

function formatInrAmount(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);
}

function normalizeProduct(product) {
  const images = Array.isArray(product.images)
    ? product.images
      .map((entry) => {
        if (typeof entry === "string") {
          return entry.trim();
        }

        if (entry && typeof entry.url === "string") {
          return entry.url.trim();
        }

        return "";
      })
      .filter(Boolean)
    : [];

  return {
    id: product._id || product.slug || product.name,
    productId: product._id || null,
    name: product.name,
    slug: product.slug || "",
    category: product.category?.name || "Uncategorized",
    shortDescription: product.shortDescription || "",
    description: product.description || "",
    detail: product.shortDescription || product.description || "Product available for business inquiries.",
    image: images[0] || "",
    images,
    price: Number.isFinite(product.price) ? product.price : 0,
    tags: Array.isArray(product.tags) ? product.tags : [],
    status: product.status || "draft"
  };
}

export default function CategoriesSection() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [activeProduct, setActiveProduct] = useState(null);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [quoteForm, setQuoteForm] = useState(quickQuoteInitial);
  const [quoteStatus, setQuoteStatus] = useState({ type: "idle", message: "" });
  const [pageCount, setPageCount] = useState(0);
  const quoteFormRef = useRef(null);

  useEffect(() => {
    let active = true;

    async function fetchData() {
      try {
        const [productsResponse, categoriesResponse] = await Promise.all([
          fetch(`${API_BASE}/products`).then((response) => response.ok ? response.json() : null),
          fetch(`${API_BASE}/categories`).then((response) => response.ok ? response.json() : null)
        ]);

        if (!active) {
          return;
        }

        const allProducts = Array.isArray(productsResponse?.products) ? productsResponse.products : [];
        const publishedProducts = allProducts.filter((product) => product?.status === "published");
        const liveProducts = publishedProducts.length ? publishedProducts : allProducts;

        const liveCategories = Array.isArray(categoriesResponse?.categories)
          ? categoriesResponse.categories.filter((category) => category?.isActive !== false)
          : [];

        const normalizedProducts = liveProducts.map(normalizeProduct);
        setProducts(normalizedProducts);
        setCategories(liveCategories);
      } catch {
        if (active) {
          setProducts([]);
          setCategories([]);
        }
      }
    }

    fetchData();

    return () => {
      active = false;
    };
  }, []);

  const liveProducts = useMemo(() => {
    const lowerQuery = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
      const matchesQuery = !lowerQuery || `${product.name} ${product.category} ${product.slug} ${product.tags.join(" ")}`.toLowerCase().includes(lowerQuery);
      return matchesCategory && matchesQuery;
    });
  }, [products, selectedCategory, query]);

  useEffect(() => {
    setPage(0);
  }, [query, selectedCategory]);

  useEffect(() => {
    setPageCount(Math.ceil(liveProducts.length / 6));
    if (!liveProducts.length) {
      setActiveProduct(null);
    }
  }, [liveProducts]);

  useEffect(() => {
    if (!activeProduct && liveProducts.length) {
      setActiveProduct(liveProducts[0]);
    }
  }, [activeProduct, liveProducts]);

  useEffect(() => {
    setShowQuoteForm(false);
    setQuoteForm(quickQuoteInitial);
    setQuoteStatus({ type: "idle", message: "" });
  }, [activeProduct?.id]);

  function selectCategory(category) {
    setSelectedCategory(category);
  }

  function handleProductSelect(product) {
    setActiveProduct(product);
    setShowQuoteForm(false);
    setQuoteStatus({ type: "idle", message: "" });
  }

  function openQuoteForm() {
    setShowQuoteForm(true);
    setTimeout(() => {
      quoteFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  async function handleQuickQuoteSubmit(event) {
    event.preventDefault();

    if (!quoteForm.name.trim() || !quoteForm.email.trim() || !quoteForm.phone.trim() || !quoteForm.quantity.trim()) {
      setQuoteStatus({ type: "error", message: "Please fill all four fields to continue." });
      return;
    }

    setQuoteStatus({ type: "loading", message: "Sending your quote request..." });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const response = await fetch(`${API_BASE}/quotes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: quoteForm.name.trim(),
          email: quoteForm.email.trim(),
          phone: quoteForm.phone.trim(),
          company: "",
          product: activeProduct.productId,
          sourcePage: "homepage-product-showcase",
          message: `Product enquiry for ${activeProduct.name}. Required quantity: ${quoteForm.quantity.trim()}.`,
          captchaToken: "dev-bypass"
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Unable to submit quote request");
      }

      setQuoteForm(quickQuoteInitial);
      setQuoteStatus({ type: "success", message: `Quote request sent for ${activeProduct.name}. Our team will contact you soon.` });
    } catch (error) {
      const message = error.name === "AbortError" ? "Request timed out. Please try again." : error.message;
      setQuoteStatus({ type: "error", message });
    }
  }

  function goPrevPage() {
    setPage((current) => Math.max(current - 1, 0));
  }

  function goNextPage() {
    setPage((current) => Math.min(current + 1, pageCount - 1));
  }

  const pagedProducts = useMemo(() => {
    const start = page * 6;
    return liveProducts.slice(start, start + 6);
  }, [liveProducts, page]);

  const categoriesToShow = ["All", ...new Set(liveProducts.map((product) => product.category || "Uncategorized"))];

  return (
    <section id="categories" className="section-block products-section">
      <div className="container">
        <div className="products-header-row">
          <SectionHeading
            eyebrow="Products"
            title="Find the right machine quickly, compare the main details, and send your requirement in one place."
            description="Look at the product groups below, use the search box if you know a product name, and move through the catalog six products at a time."
          />
          <AnimatedReveal delay={0.05} className="product-search-shell">
            <label className="product-search-label" htmlFor="product-search">Search products</label>
            <input
              id="product-search"
              className="product-search-input"
              type="search"
              placeholder="Search by product name, category, SKU..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </AnimatedReveal>
        </div>

        <div className="category-grid">
          {staticCategories.map((category, index) => (
            <AnimatedReveal key={category.id} delay={index * 0.07} className="category-card category-card-rich">
              <div className="category-index">{String(index + 1).padStart(2, "0")}</div>
              <h3>{category.title}</h3>
              <p>{category.description}</p>
            </AnimatedReveal>
          ))}
        </div>
        <AnimatedReveal delay={0.08} className="category-tabs">
          {categoriesToShow.map((category) => {
            const isActive = selectedCategory === category;

            return (
              <motion.button
                key={category}
                type="button"
                className={`category-tab ${isActive ? "active" : ""}`}
                onClick={() => selectCategory(category)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {category}
              </motion.button>
            );
          })}
        </AnimatedReveal>

        <div className="product-browser-layout">
          <div className="product-card-grid">
            {pagedProducts.map((product) => (
              <motion.button
                type="button"
                key={product.id}
                className={`product-tile ${activeProduct?.id === product.id ? "active" : ""}`}
                onClick={() => handleProductSelect(product)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="product-tile-inner">
                  <div className="product-tile-media">
                    {product.image ? (
                      <motion.img
                        layoutId={`product-image-${product.id}`}
                        className="product-tile-image"
                        src={product.image}
                        alt={product.name}
                      />
                    ) : (
                      <div className="product-tile-placeholder">No image</div>
                    )}
                  </div>
                  <div className="product-tile-copy">
                    <div className="product-tile-head">
                      <span className="product-tile-badge">{product.category}</span>
                      <strong>{product.price > 0 ? formatInrAmount(product.price) : "Request price"}</strong>
                    </div>
                    <h4>{product.name}</h4>
                    <p>{product.shortDescription || product.detail}</p>
                  </div>
                </div>
              </motion.button>
            ))}

            <div className="pagination-row">
              <button type="button" className="secondary" onClick={goPrevPage} disabled={page === 0}>Previous</button>
              <span>{page + 1} / {Math.max(pageCount, 1)}</span>
              <button type="button" className="secondary" onClick={goNextPage} disabled={page + 1 >= pageCount}>Next</button>
            </div>
          </div>

          <div className="product-detail-column">
            <div className="product-detail-sticky">
              <AnimatePresence mode="wait">
                {activeProduct ? (
                  <motion.div
                    key={`detail-${activeProduct.id}`}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 16 }}
                    transition={{ duration: 0.3 }}
                    className="product-detail-panel"
                  >
                    <div className="product-detail-kicker-row">
                      <span className="product-detail-badge">{activeProduct.category}</span>
                      <div className="product-detail-price">
                        <p>Indicative price</p>
                        <strong>{activeProduct.price > 0 ? formatInrAmount(activeProduct.price) : "Request price"}</strong>
                      </div>
                    </div>
                    <div className="product-detail-section">
                      <div className="product-detail-section-head">
                        <h3>{activeProduct.name}</h3>
                      </div>
                      <p className="product-detail-summary">{activeProduct.description || activeProduct.shortDescription}</p>
                    </div>
                    {activeProduct.tags.length ? (
                      <div className="product-detail-section product-detail-list">
                        {activeProduct.tags.map((tag) => (
                          <div key={tag} className="product-detail-list-item">
                            <span>Tag</span>
                            <strong>{tag}</strong>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    {activeProduct.images.length ? (
                      <div className="product-detail-section product-detail-gallery">
                        {activeProduct.images.slice(0, 4).map((img) => (
                          <div key={img} className="product-detail-thumb">
                            <img src={img} alt={activeProduct.name} />
                          </div>
                        ))}
                      </div>
                    ) : null}
                    <div className="product-detail-section">
                      <div className="product-detail-actions">
                        <button type="button" onClick={openQuoteForm}>Select Quick Quote</button>
                        <a href="#quote" className="secondary">Get a Quote</a>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="product-detail-panel empty-live-products">
                    <p>No published products found yet.</p>
                    <p>Add products in the admin panel to see them here.</p>
                  </div>
                )}
              </AnimatePresence>

              {showQuoteForm && activeProduct ? (
                <div
                  key={`quote-${activeProduct.id}`}
                  ref={quoteFormRef}
                  className="product-quick-quote product-quick-quote-inline"
                >
                  <div className="product-quick-quote-header">
                    <p className="eyebrow">Quick quote</p>
                    <h3>Send your requirement for {activeProduct.name}</h3>
                    <p className="quick-quote-subtext">Fill these four fields and we will review your request and get back to you.</p>
                  </div>
                  <form className="product-quick-quote-form" onSubmit={handleQuickQuoteSubmit}>
                    <div className="quick-quote-grid">
                      <label>
                        <span>Name</span>
                        <input value={quoteForm.name} onChange={(event) => setQuoteForm({ ...quoteForm, name: event.target.value })} required />
                      </label>
                      <label>
                        <span>Email</span>
                        <input type="email" value={quoteForm.email} onChange={(event) => setQuoteForm({ ...quoteForm, email: event.target.value })} required />
                      </label>
                      <label>
                        <span>Contact</span>
                        <input value={quoteForm.phone} onChange={(event) => setQuoteForm({ ...quoteForm, phone: event.target.value })} required />
                      </label>
                      <label>
                        <span>Required quantity</span>
                        <input value={quoteForm.quantity} onChange={(event) => setQuoteForm({ ...quoteForm, quantity: event.target.value })} required />
                      </label>
                    </div>
                    <button type="submit">Send request</button>
                    {quoteStatus.message ? <p className={`feedback ${quoteStatus.type}`}>{quoteStatus.message}</p> : null}
                  </form>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
