"use client";

import { useMemo, useCallback } from "react";
import { ConvexReactClient, ConvexProviderWithAuth } from "convex/react";
import { authClient } from "@/lib/auth-client";

/**
 * Custom auth hook for ConvexProviderWithAuth.
 *
 * Fetches the Convex JWT directly from /api/auth/convex/token (our Next.js
 * proxy → Convex backend). This bypasses ConvexBetterAuthProvider's internal
 * cross-domain redirect flow, which was bouncing users to lallifafa.com
 * because the Convex backend is configured with siteUrl=www.lallifafa.com.
 */
function useConvexAuth() {
  const session = authClient.useSession();

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      if (!session.data) return null;
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
    [session.data]
  );

  return useMemo(
    () => ({
      isLoading: session.isPending,
      isAuthenticated: !!session.data,
      fetchAccessToken,
    }),
    [session.isPending, session.data, fetchAccessToken]
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
