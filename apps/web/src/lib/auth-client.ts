import { createAuthClient } from "better-auth/react";
import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { emailOTPClient } from "better-auth/client/plugins";

// Our Next.js proxy at /api/auth/* forwards all auth requests to Convex
// server-side, so the browser only ever talks to our own domain.
// crossDomainClient() is NOT needed — it would redirect through Convex back
// to the Convex-configured siteUrl (lallifafa.com), breaking the preview flow.
const baseURL =
  typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_CONVEX_SITE_URL!;

export const authClient = createAuthClient({
  baseURL,
  plugins: [convexClient(), emailOTPClient()],
});

export type Session = typeof authClient.$Infer.Session;
