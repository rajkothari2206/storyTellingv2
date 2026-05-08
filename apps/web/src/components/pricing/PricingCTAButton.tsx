"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface PricingCTAButtonProps {
  planInterval: "monthly" | "yearly" | "free";
  /** Text shown when logged out */
  ctaGuest: string;
  /** Text shown when logged in */
  ctaLoggedIn: string;
  className?: string;
  style?: React.CSSProperties;
  showIcon?: boolean;
}

export function PricingCTAButton({
  planInterval,
  ctaGuest,
  ctaLoggedIn,
  className,
  style,
  showIcon = true,
}: PricingCTAButtonProps) {
  const router = useRouter();
  const { data: session, isPending: authLoading } = authClient.useSession();
  const isLoggedIn = !!session;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load plans so we can look up the Razorpay planId by interval
  const plans = useQuery(api.subscription.getPlans);
  const initiateSubscription = useAction(api.subscription.initiateSubscription);

  const handleClick = async () => {
    // Free plan — just route appropriately
    if (planInterval === "free") {
      router.push(isLoggedIn ? "/dashboard" : "/sign-up");
      return;
    }

    // Not logged in — send to sign-in with redirect back to pricing
    if (!isLoggedIn) {
      router.push("/sign-in?redirect=/pricing");
      return;
    }

    // Logged in — initiate Razorpay checkout
    setLoading(true);
    setError(null);

    try {
      const plan = plans?.find((p: any) => p.interval === planInterval);
      if (!plan) throw new Error("Plan not available. Please try again.");

      const { checkoutUrl } = await initiateSubscription({ planId: plan.planId });

      // Redirect to Razorpay hosted checkout
      window.location.href = checkoutUrl;
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const label = isLoggedIn ? ctaLoggedIn : ctaGuest;
  const isDisabled = loading || authLoading;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <button
        onClick={handleClick}
        disabled={isDisabled}
        className={className}
        style={{
          cursor: isDisabled ? "not-allowed" : "pointer",
          opacity: isDisabled ? 0.75 : 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          width: "100%",
          ...style,
        }}
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          showIcon && planInterval !== "free" && <Sparkles size={15} />
        )}
        {loading ? "Redirecting to checkout…" : label}
      </button>

      {error && (
        <p style={{ fontSize: "0.78rem", color: "#e53e3e", textAlign: "center", margin: 0 }}>
          {error}
        </p>
      )}
    </div>
  );
}
