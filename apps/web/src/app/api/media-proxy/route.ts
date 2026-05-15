/**
 * Server-side proxy for Convex storage assets.
 * Adds CORS headers so the admin panel can safely draw them onto a Canvas
 * (required for canvas.captureStream() to work without taint).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url") ?? "";

  // Allow only Convex storage URLs — block anything else
  if (
    !url.startsWith("https://glorious-gnat-469.convex.cloud/") &&
    !url.startsWith("https://glorious-gnat-469.convex.site/")
  ) {
    return new Response("Forbidden", { status: 403 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(url);
  } catch {
    return new Response("Upstream fetch failed", { status: 502 });
  }

  if (!upstream.ok) {
    return new Response("Upstream error", { status: upstream.status });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "application/octet-stream",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
