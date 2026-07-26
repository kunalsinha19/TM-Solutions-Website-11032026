import type { MetadataRoute } from "next";

const BASE_URL = "https://tmsolutionsindia.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/products`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
  ];

  let blogRoutes: MetadataRoute.Sitemap = [];
  try {
    const apiBase =
      process.env.BACKEND_URL?.replace(/\/$/, "") ??
      "http://localhost:4000/api";
    const res = await fetch(`${apiBase}/blog?limit=100`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      blogRoutes = ((data.posts ?? []) as Array<{ slug: string; publishedAt?: string }>).map(
        (post) => ({
          url: `${BASE_URL}/blog/${post.slug}`,
          lastModified: post.publishedAt ? new Date(post.publishedAt) : new Date(),
          changeFrequency: "monthly" as const,
          priority: 0.7,
        })
      );
    }
  } catch {
    // sitemap still works without blog posts
  }

  return [...staticRoutes, ...blogRoutes];
}
