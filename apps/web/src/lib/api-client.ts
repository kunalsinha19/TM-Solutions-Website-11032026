import type {
  Product,
  QuoteRequest,
  SeoPage,
  SiteSettings
} from "@tara-maa/shared-types";

type NextRequestInit = RequestInit & {
  next?: {
    revalidate?: number;
  };
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

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

export const apiClient = {
  getSettings: () => request<SiteSettings>("/settings", { next: { revalidate: 60 } }),
  getProducts: () => request<Product[]>("/products", { next: { revalidate: 60 } }),
  getProduct: (slug: string) => request<Product>(`/products/${slug}`, { next: { revalidate: 60 } }),
  getSeoPage: (slug: string) => request<SeoPage>(`/seo-pages/${slug}`, { next: { revalidate: 60 } }),
  submitQuote: (payload: QuoteRequest) =>
    request<QuoteRequest>("/quotes", {
      method: "POST",
      body: JSON.stringify(payload)
    })
};
