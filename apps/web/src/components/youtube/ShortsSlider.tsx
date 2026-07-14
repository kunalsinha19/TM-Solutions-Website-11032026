"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import type { YoutubeShort } from "../../lib/api-client";
import { SITE_CONFIG } from "../../lib/site-config";

function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M views`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K views`;
  return n > 0 ? `${n} views` : "";
}

function parseDuration(iso: string): string {
  const match = iso?.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "";
  const h = parseInt(match[1] || "0");
  const m = parseInt(match[2] || "0");
  const s = parseInt(match[3] || "0");
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch { return ""; }
}

function ShortCard({
  short,
  isPlaying,
  onPlay,
  rank,
}: {
  short: YoutubeShort;
  isPlaying: boolean;
  onPlay: () => void;
  rank: number;
}) {
  const dur = parseDuration(short.duration);
  const watchUrl = `https://www.youtube.com/watch?v=${short.id}`;

  if (isPlaying) {
    return (
      <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-red-500/60 bg-black shadow-2xl shadow-red-500/20 ring-1 ring-red-500/20">
        <div className="relative w-full" style={{ paddingBottom: "177.78%" }}>
          <iframe
            className="absolute inset-0 h-full w-full rounded-t-2xl"
            src={`https://www.youtube.com/embed/${short.id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            title={short.title}
          />
        </div>
        <div className="flex items-center justify-between gap-2 bg-[#0f0f0f] px-3 py-2.5">
          <p className="line-clamp-1 flex-1 text-[11px] font-medium text-white/80">{short.title}</p>
          <button
            onClick={onPlay}
            aria-label="Close player"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition-colors text-xs"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/8 bg-[#0f0f0f] cursor-pointer transition-all duration-300 hover:border-red-500/40 hover:shadow-xl hover:shadow-red-500/10 hover:-translate-y-1"
      onClick={onPlay}
      role="button"
      aria-label={`Play ${short.title}`}
    >
      {/* Portrait thumbnail */}
      <div className="relative w-full overflow-hidden" style={{ paddingBottom: "177.78%" }}>
        <Image
          src={short.thumbnail}
          alt={short.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Dark vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />

        {/* Rank badge — top left */}
        {rank <= 3 && (
          <div className="absolute left-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-black shadow-lg">
            #{rank}
          </div>
        )}

        {/* Shorts badge — top right */}
        <div className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
          <svg width="8" height="8" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
            <path d="M8.5 4.13L2.5 1.07A1 1 0 001 1.94v6.12A1 1 0 002.5 8.93l6-3.06a1 1 0 000-1.74z"/>
          </svg>
          Shorts
        </div>

        {/* Duration — bottom right */}
        {dur && (
          <div className="absolute bottom-14 right-2.5 rounded-md bg-black/80 px-1.5 py-0.5 text-[10px] font-mono font-bold text-white backdrop-blur-sm">
            {dur}
          </div>
        )}

        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-300 group-hover:opacity-100">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 shadow-lg shadow-red-600/50 scale-75 transition-all duration-300 group-hover:scale-100 group-hover:shadow-xl group-hover:shadow-red-600/60">
            <svg width="22" height="22" viewBox="0 0 20 20" fill="white" className="translate-x-0.5" aria-hidden="true">
              <path d="M16.5 9.13L4.5 2.54A1 1 0 003 3.41v13.18a1 1 0 001.5.87l12-6.59a1 1 0 000-1.74z"/>
            </svg>
          </div>
        </div>

        {/* Title overlay at bottom of thumbnail */}
        <div className="absolute bottom-0 left-0 right-0 px-3 pb-3 pt-8">
          <p className="line-clamp-2 text-[11px] font-semibold leading-tight text-white/90">
            {short.title}
          </p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#0a0a0a]">
        <span className="text-[11px] font-semibold text-red-400">
          {short.viewCount > 0 ? formatViews(short.viewCount) : formatDate(short.publishedAt)}
        </span>
        <a
          href={watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-[10px] font-medium text-white/30 hover:text-white/70 transition-colors"
          aria-label={`Open ${short.title} on YouTube`}
        >
          YT ↗
        </a>
      </div>
    </div>
  );
}

const CARDS_PER_PAGE = 5;

export function ShortsSlider({ shorts }: { shorts: YoutubeShort[] }) {
  const sorted = [...shorts].sort((a, b) => b.viewCount - a.viewCount);
  const [page, setPage] = useState(0);
  const [playingId, setPlayingId] = useState<string | null>(null);

  // Group into pages of CARDS_PER_PAGE
  const pages: YoutubeShort[][] = [];
  for (let i = 0; i < sorted.length; i += CARDS_PER_PAGE) {
    pages.push(sorted.slice(i, i + CARDS_PER_PAGE));
  }
  const totalPages = pages.length;

  const goTo = useCallback((p: number) => {
    setPage(p);
    setPlayingId(null);
  }, []);

  const prev = useCallback(() => goTo(Math.max(0, page - 1)), [page, goTo]);
  const next = useCallback(() => goTo(Math.min(totalPages - 1, page + 1)), [page, totalPages, goTo]);

  if (sorted.length === 0) return null;

  return (
    <div className="select-none">
      {/* Toolbar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted">
            {sorted.length} Video{sorted.length !== 1 ? "s" : ""}
          </span>
          <span className="h-3.5 w-px bg-border" />
          <span className="flex items-center gap-1.5 text-xs font-medium text-amber-500">
            <svg width="10" height="10" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
            Most viewed first
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Dot indicators */}
          <div className="flex items-center gap-1.5">
            {pages.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Go to page ${i + 1}`}
                className={`rounded-full transition-all duration-300 ${
                  i === page
                    ? "h-2 w-5 bg-red-500"
                    : "h-2 w-2 bg-white/20 hover:bg-white/40"
                }`}
              />
            ))}
          </div>

          {/* Arrow buttons */}
          <button
            onClick={prev}
            disabled={page === 0}
            aria-label="Previous"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition-all hover:border-red-500/40 hover:bg-red-500/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 2L4 7l5 5"/>
            </svg>
          </button>
          <button
            onClick={next}
            disabled={page === totalPages - 1}
            aria-label="Next"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition-all hover:border-red-500/40 hover:bg-red-500/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 2l5 5-5 5"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Slider */}
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{ transform: `translateX(-${page * 100}%)` }}
        >
          {pages.map((pageShorts, pIdx) => (
            <div
              key={pIdx}
              className="grid min-w-full grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 sm:gap-4"
            >
              {pageShorts.map((short, cardIdx) => {
                const globalRank = pIdx * CARDS_PER_PAGE + cardIdx + 1;
                return (
                  <ShortCard
                    key={short.id}
                    short={short}
                    rank={globalRank}
                    isPlaying={playingId === short.id}
                    onPlay={() =>
                      setPlayingId(playingId === short.id ? null : short.id)
                    }
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Channel CTA */}
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <a
          href={SITE_CONFIG.youtubeChannelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-2.5 text-sm font-semibold text-white/70 transition-all hover:border-red-500/30 hover:text-white"
        >
          View full channel →
        </a>
        <a
          href={`${SITE_CONFIG.youtubeChannelUrl}?sub_confirmation=1`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition-all hover:bg-red-700 hover:shadow-red-600/30"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 00.5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 002.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 002.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.75 15.5v-7l6.5 3.5-6.5 3.5z"/>
          </svg>
          Subscribe
        </a>
      </div>
    </div>
  );
}
