"use client";

import { useState } from "react";
import Image from "next/image";

interface GalleryImage {
  url: string;
  alt: string;
}

export function ProductGallery({
  images,
  productName,
}: {
  images: GalleryImage[];
  productName: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[activeIndex];

  return (
    <div>
      {/* Main image */}
      <div className="relative mb-4 h-72 overflow-hidden rounded-[2rem] border border-border/70 bg-panel shadow-card sm:h-96">
        {active ? (
          <Image
            src={active.url}
            alt={active.alt || productName}
            fill
            className="object-cover transition-opacity duration-300"
            sizes="(max-width: 1024px) 100vw, 60vw"
            priority
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-border">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect x="6" y="9" width="36" height="30" rx="4" stroke="currentColor" strokeWidth="2" />
              <circle cx="18" cy="20" r="4" stroke="currentColor" strokeWidth="2" />
              <path d="M6 33l9-8 8 6 6-5 13 10" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            </svg>
            <span className="text-sm">Image coming soon</span>
          </div>
        )}

        {/* Image counter badge */}
        {images.length > 1 && (
          <span className="absolute bottom-3 right-3 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
            {activeIndex + 1} / {images.length}
          </span>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                i === activeIndex
                  ? "border-accent shadow-glow-sm"
                  : "border-border/60 hover:border-accent/40 opacity-70 hover:opacity-100"
              }`}
            >
              <Image
                src={img.url}
                alt={img.alt || `${productName} view ${i + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
