"use client";

import { useState, useMemo } from "react";
import type { Product } from "@tara-maa/shared-types";
import { ProductCard } from "./product-card";

const PAGE_SIZE = 6;

export function ProductsClient({ products }: { products: Product[] }) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);

  const { categories, categoryCounts } = useMemo(() => {
    const seen = new Set<string>();
    const cats: string[] = ["All"];
    const counts: Record<string, number> = { All: products.length };
    for (const p of products) {
      const cat = p.tags?.[0] ?? "";
      if (cat) {
        counts[cat] = (counts[cat] ?? 0) + 1;
        if (!seen.has(cat)) { seen.add(cat); cats.push(cat); }
      }
    }
    return { categories: cats, categoryCounts: counts };
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const matchCat = selectedCategory === "All" || p.tags?.[0] === selectedCategory;
      const matchQ = !q || `${p.name} ${p.tags?.join(" ")} ${p.sku}`.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [products, selectedCategory, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  function selectCategory(cat: string) {
    setSelectedCategory(cat);
    setPage(0);
  }

  return (
    <div>
      {/* Search + category tabs */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => selectCategory(cat)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
                selectedCategory === cat
                  ? "bg-accent text-white shadow-glow-sm"
                  : "border border-border bg-panel text-muted hover:border-accent/40 hover:text-text"
              }`}
            >
              {cat}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums font-semibold ${
                selectedCategory === cat ? "bg-white/20 text-white" : "bg-border/60 text-muted"
              }`}>
                {categoryCounts[cat] ?? 0}
              </span>
            </button>
          ))}
        </div>
        <div className="relative">
          <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(0); }}
            placeholder="Search products…"
            className="w-full rounded-xl border border-border bg-surface py-2.5 pl-9 pr-4 text-sm outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/10 sm:w-56"
          />
        </div>
      </div>

      {/* Result count */}
      <p className="mb-5 text-xs text-muted">
        {filtered.length === products.length
          ? `${products.length} product${products.length !== 1 ? "s" : ""}`
          : `${filtered.length} of ${products.length} product${products.length !== 1 ? "s" : ""}`}
      </p>

      {/* Grid */}
      {paged.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {paged.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-20 text-center text-muted">
          <span className="text-3xl">🔍</span>
          <p className="font-medium">No products match your search.</p>
          <button
            type="button"
            onClick={() => { setQuery(""); setSelectedCategory("All"); }}
            className="mt-2 rounded-full border border-border px-5 py-2 text-sm hover:border-accent/40 hover:text-accent transition-colors"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="mt-10 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(p - 1, 0))}
            disabled={page === 0}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-sm font-medium disabled:opacity-30 hover:border-accent/40 transition-colors"
            aria-label="Previous page"
          >
            ←
          </button>
          {Array.from({ length: pageCount }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPage(i)}
              className={`h-9 w-9 rounded-full text-sm font-medium transition-all duration-200 ${
                i === page
                  ? "bg-accent text-white shadow-glow-sm"
                  : "border border-border text-muted hover:border-accent/40 hover:text-text"
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(p + 1, pageCount - 1))}
            disabled={page + 1 >= pageCount}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-sm font-medium disabled:opacity-30 hover:border-accent/40 transition-colors"
            aria-label="Next page"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
