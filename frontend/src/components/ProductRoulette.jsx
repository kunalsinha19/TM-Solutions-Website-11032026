"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

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

    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(880, now);
    oscillator.frequency.exponentialRampToValueAtTime(620, now + 0.08);
    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(0.05, now + 0.015);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.12);
  };
}

function formatInrAmount(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);
}

function mapProducts(products) {
  return products.map((product) => ({
    id: product.id || product._id || product.slug || product.name,
    name: product.name,
    category: product.category,
    detail: product.detail || product.shortDescription || product.description || "Product available for business inquiries.",
    image: product.image || product.images?.[0] || "",
    price: typeof product.price === "number" ? product.price : 0,
    sku: product.sku || ""
  }));
}

export default function ProductRoulette({ products = [] }) {
  const sourceProducts = useMemo(() => mapProducts(products), [products]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoverDirection, setHoverDirection] = useState(null);
  const tickPlayerRef = useRef(null);
  const intervalRef = useRef(null);

  const activeProduct = sourceProducts[activeIndex] || sourceProducts[0];
  const previewProducts = sourceProducts.length <= 5
    ? sourceProducts.map((product, index) => ({ ...product, sourceIndex: index, isActive: index === activeIndex }))
    : [-2, -1, 0, 1, 2].map((offset) => {
        const sourceIndex = (activeIndex + offset + sourceProducts.length) % sourceProducts.length;
        const product = sourceProducts[sourceIndex];
        return {
          ...product,
          sourceIndex,
          isActive: sourceIndex === activeIndex
        };
      });

  useEffect(() => {
    tickPlayerRef.current = createTickPlayer();
  }, []);

  useEffect(() => {
    setActiveIndex(0);
  }, [sourceProducts.length]);

  useEffect(() => {
    if (!hoverDirection || sourceProducts.length <= 1) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return undefined;
    }

    const move = () => {
      setActiveIndex((current) => {
        const next = hoverDirection === "up"
          ? (current - 1 + sourceProducts.length) % sourceProducts.length
          : (current + 1) % sourceProducts.length;
        tickPlayerRef.current?.();
        return next;
      });
    };

    intervalRef.current = setInterval(move, 1200);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [hoverDirection, sourceProducts.length]);

  function setDirection(direction) {
    setHoverDirection(direction);
  }

  function stopDirection() {
    setHoverDirection(null);
  }

  function step(direction) {
    if (sourceProducts.length <= 1) {
      return;
    }

    setActiveIndex((current) => {
      const next = direction === "up"
        ? (current - 1 + sourceProducts.length) % sourceProducts.length
        : (current + 1) % sourceProducts.length;
      return next;
    });
    tickPlayerRef.current?.();
  }

  if (!activeProduct) {
    return null;
  }

  return (
    <div className="roulette-shell modern-roulette premium-roulette-shell">
      <div
        className="roulette-hit roulette-hit-left"
        onMouseEnter={() => setDirection("up")}
        onMouseLeave={stopDirection}
      >
        <span>Hover left</span>
        <strong>Previous product</strong>
      </div>

      <div className="roulette-view modern-roulette-view premium-roulette-view">
        <div className="roulette-controls">
          <div className="roulette-count-badge">
            <span>Showing</span>
            <strong>{activeIndex + 1} / {sourceProducts.length}</strong>
          </div>
          <button type="button" className="roulette-nav" onClick={() => step("up")}>Up</button>
          <button type="button" className="roulette-nav" onClick={() => step("down")}>Down</button>
        </div>

        <AnimatePresence mode="wait">
          <motion.article
            key={activeProduct.id}
            className="roulette-feature-card"
            initial={{ opacity: 0, y: 18, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -18, scale: 0.985 }}
            transition={{ duration: 0.38, ease: "easeOut" }}
          >
            <div className="roulette-feature-media premium-roulette-media">
              {activeProduct.image ? (
                <img src={activeProduct.image} alt={activeProduct.name} className="roulette-feature-image" />
              ) : (
                <div className="roulette-feature-placeholder">{activeProduct.name.slice(0, 1).toUpperCase()}</div>
              )}
              <div className="roulette-image-sheen" />
            </div>
            <div className="roulette-feature-copy premium-roulette-copy">
              <p className="roulette-label">{activeProduct.category}</p>
              <h3>{activeProduct.name}</h3>
              <p>{activeProduct.detail}</p>
              <div className="roulette-price-row">
                <strong>{activeProduct.price ? formatInrAmount(activeProduct.price) : "Price on request"}</strong>
                <span>per piece</span>
              </div>
              <div className="product-info-row">
                {activeProduct.sku ? <span className="product-info-chip">SKU: {activeProduct.sku}</span> : null}
                <span className="product-info-chip">Ready for inquiry</span>
              </div>
            </div>
          </motion.article>
        </AnimatePresence>

        <div className="roulette-preview-list">
          {previewProducts.map((product) => (
            <button
              key={product.id}
              type="button"
              className={`roulette-preview-item${product.isActive ? " active" : ""}`}
              onClick={() => setActiveIndex(product.sourceIndex)}
            >
              <span>{product.name}</span>
              <strong>{product.price ? formatInrAmount(product.price) : "Quote"}</strong>
            </button>
          ))}
        </div>
      </div>

      <div
        className="roulette-hit roulette-hit-right"
        onMouseEnter={() => setDirection("down")}
        onMouseLeave={stopDirection}
      >
        <span>Hover right</span>
        <strong>Next product</strong>
      </div>
    </div>
  );
}
