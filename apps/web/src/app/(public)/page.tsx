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
    name: "Smart Pump Controller",
    slug: "smart-pump-controller",
    sku: "TPC-100",
    shortDescription: "Industrial monitoring and automation control for distributed plants.",
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
  },
  {
    name: "Flow Meter Pro",
    slug: "flow-meter-pro",
    sku: "FMP-330",
    shortDescription: "High-accuracy flow measurement for liquid and gas applications.",
    description: "Industry-grade flow sensing with digital output.",
    images: [],
    specifications: [],
    tags: ["sensors"],
    isFeatured: false,
    status: "published",
    metaTitle: "Flow Meter Pro",
    metaDescription: "High-accuracy flow measurement."
  }
];

const testimonials = [
  {
    quote: "TM Solutions delivered exactly what our plant needed. Quote turnaround was under 24 hours and the product quality is outstanding.",
    author: "Rajesh Sharma",
    role: "Plant Manager",
    company: "Reliance Industries",
    initials: "RS"
  },
  {
    quote: "We've been sourcing automation components from TM Solutions for 3 years. Reliable, fast, and technically sound team.",
    author: "Priya Mehta",
    role: "Procurement Head",
    company: "Tata Steel",
    initials: "PM"
  },
  {
    quote: "Best-in-class pricing for industrial-grade components. The online catalog saves us hours every procurement cycle.",
    author: "Arun Nair",
    role: "Operations Director",
    company: "ONGC Limited",
    initials: "AN"
  }
];

const whyUs = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M11 2L3 6v5c0 5 3.5 9.7 8 11 4.5-1.3 8-6 8-11V6l-8-4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M7 11l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "ISO-Grade Quality",
    description: "Every product meets international industrial standards. No compromises on safety or performance."
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="9" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M11 6v5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: "24hr Quote Response",
    description: "Submit a requirement and get a detailed commercial quote within one business day."
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M3 7h16M3 11h10M3 15h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="17" cy="15" r="3" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M17 13.5v1.5l1 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
    title: "Technical Support",
    description: "Our engineers are available for spec consultation, installation guidance, and after-sales support."
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M4 6a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M8 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Pan-India Delivery",
    description: "Warehouses across major industrial hubs ensure fast, reliable delivery to your site."
  }
];

export default async function HomePage() {
  let products: Product[] = fallbackProducts;

  try {
    products = await apiClient.getProducts();
  } catch {
    products = fallbackProducts;
  }

  const featuredProducts = products.filter((p) => p.isFeatured).slice(0, 3);
  const displayProducts = featuredProducts.length > 0 ? featuredProducts : products.slice(0, 3);

  return (
    <div className="relative">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden px-6 pb-24 pt-20 lg:pb-32 lg:pt-28">
        {/* Background orbs */}
        <FloatingOrb size={600} top="-20%" right="-15%" color="rgba(180,83,9,0.1)" delay={0} />
        <FloatingOrb size={400} bottom="-10%" left="-10%" color="rgba(217,119,6,0.08)" delay={2} />
        <FloatingOrb size={250} top="20%" left="30%" color="rgba(124,45,18,0.06)" delay={4} />

        <div className="relative mx-auto max-w-7xl">
          <Reveal className="flex flex-col items-center text-center">
            {/* Trust pill */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/8 px-4 py-1.5 text-xs font-semibold text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              Trusted by 200+ Industrial Companies Across India
            </div>

            <h1 className="max-w-4xl text-5xl font-extrabold leading-[1.1] tracking-tight lg:text-7xl">
              Industrial Products.{" "}
              <span className="gradient-text">Fast Quotes.</span>{" "}
              Zero Hassle.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
              TM Solutions supplies premium B2B industrial products with the speed and transparency modern procurement teams demand. Browse the catalog, configure your requirement, and get a quote in 24 hours.
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
                Request a Quote →
              </Link>
            </div>

            {/* Trust badges */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <TrustBadge icon="🏭" label="15+ Years in Industry" />
              <TrustBadge icon="✅" label="ISO Certified Products" />
              <TrustBadge icon="⚡" label="24hr Quote Turnaround" />
              <TrustBadge icon="🚚" label="Pan-India Delivery" />
            </div>
          </Reveal>

          {/* Product roulette */}
          <Reveal delay={0.15} className="mt-16">
            <ProductRoulette products={products.length > 0 ? products : fallbackProducts} />
          </Reveal>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="border-y border-border/60 bg-panel py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-2 gap-10 lg:grid-cols-4">
            <StatCounter value={200} suffix="+" label="Happy Clients" delay={0} />
            <StatCounter value={500} suffix="+" label="Products in Catalog" delay={0.1} />
            <StatCounter value={15} suffix="+" label="Years of Experience" delay={0.2} />
            <StatCounter value={24} suffix="hr" label="Quote Response Time" delay={0.3} />
          </div>
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ── */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <Reveal className="mb-12 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Our Products</p>
              <h2 className="mt-2 text-3xl font-bold lg:text-4xl">
                Featured from the Catalog
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
      <section className="bg-panel px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <Reveal className="mb-14 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Why TM Solutions</p>
            <h2 className="mt-2 text-3xl font-bold lg:text-4xl">
              Built for Industrial Buyers Who Can't Afford Delays
            </h2>
          </Reveal>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {whyUs.map((item, i) => (
              <Reveal key={item.title} delay={i * 0.1}>
                <div className="flex flex-col gap-4 rounded-[1.75rem] border border-border/70 bg-surface p-7 h-full transition-all duration-300 hover:shadow-card hover:border-accent/20">
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
      <section className="px-6 py-24">
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
                  Ready to Source?
                </p>
                <h2 className="mt-3 text-3xl font-bold lg:text-4xl">
                  Get a Quote in Under 24 Hours
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-white/80">
                  Tell us your requirement — product type, quantity, specs. Our sales engineers respond fast with competitive pricing.
                </p>
                <Link
                  href="/quote"
                  className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-bold text-accent hover:bg-amber-50 transition-colors duration-200 shadow-soft"
                >
                  Start Your Quote
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
