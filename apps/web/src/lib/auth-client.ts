import { createAuthClient } from "better-auth/react";
import {
  convexClient,
  crossDomainClient,
} from "@convex-dev/better-auth/client/plugins";
import { emailOTPClient } from "better-auth/client/plugins";

const baseURL =
  typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_CONVEX_SITE_URL!;

// DEBUG — remove before production
if (typeof window !== "undefined") {
  console.log("[auth-client] baseURL =", baseURL);
}

export const authClient = createAuthClient({
  baseURL,
  plugins: [convexClient(), crossDomainClient(), emailOTPClient()],
});

export type Session = typeof authClient.$Infer.Session;
