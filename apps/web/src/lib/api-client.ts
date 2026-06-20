import type {
  Product,
  ProductImage,
  QuoteRequest,
  SeoPage,
  SiteSettings
} from "@tara-maa/shared-types";

export type BackendCategory = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
};

// Subset of backend WebsiteSettings.homepage that drives dynamic homepage content
export type HomeConfig = {
  heroTitle?: string;
  heroSubtitle?: string;
  featuredProductIds?: string[];
};

type NextRequestInit = RequestInit & {
  next?: { revalidate?: number };
};

// Ensure the base URL always contains the /api segment regardless of how
// NEXT_PUBLIC_API_URL is set in the Railway environment.
function resolveApiBase(raw: string | undefined): string {
  const base = (raw ?? "http://localhost:4000/api").replace(/\/$/, "");
  return base.endsWith("/api") ? base : `${base}/api`;
}

const API_BASE = resolveApiBase(process.env.NEXT_PUBLIC_API_URL);

async function request<T>(path: string, init?: NextRequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

// The live backend (desirable / api.tmsolutionsindia.com) stores images as
// plain string URLs. The new apps/api schema uses { url, alt } objects.
// This normalizer handles both shapes and also extracts the populated
// `category` field (present in old backend) into tags so the UI can display it.
function normalizeImages(raw: unknown[]): ProductImage[] {
  return raw
    .map((entry) => {
      if (typeof entry === "string" && entry.trim()) {
        return { url: entry.trim(), alt: "" };
      }
      if (entry && typeof entry === "object") {
        const e = entry as Record<string, unknown>;
        if (typeof e.url === "string" && e.url.trim()) {
          return { url: e.url.trim(), alt: typeof e.alt === "string" ? e.alt : "" };
        }
      }
      return null;
    })
    .filter((img): img is ProductImage => img !== null);
}

function normalizeProduct(raw: unknown): Product {
  const p = raw as Record<string, unknown>;

  // Old backend populates category as { _id, name, slug, ... }
  const cat = p.category as Record<string, unknown> | null | undefined;
  const categoryName = cat && typeof cat.name === "string" ? cat.name : "";

  const images = normalizeImages(Array.isArray(p.images) ? p.images : []);

  // Merge category name into tags so product cards can display it
  const rawTags = Array.isArray(p.tags) ? (p.tags as string[]) : [];
  const tags = categoryName && !rawTags.some(t => t.toLowerCase() === categoryName.toLowerCase())
    ? [categoryName, ...rawTags]
    : rawTags;

  // Old backend uses seoTitle/seoDescription; new backend uses metaTitle/metaDescription
  const metaTitle = (p.metaTitle ?? p.seoTitle ?? p.name ?? "") as string;
  const metaDescription = (p.metaDescription ?? p.seoDescription ?? p.shortDescription ?? "") as string;

  return {
    ...p,
    images,
    tags,
    metaTitle,
    metaDescription,
    isFeatured: Boolean(p.isFeatured),
    status: (p.status as Product["status"]) ?? "draft",
    specifications: Array.isArray(p.specifications) ? (p.specifications as Product["specifications"]) : [],
    shortDescription: (p.shortDescription ?? "") as string,
    description: (p.description ?? "") as string,
  } as unknown as Product;
}

async function getProducts(): Promise<Product[]> {
  const raw = await request<unknown>("/products", { next: { revalidate: 60 } });
  let arr: unknown[];
  if (Array.isArray(raw)) {
    arr = raw;
  } else if (raw && typeof raw === "object") {
    const w = raw as Record<string, unknown>;
    arr = Array.isArray(w.products) ? w.products : Array.isArray(w.data) ? w.data : [];
  } else {
    arr = [];
  }
  return arr.map(normalizeProduct);
}

// The old backend only exposes GET /products/:id (by MongoDB ObjectId).
// We fall back to fetching the full list and finding by slug so both
// the old backend and the new apps/api backend are supported.
async function getProduct(slug: string): Promise<Product> {
  try {
    const raw = await request<unknown>(`/products/${slug}`, { next: { revalidate: 60 } });
    let product: unknown = raw;
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      const w = raw as Record<string, unknown>;
      if (w.product && typeof w.product === "object") product = w.product;
      else if (w.data && typeof w.data === "object") product = w.data;
    }
    return normalizeProduct(product);
  } catch {
    // Slug-based lookup failed — find in the full product list instead
    const all = await getProducts();
    const found = all.find((p) => p.slug === slug);
    if (!found) throw new Error(`Product not found: ${slug}`);
    return found;
  }
}

// Returns categories from the backend, handling both { success, categories: [] } and plain array formats.
// Active categories only; sorted by sortOrder.
async function getCategories(): Promise<BackendCategory[]> {
  try {
    const raw = await request<unknown>("/categories", { next: { revalidate: 300 } });
    let arr: unknown[];
    if (Array.isArray(raw)) {
      arr = raw;
    } else if (raw && typeof raw === "object") {
      const w = raw as Record<string, unknown>;
      arr = Array.isArray(w.categories) ? w.categories : Array.isArray(w.data) ? w.data : [];
    } else {
      arr = [];
    }
    return (arr as BackendCategory[])
      .filter((c) => c && typeof c === "object" && c.name && c.isActive !== false)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  } catch {
    return [];
  }
}

// Returns the homepage-relevant slice of site settings (hero text, featured IDs).
// Handles both { success, settings: {...} } and flat response shapes.
async function getHomeConfig(): Promise<HomeConfig> {
  try {
    const raw = await request<unknown>("/settings", { next: { revalidate: 120 } });
    if (!raw || typeof raw !== "object") return {};
    const w = raw as Record<string, unknown>;
    // Unwrap { success, settings } envelope
    const s = (w.settings && typeof w.settings === "object" ? w.settings : w) as Record<string, unknown>;
    const hp = s.homepage as Record<string, unknown> | undefined;
    // Also check new API's homepageConfig shape
    const hc = s.homepageConfig as Record<string, unknown> | undefined;
    return {
      heroTitle: (hp?.heroTitle ?? hc?.heroHeadline ?? "") as string | undefined,
      heroSubtitle: (hp?.heroSubtitle ?? hc?.heroSubheadline ?? "") as string | undefined,
      featuredProductIds: (
        Array.isArray(hp?.featuredProductIds) ? hp.featuredProductIds :
        Array.isArray(hc?.featuredProductIds) ? hc.featuredProductIds : []
      ) as string[],
    };
  } catch {
    return {};
  }
}

export const apiClient = {
  getSettings: () => request<SiteSettings>("/settings", { next: { revalidate: 60 } }),
  getProducts,
  getProduct,
  getCategories,
  getHomeConfig,
  getSeoPage: (slug: string) => request<SeoPage>(`/seo-pages/${slug}`, { next: { revalidate: 60 } }),
  submitQuote: (payload: QuoteRequest) =>
    request<QuoteRequest>("/quotes", {
      method: "POST",
      body: JSON.stringify(payload)
    })
};
