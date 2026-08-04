"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { getAccessToken } from "../../lib/auth";

const NAV = [
  { href: "/invoice", label: "Dashboard",       icon: "▦", exact: true },
  { href: "/invoice/invoices",      label: "Invoices",         icon: "🧾" },
  { href: "/invoice/customers",     label: "Customers",        icon: "👥" },
  { href: "/invoice/suppliers",     label: "Suppliers",        icon: "🏭" },
  { href: "/invoice/products",      label: "Products",         icon: "📦" },
  { href: "/invoice/inventory",     label: "Inventory",        icon: "🏗" },
  { href: "/invoice/purchase-orders", label: "Purchase Orders", icon: "📋" },
  { href: "/invoice/payments",      label: "Payments",         icon: "💳" },
  { href: "/invoice/reports",       label: "Reports",          icon: "📊" },
  { href: "/invoice/templates",     label: "Templates",        icon: "🎨" },
  { href: "/invoice/settings",      label: "Settings",         icon: "⚙️" },
];

export default function InvoiceLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace(`/admin/login?callbackUrl=${encodeURIComponent(pathname)}`);
    } else {
      setReady(true);
    }
  }, [router, pathname]);

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-screen text-sm text-muted">
        Checking session…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-surface">
      {/* ── Sidebar ── */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-60 flex flex-col bg-panel border-r border-border/60 transition-transform duration-200 lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="h-14 flex items-center gap-2 px-5 border-b border-border/60 shrink-0">
          <span className="text-lg font-black text-accent">TM</span>
          <div>
            <div className="text-xs font-bold leading-tight">Invoice & Inventory</div>
            <div className="text-[10px] text-muted leading-tight">Management System</div>
          </div>
          <button className="ml-auto lg:hidden text-muted hover:text-text" onClick={() => setOpen(false)}>✕</button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  active ? "bg-accent text-white" : "text-text hover:bg-border/40 hover:text-accent"
                }`}>
                <span className="text-base w-5 text-center shrink-0">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border/60 p-3">
          <Link href="/admin/dashboard"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-muted hover:text-accent hover:bg-border/30 transition-all">
            ← Back to Admin
          </Link>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col lg:pl-60">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 h-14 flex items-center gap-3 bg-panel border-b border-border/60 px-4 lg:hidden">
          <button onClick={() => setOpen(true)} className="text-muted hover:text-text">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>
          <span className="font-bold text-sm text-accent">TM Invoice</span>
        </header>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />
      )}
    </div>
  );
}
