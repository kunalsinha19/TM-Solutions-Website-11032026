import Link from "next/link";
import type { Product } from "@tara-maa/shared-types";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group rounded-[2rem] border border-border bg-panel p-6 transition hover:-translate-y-1 hover:shadow-soft"
    >
      <p className="text-xs uppercase tracking-[0.2em] text-muted">{product.sku}</p>
      <h3 className="mt-3 text-xl font-semibold">{product.name}</h3>
      <p className="mt-3 text-sm text-muted">{product.shortDescription}</p>
      <span className="mt-6 inline-flex text-sm font-medium text-accent">View product</span>
    </Link>
  );
}
