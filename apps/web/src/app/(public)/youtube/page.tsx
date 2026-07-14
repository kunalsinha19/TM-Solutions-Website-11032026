import type { Metadata } from "next";
import Link from "next/link";
import { apiClient } from "../../../lib/api-client";
import { SITE_CONFIG } from "../../../lib/site-config";
import { ShortsSlider } from "../../../components/youtube/ShortsSlider";
import { Reveal } from "../../../components/motion/reveal";
import { FloatingOrb } from "../../../components/motion/floating-orb";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "YouTube Shorts",
  description:
    "Watch TM Solutions' latest YouTube Shorts — product demos, industrial equipment highlights, and quick tips for buyers.",
};

export default async function YouTubePage() {
  const shorts = await apiClient.getYouTubeShorts();

  return (
    <div className="relative min-h-screen">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden px-4 pb-12 pt-14 sm:px-6 sm:pt-16">
        <FloatingOrb size={500} top="-25%" right="-8%" color="rgba(220,38,38,0.06)" />
        <FloatingOrb size={300} bottom="-5%" left="-10%" color="rgba(180,83,9,0.05)" delay={2} />

        <div className="relative mx-auto max-w-7xl">
          <Reveal>
            {/* Label */}
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/8 px-4 py-1.5 text-xs font-semibold text-red-500">
              <svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
                <path d="M10 5.13L4 2.07A1 1 0 002.5 2.94v6.12A1 1 0 004 9.93l6-3.06a1 1 0 000-1.74z"/>
              </svg>
              YouTube Shorts
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
              Watch Our Latest <span className="gradient-text">Shorts</span>
            </h1>
            <p className="mt-4 max-w-xl text-base text-muted sm:text-lg">
              Product demos, industrial equipment highlights, and quick tips — all in under 60 seconds.
            </p>

            {/* Subscribe row */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a
                href={`${SITE_CONFIG.youtubeChannelUrl}?sub_confirmation=1`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-600/20 hover:bg-red-700 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 00.5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 002.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 002.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.75 15.5v-7l6.5 3.5-6.5 3.5z"/>
                </svg>
                Subscribe
              </a>
              <a
                href={`${SITE_CONFIG.youtubeChannelUrl}?sub_confirmation=1`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Enable notifications"
                title="Enable notifications on YouTube"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-panel hover:border-red-500/40 hover:bg-red-500/8 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 01-3.46 0"/>
                </svg>
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── SLIDER / EMPTY STATE ── */}
      <section className="px-4 pb-24 sm:px-6">
        <div className="mx-auto max-w-7xl">
          {shorts.length === 0 ? (
            <Reveal>
              <div className="flex flex-col items-center justify-center gap-6 rounded-[2rem] border border-dashed border-border py-28 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/8 text-red-500">
                  <svg width="32" height="32" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                    <rect x="4" y="8" width="40" height="32" rx="6" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M20 17l11 7-11 7V17z" fill="currentColor" opacity=".5"/>
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold">No Shorts Yet</h2>
                  <p className="mt-2 max-w-xs text-sm text-muted">
                    Videos will appear here once the YouTube channel API is connected.
                  </p>
                </div>
                <a
                  href={`${SITE_CONFIG.youtubeChannelUrl}?sub_confirmation=1`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 00.5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 002.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 002.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.75 15.5v-7l6.5 3.5-6.5 3.5z"/>
                  </svg>
                  Subscribe to Our Channel
                </a>
              </div>
            </Reveal>
          ) : (
            <Reveal>
              <ShortsSlider shorts={shorts} />
            </Reveal>
          )}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="border-t border-border/60 bg-panel px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold">Looking for Industrial Equipment?</h2>
          <p className="mt-3 text-sm text-muted sm:text-base">
            Browse our full product catalog or send us your requirement and get a quote in 24 hours.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/products"
              className="rounded-full bg-accent px-7 py-3.5 text-sm font-bold text-white shadow-glow hover:bg-amber-700 transition-all duration-200"
            >
              Explore Products
            </Link>
            <Link
              href="/quote"
              className="rounded-full border border-border px-7 py-3.5 text-sm font-semibold hover:border-accent/40 hover:bg-accent/5 transition-all duration-200"
            >
              Get a Quote →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
