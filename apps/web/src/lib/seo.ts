import type { Metadata } from "next";
import type { SeoMeta } from "@tara-maa/shared-types";

export function buildMetadata(meta: SeoMeta & { title?: string }): Metadata {
  return {
    title: meta.metaTitle || meta.title,
    description: meta.metaDescription,
    alternates: meta.canonicalUrl
      ? { canonical: meta.canonicalUrl }
      : undefined,
    openGraph: {
      title: meta.metaTitle || meta.title,
      description: meta.metaDescription,
      images: meta.ogImage ? [meta.ogImage] : undefined
    }
  };
}
