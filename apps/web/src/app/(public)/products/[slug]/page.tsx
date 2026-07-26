import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { apiClient } from "../../../../lib/api-client";
import { QuoteForm } from "../../../../components/forms/quote-form";
import { Reveal } from "../../../../components/motion/reveal";
import { ProductGallery } from "../../../../components/products/product-gallery";
import Script from "next/script";

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

const PHONE = "917595056476";

export default async function ProductDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await apiClient.getProduct(slug).catch(() => null);
  if (!product) notFound();

  // Normalize to { url, alt } array for the gallery component
  const galleryImages = (product.images ?? []).map((img) => {
    if (typeof img === "string") return { url: img as string, alt: product.name };
    const o = img as unknown as Record<string, unknown>;
    return { url: String(o.url ?? ""), alt: String(o.alt ?? product.name) };
  }).filter((img) => img.url);

  const waText = encodeURIComponent(`Hi, I'm interested in ${product.name}. Please share the price and availability.`);
  const waUrl = `https://wa.me/${PHONE}?text=${waText}`;

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.metaDescription || product.shortDescription || product.description || "",
    image: galleryImages.map(i => i.url).filter(Boolean),
    sku: (product as unknown as Record<string, unknown>).sku as string || undefined,
    brand: { "@type": "Brand", name: "TM Solutions" },
    offers: {
      "@type": "Offer",
      availability: "https://schema.org/InStock",
      priceCurrency: "INR",
      seller: { "@type": "Organization", name: "TM Solutions" },
    },
  };

  return (
    <>
    <Script
      id="product-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
    />
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-2 text-sm text-muted">
        <Link href="/" className="hover:text-accent transition-colors">Home</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-accent transition-colors">Products</Link>
        <span>/</span>
        <span className="text-text">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
        {/* ── LEFT: Product details ── */}
        <article>
          <Reveal>
            {/* Interactive gallery */}
            <div className="mb-8">
              <ProductGallery images={galleryImages} productName={product.name} />
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
                {product.sku && (
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted">{product.sku}</p>
                )}
                <h1 className="mt-1 text-3xl font-extrabold tracking-tight lg:text-4xl">{product.name}</h1>
              </div>
              {product.isFeatured && (
                <span className="shrink-0 rounded-full bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent">
                  Featured
                </span>
              )}
            </div>

            <p className="mt-5 text-base leading-relaxed text-muted sm:text-lg">{product.description || product.shortDescription}</p>
          </Reveal>

          {/* Specs */}
          {product.specifications && product.specifications.length > 0 && (
            <Reveal delay={0.1} className="mt-10">
              <div className="rounded-[2rem] border border-border/70 bg-panel p-6 shadow-card sm:p-8">
                <h2 className="text-xl font-bold">Technical Specifications</h2>
                <div className="mt-6 divide-y divide-border/60">
                  {product.specifications.map((spec, i) => (
                    <div
                      key={spec.label}
                      className={`flex items-center justify-between py-3.5 text-sm ${
                        i % 2 !== 0 ? "bg-surface/40 -mx-2 px-2 rounded-lg" : ""
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
          {/* WhatsApp CTA */}
          <Reveal delay={0.12}>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mb-4 flex w-full items-center justify-center gap-3 rounded-2xl bg-[#25D366] px-6 py-4 font-bold text-white shadow-md hover:bg-[#1ebe5e] transition-colors"
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.116.554 4.103 1.523 5.827L.057 23.882l6.234-1.435A11.934 11.934 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.016-1.376l-.36-.214-3.7.852.87-3.596-.234-.37A9.818 9.818 0 012.182 12c0-5.42 4.398-9.818 9.818-9.818 5.42 0 9.818 4.398 9.818 9.818 0 5.42-4.398 9.818-9.818 9.818z"/>
              </svg>
              Get Price on WhatsApp
            </a>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="rounded-[2rem] border border-border/70 bg-panel p-2 shadow-card">
              <div className="rounded-[1.5rem] bg-accent/5 px-6 py-5 mb-2">
                <h2 className="font-bold text-lg">Request a Quote</h2>
                <p className="text-sm text-muted mt-1">
                  Get pricing for <strong>{product.name}</strong> within 24 hours.
                </p>
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
    </>
  );
}
