const FALLBACK_API_URL = "http://localhost:5000/api";

function normalizeApiBase(value) {
  const base = (value || FALLBACK_API_URL).replace(/\/$/, "");
  return base.endsWith("/api") ? base : `${base}/api`;
}

const API_BASE = normalizeApiBase(process.env.NEXT_PUBLIC_API_URL);

async function fetchJson(path) {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      next: { revalidate: 60 }
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch {
    return null;
  }
}

export async function getHomepageData() {
  const [productsResponse, categoriesResponse, settingsResponse] = await Promise.all([
    fetchJson("/products"),
    fetchJson("/categories"),
    fetchJson("/settings")
  ]);

  const categories = Array.isArray(categoriesResponse?.categories)
    ? categoriesResponse.categories.filter((category) => category?.isActive !== false)
    : [];

  const products = Array.isArray(productsResponse?.products)
    ? productsResponse.products.filter((product) => product?.status === "published")
    : [];

  return {
    categories,
    products,
    settings: settingsResponse?.settings || null
  };
}
