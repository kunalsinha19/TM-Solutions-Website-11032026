import { NextRequest, NextResponse } from "next/server";

function resolveApiBase(): string {
  const raw = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api").replace(/\/+$/, "");
  return raw.endsWith("/api") ? raw : `${raw}/api`;
}

// Proxy all /api/inv/* requests to the backend server-side.
// This avoids NEXT_PUBLIC_API_URL needing to be baked into the client bundle.
async function handler(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const subpath = path.join("/");
  const search = req.nextUrl.search;
  const backendUrl = `${resolveApiBase()}/inv/${subpath}${search}`;

  const headers: HeadersInit = { "Content-Type": "application/json" };
  const auth = req.headers.get("authorization");
  if (auth) headers["Authorization"] = auth;

  try {
    const isGet = req.method === "GET" || req.method === "DELETE";
    const body = isGet ? undefined : await req.text().catch(() => undefined);

    const upstream = await fetch(backendUrl, {
      method: req.method,
      headers,
      body: body || undefined,
    });

    // PDF download — stream the binary response through
    const contentType = upstream.headers.get("content-type") ?? "application/json";
    if (contentType.includes("application/pdf")) {
      const buffer = await upstream.arrayBuffer();
      return new NextResponse(buffer, {
        status: upstream.status,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": upstream.headers.get("content-disposition") ?? "attachment",
        },
      });
    }

    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch (err) {
    console.error(`[inv proxy /${subpath}]`, err);
    return NextResponse.json({ message: "Backend unreachable" }, { status: 502 });
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
