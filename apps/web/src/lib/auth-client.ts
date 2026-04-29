import { createAuthClient } from "better-auth/react";
import {
  convexClient,
  crossDomainClient,
} from "@convex-dev/better-auth/client/plugins";
import { emailOTPClient } from "better-auth/client/plugins";

// Force auth requests through our /api/auth/* proxy route (same-domain).
// The proxy sets Origin: https://www.lallifafa.com before forwarding to
// Convex, so Better Auth's trustedOrigins check passes server-side.
const baseURL =
  typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_CONVEX_SITE_URL!;

export const authClient = createAuthClient({
  baseURL,
  plugins: [convexClient(), crossDomainClient(), emailOTPClient()],
});

export type Session = typeof authClient.$Infer.Session;
