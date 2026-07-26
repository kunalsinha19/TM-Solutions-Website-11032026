import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import Script from "next/script";
import { apiClient } from "../../../../lib/api-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { post } = await apiClient.getBlogPost(slug);
    return {
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt,
      openGraph: {
        title: post.seoTitle || post.title,
        description: post.seoDescription || post.excerpt,
        type: "article",
        ...(post.coverImage ? { images: [post.coverImage] } : {}),
      },
    };
  } catch {
    return { title: "Article" };
  }
}

export const revalidate = 300;

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await apiClient.getBlogPost(slug).catch(() => null);
  if (!result?.post) notFound();
  const { post } = result;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt || "",
    image: post.coverImage ? [post.coverImage] : [],
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    author: { "@type": "Organization", name: "TM Solutions" },
    publisher: {
      "@type": "Organization",
      name: "TM Solutions",
      logo: { "@type": "ImageObject", url: "https://tmsolutionsindia.com/logo.png" },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `https://tmsolutionsindia.com/blog/${post.slug}` },
  };

  return (
    <>
      <Script
        id="article-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-sm text-muted">
          <Link href="/" className="hover:text-accent transition-colors">Home</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-accent transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-text line-clamp-1">{post.title}</span>
        </nav>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag: string) => (
              <Link
                key={tag}
                href={`/blog?tag=${encodeURIComponent(tag)}`}
                className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent hover:bg-accent/20 transition-colors"
              >
                {tag}
              </Link>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{post.title}</h1>

        {/* Meta */}
        <div className="mt-3 flex items-center gap-3 text-sm text-muted">
          {post.publishedAt && (
            <time dateTime={post.publishedAt}>
              {new Date(post.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            </time>
          )}
          {post.readingTimeMin && (
            <>
              <span>·</span>
              <span>{post.readingTimeMin} min read</span>
            </>
          )}
        </div>

        {/* Cover image */}
        {post.coverImage && (
          <div className="mt-8 overflow-hidden rounded-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full object-cover max-h-80"
            />
          </div>
        )}

        {/* Excerpt */}
        {post.excerpt && (
          <p className="mt-6 text-lg leading-relaxed text-muted font-medium border-l-4 border-accent pl-4">
            {post.excerpt}
          </p>
        )}

        {/* Content */}
        <div
          className="mt-8 prose prose-invert max-w-none leading-relaxed"
          dangerouslySetInnerHTML={{ __html: post.content || "" }}
        />

        {/* Back link */}
        <div className="mt-12 pt-8 border-t border-border/60">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline"
          >
            ← Back to all articles
          </Link>
        </div>
      </div>
    </>
  );
}
