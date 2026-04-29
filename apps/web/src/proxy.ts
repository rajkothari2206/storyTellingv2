import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Route protection is handled client-side by each page via useConvexAuth().
// A cookie-based check here is unreliable because the Better Auth session
// cookie is scoped to Path=/api/auth by the Convex backend, so the browser
// doesn't send it on requests to /dashboard, /onboarding, etc.
export function proxy(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/library/:path*",
    "/profile/:path*",
    "/onboarding/:path*",
    "/admin/:path*",
    "/generate/:path*",
  ],
};
