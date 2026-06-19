"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "../theme/theme-toggle";
import { TranslateWidget } from "../translate/translate-widget";

const navLinks = [
  { href: "/products", label: "Products" },
  { href: "/about", label: "About Us" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/50 bg-surface/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white text-sm font-bold shadow-glow-sm group-hover:shadow-glow transition-shadow duration-300">
              TM
            </span>
            <span className="text-base font-bold tracking-wide text-text">
              TM <span className="text-accent">Solutions</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  pathname === link.href
                    ? "bg-accent-light text-accent"
                    : "text-muted hover:bg-border/60 hover:text-text"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <div className="hidden md:block">
              <TranslateWidget />
            </div>
            <ThemeToggle />
            <Link
              href="/quote"
              className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-glow-sm hover:shadow-glow hover:bg-amber-700 transition-all duration-200"
            >
              Get a Quote
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="opacity-80">
                <path d="M1 7h12M7 1l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex md:hidden h-9 w-9 items-center justify-center rounded-lg border border-border"
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile nav drawer */}
        {mobileOpen && (
          <div className="border-t border-border/50 bg-surface/95 backdrop-blur-xl px-6 py-4 md:hidden">
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                    pathname === link.href
                      ? "bg-accent-light text-accent"
                      : "text-muted hover:bg-border/60 hover:text-text"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/quote"
                onClick={() => setMobileOpen(false)}
                className="mt-2 rounded-xl bg-accent px-4 py-3 text-center text-sm font-semibold text-white"
              >
                Get a Quote
              </Link>
              <div className="mt-3">
                <TranslateWidget />
              </div>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
