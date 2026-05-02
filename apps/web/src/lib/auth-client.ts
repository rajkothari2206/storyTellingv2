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
  // Disable Better Auth's built-in redirectPlugin.
  //
  // The crossDomain server plugin (active in the Convex backend) intercepts
  // every /sign-in/* request and rewrites a missing callbackURL to the
  // configured siteUrl (https://www.lallifafa.com). That makes the server
  // return { redirect: true, url: "https://www.lallifafa.com/" }, which the
  // redirectPlugin would then execute as window.location.href = siteUrl —
  // bouncing every sign-in on a Vercel preview URL to the v1 production site.
  //
  // With the redirectPlugin disabled we handle post-auth navigation entirely
  // ourselves via router.push() / onSuccess callbacks.
  //
  // Note: `disableDefaultFetchPlugins` is a valid runtime option in Better
  // Auth's source (see getClientConfig in better-auth.RKafzlkP.mjs) but is
  // not reflected in the published TypeScript types, hence the cast.
  ...({ disableDefaultFetchPlugins: true } as object),
});

export type Session = typeof authClient.$Infer.Session;
