import { NextRequest, NextResponse } from "next/server";

function resolveApiBase(raw: string | undefined): string {
  const base = (raw ?? "http://localhost:4000/api").replace(/\/$/, "");
  return base.endsWith("/api") ? base : `${base}/api`;
}

const BACKEND = resolveApiBase(process.env.NEXT_PUBLIC_API_URL);

// PUT /api/track/[sessionId]  →  PUT /api/analytics/track/:sessionId  (heartbeat)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const body = await req.json().catch(() => ({}));
    await fetch(`${BACKEND}/analytics/track/${sessionId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch { /* silent */ }
  return NextResponse.json({ success: true });
}

// POST /api/track/[sessionId]  →  PUT /api/analytics/track/:sessionId
// sendBeacon can only send POST — we remap it to PUT on the backend.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const body = await req.json().catch(() => ({}));
    await fetch(`${BACKEND}/analytics/track/${sessionId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch { /* silent */ }
  return NextResponse.json({ success: true });
}
