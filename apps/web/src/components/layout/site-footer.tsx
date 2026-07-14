import Link from "next/link";

const footerLinks = {
  Products: [
    { label: "All Products", href: "/products" },
    { label: "Industrial Machines", href: "/products" },
    { label: "Electrical Items", href: "/products" },
    { label: "Automation Products", href: "/products" },
    { label: "Custom Requirements", href: "/quote" },
  ],
  Company: [
    { label: "About Us", href: "/about" },
    { label: "Get a Quote", href: "/quote" },
    { label: "Contact Us", href: "/quote" },
  ],
};

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/60 bg-panel">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-[1.5fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white text-sm font-bold">
                TMS
              </span>
              <span className="text-base font-bold tracking-wide">
                Tara Maa <span className="text-accent">Solutions</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              Simple product browsing, clear communication, and quick support for your industrial procurement needs.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <a
                href="mailto:taramaasolutions2025@gmail.com"
                className="flex items-center gap-2 text-sm text-muted hover:text-accent transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="1" y="2.5" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M1 4l6 4.5L13 4" stroke="currentColor" strokeWidth="1.2"/>
                </svg>
                taramaasolutions2025@gmail.com
              </a>
              <a
                href="tel:+917595056476"
                className="flex items-center gap-2 text-sm text-muted hover:text-accent transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 2h3l1.5 3.5-1.8 1.1c.9 1.8 2.2 3.1 4 4l1.1-1.8L13 10v3a1 1 0 01-1 1C5.4 13.3 1 8.3 1 3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                </svg>
                +91 75950 56476
              </a>
              <div className="flex items-center gap-2 text-sm text-muted">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1C4.79 1 3 2.79 3 5c0 3.5 4 8 4 8s4-4.5 4-8c0-2.21-1.79-4-4-4z" stroke="currentColor" strokeWidth="1.2"/>
                  <circle cx="7" cy="5" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
                </svg>
                Kolkata · Delhi · Bengaluru · Patna
              </div>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-text">{section}</p>
              <ul className="mt-4 flex flex-col gap-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted hover:text-accent transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Additional contact numbers */}
        <div className="mt-10 rounded-xl border border-border/60 bg-surface/50 px-6 py-5">
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-text">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" className="text-accent shrink-0">
              <path d="M2 2h3l1.5 3.5-1.8 1.1c.9 1.8 2.2 3.1 4 4l1.1-1.8L13 10v3a1 1 0 01-1 1C5.4 13.3 1 8.3 1 3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
            </svg>
            Contact Numbers
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {[
              { label: "+91 75950 56476", href: "tel:+917595056476" },
              { label: "7595056477", href: "tel:+917595056477" },
              { label: "7595056478", href: "tel:+917595056478" },
              { label: "7595056479", href: "tel:+917595056479" },
              { label: "7595056480", href: "tel:+917595056480" },
            ].map(({ label, href }) => (
              <a
                key={href}
                href={href}
                className="flex items-center gap-1.5 text-sm text-muted hover:text-accent transition-colors"
              >
                <svg width="11" height="11" viewBox="0 0 14 14" fill="none" className="shrink-0 opacity-60">
                  <path d="M2 2h3l1.5 3.5-1.8 1.1c.9 1.8 2.2 3.1 4 4l1.1-1.8L13 10v3a1 1 0 01-1 1C5.4 13.3 1 8.3 1 3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                </svg>
                {label}
              </a>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-8 sm:flex-row">
          <p className="text-xs text-muted">
            © {year} Tara Maa Solutions. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-xs text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            Industrial product support · tmsolutionsindia.com
          </div>
        </div>
      </div>
    </footer>
  );
}
