import type { Product } from "@tara-maa/shared-types";
import Link from "next/link";
import { apiClient } from "../../lib/api-client";
import { Reveal } from "../../components/motion/reveal";
import { ProductRoulette } from "../../components/motion/product-roulette";
import { ProductCard } from "../../components/products/product-card";
import { StatCounter } from "../../components/motion/stat-counter";
import { FloatingOrb } from "../../components/motion/floating-orb";
import { TrustBadge } from "../../components/ui/trust-badge";
import { TestimonialCard } from "../../components/ui/testimonial-card";

const fallbackProducts: Product[] = [
  {
    name: "Industrial Printing Equipment",
    slug: "industrial-printing-equipment",
    sku: "IPE-101",
    shortDescription: "Heavy-duty industrial printing and finishing equipment for high-volume production environments.",
    description: "Professional-grade printing machinery built for industrial output and reliability.",
    images: [],
    specifications: [],
    tags: ["industrial machines"],
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
    tags: ["office automation"],
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
    tags: ["automation products"],
    isFeatured: true,
    status: "published",
    metaTitle: "Sublimation Printing Equipment",
    metaDescription: "High-performance sublimation and custom printing equipment."
  }
];

const categories = [
  {
    number: "01",
    name: "Industrial Machines",
    description: "Printing, finishing, and heavy-duty production machinery for industrial-scale operations.",
    icon: "⚙️"
  },
  {
    number: "02",
    name: "Electrical Items",
    description: "Electrical components, panels, and systems sourced from trusted manufacturers.",
    icon: "⚡"
  },
  {
    number: "03",
    name: "Automation Products",
    description: "Smart automation tools and systems to modernize your production workflows.",
    icon: "🤖"
  },
  {
    number: "04",
    name: "Custom Requirements",
    description: "Can't find what you need? Describe your requirement and we'll source it for you.",
    icon: "🎯"
  }
];

const testimonials = [
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

const whyUs = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M3 7h16M3 11h10M3 15h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="17" cy="15" r="3" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
    title: "Easy Product Search",
    description: "Browse products clearly organised by category. No confusing technical jargon — just what you need to decide fast."
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="9" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M11 6v5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: "Fast Quote Reply",
    description: "Send your requirement in minutes. Our team responds quickly with clear pricing and availability."
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M11 2L3 6v5c0 5 3.5 9.7 8 11 4.5-1.3 8-6 8-11V6l-8-4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M7 11l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Helpful Guidance",
    description: "Not sure which product fits your need? Our team helps you select the right solution without the sales pressure."
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M4 6a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M8 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Simple Buying Process",
    description: "Browse, compare, and request — all in one place. We keep industrial procurement clear and measurable."
  }
];

