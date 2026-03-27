"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import AnimatedReveal from "./AnimatedReveal";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/$/, "");

export default function HeroSection({ content }) {
  const [counts, setCounts] = useState({ products: 0, categories: 0 });

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    let active = true;

    async function loadCounts() {
      try {
        const [productsResponse, categoriesResponse] = await Promise.all([
          fetch(`${API_BASE}/products`).then((response) => response.ok ? response.json() : null),
          fetch(`${API_BASE}/categories`).then((response) => response.ok ? response.json() : null)
        ]);

        if (!active) {
          return;
        }

        const products = Array.isArray(productsResponse?.products)
          ? productsResponse.products.filter((product) => product?.status === "published")
          : [];
        const categories = Array.isArray(categoriesResponse?.categories)
          ? categoriesResponse.categories.filter((category) => category?.isActive !== false)
          : [];

        setCounts({
          products: products.length,
          categories: categories.length
        });
      } catch {
        if (active) {
          setCounts({ products: 0, categories: 0 });
        }
      }
    }

    loadCounts();
    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => [
    {
      value: `${counts.products}+`,
      label: "Products ready to view"
    },
    {
      value: `${counts.categories}+`,
      label: "Product categories"
    },
    {
      value: "Fast",
      label: "Reply on quote requests"
    },
    {
      value: "Simple",
      label: "Easy buying support"
    }
  ], [counts]);

  const heroTitle = content?.heroTitle || "We help you find the right industrial product without wasting time.";
  const heroSubtitle = content?.heroSubtitle || "Browse products, check categories, and send us your requirement in a few simple steps. We keep the process clear, fast, and easy to understand.";

  return (
    <section className="hero-section">
      <div className="hero-backdrop" />
      <div className="container hero-grid">
        <AnimatedReveal className="hero-copy">
          <h1>{heroTitle}</h1>
          <p className="hero-text">
            {heroSubtitle}
          </p>
          <div className="hero-actions">
            <a href="#quote" className="button-primary">Get a Quote</a>
            <a href="#categories" className="button-secondary">See Products</a>
          </div>
        </AnimatedReveal>

        <AnimatedReveal delay={0.1} className="hero-card-wrap">
          <motion.div
            className="hero-card"
            animate={{ y: [0, -10, 0], rotate: [0, 1.2, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="hero-stat-grid">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatedReveal>
      </div>
    </section>
  );
}
