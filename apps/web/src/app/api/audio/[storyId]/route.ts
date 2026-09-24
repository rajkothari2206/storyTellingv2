import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

// Proxies a story's narration audio through this Vercel route instead of
// linking straight to the raw Convex storage URL, so Vercel's edge network
// can cache the response. Narration is set once at generation and never
// overwritten afterward (see stories.ts — narrationFilePath is only ever
// written at creation or removed alongside full story deletion), so it's
// safe to cache as immutable, keyed by storyId.
//
// No auth/ownership check is added here on purpose: the underlying Convex
// query (getNarrationFileUrl) and the raw storage URL it returns have none
// today either — per Convex's own docs, storage.getUrl() is a bearer URL,
// "anyone with the URL can access the file without further authentication."
// This route preserves that exact access level rather than changing it.
//
// Range support: this route used to always fetch the upstream URL with no
// Range header and return the whole file as a plain 200, regardless of what
// the browser asked for. Verified directly (curl with a Range header):
// Convex's raw storage URL correctly returns 206/Content-Range/Accept-Ranges
// -- ranges were never actually broken at the source. This proxy was the one
// throwing that away, which is the real, confirmed cause of the reader's
// "resume restarts from the beginning" bug: the audio element issues a Range
// request to seek/resume, gets back an unexpected full 200 body instead of
// the requested slice, and falls back to restarting the resource from byte 0.
// Forwarding the Range header upstream and mirroring Convex's 206 response
// fixes seeking/resume at the source instead of working around it client-side.
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ storyId: string }> }
) {
  const { storyId } = await context.params;

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    return NextResponse.json({ error: "Convex not configured" }, { status: 500 });
  }
  const convex = new ConvexHttpClient(convexUrl);

  const result = await convex
    .query(api.stories.getNarrationFileUrl, { storyId: storyId as Id<"stories"> })
    .catch(() => null);

  const sourceUrl = result?.url;
  if (!sourceUrl) {
    return NextResponse.json(
      { error: "Narration not found" },
      { status: 404, headers: { "Cache-Control": "no-store" } }
    );
  }

  const range = request.headers.get("range");
  const upstream = await fetch(sourceUrl, range ? { headers: { Range: range } } : undefined);
  const contentLength = upstream.headers.get("Content-Length");

  // Never cache an empty or failed narration file as if it were the real
  // thing. Real incident: Convex storage returned 200 with Content-Length:
  // 0 for a story whose narration synthesis had silently produced nothing
  // -- upstream.ok and upstream.body were both truthy (a 0-byte stream is
  // still a stream), so the old check here didn't catch it, and the empty
  // response got cached "immutable" for a year. Even after the real audio
  // was regenerated, the CDN kept serving the empty one from cache.
  if (!upstream.ok || !upstream.body || contentLength === "0") {
    return NextResponse.json(
      { error: "Narration not found or empty" },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }

  const headers = new Headers();
  headers.set("Content-Type", upstream.headers.get("Content-Type") ?? "audio/mpeg");
  if (contentLength) headers.set("Content-Length", contentLength);
  headers.set("Accept-Ranges", "bytes");
  headers.set("Cache-Control", "public, max-age=31536000, immutable");

  // Mirror Convex's 206 exactly (status + Content-Range) when this was a
  // range request it actually satisfied — a 200 response to a Range request
  // is what silently broke seeking before.
  if (upstream.status === 206) {
    const contentRange = upstream.headers.get("Content-Range");
    if (contentRange) headers.set("Content-Range", contentRange);
    return new NextResponse(upstream.body, { status: 206, headers });
  }

  return new NextResponse(upstream.body, { status: 200, headers });
}
