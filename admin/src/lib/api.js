const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

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
  requestLoginOtp: (email, password) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    }),
  verifyLoginOtp: (email, otp) =>
    request("/auth/verify-login-otp", {
      method: "POST",
      body: JSON.stringify({ email, otp })
    }),
  getProfile: (token) =>
    request("/auth/me", {
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
  getSettings: () => request("/settings"),
  saveSettings: (token, payload) =>
    request("/settings", {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    })
};
