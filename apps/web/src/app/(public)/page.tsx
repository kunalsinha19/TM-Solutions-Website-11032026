import type { Product } from "@tara-maa/shared-types";
import Link from "next/link";
import { apiClient, type BackendCategory } from "../../lib/api-client";

export const dynamic = "force-dynamic";
import { Reveal } from "../../components/motion/reveal";
import { ProductRoulette } from "../../components/motion/product-roulette";
import { ProductCard } from "../../components/products/product-card";
import { StatCounter } from "../../components/motion/stat-counter";
import { FloatingOrb } from "../../components/motion/floating-orb";
import { TrustBadge } from "../../components/ui/trust-badge";
import { TestimonialCard } from "../../components/ui/testimonial-card";

// ── Fallback data used when backend is unreachable ────────────────────────────

const FALLBACK_PRODUCTS: Product[] = [
  {
    name: "Industrial Printing Equipment",
    slug: "industrial-printing-equipment",
    sku: "IPE-101",
    shortDescription: "Heavy-duty industrial printing and finishing equipment for high-volume production environments.",
    description: "Professional-grade printing machinery built for industrial output and reliability.",
    images: [],
    specifications: [],
    tags: ["Industrial Machines"],
    isFeatured: true,
    status: "published",
    metaTitle: "Industrial Printing Equipment",
    metaDescription: "Heavy-duty industrial printing and finishing equipment."
  },
  {
    name: "Lamination & Binding Solutions",
    slug: "lamination-binding-solutions",
    sku: "LBS-202",
    shortDescription: "Complete lamination and binding solutions for office and industrial-scale applications.",
    description: "Durable lamination and binding machinery with precision controls.",
    images: [],
    specifications: [],
    tags: ["Office Automation"],
    isFeatured: true,
    status: "published",
    metaTitle: "Lamination & Binding Solutions",
    metaDescription: "Complete lamination and binding solutions."
  },
  {
    name: "Sublimation Printing Equipment",
    slug: "sublimation-printing-equipment",
    sku: "SPE-303",
    shortDescription: "High-performance sublimation and custom printing equipment for diverse material applications.",
    description: "Precision sublimation systems for industrial and commercial custom printing.",
    images: [],
    specifications: [],
    tags: ["Automation Products"],
    isFeatured: true,
    status: "published",
    metaTitle: "Sublimation Printing Equipment",
    metaDescription: "High-performance sublimation and custom printing equipment."
  }
];

const FALLBACK_CATEGORIES: BackendCategory[] = [
  { _id: "1", name: "Industrial Machines", slug: "industrial-machines", description: "Printing, finishing, and heavy-duty production machinery for industrial-scale operations." },
  { _id: "2", name: "Electrical Items", slug: "electrical-items", description: "Electrical components, panels, and systems sourced from trusted manufacturers." },
  { _id: "3", name: "Automation Products", slug: "automation-products", description: "Smart automation tools and systems to modernize your production workflows." },
  { _id: "4", name: "Custom Requirements", slug: "custom-requirements", description: "Can't find what you need? Describe your requirement and we'll source it for you." },
];

const TESTIMONIALS = [
  {
    quote: "Tara Maa Solutions made our procurement simple. We described our requirement and had a quote the same day. Excellent service.",
    author: "Rajesh Sharma",
    role: "Plant Manager",
    company: "Industrial Corp India",
    initials: "RS"
  },
  {
    quote: "The lamination equipment we sourced through TMS has been running without issues for 2 years. Reliable supply and great after-sales support.",
    author: "Priya Mehta",
    role: "Procurement Head",
    company: "PrintTech Solutions",
    initials: "PM"
  },
  {
    quote: "Best platform for industrial sourcing. Clear product details, fast replies, and transparent pricing every time.",
    author: "Arun Nair",
    role: "Operations Director",
    company: "AutoMfg Ltd",
    initials: "AN"
  }
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Browse the Catalog",
    description: "Filter by category or search by keyword. Every product has specs, SKU, and a quote button — no login required.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="3" y="3" width="22" height="22" rx="4" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M8 9h12M8 14h8M8 19h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    )
  },
  {
    step: "02",
    title: "Send Your Requirement",
    description: "Fill in your name, contact, and product details in under 2 minutes. No account needed, no complex forms.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M4 6a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2H8l-4 4V6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M9 10h10M9 14h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    )
  },
  {
    step: "03",
    title: "Get a Quote in 24hr",
    description: "Our team reviews your request and sends back clear pricing, availability, and delivery details — same day.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="10" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M14 8v6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    )
  }
];

