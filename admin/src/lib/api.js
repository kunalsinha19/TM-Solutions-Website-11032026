const rawApiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const normalizedBase = rawApiBase.replace(/\/$/, "");
const safeLocalBase = normalizedBase.replace(/^https:\/\/(localhost|127\.0\.0\.1)(?::\d+)?/i, (match) => match.replace("https://", "http://"));
const API_BASE = safeLocalBase.endsWith("/api") ? safeLocalBase : `${safeLocalBase}/api`;

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

export const api = {
  login: (email, password) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    }),
  getProfile: (token) =>
    request("/auth/me", {
      headers: { Authorization: `Bearer ${token}` }
    }),
  getAdmins: (token) =>
    request("/admins", {
      headers: { Authorization: `Bearer ${token}` }
    }),
  createAdmin: (token, payload) =>
    request("/admins", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    }),
  updateAdmin: (token, id, payload) =>
    request(`/admins/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    }),
  deleteAdmin: (token, id) =>
    request(`/admins/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    }),
  getProducts: () => request("/products"),
  createProduct: (token, payload) =>
    request("/products", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    }),
  updateProduct: (token, id, payload) =>
    request(`/products/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    }),
  deleteProduct: (token, id) =>
    request(`/products/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    }),
  getCategories: () => request("/categories"),
  createCategory: (token, payload) =>
    request("/categories", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    }),
  updateCategory: (token, id, payload) =>
    request(`/categories/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    }),
  deleteCategory: (token, id) =>
    request(`/categories/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    }),
  getSeoPages: () => request("/seo-pages"),
  createSeoPage: (token, payload) =>
    request("/seo-pages", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    }),
  updateSeoPage: (token, id, payload) =>
    request(`/seo-pages/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    }),
  deleteSeoPage: (token, id) =>
    request(`/seo-pages/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    }),
  getQuotes: (token) =>
    request("/quotes", {
      headers: { Authorization: `Bearer ${token}` }
    }),
  updateQuote: (token, id, payload) =>
    request(`/quotes/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    }),
  replyToQuote: (token, id, payload) =>
    request(`/quotes/${id}/reply`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    }),
  getSettings: () => request("/settings"),
  saveSettings: (token, payload) =>
    request("/settings", {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    }),
  updateLogo: (token, logoUrl) =>
    request("/settings/logo", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ logoUrl })
    }),
  uploadMedia: async (token, file) => {
    const data = new FormData();
    data.append("file", file);

    const response = await fetch(`${API_BASE}/media/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: data
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.message || "Upload failed");
    }

    return payload;
  }
};
