"use client";

import { useMemo, useCallback, useRef } from "react";
import { ConvexReactClient, ConvexProviderWithAuth } from "convex/react";
import { authClient } from "@/lib/auth-client";

/**
 * Custom auth hook for ConvexProviderWithAuth.
 *
 * Fetches the Convex JWT directly from /api/auth/convex/token (our Next.js
 * proxy → Convex backend). This bypasses ConvexBetterAuthProvider's internal
 * cross-domain redirect flow, which was bouncing users to lallifafa.com
 * because the Convex backend is configured with siteUrl=www.lallifafa.com.
 *
 * Key stability fixes:
 * 1. Use !!session.data (boolean) not session.data (object ref) as dependency —
 *    prevents fetchAccessToken from being recreated on every render just because
 *    the session object reference changed while auth state stayed the same.
 * 2. Use a ref to hold the last confirmed auth state so we never flash
 *    isAuthenticated=false during the brief isPending=true window that occurs
 *    on every page navigation — which was causing ConvexProviderWithAuth to
 *    clear the Convex token and drop the session.
 */
function useConvexAuth() {
  const session = authClient.useSession();

  // Stable boolean: true = logged in, false = logged out
  const isAuthenticated = !!session.data;

  // Persist the last known auth state across loading transitions.
  // When isPending is true we don't know yet — keep the last known value
  // so ConvexProviderWithAuth never sees a spurious false during navigation.
  const lastKnownAuth = useRef(false);
  if (!session.isPending) {
    lastKnownAuth.current = isAuthenticated;
  }
  const stableAuth = session.isPending ? lastKnownAuth.current : isAuthenticated;

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      if (!stableAuth) return null;
      try {
        const res = await fetch("/api/auth/convex/token", {
          // bypass cache on forced refresh so we get a fresh JWT
          cache: forceRefreshToken ? "no-store" : "default",
        });
        if (!res.ok) return null;
        const data = (await res.json()) as { token?: string };
        return data.token ?? null;
      } catch {
        return null;
      }
    },
    [stableAuth] // only recreates on actual login/logout, not object-ref churn
  );

  return useMemo(
    () => ({
      isLoading: session.isPending && !lastKnownAuth.current,
      isAuthenticated: stableAuth,
      fetchAccessToken,
    }),
    [session.isPending, stableAuth, fetchAccessToken]
  );
}

export function ConvexAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const convex = useMemo(
    () => new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!),
    []
  );

  return (
    <ConvexProviderWithAuth client={convex} useAuth={useConvexAuth}>
      {children}
    </ConvexProviderWithAuth>
  );
}
