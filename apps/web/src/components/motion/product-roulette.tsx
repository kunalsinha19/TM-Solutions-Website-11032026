"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { Product } from "@tara-maa/shared-types";

export function ProductRoulette({ products }: { products: Product[] }) {
  const reduceMotion = useReducedMotion();
  const reel = [...products, ...products, ...products];

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-panel p-5 shadow-soft">
      {/* Fade edges */}
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-16 bg-gradient-to-r from-panel to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-16 bg-gradient-to-l from-panel to-transparent" />

      <motion.div
        className="flex gap-4"
        animate={reduceMotion ? { x: 0 } : { x: ["0%", "-33.333%"] }}
        transition={
          reduceMotion
            ? undefined
            : { duration: 22, repeat: Infinity, ease: "linear" }
        }
      >
        {reel.map((product, index) => (
          <div
            key={`${product.slug}-${index}`}
            className="min-w-[240px] rounded-[1.5rem] border border-border/60 bg-surface p-5 hover:border-accent/30 transition-colors duration-200"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted bg-panel px-2 py-0.5 rounded-full border border-border/60">
                {product.sku}
              </span>
              {product.isFeatured && (
                <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              )}
            </div>
            <h3 className="text-base font-semibold leading-snug">{product.name}</h3>
            <p className="mt-2 text-xs leading-relaxed text-muted line-clamp-2">{product.shortDescription}</p>
            <div className="mt-4 text-xs font-semibold text-accent">View →</div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
