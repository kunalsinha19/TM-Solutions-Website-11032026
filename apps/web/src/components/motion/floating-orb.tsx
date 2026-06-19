"use client";

import { useReducedMotion } from "framer-motion";

interface FloatingOrbProps {
  size: number;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  color?: string;
  delay?: number;
  className?: string;
}

export function FloatingOrb({
  size,
  top,
  left,
  right,
  bottom,
  color = "rgba(180,83,9,0.15)",
  delay = 0,
  className = ""
}: FloatingOrbProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      className={`absolute rounded-full blur-3xl ${reduceMotion ? "" : "animate-float-slow"} animate-pulse-glow ${className}`}
      style={{
        width: size,
        height: size,
        top,
        left,
        right,
        bottom,
        background: color,
        animationDelay: `${delay}s`,
        pointerEvents: "none"
      }}
    />
  );
}
