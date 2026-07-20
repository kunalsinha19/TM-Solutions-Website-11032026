import { NextRequest, NextResponse } from "next/server";

function resolveApiBase(raw: string | undefined): string {
  const base = (raw ?? "http://localhost:4000/api").replace(/\/$/, "");
  return base.endsWith("/api") ? base : `${base}/api`;
}

const BACKEND = resolveApiBase(process.env.NEXT_PUBLIC_API_URL);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ip   = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-real-ip") ??
      (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();

    const res = await fetch(`${BACKEND}/chat-sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-real-ip": ip ?? "" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8_000),
    });
    const data = await res.json().catch(() => ({ success: false }));
    return NextResponse.json(data, { status: res.ok ? 200 : 500 });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
