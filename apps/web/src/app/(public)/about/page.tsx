import Link from "next/link";
import type { Metadata } from "next";
import { Reveal } from "../../../components/motion/reveal";
import { StatCounter } from "../../../components/motion/stat-counter";
import { FloatingOrb } from "../../../components/motion/floating-orb";

export const metadata: Metadata = {
  title: "About Us",
  description: "Tara Maa Solutions — accelerating digital transformation in industrial procurement. Learn our mission, vision, and values."
};

const vision = [
  {
    icon: "🚀",
    text: "Accelerate digital transformation with intelligent, automation-first procurement workflows."
  },
  {
    icon: "🔗",
    text: "Connect manufacturers, distributors, and enterprises through a single, data-driven marketplace."
  },
  {
    icon: "📊",
    text: "Deliver smart insights that improve cost, speed, and operational performance at scale."
  },
  {
    icon: "🌐",
    text: "Build a future-ready ecosystem that evolves with emerging industrial technologies."
  }
];

const offerings = [
  { icon: "🖨️", name: "Industrial Printing & Finishing Equipment", description: "Heavy-duty printing machinery for high-volume production environments." },
  { icon: "📋", name: "Lamination & Binding Solutions", description: "Office and industrial-grade lamination and binding for every scale." },
  { icon: "🤖", name: "Office Automation Tools", description: "Smart tools to streamline workflows and reduce manual overhead." },
  { icon: "🎨", name: "Sublimation & Custom Printing", description: "High-performance sublimation systems for diverse material applications." },
  { icon: "📦", name: "Industrial Consumables", description: "Reliable supply of consumables to keep your operations running." },
  { icon: "🔄", name: "Workflow & Procurement Support", description: "End-to-end procurement guidance for structured, scalable buying." }
];

const values = [
  { icon: "🎯", title: "Clarity First", description: "We show products clearly and communicate without technical confusion so your team can decide fast." },
  { icon: "⚡", title: "Speed Matters", description: "Fast replies, quick quotes, and no unnecessary back-and-forth. Your time is valuable." },
  { icon: "🤝", title: "Honest Guidance", description: "We help you select the right product for your need — not the most expensive one on the shelf." },
  { icon: "🌱", title: "Long-term Thinking", description: "We build relationships, not transactions. Your repeat business depends on us getting it right every time." }
];

export default function AboutPage() {
  return (
    <div className="relative">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden px-6 pb-20 pt-20">
        <FloatingOrb size={500} top="-20%" right="-10%" color="rgba(180,83,9,0.1)" />
        <FloatingOrb size={350} bottom="-10%" left="-8%" color="rgba(217,119,6,0.07)" />

        <div className="relative mx-auto max-w-5xl text-center">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">About Tara Maa Solutions</p>
            <h1 className="mt-4 text-4xl font-extrabold leading-[1.1] tracking-tight lg:text-6xl">
              We Make{" "}
              <span className="gradient-text">Industrial Buying</span>{" "}
              Simpler for Your Business
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted">
              Automation, predictive insights, and guided procurement journeys reduce downtime, standardize vendor choices, and help teams scale with confidence. Every interaction is designed to be transparent, fast, and measurable.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="border-y border-border/60 bg-panel py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-2 gap-10 lg:grid-cols-4">
            <StatCounter value={4} suffix="+" label="Product Categories" delay={0} />
            <StatCounter value={100} suffix="+" label="Products in Catalog" delay={0.1} />
            <StatCounter value={24} suffix="hr" label="Quote Response Time" delay={0.2} />
            <StatCounter value={100} suffix="%" label="Transparent Pricing" delay={0.3} />
          </div>
        </div>
      </section>

      {/* ── MISSION / VISION ── */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 md:grid-cols-2">
            <Reveal>
              <div className="flex flex-col gap-5 rounded-[2rem] border border-border/70 bg-panel p-10 h-full shadow-card">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-2xl">
                  🧭
                </div>
                <h2 className="text-2xl font-bold">Our Mission</h2>
                <p className="leading-relaxed text-muted">
                  To simplify industrial procurement for businesses of all sizes — making it as easy to buy an industrial machine as it is to shop online. Clear products, fast quotes, honest guidance.
                </p>
                <p className="leading-relaxed text-muted">
                  Built for global growth, we deliver secure, scalable infrastructure that modernizes production environments, connects supply chains, and keeps operations future-ready.
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="flex flex-col gap-5 rounded-[2rem] border border-accent/20 bg-accent/5 p-10 h-full shadow-card">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/15 text-2xl">
                  🔭
                </div>
                <h2 className="text-2xl font-bold">Our Vision</h2>
                <div className="flex flex-col gap-4 mt-1">
                  {vision.map((v) => (
                    <div key={v.text} className="flex gap-3">
                      <span className="text-lg shrink-0">{v.icon}</span>
                      <p className="text-sm leading-relaxed text-muted">{v.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── WHAT WE OFFER ── */}
      <section className="bg-panel px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <Reveal className="mb-14 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Product Range</p>
            <h2 className="mt-2 text-3xl font-bold lg:text-4xl">What We Offer</h2>
            <p className="mt-4 mx-auto max-w-xl text-muted">
              From heavy industrial machinery to office automation — we source and supply across the full spectrum of business needs.
            </p>
          </Reveal>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {offerings.map((item, i) => (
              <Reveal key={item.name} delay={i * 0.08}>
                <div className="flex flex-col gap-4 rounded-[1.75rem] border border-border/70 bg-surface p-7 h-full hover:shadow-card hover:border-accent/20 transition-all duration-300">
                  <span className="text-3xl">{item.icon}</span>
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-sm leading-relaxed text-muted">{item.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── VALUES ── */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <Reveal className="mb-14 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">What We Stand For</p>
            <h2 className="mt-2 text-3xl font-bold lg:text-4xl">Our Core Values</h2>
          </Reveal>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v, i) => (
              <Reveal key={v.title} delay={i * 0.1}>
                <div className="flex flex-col gap-4 rounded-[1.75rem] border border-border/70 bg-panel p-7 h-full hover:shadow-card hover:border-accent/20 transition-all duration-300">
                  <span className="text-3xl">{v.icon}</span>
                  <h3 className="font-semibold">{v.title}</h3>
                  <p className="text-sm leading-relaxed text-muted">{v.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <div className="relative overflow-hidden rounded-[2.5rem] bg-accent px-10 py-16 text-center text-white shadow-glow">
              <FloatingOrb size={300} top="-40%" right="-5%" color="rgba(255,255,255,0.08)" />
              <div className="relative z-10">
                <h2 className="text-3xl font-bold lg:text-4xl">
                  Tell Us What You Need
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-white/80">
                  Send your requirement and we will get back to you with clear pricing and availability. No confusion, no delays.
                </p>
                <Link
                  href="/quote"
                  className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-bold text-accent hover:bg-amber-50 transition-colors shadow-soft"
                >
                  Get a Quote
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
