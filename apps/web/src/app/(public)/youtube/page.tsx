import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { apiClient, type YoutubeShort } from "../../../lib/api-client";
import { SITE_CONFIG } from "../../../lib/site-config";
import { Reveal } from "../../../components/motion/reveal";
import { FloatingOrb } from "../../../components/motion/floating-orb";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "YouTube Shorts",
  description:
    "Watch TM Solutions' latest YouTube Shorts — product demos, industrial equipment highlights, and quick tips for buyers.",
};

function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

function parseDuration(iso: string): string {
  // ISO 8601 duration: PT1M30S, PT45S, PT2M, etc.
  const match = iso?.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "";
  const h = parseInt(match[1] || "0");
  const m = parseInt(match[2] || "0");
  const s = parseInt(match[3] || "0");
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function ShortCard({ short }: { short: YoutubeShort }) {
  const watchUrl = `https://www.youtube.com/watch?v=${short.id}`;
  const dur = parseDuration(short.duration);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-[1.5rem] border border-border/70 bg-panel transition-all duration-300 hover:border-accent/40 hover:shadow-card hover:-translate-y-0.5">
      {/* Thumbnail — 9:16 portrait */}
      <a
        href={watchUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="relative block overflow-hidden"
        style={{ paddingBottom: "177.78%" /* 9:16 */ }}
        aria-label={`Watch ${short.title} on YouTube`}
      >
        {short.thumbnail ? (
          <Image
            src={short.thumbnail}
            alt={short.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-surface text-4xl">▶️</div>
        )}

        {/* Duration badge */}
        {dur && (
          <span className="absolute bottom-2 right-2 rounded-md bg-black/80 px-1.5 py-0.5 text-[10px] font-bold text-white">
            {dur}
          </span>
        )}

        {/* Shorts badge */}
        <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
            <path d="M8.5 4.13L2.5 1.07A1 1 0 001 1.94v6.12A1 1 0 002.5 8.93l6-3.06a1 1 0 000-1.74z"/>
          </svg>
          Shorts
        </span>

        {/* Play overlay on hover */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-300 group-hover:bg-black/30">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/0 transition-all duration-300 group-hover:bg-white/90">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="#B45309" className="opacity-0 transition-opacity duration-300 group-hover:opacity-100 translate-x-0.5" aria-hidden="true">
              <path d="M16.5 9.13L4.5 2.54A1 1 0 003 3.41v13.18a1 1 0 001.5.87l12-6.59a1 1 0 000-1.74z"/>
            </svg>
          </div>
        </div>
      </a>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug">
          {short.title}
        </h3>
        <div className="mt-auto flex items-center justify-between">
          <span className="text-xs text-muted">
            {short.viewCount > 0 ? `${formatViews(short.viewCount)} views` : formatDate(short.publishedAt)}
          </span>
          <a
            href={watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-accent/10 px-3 py-1 text-[11px] font-semibold text-accent hover:bg-accent hover:text-white transition-all duration-200"
          >
            Watch →
          </a>
        </div>
      </div>
    </div>
  );
}

export default async function YouTubePage() {
  const shorts = await apiClient.getYouTubeShorts();

  return (
    <div className="relative">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden px-4 pb-10 pt-14 sm:px-6 sm:pt-16">
        <FloatingOrb size={400} top="-20%" right="-10%" color="rgba(220,38,38,0.07)" />
        <FloatingOrb size={280} bottom="-5%" left="-8%" color="rgba(180,83,9,0.06)" delay={2} />
        <div className="relative mx-auto max-w-7xl">
          <Reveal>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/8 px-4 py-1.5 text-xs font-semibold text-red-500">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
                <path d="M10 5.13L4 2.07A1 1 0 002.5 2.94v6.12A1 1 0 004 9.93l6-3.06a1 1 0 000-1.74z"/>
              </svg>
              YouTube Shorts
            </div>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight lg:text-5xl">
              Watch Our Latest <span className="gradient-text">Shorts</span>
            </h1>
            <p className="mt-4 max-w-2xl text-base text-muted sm:text-lg">
              Product demos, industrial equipment highlights, and quick tips — all in under 60 seconds.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a
                href={`${SITE_CONFIG.youtubeChannelUrl}?sub_confirmation=1`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors shadow-sm"
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
                className="inline-flex items-center justify-center h-10 w-10 rounded-full border border-border bg-panel hover:border-red-500/40 hover:bg-red-500/8 transition-colors"
                title="Enable notifications on YouTube"
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

      {/* ── GRID ── */}
      <section className="px-4 pb-24 sm:px-6">
        <div className="mx-auto max-w-7xl">
          {shorts.length === 0 ? (
            <Reveal>
              <div className="flex flex-col items-center justify-center gap-5 rounded-[2rem] border border-dashed border-border py-24 text-center">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="text-muted" aria-hidden="true">
                  <rect x="4" y="8" width="40" height="32" rx="6" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M20 17l11 7-11 7V17z" fill="currentColor" opacity=".4"/>
                </svg>
                <div>
                  <h2 className="text-xl font-semibold">No Shorts Yet</h2>
                  <p className="mt-2 max-w-xs text-sm text-muted">
                    Videos will appear here once the YouTube channel is connected in the admin panel.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3">
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
              </div>
            </Reveal>
          ) : (
            <>
              <Reveal className="mb-6 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                  {shorts.length} video{shorts.length !== 1 ? "s" : ""}
                </p>
                <a
                  href={SITE_CONFIG.youtubeChannelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-accent hover:underline"
                >
                  View channel →
                </a>
              </Reveal>

              {/* Portrait grid — 2 cols mobile, 3 sm, 4 lg, 5 xl */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {shorts.map((short, i) => (
                  <Reveal key={short.id} delay={Math.min(i * 0.05, 0.4)}>
                    <ShortCard short={short} />
                  </Reveal>
                ))}
              </div>
            </>
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
