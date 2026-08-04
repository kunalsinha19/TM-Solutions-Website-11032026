import { NextRequest, NextResponse } from "next/server";

function resolveApiBase(): string {
  const raw = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api").replace(/\/+$/, "");
  return raw.endsWith("/api") ? raw : `${raw}/api`;
}

// Proxy any POST to /api/auth?action=request-otp|verify-otp  →  backend /api/auth/:action
// The browser calls this same-origin route so NEXT_PUBLIC_API_URL never needs to be
// baked into the client bundle.
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  if (action !== "request-otp" && action !== "verify-otp") {
    return NextResponse.json({ message: "Unknown auth action" }, { status: 400 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const upstream = await fetch(`${resolveApiBase()}/auth/${action}`, {
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
