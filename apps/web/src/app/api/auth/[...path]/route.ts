/**
 * Auth proxy route
 *
 * Forwards /api/auth/* to the Convex HTTP endpoint server-side, solving two issues:
 *
 * 1. CORS — browser never makes a cross-origin request; Next.js does it server-side.
 * 2. Better Auth trustedOrigins — we send Origin: lallifafa.com (always trusted).
 * 3. CSRF cookies — Convex sets cookies with Domain=convex.site; we strip the Domain
 *    attribute so the browser stores them against our Vercel domain instead.
 */

import { type NextRequest, NextResponse } from "next/server";

const CONVEX_SITE_URL = process.env.NEXT_PUBLIC_CONVEX_SITE_URL!;

// The production origin shared by:
//   - TRUSTED_ORIGIN sent in Origin/Referer headers so Better Auth's
//     trustedOrigins check passes (Convex backend only trusts this domain).
//   - SITE_URL used to identify redirect Location headers that the crossDomain
//     server plugin rewrites callbackURLs to; we rewrite those to our own
//     origin so users on Vercel preview URLs don't land on the v1 prod site.
const LALLIFAFA_ORIGIN = "https://www.lallifafa.com";

// Headers that shouldn't be forwarded upstream
const DROP_REQUEST_HEADERS = new Set([
  "host",
  "origin",
  "referer",
]);

// Hop-by-hop headers that shouldn't be forwarded downstream
const DROP_RESPONSE_HEADERS = new Set([
  "connection",
  "keep-alive",
  "transfer-encoding",
  "content-encoding", // fetch decompresses automatically
]);

async function proxyAuth(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;

  const destination = new URL(
    `${CONVEX_SITE_URL}/api/auth/${path.join("/")}`
  );
  destination.search = req.nextUrl.search;

  // Build forwarded headers
  const forwarded = new Headers();
  for (const [k, v] of req.headers.entries()) {
    if (DROP_REQUEST_HEADERS.has(k.toLowerCase())) continue;
    forwarded.set(k, v);
  }
  // Override origin/referer so Better Auth's trustedOrigins check passes
  forwarded.set("origin", LALLIFAFA_ORIGIN);
  forwarded.set("referer", `${LALLIFAFA_ORIGIN}/`);
  forwarded.set("x-forwarded-host", new URL(LALLIFAFA_ORIGIN).host);

  const body =
    req.method !== "GET" && req.method !== "HEAD"
      ? await req.arrayBuffer()
      : undefined;

  const upstream = await fetch(destination.toString(), {
    method: req.method,
    headers: forwarded,
    body,
    // Don't follow redirects — pass them through to the browser
    redirect: "manual",
  });

  const resHeaders = new Headers();

  // Forward non-hop-by-hop headers
  for (const [k, v] of upstream.headers.entries()) {
    if (DROP_RESPONSE_HEADERS.has(k.toLowerCase())) continue;
    if (k.toLowerCase() === "set-cookie") continue; // handled separately below
    resHeaders.set(k, v);
  }

  // Rewrite Set-Cookie headers:
  // Strip Domain= so the browser stores them for *our* Vercel domain,
  // and ensure SameSite=Lax so they're sent on same-site navigations.
  const setCookies: string[] =
    // getSetCookie() is available in Node 18+ / WinterCG
    typeof (upstream.headers as any).getSetCookie === "function"
      ? (upstream.headers as any).getSetCookie()
      : upstream.headers.get("set-cookie")
          ?.split(/,(?=\s*\w+=)/)
          .map((c: string) => c.trim()) ?? [];

  for (const raw of setCookies) {
    const rewritten = raw
      .replace(/;\s*Domain=[^;,]*/gi, "")       // strip Domain attribute
      .replace(/;\s*SameSite=None/gi, "; SameSite=Lax"); // relax SameSite
    resHeaders.append("set-cookie", rewritten);
  }

  // For redirect responses, rewrite the Location header so the browser stays
  // on the current origin (Vercel preview URL or production).
  //
  // Two cases to handle:
  // 1. Location points to the raw Convex site URL (e.g. https://x.convex.site/…)
  //    – simple: replace the Convex site prefix with our origin.
  // 2. Location points to SITE_URL (https://www.lallifafa.com/…)
  //    – the crossDomain server plugin rewrites callbackURLs to this origin,
  //      so OAuth callbacks (e.g. /callback/google) redirect there. We must
  //      rewrite these to our origin too, otherwise preview-URL users land on
  //      the v1 production site.
  const location = upstream.headers.get("location");
  if (location) {
    let newLocation = location;
    if (location.startsWith(CONVEX_SITE_URL)) {
      newLocation = location.replace(CONVEX_SITE_URL, req.nextUrl.origin);
    } else if (location.startsWith(LALLIFAFA_ORIGIN)) {
      newLocation = location.replace(LALLIFAFA_ORIGIN, req.nextUrl.origin);
    }
    if (newLocation !== location) {
      resHeaders.set("location", newLocation);
    }
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
