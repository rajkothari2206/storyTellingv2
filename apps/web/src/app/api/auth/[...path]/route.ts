/**
 * Auth proxy route
 *
 * Forwards /api/auth/* requests to the Convex HTTP endpoint server-side.
 * This avoids two problems:
 *   1. CORS — the browser never makes a cross-origin request
 *   2. Better Auth trustedOrigins — we set the Origin header to a value
 *      that IS in the Convex backend's trustedOrigins list (lallifafa.com)
 *      so the server-side security check passes
 */

import { type NextRequest, NextResponse } from "next/server";

const CONVEX_SITE_URL = process.env.NEXT_PUBLIC_CONVEX_SITE_URL!;

// The origin we present to the Convex auth server. Must be one of the
// values listed in trustedOrigins in convex/auth.ts on the backend.
const TRUSTED_ORIGIN = "https://www.lallifafa.com";

async function proxyAuth(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const destination = new URL(
    `${CONVEX_SITE_URL}/api/auth/${path.join("/")}`
  );
  destination.search = req.nextUrl.search;

  // Build forwarded headers — strip Origin/Host so we can override them
  const forwarded = new Headers();
  for (const [k, v] of req.headers.entries()) {
    const lower = k.toLowerCase();
    if (lower === "host" || lower === "origin") continue;
    forwarded.set(k, v);
  }
  // Present a trusted origin so Better Auth's trustedOrigins check passes
  forwarded.set("origin", TRUSTED_ORIGIN);
  forwarded.set("referer", `${TRUSTED_ORIGIN}/`);

  const body =
    req.method !== "GET" && req.method !== "HEAD"
      ? await req.arrayBuffer()
      : undefined;

  const upstream = await fetch(destination.toString(), {
    method: req.method,
    headers: forwarded,
    body,
  });

  // Forward response headers (skip hop-by-hop headers)
  const resHeaders = new Headers();
  const skip = new Set(["connection", "keep-alive", "transfer-encoding"]);
  for (const [k, v] of upstream.headers.entries()) {
    if (!skip.has(k.toLowerCase())) resHeaders.set(k, v);
  }

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: resHeaders,
  });
}

export const GET = proxyAuth;
export const POST = proxyAuth;
export const PUT = proxyAuth;
export const PATCH = proxyAuth;
export const DELETE = proxyAuth;

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
    },
  });
}
