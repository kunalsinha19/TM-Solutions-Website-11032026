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
    // Forward real visitor IP from the browser via the frontend server
    const forwarded = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "";
    await fetch(`${BACKEND}/analytics/track`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(forwarded ? { "x-forwarded-for": forwarded } : {}),
      },
      body: JSON.stringify(body),
    });
  } catch {
    // Never surface tracking errors to the user
  }
  return NextResponse.json({ success: true });
}
