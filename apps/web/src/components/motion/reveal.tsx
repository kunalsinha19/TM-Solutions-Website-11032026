"use client";

import { motion } from "framer-motion";
import type { PropsWithChildren } from "react";

export function Reveal(props: PropsWithChildren<{ delay?: number; className?: string }>) {
  const { children, delay = 0, className = "" } = props;
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
