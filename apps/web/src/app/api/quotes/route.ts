import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/quotes  →  POST https://api.tmsolutionsindia.com/api/v1/quotes
 *
 * Server-side proxy so the browser never makes a cross-origin request.
 * Uses API_INTERNAL_URL (server-side only, never baked into client bundle).
 */
function backendBase(): string {
  return (process.env.API_INTERNAL_URL ?? "http://localhost:4000").replace(/\/+$/, "");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const upstream = await fetch(`${backendBase()}/api/v1/quotes`, {
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
