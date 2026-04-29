import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";

// baseURL = our own origin so all auth requests go through the Next.js proxy
// at /api/auth/*, which forwards to Convex server-side with a trusted Origin.
// convexClient() and crossDomainClient() are intentionally omitted:
//   - crossDomainClient() caused post-auth page redirects to lallifafa.com
//     (the Convex backend's configured siteUrl).
//   - convexClient() is not needed client-side; we fetch /api/auth/convex/token
//     directly inside ConvexAuthProvider using ConvexProviderWithAuth.
const baseURL =
  typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_CONVEX_SITE_URL!;

export const authClient = createAuthClient({
  baseURL,
  plugins: [emailOTPClient()],
});

export type Session = typeof authClient.$Infer.Session;
