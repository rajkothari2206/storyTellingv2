"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { useConvexAuth, useAction, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export function CheckoutClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const plan = searchParams.get("plan") as "monthly" | "yearly" | null;

  // useConvexAuth is already hydrated by ConvexProviderWithAuth — resolves
  // synchronously from the in-memory token, no network round-trip needed.
  const { isLoading: authLoading, isAuthenticated } = useConvexAuth();

  const plans = useQuery(api.subscription.getPlans);
  const initiateSubscription = useAction(api.subscription.initiateSubscription);

  const [error, setError] = useState<string | null>(null);
  const initiated = useRef(false);

  useEffect(() => {
    // Wait for auth to resolve
    if (authLoading) return;

    // Invalid plan → back to pricing
    if (!plan || (plan !== "monthly" && plan !== "yearly")) {
      router.replace("/pricing");
      return;
    }

    // Not authenticated → sign in with encoded return URL
    if (!isAuthenticated) {
      const encodedRedirect = encodeURIComponent(`/checkout?plan=${plan}`);
      router.replace(`/sign-in?redirect=${encodedRedirect}`);
      return;
    }

    // Wait for plans to load from Convex
    if (plans === undefined) return;

    // Prevent double-fire (React strict mode / re-renders)
    if (initiated.current) return;
    initiated.current = true;

    const matchedPlan = plans.find((p: any) => p.interval === plan);
    if (!matchedPlan) {
      setError("Plan not found. Please try again from the pricing page.");
      return;
    }

    initiateSubscription({ planId: matchedPlan.planId })
      .then(({ checkoutUrl }: { checkoutUrl: string }) => {
        window.location.href = checkoutUrl;
      })
      .catch((err: any) => {
        // Convex wraps ConvexErrors — extract the user-facing message
        const raw: string = err?.message ?? "Something went wrong. Please try again.";
        // Strip the "[CONVEX A(...)] ..." prefix that Convex prepends to errors
        const clean = raw.replace(/^\[CONVEX [^\]]+\]\s*/i, "").trim();
        setError(clean || "Something went wrong. Please try again.");
      });
  }, [authLoading, isAuthenticated, plans, plan]);

  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          background: "linear-gradient(160deg, #F3EEFF 0%, #EBF2FF 100%)",
          padding: 24,
        }}
      >
        <p style={{ fontSize: "1.1rem", color: "#c0392b", textAlign: "center", maxWidth: 400 }}>
          {error}
        </p>
        <button
          className="btn-primary"
          onClick={() => router.push("/pricing")}
          style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
        >
          <Sparkles size={16} />
          Back to Pricing
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        background: "linear-gradient(160deg, #F3EEFF 0%, #EBF2FF 100%)",
      }}
    >
      <Loader2
        size={48}
        className="animate-spin"
        style={{ color: "var(--lf-purple)" }}
      />
      <p
        style={{
          fontFamily: "'Baloo 2', sans-serif",
          fontSize: "1.2rem",
          fontWeight: 700,
          color: "var(--lf-dark)",
        }}
      >
        Setting up your Magic Pass…
      </p>
      <p style={{ color: "rgba(45,45,45,0.55)", fontSize: "0.9rem" }}>
        Redirecting you to secure checkout
      </p>
    </div>
  );
}
