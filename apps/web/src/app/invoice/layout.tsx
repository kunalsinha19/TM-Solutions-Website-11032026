"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { getAccessToken } from "../../lib/auth";

const NAV = [
  { href: "/invoice",                   label: "Dashboard",       icon: "▦",  exact: true },
  { href: "/invoice/invoices",          label: "Invoices",         icon: "🧾" },
  { href: "/invoice/customers",         label: "Customers",        icon: "👥" },
  { href: "/invoice/suppliers",         label: "Suppliers",        icon: "🏭" },
  { href: "/invoice/products",          label: "Products",         icon: "📦" },
  { href: "/invoice/inventory",         label: "Inventory",        icon: "🏗"  },
  { href: "/invoice/purchase-orders",   label: "Purchase Orders",  icon: "📋" },
  { href: "/invoice/payments",          label: "Payments",         icon: "💳" },
  { href: "/invoice/reports",           label: "Reports",          icon: "📊" },
  { href: "/invoice/templates",         label: "Templates",        icon: "🎨" },
  { href: "/invoice/settings",          label: "Settings",         icon: "⚙️"  },
];

export default function InvoiceLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [ready, setReady] = useState(false);
  const [open,  setOpen]  = useState(false);

  /* Take over the full viewport — hide public site header/footer and strip
     the z-10 stacking context from <main> so our z-[200] wins globally.  */
  useEffect(() => {
    document.body.classList.add("invoice-mode");
    return () => document.body.classList.remove("invoice-mode");
  }, []);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace(`/admin/login?callbackUrl=${encodeURIComponent(pathname)}`);
    } else {
      setReady(true);
    }
  }, [router, pathname]);

  /* Close drawer on route change */
  useEffect(() => { setOpen(false); }, [pathname]);

  if (!ready) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-surface text-sm text-muted">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          Checking session…
        </div>
      </div>
    );
  }

  return (
    /*
     * fixed inset-0 z-[200] → fully covers the public site header (z-40)
     * and footer, making the invoice section feel like a standalone app.
     */
    <div className="fixed inset-0 z-[200] flex overflow-hidden bg-[var(--surface,#0f1117)]">

      {/* ── Mobile backdrop ── */}
      {open && (
        <div
          className="absolute inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={[
          "absolute inset-y-0 left-0 z-40 flex w-60 flex-col",
          "bg-[var(--panel,#161b22)] border-r border-white/[0.07]",
          "transition-transform duration-200 ease-in-out",
          "lg:relative lg:translate-x-0 lg:flex-shrink-0",
          open ? "translate-x-0 shadow-2xl" : "-translate-x-full",
        ].join(" ")}
      >
        {/* Brand */}
        <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-white/[0.07] px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white text-sm font-black shrink-0">
            TM
          </div>
          <div className="min-w-0">
            <div className="truncate text-xs font-bold leading-tight text-[var(--text,#e6edf3)]">
              Invoice & Inventory
            </div>
            <div className="text-[10px] leading-tight text-[var(--muted,#8b949e)]">
              Management System
            </div>
          </div>
          <button
            className="ml-auto shrink-0 text-[var(--muted,#8b949e)] hover:text-[var(--text,#e6edf3)] lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {NAV.map(({ href, label, icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={[
                  "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-all",
                  active
                    ? "bg-accent text-white shadow-sm"
                    : "text-[var(--text,#e6edf3)] hover:bg-white/[0.06] hover:text-accent",
                ].join(" ")}
              >
                <span className="w-5 shrink-0 text-center text-base leading-none">{icon}</span>
                <span className="truncate">{label}</span>
                {active && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white/60 shrink-0" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="shrink-0 border-t border-white/[0.07] p-3 space-y-1">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-[var(--muted,#8b949e)] transition-all hover:bg-white/[0.06] hover:text-accent"
          >
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Back to Admin
          </Link>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

        {/* Mobile topbar */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-white/[0.07] bg-[var(--panel,#161b22)] px-4 lg:hidden">
          <button
            onClick={() => setOpen(true)}
            className="rounded-lg p-1.5 text-[var(--muted,#8b949e)] hover:bg-white/[0.06] hover:text-[var(--text,#e6edf3)]"
            aria-label="Open menu"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>
          <span className="font-bold text-sm text-accent">TM Invoice</span>
        </header>

        {/* Page content — scrolls independently */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
