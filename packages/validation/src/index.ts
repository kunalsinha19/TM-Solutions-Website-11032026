import { z } from "zod";

export const requestOtpSchema = z.object({
  target: z.string().min(3),
  purpose: z.literal("admin_login")
});

export const verifyOtpSchema = z.object({
  target: z.string().min(3),
  code: z.string().length(6)
});

export const productSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  sku: z.string().min(2),
  shortDescription: z.string().min(10),
  description: z.string().min(20),
  categoryId: z.string().optional(),
  images: z.array(z.object({ url: z.string().url(), alt: z.string().min(2) })).default([]),
  specifications: z.array(z.object({ label: z.string().min(1), value: z.string().min(1) })).default([]),
  tags: z.array(z.string()).default([]),
  isFeatured: z.boolean().default(false),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  metaTitle: z.string().min(2),
  metaDescription: z.string().min(10),
  canonicalUrl: z.string().url().optional(),
  ogImage: z.string().url().optional(),
  schemaMarkup: z.string().optional()
});

export const seoSectionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("hero"), heading: z.string(), subheading: z.string(), ctaLabel: z.string().optional(), ctaHref: z.string().optional() }),
  z.object({ type: z.literal("feature-grid"), title: z.string(), items: z.array(z.object({ title: z.string(), description: z.string() })) }),
  z.object({ type: z.literal("stats"), title: z.string(), items: z.array(z.object({ label: z.string(), value: z.string() })) }),
  z.object({ type: z.literal("cta-banner"), title: z.string(), description: z.string(), ctaLabel: z.string(), ctaHref: z.string() }),
  z.object({ type: z.literal("faq"), title: z.string(), items: z.array(z.object({ question: z.string(), answer: z.string() })) }),
  z.object({ type: z.literal("rich-text"), title: z.string().optional(), content: z.string() })
]);

export const seoPageSchema = z.object({
  title: z.string().min(2),
  slug: z.string().min(2),
  metaTitle: z.string().min(2),
  metaDescription: z.string().min(10),
  canonicalUrl: z.string().url().optional(),
  ogImage: z.string().url().optional(),
  schemaMarkup: z.string().optional(),
  sections: z.array(seoSectionSchema),
  status: z.enum(["draft", "published", "archived"]).default("draft")
});

export const quoteSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  company: z.string().optional(),
  message: z.string().min(10),
  productId: z.string().optional(),
  sourcePage: z.string().optional(),
  captchaToken: z.string().min(10)
});

export const settingsSchema = z.object({
  siteName: z.string().min(2),
  logo: z.string().optional(),
  contactInfo: z.object({ email: z.string().email().optional(), phone: z.string().optional(), address: z.string().optional() }),
  socialLinks: z.array(z.object({ label: z.string(), href: z.string().url() })),
  themeDefaults: z.object({ mode: z.enum(["light", "dark", "system"]), accent: z.string() }),
  translateEnabled: z.boolean(),
  analytics: z.object({ googleAnalyticsId: z.string().optional() }).optional(),
  homepageConfig: z.object({ heroHeadline: z.string(), heroSubheadline: z.string(), featuredProductIds: z.array(z.string()) })
});
