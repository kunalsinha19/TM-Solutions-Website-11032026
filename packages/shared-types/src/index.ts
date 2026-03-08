export type PublishStatus = "draft" | "published" | "archived";
export type QuoteStatus = "new" | "contacted" | "qualified" | "closed";
export type AdminRole = "super_admin";

export interface SeoMeta {
  metaTitle: string;
  metaDescription: string;
  canonicalUrl?: string;
  ogImage?: string;
  schemaMarkup?: string;
}

export interface ProductImage {
  url: string;
  alt: string;
}

export interface ProductCategory {
  _id?: string;
  name: string;
  slug: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface ProductSpecification {
  label: string;
  value: string;
}

export interface Product extends SeoMeta {
  _id?: string;
  name: string;
  slug: string;
  sku: string;
  shortDescription: string;
  description: string;
  categoryId?: string;
  images: ProductImage[];
  specifications: ProductSpecification[];
  tags: string[];
  isFeatured: boolean;
  status: PublishStatus;
}

export type SeoSection =
  | { type: "hero"; heading: string; subheading: string; ctaLabel?: string; ctaHref?: string }
  | { type: "feature-grid"; title: string; items: Array<{ title: string; description: string }> }
  | { type: "stats"; title: string; items: Array<{ label: string; value: string }> }
  | { type: "cta-banner"; title: string; description: string; ctaLabel: string; ctaHref: string }
  | { type: "faq"; title: string; items: Array<{ question: string; answer: string }> }
  | { type: "rich-text"; title?: string; content: string };

export interface SeoPage extends SeoMeta {
  _id?: string;
  title: string;
  slug: string;
  sections: SeoSection[];
  status: PublishStatus;
}

export interface QuoteRequest {
  _id?: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message: string;
  productId?: string;
  sourcePage?: string;
  captchaToken?: string;
  status?: QuoteStatus;
}

export interface AdminSession {
  accessToken: string;
  refreshToken: string;
  admin: {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
    role: AdminRole;
  };
}

export interface SiteSettings {
  siteName: string;
  logo?: string;
  contactInfo: {
    email?: string;
    phone?: string;
    address?: string;
  };
  socialLinks: Array<{ label: string; href: string }>;
  themeDefaults: {
    mode: "light" | "dark" | "system";
    accent: string;
  };
  translateEnabled: boolean;
  analytics?: {
    googleAnalyticsId?: string;
  };
  homepageConfig: {
    heroHeadline: string;
    heroSubheadline: string;
    featuredProductIds: string[];
  };
}
