"use client";

import { useState, useMemo } from "react";
import type { Product } from "@tara-maa/shared-types";
import { ProductCard } from "./product-card";

const PAGE_SIZE = 6;

export function ProductsClient({ products }: { products: Product[] }) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);

  const categories = useMemo(() => {
    const seen = new Set<string>();
    const cats: string[] = ["All"];
    for (const p of products) {
      const cat = p.tags?.[0] ?? "";
      if (cat && !seen.has(cat)) {
        seen.add(cat);
        cats.push(cat);
      }
    }
    return cats;
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
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => selectCategory(cat)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
                selectedCategory === cat
                  ? "bg-accent text-white shadow-glow-sm"
                  : "border border-border bg-panel text-muted hover:border-accent/40 hover:text-text"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(0); }}
          placeholder="Search products..."
          className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-accent/40 sm:w-56"
        />
      </div>

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
        <div className="mt-10 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(p - 1, 0))}
            disabled={page === 0}
            className="rounded-full border border-border px-5 py-2 text-sm font-medium disabled:opacity-40 hover:border-accent/40 transition-colors"
          >
            ← Previous
          </button>
          <span className="text-sm text-muted">{page + 1} / {pageCount}</span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(p + 1, pageCount - 1))}
            disabled={page + 1 >= pageCount}
            className="rounded-full border border-border px-5 py-2 text-sm font-medium disabled:opacity-40 hover:border-accent/40 transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
