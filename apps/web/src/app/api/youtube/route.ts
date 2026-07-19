import { NextResponse } from "next/server";

function resolveApiBase(raw: string | undefined): string {
  const base = (raw ?? "http://localhost:4000/api").replace(/\/$/, "");
  return base.endsWith("/api") ? base : `${base}/api`;
}

const BACKEND = resolveApiBase(process.env.NEXT_PUBLIC_API_URL);

// GET /api/youtube  →  GET /api/youtube/shorts on backend
// Called by ShortsSlider for live stat polling. Never cached on this edge.
export async function GET() {
  try {
    const res = await fetch(`${BACKEND}/youtube/shorts`, {
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`Backend ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    console.error("[youtube proxy]", err);
    return NextResponse.json({ success: false }, { status: 502 });
  }
}
