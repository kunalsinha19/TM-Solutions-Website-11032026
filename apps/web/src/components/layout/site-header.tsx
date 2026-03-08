import Link from "next/link";
import { ThemeToggle } from "../theme/theme-toggle";
import { TranslateWidget } from "../translate/translate-widget";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-surface/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-[0.2em] text-accent">
          TARA MAA SOLUTIONS
        </Link>
        <nav className="hidden gap-6 text-sm md:flex">
          <Link href="/about">About</Link>
          <Link href="/products">Products</Link>
          <Link href="/quote">Quote</Link>
        </nav>
        <div className="flex items-center gap-3">
          <TranslateWidget />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