// Map category name keywords to display icons
function getCategoryIcon(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("industrial") || n.includes("machine") || n.includes("printing")) return "⚙️";
  if (n.includes("electrical") || n.includes("electric") || n.includes("panel")) return "⚡";
  if (n.includes("automation") || n.includes("auto")) return "🤖";
  if (n.includes("sublimation") || n.includes("custom")) return "🎯";
  if (n.includes("office") || n.includes("stationery")) return "💼";
  if (n.includes("accessory") || n.includes("accessories")) return "🔧";
  return "📦";
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  // Fetch all data in parallel — any failure falls back gracefully
  const [productsResult, categoriesResult, homeConfig] = await Promise.allSettled([
    apiClient.getProducts(),
    apiClient.getCategories(),
    apiClient.getHomeConfig(),
  ]);

  const products: Product[] =
    productsResult.status === "fulfilled" && productsResult.value.length > 0
      ? productsResult.value
      : FALLBACK_PRODUCTS;

  const categories: BackendCategory[] =
    categoriesResult.status === "fulfilled" && categoriesResult.value.length > 0
      ? categoriesResult.value
      : FALLBACK_CATEGORIES;

  const config = homeConfig.status === "fulfilled" ? homeConfig.value : {};

  // Resolve featured products: prefer admin-pinned IDs, then isFeatured flag, then first 6
  let featured: Product[];
  if (config.featuredProductIds && config.featuredProductIds.length > 0) {
    const pinned = config.featuredProductIds
      .map((id) => products.find((p) => String((p as unknown as Record<string, unknown>)._id) === id || p.slug === id))
      .filter(Boolean) as Product[];
    featured = pinned.length > 0 ? pinned.slice(0, 6) : products.filter((p) => p.isFeatured).slice(0, 6);
  } else {
    const byFlag = products.filter((p) => p.isFeatured);
    featured = (byFlag.length > 0 ? byFlag : products).slice(0, 6);
  }

  // Per-category product counts (using tags[0] as category label)
  const countByCategory: Record<string, number> = {};
  for (const p of products) {
    const cat = p.tags?.[0] ?? "";
    if (cat) countByCategory[cat] = (countByCategory[cat] ?? 0) + 1;
  }

  // Dynamic hero copy — admin can override via Settings → Homepage
  const heroTitle = (config.heroTitle?.trim()) || "Find the Right Industrial Product Without Wasting Time.";
  const heroSubtitle = (config.heroSubtitle?.trim()) || "Browse our catalog, filter by category, and get a quote in minutes. We keep industrial procurement clear, fast, and simple.";

  return (
    <div className="relative">

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 pb-0 pt-14 sm:px-6 sm:pt-20">
        <FloatingOrb size={600} top="-20%" right="-15%" color="rgba(180,83,9,0.1)" delay={0} />
        <FloatingOrb size={350} bottom="-5%" left="-8%" color="rgba(217,119,6,0.07)" delay={2} />

        <div className="relative mx-auto max-w-7xl">
          <Reveal className="flex flex-col items-center text-center">
            {/* Live badge */}
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/8 px-4 py-1.5 text-xs font-semibold text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              Pan-India Industrial Supply · {categories.length} Categories · {products.length}+ Products
            </div>

            <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-7xl">
              {heroTitle.includes("Industrial Product") ? (
                <>
                  Find the Right{" "}
                  <span className="gradient-text">Industrial Product</span>{" "}
                  <span className="block sm:inline">Without Wasting Time.</span>
                </>
              ) : (
                <span dangerouslySetInnerHTML={{ __html: heroTitle }} />
              )}
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              {heroSubtitle}
            </p>

            {/* CTA buttons */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/products"
                className="rounded-full bg-accent px-7 py-3.5 text-sm font-bold text-white shadow-glow hover:bg-amber-700 hover:shadow-glow transition-all duration-200"
              >
                Explore Products
              </Link>
              <Link
                href="/quote"
                className="rounded-full border border-border bg-panel px-7 py-3.5 text-sm font-semibold hover:border-accent/40 hover:bg-accent/5 transition-all duration-200"
              >
                Get a Quote →
              </Link>
            </div>

            {/* Dynamic category chips from real backend data */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              {categories.slice(0, 5).map((cat) => (
                <TrustBadge key={cat._id} icon={getCategoryIcon(cat.name)} label={cat.name} />
              ))}
            </div>
          </Reveal>

          {/* ── PRODUCT SCROLLER ── */}
          <div className="mt-10 pb-8">
            <Reveal delay={0.1}>
              <div className="mb-3 flex items-center justify-between px-1">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                  Live catalog — {products.length}+ products
                </p>
                <Link href="/products" className="text-xs font-semibold text-accent hover:underline">
                  View all →
                </Link>
              </div>
            </Reveal>
            <ProductRoulette products={products} />
          </div>
        </div>
      </section>

      {/* ── STATS (dynamic) ─────────────────────────────────────────────────── */}
      <section className="border-y border-border/60 bg-panel py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            <StatCounter value={categories.length} suffix="+" label="Product Categories" delay={0} />
            <StatCounter value={products.length} suffix="+" label="Products Available" delay={0.1} />
            <StatCounter value={24} suffix="hr" label="Quote Reply Time" delay={0.2} />
            <StatCounter value={100} suffix="%" label="Easy Buying Process" delay={0.3} />
          </div>
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ───────────────────────────────────────────────── */}
      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <Reveal className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Product Catalog</p>
              <h2 className="mt-2 text-3xl font-bold lg:text-4xl">
                Popular Products
              </h2>
              <p className="mt-2 text-sm text-muted">
                Request a quote on any product in under 2 minutes.
              </p>
            </div>
            <Link
              href="/products"
              className="shrink-0 self-start rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:border-accent/40 hover:text-accent transition-colors sm:self-auto"
            >
              View all {products.length > 6 ? `${products.length} ` : ""}products →
            </Link>
          </Reveal>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {featured.map((product, i) => (
              <Reveal key={product.slug} delay={i * 0.07}>
                {/* First 3 are near the fold — load eagerly */}
                <ProductCard product={product} priority={i < 3} />
              </Reveal>
            ))}
          </div>

          {products.length > 6 && (
            <Reveal delay={0.3} className="mt-10 text-center">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-7 py-3 text-sm font-semibold text-accent hover:bg-accent/15 transition-colors"
              >
                See all {products.length} products
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 7h12M7 1l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </Reveal>
          )}
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────────── */}
      <section className="bg-panel px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <Reveal className="mb-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Simple Process</p>
            <h2 className="mt-2 text-3xl font-bold lg:text-4xl">Get a Quote in 3 Steps</h2>
            <p className="mt-3 mx-auto max-w-lg text-sm text-muted">
              No registration, no complex forms. Browse → Send → Receive.
            </p>
          </Reveal>

          <div className="relative grid gap-6 sm:grid-cols-3">
            {/* Connector line — desktop only */}
            <div className="absolute left-[16.67%] right-[16.67%] top-[2.2rem] hidden h-px border-t border-dashed border-border/60 sm:block" />

            {HOW_IT_WORKS.map((step, i) => (
              <Reveal key={step.step} delay={i * 0.1}>
                <div className="relative flex flex-col items-center gap-4 rounded-[1.75rem] border border-border/70 bg-surface p-7 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                    {step.icon}
                  </div>
                  <div className="absolute -top-3 right-5 rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-bold text-white">
                    {step.step}
                  </div>
                  <h3 className="font-bold text-base">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-muted">{step.description}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.35} className="mt-10 text-center">
            <Link
              href="/quote"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-bold text-white shadow-glow hover:bg-amber-700 transition-all duration-200"
            >
              Send a Quote Request Now
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 7h12M7 1l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ── CATEGORIES (dynamic from backend) ──────────────────────────────── */}
      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <Reveal className="mb-10 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">What We Carry</p>
            <h2 className="mt-2 text-3xl font-bold lg:text-4xl">
              Browse by Category
            </h2>
            <p className="mt-3 mx-auto max-w-xl text-sm text-muted">
              Every category is stocked with real products. Click any category to filter instantly.
            </p>
          </Reveal>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((cat, i) => {
              const count = Object.entries(countByCategory).find(
                ([k]) => k.toLowerCase() === cat.name.toLowerCase()
              )?.[1] ?? 0;

              return (
                <Reveal key={cat._id} delay={i * 0.07}>
                  <Link
                    href="/products"
                    className="group flex flex-col gap-4 rounded-[1.75rem] border border-border/70 bg-panel p-6 h-full transition-all duration-300 hover:shadow-card hover:border-accent/30 hover:-translate-y-0.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-3xl">{getCategoryIcon(cat.name)}</span>
                      {count > 0 && (
                        <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-bold text-accent">
                          {count} products
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-base">{cat.name}</h3>
                    <p className="text-sm leading-relaxed text-muted flex-1">
                      {cat.description || `Browse ${cat.name.toLowerCase()} products.`}
                    </p>
                    <span className="text-xs font-semibold text-accent">
                      Browse category →
                    </span>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────────────────────── */}
      <section className="bg-panel px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <Reveal className="mb-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Client Voices</p>
            <h2 className="mt-2 text-3xl font-bold lg:text-4xl">
              What Our Buyers Say
            </h2>
          </Reveal>

          <div className="grid gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.author} delay={i * 0.1}>
                <TestimonialCard {...t} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ──────────────────────────────────────────────────────── */}
      <section className="px-4 pb-20 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <div className="relative overflow-hidden rounded-[2rem] bg-accent px-8 py-14 text-center text-white shadow-glow sm:rounded-[2.5rem] sm:px-10 sm:py-16">
              <FloatingOrb size={400} top="-50%" right="-10%" color="rgba(255,255,255,0.08)" />
              <FloatingOrb size={300} bottom="-50%" left="-5%" color="rgba(255,255,255,0.06)" />
              <div className="relative z-10">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                  Tell Us What You Need
                </p>
                <h2 className="mt-3 text-2xl font-bold sm:text-3xl lg:text-4xl">
                  We Will Get Back to You Fast
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-sm text-white/80 sm:text-base">
                  Share your requirement — product type, quantity, or any specification. We keep the process clear, fast, and easy to understand.
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                  <Link
                    href="/quote"
                    className="rounded-full bg-white px-7 py-3.5 text-sm font-bold text-accent hover:bg-amber-50 transition-colors duration-200 shadow-soft"
                  >
                    Send a Quote Request
                  </Link>
                  <Link
                    href="/products"
                    className="rounded-full border border-white/30 px-7 py-3.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                  >
                    Browse Products →
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
