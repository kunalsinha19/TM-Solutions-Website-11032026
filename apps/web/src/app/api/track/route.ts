import { NextRequest, NextResponse } from "next/server";

// Server-side proxy — env var is available at runtime here, no build-time baking needed.
function resolveApiBase(raw: string | undefined): string {
  const base = (raw ?? "http://localhost:4000/api").replace(/\/$/, "");
  return base.endsWith("/api") ? base : `${base}/api`;
}

const BACKEND = resolveApiBase(process.env.NEXT_PUBLIC_API_URL);

// POST /api/track  →  POST /api/analytics/track  (new visit / page change)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    // CF-Connecting-IP is set by Cloudflare with the TRUE end-user IP and cannot
    // be spoofed by the client. Fall back to x-real-ip, then the first entry in
    // x-forwarded-for (leftmost = original client before any proxy appends).
    const realIp =
      req.headers.get("cf-connecting-ip") ??
      req.headers.get("x-real-ip") ??
      (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() ??
      "";
    await fetch(`${BACKEND}/analytics/track`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // x-visitor-ip is a dedicated header the backend reads first so that
        // Railway's internal LB cannot overwrite the real IP in x-forwarded-for.
        ...(realIp ? { "x-visitor-ip": realIp } : {}),
      },
      body: JSON.stringify(body),
    });
  } catch {
    // Never surface tracking errors to the user
  }
  return NextResponse.json({ success: true });
}
