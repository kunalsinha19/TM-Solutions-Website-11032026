import Link from "next/link";
import type { Metadata } from "next";
import { apiClient } from "../../../lib/api-client";

export const metadata: Metadata = {
  title: "Blog — Industrial Insights & Product Guides",
  description: "Expert articles on industrial equipment, automation, packaging machinery, and B2B procurement tips from TM Solutions.",
};

export const revalidate = 60;

export default async function BlogListPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; tag?: string }>;
}) {
  const { page: pageStr, tag = "" } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1") || 1);

  const { posts, total, pages } = await apiClient.getBlogPosts({ page, tag }).catch(() => ({
    posts: [], total: 0, pages: 0,
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      {/* Header */}
      <div className="mb-10 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-accent">Resources</p>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight">Industrial Insights</h1>
        <p className="mt-3 text-muted max-w-xl mx-auto">
          Expert guides, product comparisons, and industry news to help you make better procurement decisions.
        </p>
      </div>

      {/* Post grid */}
      {posts.length === 0 ? (
        <div className="text-center py-20 text-muted">
          <p className="text-2xl mb-2">✍️</p>
          <p>No articles yet — check back soon.</p>
        </div>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post._id}
              href={`/blog/${post.slug}`}
              className="group flex flex-col rounded-2xl border border-border/70 bg-panel shadow-card hover:shadow-lg transition-shadow overflow-hidden"
            >
              {post.coverImage && (
                <div className="h-44 overflow-hidden bg-surface">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              <div className="flex flex-col flex-1 p-5">
                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {post.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <h2 className="font-bold text-lg leading-snug group-hover:text-accent transition-colors flex-1">
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p className="mt-2 text-sm text-muted line-clamp-2">{post.excerpt}</p>
                )}
                <div className="mt-4 flex items-center gap-3 text-xs text-muted">
                  {post.publishedAt && (
                    <time dateTime={post.publishedAt}>
                      {new Date(post.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </time>
                  )}
                  {post.readingTimeMin && (
                    <>
                      <span>·</span>
                      <span>{post.readingTimeMin} min read</span>
                    </>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="mt-10 flex justify-center gap-2">
          {page > 1 && (
            <Link
              href={`/blog?page=${page - 1}${tag ? `&tag=${tag}` : ""}`}
              className="rounded-xl border border-border/70 bg-panel px-5 py-2 text-sm font-medium hover:bg-accent/10 transition-colors"
            >
              ← Previous
            </Link>
          )}
          <span className="rounded-xl border border-border/70 bg-panel px-5 py-2 text-sm font-medium text-muted">
            Page {page} of {pages}
          </span>
          {page < pages && (
            <Link
              href={`/blog?page=${page + 1}${tag ? `&tag=${tag}` : ""}`}
              className="rounded-xl border border-border/70 bg-panel px-5 py-2 text-sm font-medium hover:bg-accent/10 transition-colors"
            >
              Next →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
