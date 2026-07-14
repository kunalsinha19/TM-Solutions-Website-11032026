"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "../theme/theme-toggle";
import { TranslateWidget } from "../translate/translate-widget";

const navLinks = [
  { href: "/products", label: "Products" },
  { href: "/youtube", label: "Shorts" },
  { href: "/about", label: "About Us" },
];

export function SiteHeader({
  logoUrl,
  contactEmail,
  contactPhone,
}: {
  logoUrl?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const displayEmail = contactEmail || "taramaasolutions2025@gmail.com";
  const displayPhone = contactPhone || "+91 75950 56476";
  const telHref = `tel:${displayPhone.replace(/[\s-]/g, "")}`;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/50 bg-surface/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          {/* Logo + contact info */}
          <div className="flex min-w-0 items-center gap-2.5">
            <Link href="/" className="shrink-0 group" aria-label="Tara Maa Solutions home">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt="Tara Maa Solutions"
                  width={36}
                  height={36}
                  className="h-9 w-9 shrink-0 rounded-xl object-contain ring-2 ring-accent/20 group-hover:ring-accent/40 transition-all duration-300"
                  priority
                />
              ) : (
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-white text-[11px] font-extrabold tracking-tight shadow-glow-sm ring-2 ring-accent/20 group-hover:shadow-glow group-hover:ring-accent/40 transition-all duration-300">
                  TMS
                </span>
              )}
            </Link>
            <div className="min-w-0">
              <Link href="/" className="group block">
                <span className="text-sm font-bold tracking-wide leading-tight">
                  <span className="text-text">Tara Maa </span>
                  <span className="text-accent">Solutions</span>
                </span>
              </Link>
              <div className="mt-0.5 flex flex-col gap-px">
                <a
                  href={`mailto:${displayEmail}`}
                  className="block max-w-[150px] truncate text-[10px] leading-tight text-muted hover:text-accent transition-colors xs:max-w-[200px] sm:max-w-none"
                >
                  {displayEmail}
                </a>
                <a
                  href={telHref}
                  className="block text-[10px] leading-tight text-muted hover:text-accent transition-colors"
                >
                  {displayPhone}
                </a>
              </div>
            </div>
          </div>

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
              <div className="mt-3 gt-mobile-ctx">
                <TranslateWidget />
              </div>
              <div className="mt-3 flex flex-col gap-1.5 rounded-xl border border-border/50 bg-panel/60 px-4 py-3">
                <a href={`mailto:${displayEmail}`} className="flex items-center gap-2 text-xs text-muted hover:text-accent transition-colors">
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                    <rect x="1" y="2.5" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M1 4l6 4.5L13 4" stroke="currentColor" strokeWidth="1.2"/>
                  </svg>
                  {displayEmail}
                </a>
                <a href={telHref} className="flex items-center gap-2 text-xs text-muted hover:text-accent transition-colors">
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                    <path d="M2 2h3l1.5 3.5-1.8 1.1c.9 1.8 2.2 3.1 4 4l1.1-1.8L13 10v3a1 1 0 01-1 1C5.4 13.3 1 8.3 1 3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                  </svg>
                  {displayPhone}
                </a>
              </div>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
