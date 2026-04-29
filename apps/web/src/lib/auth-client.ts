import { createAuthClient } from "better-auth/react";
import {
  convexClient,
  crossDomainClient,
} from "@convex-dev/better-auth/client/plugins";
import { emailOTPClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  // No explicit baseURL — defaults to the current origin.
  // next.config.ts rewrites /api/auth/* → Convex site server-side,
  // so auth requests stay same-domain and never hit the CORS wall.
  plugins: [convexClient(), crossDomainClient(), emailOTPClient()],
});

export type Session = typeof authClient.$Infer.Session;
