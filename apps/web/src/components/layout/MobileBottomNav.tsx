"use client";

// Persistent mobile bottom nav for the logged-in app shell (dashboard,
// generate, library, growth, profile). Originally lived only on the
// dashboard page; pulled out so every app page gets the same quick-access
// bar instead of relying on the browser back button. Not used on the
// public marketing site (homepage/blog/pricing use SiteHeader/SiteFooter
// instead) or on the immersive story reader, which needs the full screen
// for audio controls.

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useConvexAuth } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Sparkles, Library, TrendingUp, User, Zap } from "lucide-react";

const ACTIVE_COLOR = "var(--lf-teal)";
const IDLE_COLOR = "rgba(45,45,45,0.5)";

export function MobileBottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useConvexAuth();

  const challengeEnabled = useQuery(
    api["testserver/_shared"].isChallengeRolloutEnabled,
    isAuthenticated ? {} : "skip"
  );
  const subscription = useQuery(api.subscription.getSubscription, isAuthenticated ? {} : "skip");
  const isSubscribed = subscription !== null && subscription !== undefined && (subscription as { status?: string })?.status === "active";

  if (!isAuthenticated) return null;

  const isActive = (path: string) => pathname === path || pathname?.startsWith(`${path}/`);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 md:hidden flex items-center justify-around px-4 py-3 z-50"
      style={{ background: "rgba(255,252,245,0.96)", backdropFilter: "blur(16px)", borderTop: "1.5px solid rgba(0,0,0,0.08)" }}
    >
      <button
        onClick={() => router.push("/generate")}
        className="flex flex-col items-center gap-0.5"
        style={{ background: "none", border: "none", cursor: "pointer" }}
      >
        <Sparkles size={22} style={{ color: isActive("/generate") ? ACTIVE_COLOR : IDLE_COLOR }} />
        <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.65rem", fontWeight: 700, color: isActive("/generate") ? ACTIVE_COLOR : IDLE_COLOR }}>Create</span>
      </button>
      <Link href="/library" className="flex flex-col items-center gap-0.5">
        <Library size={22} style={{ color: isActive("/library") ? ACTIVE_COLOR : IDLE_COLOR }} />
        <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.65rem", fontWeight: 700, color: isActive("/library") ? ACTIVE_COLOR : IDLE_COLOR }}>Library</span>
      </Link>
      {challengeEnabled && (
        <Link href="/growth" className="flex flex-col items-center gap-0.5">
          <TrendingUp size={22} style={{ color: isActive("/growth") ? ACTIVE_COLOR : IDLE_COLOR }} />
          <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.65rem", fontWeight: 700, color: isActive("/growth") ? ACTIVE_COLOR : IDLE_COLOR }}>Growth</span>
        </Link>
      )}
      <Link href="/profile" className="flex flex-col items-center gap-0.5">
        <User size={22} style={{ color: isActive("/profile") ? ACTIVE_COLOR : IDLE_COLOR }} />
        <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.65rem", fontWeight: 700, color: isActive("/profile") ? ACTIVE_COLOR : IDLE_COLOR }}>Profile</span>
      </Link>
      {!isSubscribed && (
        <Link href="/pricing" className="flex flex-col items-center gap-0.5">
          <Zap size={22} style={{ color: "var(--lf-electric)" }} />
          <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.65rem", fontWeight: 700, color: "var(--lf-electric)" }}>Upgrade</span>
        </Link>
      )}
    </nav>
  );
}
