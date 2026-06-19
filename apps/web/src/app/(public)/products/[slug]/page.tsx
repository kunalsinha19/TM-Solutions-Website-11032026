import Link from "next/link";
import type { Metadata } from "next";
import { apiClient } from "../../../../lib/api-client";
import { QuoteForm } from "../../../../components/forms/quote-form";
import { Reveal } from "../../../../components/motion/reveal";

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await apiClient.getProduct(slug);
    return { title: product.metaTitle, description: product.metaDescription };
  } catch {
    return { title: "Product" };
  }
}

export default async function ProductDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await apiClient.getProduct(slug);

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-2 text-sm text-muted">
        <Link href="/" className="hover:text-accent transition-colors">Home</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-accent transition-colors">Products</Link>
        <span>/</span>
        <span className="text-text">{product.name}</span>
      </nav>

      <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
        {/* ── LEFT: Product details ── */}
        <article>
          <Reveal>
            {/* Image */}
            <div className="mb-8 flex h-72 items-center justify-center rounded-[2rem] border border-border/70 bg-panel overflow-hidden shadow-card">
              {product.images && product.images[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.images[0].url}
                  alt={product.images[0].alt || product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-3 text-border">
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                    <rect x="6" y="9" width="36" height="30" rx="4" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="18" cy="20" r="4" stroke="currentColor" strokeWidth="2"/>
                    <path d="M6 33l9-8 8 6 6-5 13 10" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-sm">Product Image Coming Soon</span>
                </div>
              )}
            </div>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Title block */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted">{product.sku}</p>
                <h1 className="mt-1 text-3xl font-extrabold tracking-tight lg:text-4xl">{product.name}</h1>
              </div>
              {product.isFeatured && (
                <span className="shrink-0 rounded-full bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent">
                  Featured
                </span>
              )}
            </div>

            <p className="mt-5 text-lg leading-relaxed text-muted">{product.description}</p>

            {/* Image gallery (additional images) */}
            {product.images && product.images.length > 1 && (
              <div className="mt-6 flex gap-3 overflow-x-auto pb-2">
                {product.images.slice(1).map((img, i) => (
                  <div key={i} className="h-20 w-20 shrink-0 rounded-xl overflow-hidden border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt={img.alt || `${product.name} ${i + 2}`} className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </Reveal>

          {/* Specs */}
          {product.specifications && product.specifications.length > 0 && (
            <Reveal delay={0.1} className="mt-10">
              <div className="rounded-[2rem] border border-border/70 bg-panel p-8 shadow-card">
                <h2 className="text-xl font-bold">Technical Specifications</h2>
                <div className="mt-6 divide-y divide-border/60">
                  {product.specifications.map((spec, i) => (
                    <div
                      key={spec.label}
                      className={`flex items-center justify-between py-3.5 text-sm ${
                        i % 2 === 0 ? "" : "bg-surface/40 -mx-2 px-2 rounded-lg"
                      }`}
                    >
                      <span className="font-medium">{spec.label}</span>
                      <span className="text-muted">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          )}
        </article>

        {/* ── RIGHT: Sticky quote form ── */}
        <aside className="lg:sticky lg:top-24">
          <Reveal delay={0.15}>
            <div className="rounded-[2rem] border border-border/70 bg-panel p-2 shadow-card">
              <div className="rounded-[1.5rem] bg-accent/5 px-6 py-5 mb-2">
                <h2 className="font-bold text-lg">Request a Quote</h2>
                <p className="text-sm text-muted mt-1">Get pricing for <strong>{product.name}</strong> within 24 hours.</p>
              </div>
              <div className="px-2 pb-2">
                <QuoteForm productId={product._id} />
              </div>
            </div>
          </Reveal>

          {/* Trust signals */}
          <Reveal delay={0.2} className="mt-4 grid grid-cols-2 gap-3">
            {[
              { icon: "⚡", text: "24hr response" },
              { icon: "🔒", text: "Secure inquiry" },
              { icon: "🚚", text: "Pan-India delivery" },
              { icon: "🤝", text: "No spam, ever" }
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2 rounded-xl border border-border/60 bg-panel px-4 py-3 text-xs font-medium text-muted">
                <span>{item.icon}</span>
                {item.text}
              </div>
            ))}
          </Reveal>
        </aside>
      </div>
    </div>
  );
}
