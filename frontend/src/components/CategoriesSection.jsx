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

// This converts the saved numeric price into the INR format used on the product cards and detail panel.
// The cards, expanded product preview, and quote context all depend on this so pricing stays consistent.
function formatInrAmount(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);
}

// This reshapes raw API product data into one clean frontend shape.
// It is used right after fetching products so the list, expanded detail, and quote form all read the same fields.
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
    price: typeof product.price === "number" ? product.price : 0,
    sku: product.sku || "",
    status: product.status || "published",
    isFeatured: Boolean(product.isFeatured),
    seoTitle: product.seoTitle || "",
    seoDescription: product.seoDescription || "",
    canonicalUrl: product.canonicalUrl || "",
    tags: Array.isArray(product.tags) ? product.tags.filter(Boolean) : []
  };
}

// This creates the short text shown on each product card.
// It keeps the grid tidy while the full description still appears in the expanded detail below.
function productSnippet(product) {
  if (product.detail) {
    return product.detail.length > 180 ? `${product.detail.slice(0, 177)}...` : product.detail;
  }

  return "Product available for business inquiries.";
}

export default function CategoriesSection() {
  const [liveProducts, setLiveProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [activeProductId, setActiveProductId] = useState("");
  const [quoteForm, setQuoteForm] = useState(quickQuoteInitial);
  const [quoteStatus, setQuoteStatus] = useState({ type: "idle", message: "" });
  const [isQuoteFormOpen, setIsQuoteFormOpen] = useState(false);
  const detailPanelRef = useRef(null);
  const quoteFormRef = useRef(null);

  // This loads published products from the backend when the section opens.
  // It feeds the whole browser: the six-card grid, the active preview card, and the quote form context.
  useEffect(() => {
    let active = true;

    async function loadLiveData() {
      try {
        const productsResponse = await fetch(`${API_BASE}/products`).then((response) => response.ok ? response.json() : null);

        if (!active) {
          return;
        }

        const rawProducts = Array.isArray(productsResponse)
          ? productsResponse
          : Array.isArray(productsResponse?.products)
            ? productsResponse.products
            : [];

        const products = rawProducts
          .filter((product) => product?.status === "published")
          .map(normalizeProduct);

        setLiveProducts(products);
      } catch {
        if (active) {
          setLiveProducts([]);
        }
      }
    }

    loadLiveData();
    return () => {
      active = false;
    };
  }, []);

  // This applies the search box to the fetched products.
  // The pagination and selected product both work from this filtered list, not the raw API list.
  const filteredProducts = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    if (!keyword) {
      return liveProducts;
    }

    return liveProducts.filter((product) => {
      const haystack = [product.name, product.category, product.detail, product.sku, product.slug, product.seoTitle, product.seoDescription, ...(product.tags || [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(keyword);
    });
  }, [liveProducts, query]);

  // This calculates how many pages are needed for the current filtered result.
  // The bottom pagination control reads this so it always matches the visible product set.
  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / 6));

  // This resets the browser back to page 1 when a new search is typed.
  // It avoids landing on an empty page after the result count changes.
  useEffect(() => {
    setPage(0);
  }, [query]);

  // This keeps the current page inside valid bounds when filters or results change.
  // It protects the grid from pointing to a page number that no longer exists.
  useEffect(() => {
    if (page > pageCount - 1) {
      setPage(Math.max(pageCount - 1, 0));
    }
  }, [page, pageCount]);

  // This slices the filtered products into the current six-card page.
  // The product tiles and active product selection both depend on this page-sized list.
  const visibleProducts = useMemo(() => {
    const start = page * 6;
    return filteredProducts.slice(start, start + 6);
  }, [filteredProducts, page]);

  // This makes sure the active product always belongs to the current visible six cards.
  // If the user changes page or search, it automatically moves selection to the first visible product.
  useEffect(() => {
    if (!visibleProducts.length) {
      setActiveProductId("");
      return;
    }

    const stillVisible = visibleProducts.some((product) => product.id === activeProductId);
    if (!stillVisible) {
      setActiveProductId(visibleProducts[0].id);
    }
  }, [visibleProducts, activeProductId]);

  // This gives the UI one single "currently expanded" product object.
  // The sticky preview card and quote form both read from this value.
  const activeProduct = useMemo(() => {
    return visibleProducts.find((product) => product.id === activeProductId) || visibleProducts[0] || null;
  }, [visibleProducts, activeProductId]);

  // This closes the quote form whenever the selected product changes.
  // That is the behavior you asked for: hover another product, and the old form should hide immediately.
  useEffect(() => {
    setIsQuoteFormOpen(false);
    setQuoteStatus({ type: "idle", message: "" });
  }, [activeProduct?.id]);

  // This breaks the long description into readable paragraphs.
  // The lower full-width detail area uses it so inserted product descriptions display cleanly.
  const activeProductDescription = useMemo(() => {
    if (!activeProduct?.description) {
      return [];
    }

    return activeProduct.description
      .split(/\n+/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);
  }, [activeProduct]);

  // This collects only the SEO fields that actually exist for the selected product.
  // It keeps the SEO block clean and avoids empty rows in the expanded detail section.
  const activeProductSeo = useMemo(() => {
    if (!activeProduct) {
      return [];
    }

    return [
      activeProduct.seoTitle ? { label: "SEO title", value: activeProduct.seoTitle } : null,
      activeProduct.seoDescription ? { label: "SEO description", value: activeProduct.seoDescription } : null,
      activeProduct.canonicalUrl ? { label: "Canonical URL", value: activeProduct.canonicalUrl } : null
    ].filter(Boolean);
  }, [activeProduct]);

  // This helps mobile users see the expanded product card after they choose a product.
  // It is only used on smaller screens so users do not need to manually scroll back up.
  function focusDetailPanel() {
    if (typeof window === "undefined" || !detailPanelRef.current || window.innerWidth > 980) {
      return;
    }

    const rect = detailPanelRef.current.getBoundingClientRect();
    const hiddenAboveViewport = rect.top < 96;
    const pushedBelowViewport = rect.top > window.innerHeight * 0.22;

    if (hiddenAboveViewport || pushedBelowViewport) {
      detailPanelRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  // This switches the active product whenever a user hovers, focuses, or clicks a product tile.
  // It also closes any open quote form so the form only belongs to the currently selected product.
  function selectProduct(productId, options = {}) {
    setActiveProductId(productId);
    setIsQuoteFormOpen(false);
    setQuoteStatus({ type: "idle", message: "" });

    if (options.focusDetail) {
      requestAnimationFrame(() => {
        focusDetailPanel();
      });
    }
  }

  // This opens the quote form for the selected product.
  // It is only triggered by the Reach Out button inside the expanded product preview card.
  function openQuoteForm() {
    setIsQuoteFormOpen(true);

    requestAnimationFrame(() => {
      quoteFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  // This sends the quick quote request to the backend.
  // It validates the four visible fields, submits the selected product id, and shows success or error feedback.
  async function handleQuickQuoteSubmit(event) {
    event.preventDefault();

    if (!activeProduct) {
      setQuoteStatus({ type: "error", message: "Please select a product first." });
      return;
    }

    if (!quoteForm.name.trim() || !quoteForm.email.trim() || !quoteForm.phone.trim() || !quoteForm.quantity.trim()) {
      setQuoteStatus({ type: "error", message: "Please fill all four fields before sending the request." });
      return;
    }

    setQuoteStatus({ type: "loading", message: "Sending your quote request..." });

    try {
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
        }),`n        signal: controller.signal`n      });`n      clearTimeout(timeoutId);

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Unable to submit quote request");
      }

      setQuoteForm(quickQuoteInitial);
      setQuoteStatus({ type: "success", message: `Quote request sent for ${activeProduct.name}. Our team will contact you soon.` });
    } catch (error) {`n      const message = error.name === "AbortError" ? "Request timed out. Please try again." : error.message;`n      setQuoteStatus({ type: "error", message });
    }
  }

  // This moves the six-card browser to the previous page.
  // It is used by the left button in the centered bottom pagination control.
  function goPrevPage() {
    setPage((current) => Math.max(current - 1, 0));
  }

  // This moves the six-card browser to the next page.
  // It is used by the right button in the centered bottom pagination control.
  function goNextPage() {
    setPage((current) => Math.min(current + 1, pageCount - 1));
  }

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
          {["All", ...new Set(liveProducts.map((product) => product.category || "Uncategorized"))].map((category) => {
            const isActive = (!query && category === "All") || query.trim().toLowerCase() === category.toLowerCase();

            return (
              <motion.button
                key={category}
                type="button"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setQuery(category === "All" ? "" : category)}
                className={`category-tab${isActive ? " active" : ""}`}
              >
                {category}
              </motion.button>
            );
          })}
        </AnimatedReveal>
 {filteredProducts.length ? (
          <div className="product-browser-block">
            <div className="product-browser-layout">
              <motion.div
                key={`${query}-${page}`}
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                className="product-card-grid"
              >
                {visibleProducts.map((product, index) => {
                  const isActive = activeProduct?.id === product.id;

                  return (
                    <AnimatedReveal key={product.id} delay={index * 0.04} className={`product-tile${isActive ? " active" : ""}`}>
                      <motion.button
                        type="button"
                        layout
                        whileHover={{ y: -8, scale: 1.015 }}
                        whileTap={{ scale: 0.99 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        onMouseEnter={() => selectProduct(product.id)}
                        onFocus={() => selectProduct(product.id, { focusDetail: true })}
                        onClick={() => selectProduct(product.id, { focusDetail: true })}
                        className="product-tile-inner"
                      >
                        <div className="product-tile-media">
                          {product.image ? (
                            <motion.img
                              src={product.image}
                              alt={product.name}
                              className="product-tile-image"
                            />
                          ) : (
                            <div className="live-product-placeholder">{product.name.slice(0, 1).toUpperCase()}</div>
                          )}
                        </div>
                        <div className="product-tile-copy">
                          <div className="product-tile-head">
                            <motion.p className="live-product-category">{product.category}</motion.p>
                            {product.isFeatured ? <span className="product-tile-badge">Featured</span> : null}
                          </div>
                          <motion.h4>{product.name}</motion.h4>
                          <p>{productSnippet(product)}</p>
                          <div className="showcase-price-row">
                            <strong>{product.price ? formatInrAmount(product.price) : "Price on request"}</strong>
                            <span>per piece</span>
                          </div>
                        </div>
                      </motion.button>
                    </AnimatedReveal>
                  );
                })}
              </motion.div>

              {activeProduct ? (
                <AnimatedReveal className="product-detail-column" delay={0.06}>
                  <div ref={detailPanelRef} className="product-detail-sticky">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeProduct.id}
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -16 }}
                        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                        className="product-detail-stack"
                      >
                        <section className="product-highlight-shell product-highlight-expanded">
                          <div className="product-highlight-media product-highlight-media-expanded">
                            {activeProduct.image ? (
                              <motion.img
                                src={activeProduct.image}
                                alt={activeProduct.name}
                                className="product-highlight-image"
                              />
                            ) : (
                              <div className="live-product-placeholder product-highlight-placeholder">{activeProduct.name.slice(0, 1).toUpperCase()}</div>
                            )}
                          </div>
                          <div className="product-highlight-copy">
                            <div className="product-detail-kicker-row">
                              <motion.p className="live-product-category">{activeProduct.category}</motion.p>
                              {activeProduct.isFeatured ? <span className="product-detail-badge">Featured product</span> : null}
                            </div>
                            <motion.h3>{activeProduct.name}</motion.h3>
                            <p className="product-detail-summary">{activeProduct.shortDescription || productSnippet(activeProduct)}</p>
                            <div className="showcase-price-row">
                              <strong>{activeProduct.price ? formatInrAmount(activeProduct.price) : "Price on request"}</strong>
                              <span>per piece</span>
                            </div>
                            <div className="product-info-row">
                              {activeProduct.sku ? <span className="product-info-chip">SKU: {activeProduct.sku}</span> : null}
                              <span className="product-info-chip">{activeProduct.status}</span>
                              <span className="product-info-chip">Ready to quote</span>
                            </div>
                            <div className="product-highlight-actions">
                              <button
                                type="button"
                                className="button-primary product-reach-out-button"
                                onClick={openQuoteForm}
                              >
                                Reach Out
                              </button>
                            </div>
                          </div>
                        </section>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </AnimatedReveal>
              ) : null}
            </div>

            <div className="product-browser-pagination">
              <button type="button" className="product-page-arrow" onClick={goPrevPage} disabled={page === 0} aria-label="Previous products">
                Previous
              </button>
              <div className="product-page-indicator-shell" aria-label={`Page ${page + 1} of ${pageCount}`}>
                <span className="product-page-indicator-current">{page + 1}</span>
                <span className="product-page-indicator-separator">/</span>
                <span className="product-page-indicator-total">{pageCount}</span>
              </div>
              <button type="button" className="product-page-arrow" onClick={goNextPage} disabled={page >= pageCount - 1} aria-label="Next products">
                Next
              </button>
            </div>

            {activeProduct ? (
              <AnimatedReveal delay={0.08}>
                <section className="product-detail-panel product-detail-panel-full">
                  <AnimatePresence initial={false} mode="wait">
                    {isQuoteFormOpen ? (
                      <motion.section
                        key={`quote-${activeProduct.id}`}
                        initial={{ opacity: 0, y: -12, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -8, height: 0 }}
                        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                        ref={quoteFormRef}
                        className="product-quick-quote product-quick-quote-inline"
                      >
                        <div>
                          <p className="eyebrow">Quick quote</p>`n                          <h3>Send your requirement for {activeProduct.name}</h3>`n                          <p className="quick-quote-subtext">Fill these four fields and we will review your request and get back to you.</p>
                          <p className="section-description">Fill these four fields and we will review your request and get back to you.</p>
                        </div>
                        <form className="product-quick-quote-form" onSubmit={handleQuickQuoteSubmit}>
                          <div className="quick-quote-grid">
                            <label>
                              <span>Name</span>
                              <input value={quoteForm.name} onChange={(event) => setQuoteForm({ ...quoteForm, name: event.target.value })} required />
                            </label>
                            <label>
                              <span>Email address</span>
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
                          <button type="submit" className="button-primary">Send Quote Request</button>
                          {quoteStatus.message ? <p className={`feedback ${quoteStatus.type}`}>{quoteStatus.message}</p> : null}
                        </form>
                      </motion.section>
                    ) : null}
                  </AnimatePresence>

                  <motion.div
                    key={`detail-${activeProduct.id}`}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="product-detail-section"
                  >
                    {activeProductDescription.length ? (
                      <div className="product-detail-description product-detail-description-wide">
                        {activeProductDescription.map((paragraph) => (
                          <p key={paragraph}>{paragraph}</p>
                        ))}
                      </div>
                    ) : (
                      <p className="section-description">No long description has been added for this product yet.</p>
                    )}
                  </motion.div>

                  {activeProductSeo.length ? (
                    <div className="product-detail-section">
                      <div className="product-detail-section-head">
                        <p className="eyebrow">SEO</p>
                        <h3>Search metadata</h3>
                      </div>
                      <div className="product-detail-list product-detail-list-grid">
                        {activeProductSeo.map((item) => (
                          <div key={item.label} className="product-detail-list-item">
                            <span>{item.label}</span>
                            <strong>{item.value}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {activeProduct.images.length ? (
                    <div className="product-detail-section">
                      <div className="product-detail-section-head">
                        <p className="eyebrow">Images</p>
                        <h3>Available product visuals</h3>
                      </div>
                      <div className="product-detail-gallery product-detail-gallery-wide">
                        {activeProduct.images.map((image, imageIndex) => (
                          <div key={`${image}-${imageIndex}`} className="product-detail-thumb">
                            <img src={image} alt={`${activeProduct.name} view ${imageIndex + 1}`} />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {activeProduct.tags.length ? (
                    <div className="product-detail-section">
                      <div className="product-detail-section-head">
                        <p className="eyebrow">Tags</p>
                        <h3>Inserted product labels</h3>
                      </div>
                      <div className="product-info-row">
                        {activeProduct.tags.map((tag) => (
                          <span key={tag} className="product-info-chip">{tag}</span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </section>
              </AnimatedReveal>
            ) : null}
          </div>
        ) : (
          <div className="empty-live-products">
            <p>{query ? "No products matched your search." : "No published products are visible yet."}</p>
            <p>{query ? "Try a different keyword or clear the search box." : "Add products in admin, set the status to published, and refresh the homepage."}</p>
          </div>
        )}
      </div>
    </section>
  );
}









