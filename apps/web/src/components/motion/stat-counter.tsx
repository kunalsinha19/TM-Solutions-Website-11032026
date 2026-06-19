"use client";

import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef } from "react";

interface StatCounterProps {
  value: number;
  suffix?: string;
  label: string;
  delay?: number;
}

export function StatCounter({ value, suffix = "", label, delay = 0 }: StatCounterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (v) => Math.round(v));
  const displayValue = useTransform(rounded, (v) => `${v}${suffix}`);

  useEffect(() => {
    if (!isInView) return;
    const controls = animate(motionValue, value, {
      duration: 2,
      delay,
      ease: "easeOut"
    });
    return controls.stop;
  }, [isInView, value, delay, motionValue]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      className="text-center"
    >
      <motion.p className="text-4xl font-bold gradient-text lg:text-5xl">
        {displayValue}
      </motion.p>
      <p className="mt-2 text-sm font-medium text-muted">{label}</p>
    </motion.div>
  );
}
