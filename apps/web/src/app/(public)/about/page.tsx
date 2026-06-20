import Link from "next/link";
import type { Metadata } from "next";
import { Reveal } from "../../../components/motion/reveal";
import { StatCounter } from "../../../components/motion/stat-counter";
import { FloatingOrb } from "../../../components/motion/floating-orb";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about TM Solutions — 15+ years of delivering premium industrial products and automation solutions across India."
};

const values = [
  {
    icon: "🎯",
    title: "Customer First",
    description: "Every decision we make starts with how it affects our buyer's plant uptime, budget, and compliance."
  },
  {
    icon: "🔬",
    title: "Technical Depth",
    description: "Our team includes certified engineers who understand your application — not just salespeople pushing SKUs."
  },
  {
    icon: "⚖️",
    title: "Transparent Pricing",
    description: "No hidden charges. No margin games. You get competitive pricing with full commercial clarity."
  },
  {
    icon: "🌱",
    title: "Long-term Partnerships",
    description: "We don't chase one-time orders. We build relationships that last procurement cycles."
  }
];

const milestones = [
  { year: "2009", event: "Founded in Mumbai with a focus on industrial valve supply." },
  { year: "2012", event: "Expanded into automation components and pump controllers." },
  { year: "2015", event: "Opened regional offices in Delhi and Pune. 50+ active clients." },
  { year: "2018", event: "Achieved ISO 9001:2015 certification. Launched technical support division." },
  { year: "2022", event: "Digital-first transformation — online catalog and real-time quote platform." },
  { year: "2024", event: "200+ clients. Pan-India delivery network. 500+ SKUs cataloged." }
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
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">About TM Solutions</p>
            <h1 className="mt-4 text-4xl font-extrabold leading-[1.1] tracking-tight lg:text-6xl">
              Built on{" "}
              <span className="gradient-text">15 Years</span>{" "}
              of Industrial Trust
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted">
              TM Solutions was founded to solve one persistent problem in industrial procurement: reliable supply at transparent pricing with technical expertise. Today we serve 200+ companies across India.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="border-y border-border/60 bg-panel py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-2 gap-10 lg:grid-cols-4">
            <StatCounter value={200} suffix="+" label="Active Clients" delay={0} />
            <StatCounter value={500} suffix="+" label="Products Supplied" delay={0.1} />
            <StatCounter value={15} suffix="+" label="Years of Operation" delay={0.2} />
            <StatCounter value={98} suffix="%" label="On-time Delivery Rate" delay={0.3} />
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
                  To be India's most trusted B2B industrial supplier — where procurement teams come first for accurate specs, fair pricing, and reliable delivery. We exist to eliminate sourcing friction in industrial operations.
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="flex flex-col gap-5 rounded-[2rem] border border-accent/20 bg-accent/5 p-10 h-full shadow-card">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/15 text-2xl">
                  🔭
                </div>
                <h2 className="text-2xl font-bold">Our Vision</h2>
                <p className="leading-relaxed text-muted">
                  A future where every industrial plant in India can access world-class components through a simple digital interface — with the technical support of an on-site engineer, delivered at scale.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── VALUES ── */}
      <section className="bg-panel px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <Reveal className="mb-14 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">What We Stand For</p>
            <h2 className="mt-2 text-3xl font-bold lg:text-4xl">Our Core Values</h2>
          </Reveal>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v, i) => (
              <Reveal key={v.title} delay={i * 0.1}>
                <div className="flex flex-col gap-4 rounded-[1.75rem] border border-border/70 bg-surface p-7 h-full hover:shadow-card hover:border-accent/20 transition-all duration-300">
                  <span className="text-3xl">{v.icon}</span>
                  <h3 className="font-semibold">{v.title}</h3>
                  <p className="text-sm leading-relaxed text-muted">{v.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── TIMELINE ── */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <Reveal className="mb-14 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Our Journey</p>
            <h2 className="mt-2 text-3xl font-bold lg:text-4xl">How We Got Here</h2>
          </Reveal>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[22px] top-0 h-full w-px bg-gradient-to-b from-accent/40 via-border to-transparent" />

            <div className="flex flex-col gap-8">
              {milestones.map((m, i) => (
                <Reveal key={m.year} delay={i * 0.08}>
                  <div className="flex gap-6">
                    <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-accent/40 bg-panel text-xs font-bold text-accent z-10">
                      {m.year.slice(2)}
                    </div>
                    <div className="pt-2">
                      <p className="text-xs font-semibold text-accent">{m.year}</p>
                      <p className="mt-1 text-sm leading-relaxed text-muted">{m.event}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
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
                <h2 className="text-3xl font-bold lg:text-4xl">Ready to Work Together?</h2>
                <p className="mx-auto mt-4 max-w-xl text-white/80">
                  Tell us your sourcing requirement and our team will get back to you with a tailored quote within 24 hours.
                </p>
                <Link
                  href="/quote"
                  className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-bold text-accent hover:bg-amber-50 transition-colors shadow-soft"
                >
                  Request a Quote
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
