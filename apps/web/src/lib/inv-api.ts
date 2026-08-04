import { getAccessToken } from "./auth";

export async function invFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getAccessToken();
  const res = await fetch(`/api/inv${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function invPost<T>(path: string, body: unknown): Promise<T> {
  return invFetch<T>(path, { method: "POST", body: JSON.stringify(body) });
}

export async function invPut<T>(path: string, body: unknown): Promise<T> {
  return invFetch<T>(path, { method: "PUT", body: JSON.stringify(body) });
}

export async function invDelete<T>(path: string): Promise<T> {
  return invFetch<T>(path, { method: "DELETE" });
}

export function fmtCurrency(n: number): string {
  return "₹" + (Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function fmtNum(n: number): string {
  return (Number(n) || 0).toLocaleString("en-IN");
}
