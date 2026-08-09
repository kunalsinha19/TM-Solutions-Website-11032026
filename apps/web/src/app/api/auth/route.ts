import { NextRequest, NextResponse } from "next/server";

// Server-side backend URL — never baked into client bundle
const BACKEND_BASE = (process.env.API_INTERNAL_URL ?? "http://localhost:4000").replace(/\/+$/, "");

// Proxy POST /api/auth?action=request-otp|verify-otp  →  backend /api/v1/auth/:action
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  if (action !== "request-otp" && action !== "verify-otp") {
    return NextResponse.json({ message: "Unknown auth action" }, { status: 400 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const upstream = await fetch(`${BACKEND_BASE}/api/v1/auth/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch (err) {
    console.error(`[auth/${action} proxy]`, err);
    return NextResponse.json(
      { message: "Backend unreachable. Please try again later." },
      { status: 502 }
    );
  }
}
