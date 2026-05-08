"use client";

import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

interface PricingCTAButtonProps {
  planInterval: "monthly" | "yearly" | "free";
  /** Text shown always (we no longer differentiate logged-in/out here) */
  ctaGuest: string;
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

  const handleClick = () => {
    if (planInterval === "free") {
      router.push("/sign-up");
      return;
    }
    // Always go to /checkout — the checkout page resolves auth and redirects to
    // Razorpay (logged in) or to sign-in with redirect back here (logged out).
    router.push(`/checkout?plan=${planInterval}`);
  };

  return (
    <button
      onClick={handleClick}
      className={className}
      style={{
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        width: "100%",
        ...style,
      }}
    >
      {showIcon && planInterval !== "free" && <Sparkles size={15} />}
      {ctaGuest}
    </button>
  );
}
