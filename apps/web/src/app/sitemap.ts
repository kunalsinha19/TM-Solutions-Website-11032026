import type { MetadataRoute } from "next";

const BASE_URL = "https://tmsolutionsindia.com";

// Use API_INTERNAL_URL (server-side only) for server-rendered pages like sitemap.
// Falls back to BACKEND_URL (legacy env var) then NEXT_PUBLIC_API_URL then localhost.
function getApiBase(): string {
  const raw =
    process.env.API_INTERNAL_URL ??
    process.env.BACKEND_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:4000";
  const base = raw.replace(/\/+$/, "");
  // Append /api if not already there
  return base.endsWith("/api") ? base : `${base}/api`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const apiBase = getApiBase();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL,                      lastModified: new Date(), changeFrequency: "weekly",  priority: 1.0 },
    { url: `${BASE_URL}/products`,        lastModified: new Date(), changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE_URL}/quote`,           lastModified: new Date(), changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE_URL}/about`,           lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/blog`,            lastModified: new Date(), changeFrequency: "daily",   priority: 0.8 },
    // NOTE: /contact was removed — no such page exists; a 404 in the sitemap
    // hurts crawl budget and rankings. The /quote page serves as the contact page.
  ];

  // ── Products (184 products → all indexed) ──────────────────────────────
  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${apiBase}/products`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      const products: Array<{ slug?: string; name?: string; updatedAt?: string }> =
        data?.products ?? data?.data ?? (Array.isArray(data) ? data : []);

      productRoutes = products
        .filter((p) => p.slug || p.name)
        .map((p) => ({
          url: `${BASE_URL}/products/${p.slug ?? encodeURIComponent(p.name ?? "")}`,
          lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
          changeFrequency: "weekly" as const,
          priority: 0.85,
        }));
    }
  } catch {
    // sitemap still works without product routes
  }

  // ── Categories ─────────────────────────────────────────────────────────
  let categoryRoutes: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${apiBase}/categories`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      const cats: Array<{ slug?: string; name?: string; updatedAt?: string }> =
        data?.categories ?? data?.data ?? (Array.isArray(data) ? data : []);

      categoryRoutes = cats
        .filter((c) => c.slug || c.name)
        .map((c) => ({
          url: `${BASE_URL}/products?category=${c.slug ?? encodeURIComponent(c.name ?? "")}`,
          lastModified: c.updatedAt ? new Date(c.updatedAt) : new Date(),
          changeFrequency: "weekly" as const,
          priority: 0.8,
        }));
    }
  } catch {
    // sitemap still works without category routes
  }

  // ── Blog posts ─────────────────────────────────────────────────────────
  let blogRoutes: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${apiBase}/blog?limit=200`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      const posts: Array<{ slug: string; publishedAt?: string }> =
        data?.posts ?? (Array.isArray(data) ? data : []);

      blogRoutes = posts
        .filter((p) => p.slug)
        .map((p) => ({
          url: `${BASE_URL}/blog/${p.slug}`,
          lastModified: p.publishedAt ? new Date(p.publishedAt) : new Date(),
          changeFrequency: "monthly" as const,
          priority: 0.7,
        }));
    }
  } catch {
    // sitemap still works without blog posts
  }

  return [...staticRoutes, ...productRoutes, ...categoryRoutes, ...blogRoutes];
}
