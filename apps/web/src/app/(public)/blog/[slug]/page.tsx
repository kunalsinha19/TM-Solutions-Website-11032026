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

        {/* Content — isolated white card so hardcoded blog colours work in every theme */}
        <div className="mt-8 rounded-2xl border border-border/30 overflow-hidden shadow-sm">
          <div
            className="max-w-none leading-relaxed p-6 sm:p-8"
            style={{ background: "#ffffff", color: "#1a0f08", fontFamily: "inherit", overflowWrap: "break-word" }}
            dangerouslySetInnerHTML={{ __html: post.content || "" }}
          />
        </div>

        {/* WhatsApp CTA */}
        <div className="mt-10 rounded-2xl p-6 sm:p-8 text-center" style={{ background: "linear-gradient(135deg,#d97706,#92400e)" }}>
          <p className="text-sm font-bold tracking-widest uppercase mb-1" style={{ color: "#fde68a" }}>Got a question?</p>
          <p className="text-xl font-extrabold mb-2" style={{ color: "#ffffff" }}>Talk to our experts — no sales pressure</p>
          <p className="text-sm mb-5" style={{ color: "#fef3c7" }}>Get a free quote, spec advice, or a machine demo in your city.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a
              href="https://wa.me/917595056476?text=Hi%2C+I+read+your+blog+and+want+to+know+more+about+your+machines."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 font-bold text-sm"
              style={{ background: "#25d366", color: "#ffffff" }}
            >
              💬 Chat on WhatsApp
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 font-bold text-sm"
              style={{ background: "#ffffff", color: "#92400e" }}
            >
              Get a Free Quote →
            </Link>
          </div>
        </div>

        {/* Back link */}
        <div className="mt-8 pt-6 border-t border-border/60">
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
