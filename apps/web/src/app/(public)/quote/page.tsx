import type { Metadata } from "next";
import { QuoteForm } from "../../../components/forms/quote-form";
import { Reveal } from "../../../components/motion/reveal";
import { FloatingOrb } from "../../../components/motion/floating-orb";

export const metadata: Metadata = {
  title: "Request a Quote",
  description: "Submit your industrial product requirement and get a detailed commercial quote from TM Solutions within 24 hours."
};

const trustPoints = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M10 5v5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: "Fast Response",
    description: "Our sales engineers respond to every quote request within 24 business hours."
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 2L3 6v5c0 4.5 3 8.3 7 9.5 4-1.2 7-5 7-9.5V6l-7-4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Secure & Private",
    description: "Your inquiry details are confidential. We never share your data with third parties."
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="4" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M7 9h6M7 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: "Detailed Quote",
    description: "Receive itemised pricing with lead time, payment terms, and technical notes."
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M17 10.5c0 3.6-3.1 6.5-7 6.5-1.4 0-2.7-.4-3.8-1L3 17l1.2-3.1C3.4 12.8 3 11.7 3 10.5 3 6.9 6.1 4 10 4s7 2.9 7 6.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      </svg>
    ),
    title: "No Spam",
    description: "One contact from our team. No cold follow-ups unless you ask."
  }
];

export default function QuotePage() {
  return (
    <div className="relative">
      <section className="relative overflow-hidden px-6 py-16 lg:py-24">
        <FloatingOrb size={500} top="-20%" right="-10%" color="rgba(180,83,9,0.09)" />
        <FloatingOrb size={300} bottom="-10%" left="-8%" color="rgba(217,119,6,0.07)" />

        <div className="relative mx-auto max-w-7xl">
          <div className="grid gap-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            {/* ── LEFT: Context ── */}
            <div>
              <Reveal>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">Quote Request</p>
                <h1 className="mt-3 text-4xl font-extrabold leading-[1.15] tracking-tight lg:text-5xl">
                  Tell Us What You Need.{" "}
                  <span className="gradient-text">We'll Handle the Rest.</span>
                </h1>
                <p className="mt-5 text-lg leading-relaxed text-muted">
                  Share your requirement — product type, quantity, delivery location, or any specifications. Our engineers will prepare a detailed quote tailored to your operation.
                </p>
              </Reveal>

              {/* Trust points */}
              <div className="mt-10 flex flex-col gap-5">
                {trustPoints.map((point, i) => (
                  <Reveal key={point.title} delay={i * 0.08}>
                    <div className="flex gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                        {point.icon}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{point.title}</p>
                        <p className="mt-0.5 text-sm text-muted">{point.description}</p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>

              {/* Contact block */}
              <Reveal delay={0.3} className="mt-10 rounded-[1.75rem] border border-border/70 bg-panel p-6 shadow-card">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted mb-4">Prefer to talk directly?</p>
                <div className="flex flex-col gap-3">
                  <a href="mailto:contact@tmsolutions.com" className="flex items-center gap-3 text-sm hover:text-accent transition-colors">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface border border-border/60 text-xs">✉️</span>
                    contact@tmsolutions.com
                  </a>
                  <a href="tel:+919876543210" className="flex items-center gap-3 text-sm hover:text-accent transition-colors">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface border border-border/60 text-xs">📞</span>
                    +91 98765 43210
                  </a>
                  <div className="flex items-center gap-3 text-sm text-muted">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface border border-border/60 text-xs">📍</span>
                    Mumbai, Maharashtra, India
                  </div>
                </div>
              </Reveal>
            </div>

            {/* ── RIGHT: Form ── */}
            <Reveal delay={0.1}>
              <div className="rounded-[2rem] border border-border/70 bg-panel p-2 shadow-card">
                <div className="rounded-[1.5rem] bg-accent/5 px-6 py-5 mb-2">
                  <h2 className="font-bold text-lg">Quote Request Form</h2>
                  <p className="text-sm text-muted mt-1">Fill in your details and we'll get back to you within 24 hours.</p>
                </div>
                <div className="px-2 pb-2">
                  <QuoteForm />
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  );
}
