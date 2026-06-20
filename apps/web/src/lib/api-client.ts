import type {
  Product,
  ProductImage,
  QuoteRequest,
  SeoPage,
  SiteSettings
} from "@tara-maa/shared-types";

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

export const apiClient = {
  getSettings: () => request<SiteSettings>("/settings", { next: { revalidate: 60 } }),
  getProducts,
  getProduct,
  getSeoPage: (slug: string) => request<SeoPage>(`/seo-pages/${slug}`, { next: { revalidate: 60 } }),
  submitQuote: (payload: QuoteRequest) =>
    request<QuoteRequest>("/quotes", {
      method: "POST",
      body: JSON.stringify(payload)
    })
};
