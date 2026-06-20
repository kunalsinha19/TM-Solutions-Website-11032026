"use client";

import Link from "next/link";
import type { Product } from "@tara-maa/shared-types";

function getImageUrl(product: Product): string | null {
  if (!product.images?.length) return null;
  const first = product.images[0];
  return typeof first === "string" ? first : (first as { url: string }).url || null;
}

export function ProductRoulette({ products }: { products: Product[] }) {
  if (!products.length) return null;

  // 2 identical copies → seamless loop with translateX(-50%)
  const reel = [...products, ...products];

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-panel py-5 shadow-soft">
      {/* Fade edges */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-panel to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-panel to-transparent" />

      <div className="flex w-max animate-marquee gap-4 px-4">
        {reel.map((product, index) => {
          const imgUrl = getImageUrl(product);
          const categoryTag = product.tags?.[0] ?? "";

          return (
            <Link
              key={`${product.slug}-${index}`}
              href={`/products/${product.slug}`}
              className="flex w-[260px] shrink-0 flex-col gap-3 rounded-[1.5rem] border border-border/60 bg-surface p-4 hover:border-accent/30 transition-colors duration-200"
            >
              {/* Image thumbnail */}
              <div className="flex h-32 items-center justify-center rounded-[1rem] bg-panel border border-border/40 overflow-hidden">
                {imgUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imgUrl} alt={product.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-1.5 text-border">
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                      <rect x="3" y="5" width="22" height="18" rx="3" stroke="currentColor" strokeWidth="1.5"/>
                      <circle cx="10" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M3 19l5-5 5 4 4-3 8 6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                    </svg>
                    <span className="text-[10px]">No image</span>
                  </div>
                )}
              </div>

              {/* Meta row */}
              <div className="flex items-center justify-between gap-2">
                {categoryTag && (
                  <span className="truncate text-[10px] font-semibold uppercase tracking-wider text-accent/80">
                    {categoryTag}
                  </span>
                )}
                {product.sku && (
                  <span className="shrink-0 rounded-full border border-border/60 bg-panel px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-muted">
                    {product.sku}
                  </span>
                )}
              </div>

              <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{product.name}</h3>
              <p className="line-clamp-2 text-xs leading-relaxed text-muted">
                {product.shortDescription || product.metaDescription}
              </p>
              <span className="mt-auto text-xs font-semibold text-accent">View details →</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