export default async function HomePage() {
  let products: Product[] = fallbackProducts;

  try {
    const raw = await apiClient.getProducts() as unknown;
    if (Array.isArray(raw)) {
      products = raw as Product[];
    } else if (raw && typeof raw === "object" && Array.isArray((raw as Record<string, unknown>).products)) {
      products = (raw as { products: Product[] }).products;
    }
    if (products.length === 0) products = fallbackProducts;
  } catch {
    products = fallbackProducts;
  }

  const featuredProducts = products.filter((p) => p.isFeatured).slice(0, 3);
  const displayProducts = featuredProducts.length > 0 ? featuredProducts : products.slice(0, 3);

  return (
    <div className="relative">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden px-6 pb-24 pt-20 lg:pb-32 lg:pt-28">
        <FloatingOrb size={600} top="-20%" right="-15%" color="rgba(180,83,9,0.1)" delay={0} />
        <FloatingOrb size={400} bottom="-10%" left="-10%" color="rgba(217,119,6,0.08)" delay={2} />
        <FloatingOrb size={250} top="20%" left="30%" color="rgba(124,45,18,0.06)" delay={4} />

        <div className="relative mx-auto max-w-7xl">
          <Reveal className="flex flex-col items-center text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/8 px-4 py-1.5 text-xs font-semibold text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              Leading Digital Innovations in Industrial Procurement
            </div>

            <h1 className="max-w-4xl text-5xl font-extrabold leading-[1.1] tracking-tight lg:text-7xl">
              Find the Right{" "}
              <span className="gradient-text">Industrial Product</span>{" "}
              Without Wasting Time.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
              Browse products, check categories, and send us your requirement in a few simple steps. We keep the process clear, fast, and easy to understand.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/products"
                className="rounded-full bg-accent px-8 py-4 text-sm font-bold text-white shadow-glow hover:bg-amber-700 hover:shadow-glow transition-all duration-200"
              >
                Explore Products
              </Link>
              <Link
                href="/quote"
                className="rounded-full border border-border bg-panel px-8 py-4 text-sm font-semibold hover:border-accent/40 hover:bg-accent/5 transition-all duration-200"
              >
                Get a Quote →
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <TrustBadge icon="🏭" label="Industrial Machines" />
              <TrustBadge icon="⚡" label="Electrical Items" />
              <TrustBadge icon="🤖" label="Automation Products" />
              <TrustBadge icon="🎯" label="Custom Requirements" />
            </div>
          </Reveal>

          <Reveal delay={0.15} className="mt-16">
            <ProductRoulette products={products} />
          </Reveal>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="border-y border-border/60 bg-panel py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-2 gap-10 lg:grid-cols-4">
            <StatCounter value={4} suffix="+" label="Product Categories" delay={0} />
            <StatCounter value={100} suffix="+" label="Products Available" delay={0.1} />
            <StatCounter value={24} suffix="hr" label="Quote Reply Time" delay={0.2} />
            <StatCounter value={100} suffix="%" label="Easy Buying Process" delay={0.3} />
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <Reveal className="mb-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">What We Carry</p>
            <h2 className="mt-2 text-3xl font-bold lg:text-4xl">
              We Make Industrial Buying Simpler
            </h2>
            <p className="mt-4 mx-auto max-w-xl text-muted">
              You do not need to search through confusing technical pages. We show products clearly and help you reach the right team quickly.
            </p>
          </Reveal>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((cat, i) => (
              <Reveal key={cat.name} delay={i * 0.08}>
                <Link
                  href="/products"
                  className="group flex flex-col gap-4 rounded-[1.75rem] border border-border/70 bg-panel p-7 h-full transition-all duration-300 hover:shadow-card hover:border-accent/30 hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">{cat.icon}</span>
                    <span className="text-xs font-bold text-border">{cat.number}</span>
                  </div>
                  <h3 className="font-bold text-lg">{cat.name}</h3>
                  <p className="text-sm leading-relaxed text-muted flex-1">{cat.description}</p>
                  <span className="text-xs font-semibold text-accent group-hover:gap-2 transition-all">
                    Browse category →
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ── */}
      <section className="bg-panel px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <Reveal className="mb-12 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Product Catalog</p>
              <h2 className="mt-2 text-3xl font-bold lg:text-4xl">
                Find the Right Machine Quickly
              </h2>
            </div>
            <Link
              href="/products"
              className="shrink-0 rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:border-accent/40 hover:text-accent transition-colors"
            >
              View all products →
            </Link>
          </Reveal>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {displayProducts.map((product, i) => (
              <Reveal key={product.slug} delay={i * 0.1}>
                <ProductCard product={product} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY US ── */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <Reveal className="mb-14 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Why Choose Us</p>
            <h2 className="mt-2 text-3xl font-bold lg:text-4xl">
              Simple. Clear. Fast.
            </h2>
          </Reveal>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {whyUs.map((item, i) => (
              <Reveal key={item.title} delay={i * 0.1}>
                <div className="flex flex-col gap-4 rounded-[1.75rem] border border-border/70 bg-panel p-7 h-full transition-all duration-300 hover:shadow-card hover:border-accent/20">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    {item.icon}
                  </div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-muted">{item.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="bg-panel px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <Reveal className="mb-14 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Client Voices</p>
            <h2 className="mt-2 text-3xl font-bold lg:text-4xl">
              What Our Buyers Say
            </h2>
          </Reveal>

          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <Reveal key={t.author} delay={i * 0.1}>
                <TestimonialCard {...t} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <div className="relative overflow-hidden rounded-[2.5rem] bg-accent px-10 py-16 text-center text-white shadow-glow">
              <FloatingOrb size={400} top="-50%" right="-10%" color="rgba(255,255,255,0.08)" />
              <FloatingOrb size={300} bottom="-50%" left="-5%" color="rgba(255,255,255,0.06)" />
              <div className="relative z-10">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                  Tell Us What You Need
                </p>
                <h2 className="mt-3 text-3xl font-bold lg:text-4xl">
                  We Will Get Back to You Fast
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-white/80">
                  Share your requirement — product type, quantity, or any specification. We keep the process clear, fast, and easy to understand.
                </p>
                <Link
                  href="/quote"
                  className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-bold text-accent hover:bg-amber-50 transition-colors duration-200 shadow-soft"
                >
                  Send a Quote Request
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M1 7h12M7 1l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
