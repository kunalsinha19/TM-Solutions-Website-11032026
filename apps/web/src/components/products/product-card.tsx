import Link from "next/link";
import type { Product } from "@tara-maa/shared-types";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group relative flex flex-col rounded-[1.75rem] border border-border/70 bg-panel p-7 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover hover:border-accent/30 overflow-hidden"
    >
      {/* Shine overlay */}
      <div className="absolute inset-0 bg-card-shine opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-[1.75rem]" />

      {/* Featured badge */}
      {product.isFeatured && (
        <span className="absolute right-5 top-5 rounded-full bg-accent/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-accent">
          Featured
        </span>
      )}

      {/* Image placeholder */}
      <div className="mb-5 flex h-44 items-center justify-center rounded-[1.25rem] bg-surface border border-border/50 overflow-hidden">
        {product.images && product.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.images[0].url} alt={product.images[0].alt || product.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-border">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect x="4" y="6" width="24" height="20" rx="3" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="12" cy="13" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M4 22l6-5 5 4 4-3 9 7" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
            <span className="text-xs">Product Image</span>
          </div>
        )}
      </div>

      {/* SKU + Category */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted bg-surface px-2 py-0.5 rounded-full border border-border/60">
          {product.sku}
        </span>
        {product.tags?.[0] && (
          <span className="text-[10px] font-medium uppercase tracking-wide text-accent/80">
            {product.tags[0]}
          </span>
        )}
      </div>

      <h3 className="text-lg font-semibold leading-snug">{product.name}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted flex-1">{product.shortDescription}</p>

      <div className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-accent group-hover:gap-2.5 transition-all duration-200">
        View details
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M1 7h12M7 1l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </Link>
  );
}
