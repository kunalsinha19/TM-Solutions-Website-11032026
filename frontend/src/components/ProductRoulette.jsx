"use client";

import { motion, useAnimationFrame, useMotionValue, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

const products = [
  {
    name: "Process Valve Unit",
    category: "Process Equipment",
    detail: "Precision flow control for industrial process lines."
  },
  {
    name: "Smart Pump Controller",
    category: "Automation Systems",
    detail: "Remote monitoring and responsive plant automation."
  },
  {
    name: "Power Distribution Board",
    category: "Electrical Solutions",
    detail: "Stable, compliant distribution for demanding installations."
  },
  {
    name: "Custom Maintenance Kit",
    category: "Custom Supply Kits",
    detail: "Bundled consumables and spares tailored to site operations."
  },
  {
    name: "Sensor Relay Module",
    category: "Automation Systems",
    detail: "Signal conversion and monitoring for connected facilities."
  }
];

const ITEM_HEIGHT = 128;
const LOOP_HEIGHT = ITEM_HEIGHT * products.length;
const BASE_OFFSET = LOOP_HEIGHT;

function createTickPlayer() {
  let audioContext = null;

  return () => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      return;
    }

    if (!audioContext) {
      audioContext = new AudioContextClass();
    }

    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const now = audioContext.currentTime;

    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(920, now);
    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(0.035, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.08);
  };
}

export default function ProductRoulette() {
  const trackY = useMotionValue(BASE_OFFSET);
  const reduceMotion = useReducedMotion();
  const [direction, setDirection] = useState(null);
  const velocityRef = useRef(0);
  const tickDistanceRef = useRef(0);
  const hasInteractedRef = useRef(false);
  const tickPlayerRef = useRef(null);

  const visibleProducts = useMemo(
    () => [...products, ...products, ...products],
    []
  );

  useEffect(() => {
    tickPlayerRef.current = createTickPlayer();
  }, []);

  useAnimationFrame((_, delta) => {
    if (reduceMotion) {
      return;
    }

    const targetVelocity =
      direction === "up" ? -0.18 : direction === "down" ? 0.18 : 0;
    velocityRef.current += (targetVelocity - velocityRef.current) * 0.14;

    if (Math.abs(velocityRef.current) < 0.002 && !direction) {
      velocityRef.current = 0;
      return;
    }

    const movement = velocityRef.current * delta;
    const next = trackY.get() + movement;

    let normalized = next;
    if (normalized <= 0) {
      normalized += LOOP_HEIGHT;
    }
    if (normalized >= LOOP_HEIGHT * 2) {
      normalized -= LOOP_HEIGHT;
    }

    trackY.set(normalized);

    tickDistanceRef.current += Math.abs(movement);
    if (
      hasInteractedRef.current &&
      tickDistanceRef.current >= ITEM_HEIGHT &&
      Math.abs(velocityRef.current) > 0.04
    ) {
      tickDistanceRef.current -= ITEM_HEIGHT;
      tickPlayerRef.current?.();
    }
  });

  function startDirection(nextDirection) {
    hasInteractedRef.current = true;
    setDirection(nextDirection);
    tickPlayerRef.current?.();
  }

  return (
    <div className="roulette-shell">
      <div
        className="roulette-hit roulette-hit-left"
        onMouseEnter={() => startDirection("up")}
        onMouseLeave={() => setDirection(null)}
        onTouchStart={() => startDirection("up")}
        onTouchEnd={() => setDirection(null)}
      >
        <span>Hover left</span>
        <strong>Rotate upward</strong>
      </div>

      <div className="roulette-view">
        <motion.div className="roulette-track" style={{ y: trackY }}>
          {visibleProducts.map((product, index) => (
            <article className="roulette-card" key={`${product.name}-${index}`}>
              <p className="roulette-label">{product.category}</p>
              <h3>{product.name}</h3>
              <p>{product.detail}</p>
            </article>
          ))}
        </motion.div>
      </div>

      <div
        className="roulette-hit roulette-hit-right"
        onMouseEnter={() => startDirection("down")}
        onMouseLeave={() => setDirection(null)}
        onTouchStart={() => startDirection("down")}
        onTouchEnd={() => setDirection(null)}
      >
        <span>Hover right</span>
        <strong>Rotate downward</strong>
      </div>
    </div>
  );
}
