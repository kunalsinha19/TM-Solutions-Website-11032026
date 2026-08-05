import { NextRequest, NextResponse } from "next/server";

/**
 * Catch-all proxy: /api/v1/* → Express backend /api/v1/*
 *
 * Set API_INTERNAL_URL in Railway → Next.js service → Variables to the URL
 * of the Express API service (e.g. https://tm-solutions-api-production-xxx.up.railway.app).
 * The /api/v1 prefix is appended automatically.
 */
function backendBase(): string {
  return (process.env.API_INTERNAL_URL ?? "http://localhost:4000").replace(/\/+$/, "");
}

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const subpath = path.join("/");
  const search = req.nextUrl.search;
  const upstreamUrl = `${backendBase()}/api/v1/${subpath}${search}`;

  const headers: HeadersInit = {};
  const ct = req.headers.get("content-type");
  if (ct) headers["Content-Type"] = ct;
  const auth = req.headers.get("authorization");
  if (auth) headers["Authorization"] = auth;

  try {
    const isBodyless = req.method === "GET" || req.method === "HEAD" || req.method === "DELETE";
    const body = isBodyless ? undefined : await req.text().catch(() => undefined);

    const upstream = await fetch(upstreamUrl, {
      method: req.method,
      headers,
      body: body || undefined,
    });

    const upstreamCt = upstream.headers.get("content-type") ?? "";

    // Stream PDF responses through as binary
    if (upstreamCt.includes("application/pdf")) {
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
    console.error(`[v1 proxy /${subpath}]`, err);
    return NextResponse.json({ message: "Backend unreachable" }, { status: 502 });
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
