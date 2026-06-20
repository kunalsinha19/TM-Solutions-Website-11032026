import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { apiClient } from "../../../lib/api-client";
import { Reveal } from "../../../components/motion/reveal";
import { FloatingOrb } from "../../../components/motion/floating-orb";
import { ProductsClient } from "../../../components/products/products-client";
import {
  ProductGridSkeleton,
  CategoryFilterSkeleton,
} from "../../../components/products/product-grid-skeleton";

export const metadata: Metadata = {
  title: "Products",
  description:
    "Browse TM Solutions' full product catalog — office accessories, sublimation printing, automation, and more.",
};

// Async inner component — streamed in behind a Suspense boundary so the
// page shell (hero, CTA) renders instantly while data is fetched.
async function ProductsContent() {
  const products = await apiClient.getProducts().catch(() => []);

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-[2rem] border border-dashed border-border py-24 text-center">
        <div className="text-4xl">📦</div>
        <h2 className="text-xl font-semibold">No products yet</h2>
        <p className="max-w-xs text-sm text-muted">
          The catalog is being populated. Come back shortly or send us your requirement directly.
        </p>
        <Link
          href="/quote"
          className="mt-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-amber-700 transition-colors"
        >
          Request a specific product
        </Link>
      </div>
    );
  }

  return <ProductsClient products={products} />;
}

// The shell renders synchronously — no loading delay for the page itself.
export default function ProductsPage() {
  return (
    <div className="relative">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden px-4 pb-12 pt-14 sm:px-6 sm:pt-16">
        <FloatingOrb size={400} top="-20%" right="-10%" color="rgba(180,83,9,0.08)" />
        <div className="relative mx-auto max-w-7xl">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
              Product Catalog
            </p>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight lg:text-5xl">
              Our Products
            </h1>
            <p className="mt-4 max-w-2xl text-base text-muted sm:text-lg">
              Browse our catalog, filter by category, and request a quote for any product in
              minutes.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── PRODUCT GRID — streams in behind skeleton ── */}
      <section className="px-4 pb-24 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <Suspense
            fallback={
              <div>
                <CategoryFilterSkeleton />
                <ProductGridSkeleton count={6} />
              </div>
            }
          >
            <ProductsContent />
          </Suspense>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="border-t border-border/60 bg-panel px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold">Can&apos;t Find What You Need?</h2>
          <p className="mt-3 text-sm text-muted sm:text-base">
            Our catalog is growing. If you need a specific product, part number, or custom
            specification — describe it and our team will source it.
          </p>
          <Link
            href="/quote"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-bold text-white shadow-glow-sm hover:shadow-glow hover:bg-amber-700 transition-all duration-200"
          >
            Request a Custom Product
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M1 7h12M7 1l6 6-6 6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
}
