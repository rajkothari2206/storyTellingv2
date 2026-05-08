"use client";

import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { authClient } from "@/lib/auth-client";

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
  const { data: session } = authClient.useSession();
  const isLoggedIn = !!session;

  const handleClick = () => {
    if (planInterval === "free") {
      router.push(isLoggedIn ? "/dashboard" : "/sign-up");
      return;
    }

    if (isLoggedIn) {
      // Logged in: go directly to checkout page which auto-initiates Razorpay
      router.push(`/checkout?plan=${planInterval}`);
    } else {
      // Not logged in: sign in, then come back to checkout
      router.push(`/sign-in?redirect=/checkout?plan=${planInterval}`);
    }
  };

  const label = isLoggedIn ? ctaLoggedIn : ctaGuest;

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
      {label}
    </button>
  );
}
