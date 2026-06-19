import type { Metadata } from "next";
import { apiClient } from "../../../lib/api-client";
import { ProductCard } from "../../../components/products/product-card";
import { Reveal } from "../../../components/motion/reveal";
import { FloatingOrb } from "../../../components/motion/floating-orb";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Products",
  description: "Browse TM Solutions' full industrial product catalog — automation, valves, sensors, and more."
};

export default async function ProductsPage() {
  const products = await apiClient.getProducts().catch(() => []);

  return (
    <div className="relative">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden px-6 pb-16 pt-16">
        <FloatingOrb size={400} top="-20%" right="-10%" color="rgba(180,83,9,0.08)" />

        <div className="relative mx-auto max-w-7xl">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">Product Catalog</p>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight lg:text-5xl">
              Industrial Products & Equipment
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-muted">
              Browse our full catalog of automation components, valves, sensors, and process equipment. Click any product to view specs and request a quote.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── PRODUCT GRID ── */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-7xl">
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-[2rem] border border-dashed border-border py-24 text-center">
              <div className="text-4xl">📦</div>
              <h2 className="text-xl font-semibold">Catalog loading...</h2>
              <p className="text-sm text-muted">Products will appear here once the catalog is populated.</p>
              <Link href="/quote" className="mt-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white">
                Request a specific product
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {products.map((product, i) => (
                <Reveal key={product.slug} delay={(i % 3) * 0.08}>
                  <ProductCard product={product} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="border-t border-border/60 bg-panel px-6 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold">Can't Find What You Need?</h2>
          <p className="mt-3 text-muted">
            Our catalog is growing. If you need a specific product, part number, or custom specification — describe it in a quote request and our team will source it.
          </p>
          <Link
            href="/quote"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-bold text-white shadow-glow-sm hover:shadow-glow hover:bg-amber-700 transition-all duration-200"
          >
            Request a Custom Product
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 7h12M7 1l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
}
