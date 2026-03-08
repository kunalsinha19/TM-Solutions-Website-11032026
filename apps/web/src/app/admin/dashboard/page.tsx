import Link from "next/link";

const cards = [
  { title: "Products", href: "/admin/products", description: "Manage product catalog and featured items." },
  { title: "SEO Pages", href: "/admin/seo-pages", description: "Build and publish section-driven landing pages." },
  { title: "Quotes", href: "/admin/quotes", description: "Review incoming quote requests and follow-ups." },
  { title: "Settings", href: "/admin/settings", description: "Control branding, translation, and homepage content." }
];

export default function AdminDashboardPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="text-4xl font-semibold">Admin Dashboard</h1>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {cards.map((card) => (
          <Link key={card.href} href={card.href} className="rounded-[2rem] border border-border bg-panel p-6">
            <h2 className="text-xl font-semibold">{card.title}</h2>
            <p className="mt-3 text-sm text-muted">{card.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
