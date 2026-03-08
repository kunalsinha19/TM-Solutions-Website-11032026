import type { Product } from "@tara-maa/shared-types";
import Link from "next/link";
import { apiClient } from "../../lib/api-client";
import { Reveal } from "../../components/motion/reveal";
import { ProductRoulette } from "../../components/motion/product-roulette";
import { ProductCard } from "../../components/products/product-card";

const fallbackProducts: Product[] = [
  {
    name: "Smart Pump Controller",
    slug: "smart-pump-controller",
    sku: "TPC-100",
    shortDescription: "Industrial monitoring and automation control.",
    description: "A resilient controller built for distributed plants.",
    images: [],
    specifications: [],
    tags: ["automation"],
    isFeatured: true,
    status: "published",
    metaTitle: "Smart Pump Controller",
    metaDescription: "Industrial monitoring and automation control."
  },
  {
    name: "Process Valve Unit",
    slug: "process-valve-unit",
    sku: "TVU-220",
    shortDescription: "Heavy-duty valve system for chemical and process plants.",
    description: "Precision flow management with remote diagnostics.",
    images: [],
    specifications: [],
    tags: ["valves"],
    isFeatured: true,
    status: "published",
    metaTitle: "Process Valve Unit",
    metaDescription: "Heavy-duty valve system for chemical and process plants."
  }
];

export default async function HomePage() {
  let products: Product[] = fallbackProducts;

  try {
    products = await apiClient.getProducts();
  } catch {
    products = fallbackProducts;
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <Reveal className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-accent">B2B Product Website</p>
          <h1 className="mt-5 text-5xl font-semibold leading-tight">
            Modern catalog, SEO landing pages, and quote conversion in one stack.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted">
            Tara Maa Solutions combines a public-facing product experience with an operational admin layer for catalog, landing page, and quote management.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/products" className="rounded-full bg-accent px-6 py-3 font-semibold text-white">
              Explore Products
            </Link>
            <Link href="/quote" className="rounded-full border border-border px-6 py-3 font-semibold">
              Request a Quote
            </Link>
          </div>
        </div>
        <ProductRoulette products={products} />
      </Reveal>

      <Reveal delay={0.1} className="mt-16 grid gap-6 md:grid-cols-3">
        {products.slice(0, 3).map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </Reveal>
    </div>
  );
}
