"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Product } from "@tara-maa/shared-types";

function getImageUrl(product: Product): string | null {
  if (!product.images?.length) return null;
  const first = product.images[0];
  return typeof first === "string" ? first : (first as { url: string }).url || null;
}

function NoImagePlaceholder() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-border">
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="3" y="5" width="22" height="18" rx="3" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="10" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M3 19l5-5 5 4 4-3 8 6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      </svg>
      <span className="text-[10px] text-muted">No image</span>
    </div>
  );
}

function RouletteImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <NoImagePlaceholder />;
  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="object-cover"
      sizes="260px"
      onError={() => setFailed(true)}
    />
  );
}

export function ProductRoulette({ products }: { products: Product[] }) {
  if (!products.length) return null;

  // Prefer products with images; show at most 30 to keep scroll speed comfortable
  const withImg = products.filter(p => getImageUrl(p) !== null);
  const pool = (withImg.length >= 8 ? withImg : products).slice(0, 30);

  // 2 identical copies → seamless loop with translateX(-50%)
  const reel = [...pool, ...pool];

  return (
    <div className="marquee-container relative overflow-hidden rounded-[2rem] border border-border/70 bg-panel py-5 shadow-soft" title="Hover to pause">
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
              <div className="relative h-36 overflow-hidden rounded-[1rem] bg-panel border border-border/40">
                {imgUrl ? (
                  <RouletteImage src={imgUrl} alt={product.name} />
                ) : (
                  <NoImagePlaceholder />
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
