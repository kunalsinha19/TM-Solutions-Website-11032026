"use client";

import { motion } from "framer-motion";
import AnimatedReveal from "./AnimatedReveal";

export default function HeroSection() {
  return (
    <section className="hero-section">
      <div className="hero-backdrop" />
      <div className="container hero-grid">
        <AnimatedReveal className="hero-copy">
          <p className="eyebrow">Tara Maa Solutions</p>
          <h1>Industrial products, trusted supply, and a modern B2B buying experience.</h1>
          <p className="hero-text">
            We help businesses discover the right products faster with a clean digital catalog, responsive consultation, and quote-first workflow designed for operational teams.
          </p>
          <div className="hero-actions">
            <a href="#quote" className="button-primary">Request a Quote</a>
            <a href="#categories" className="button-secondary">Explore Categories</a>
          </div>
        </AnimatedReveal>

        <AnimatedReveal delay={0.1} className="hero-card-wrap">
          <motion.div
            className="hero-card"
            animate={{ y: [0, -10, 0], rotate: [0, 1.2, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="hero-stat-grid">
              <div>
                <strong>250+</strong>
                <span>Products mapped</span>
              </div>
              <div>
                <strong>24h</strong>
                <span>Average lead response</span>
              </div>
              <div>
                <strong>SEO-ready</strong>
                <span>Catalog + landing pages</span>
              </div>
              <div>
                <strong>Quote-first</strong>
                <span>Built for B2B conversion</span>
              </div>
            </div>
          </motion.div>
        </AnimatedReveal>
      </div>
    </section>
  );
}
