"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { Product } from "@tara-maa/shared-types";

export function ProductRoulette({ products }: { products: Product[] }) {
  const reduceMotion = useReducedMotion();
  const reel = [...products, ...products];

  return (
    <div className="overflow-hidden rounded-[2rem] border border-border bg-panel p-4 shadow-soft">
      <motion.div
        className="flex gap-4"
        animate={
          reduceMotion
            ? { x: 0 }
            : {
                x: ["0%", "-50%"]
              }
        }
        transition={
          reduceMotion
            ? undefined
            : {
                duration: 18,
                repeat: Infinity,
                ease: "linear"
              }
        }
      >
        {reel.map((product, index) => (
          <div
            key={`${product.slug}-${index}`}
            className="min-w-[260px] rounded-[1.5rem] bg-surface p-5"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-muted">{product.sku}</p>
            <h3 className="mt-3 text-lg font-semibold">{product.name}</h3>
            <p className="mt-2 text-sm text-muted">{product.shortDescription}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
