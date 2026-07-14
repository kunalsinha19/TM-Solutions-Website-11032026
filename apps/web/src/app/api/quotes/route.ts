import { NextRequest, NextResponse } from "next/server";

function resolveApiBase(raw: string | undefined): string {
  const base = (raw ?? "http://localhost:4000/api").replace(/\/$/, "");
  return base.endsWith("/api") ? base : `${base}/api`;
}

const BACKEND = resolveApiBase(process.env.NEXT_PUBLIC_API_URL);

// POST /api/quotes  →  POST /api/quotes  on backend
// Proxy so the browser never makes a cross-origin request.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const upstream = await fetch(`${BACKEND}/quotes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch (err) {
    console.error("[quotes proxy]", err);
    return NextResponse.json(
      { success: false, error: "Failed to submit quote request" },
      { status: 500 }
    );
  }
}
