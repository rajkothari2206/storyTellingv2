"use client";

import { useEffect, useRef, useState } from "react"; // useEffect used for outside-click
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useConvexAuth } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { LayoutDashboard, User, LogOut, ChevronDown } from "lucide-react";

/* ── helpers ─────────────────────────────────────────── */

const AVATAR_GRADIENTS: Record<string, string> = {
  pink:   "linear-gradient(135deg,#FF6B9D,#C850C0)",
  red:    "linear-gradient(135deg,#FF6B6B,#EE5A24)",
  blue:   "linear-gradient(135deg,#74b9ff,#0984e3)",
  green:  "linear-gradient(135deg,#55efc4,#00b894)",
  purple: "linear-gradient(135deg,#a29bfe,#6c5ce7)",
  yellow: "linear-gradient(135deg,#ffd93d,#fdcb6e)",
  orange: "linear-gradient(135deg,#ffa07a,#FF6348)",
  teal:   "linear-gradient(135deg,#81ecec,#00cec9)",
  white:  "linear-gradient(135deg,#dfe6e9,#b2bec3)",
};

function avatarGrad(color?: string) {
  return AVATAR_GRADIENTS[(color ?? "").toLowerCase()] ?? "linear-gradient(135deg,var(--lf-teal),#00a38d)";
}

/* ── props ─────────────────────────────────────────────*/

export type PillVariant = "light" | "dark";

interface Props {
  variant?: PillVariant;
}

/* ── component ──────────────────────────────────────── */

export function UserPill({ variant = "light" }: Props) {
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const profile = useQuery(
    api.userProfiles.getProfile,
    isAuthenticated ? {} : "skip"
  ) as
    | { childName?: string; childNickName?: string; favoriteColor?: string }
    | null
    | undefined;

  const profilePhotoUrl = useQuery(
    api.userProfiles.getProfilePhotoUrl,
    isAuthenticated ? {} : "skip"
  ) as string | null | undefined;

  // Close on outside click
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  async function handleSignOut() {
    setOpen(false);
    await authClient.signOut();
    router.push("/");
    toast.success("Signed out");
  }

  // Don't render until profile data is ready (avoids flash)
  if (!isAuthenticated || profile === undefined) return null;

  const childName = profile?.childName ?? profile?.childNickName ?? "there";
  const initial   = childName[0].toUpperCase();
  const grad      = avatarGrad(profile?.favoriteColor);

  const isDark = variant === "dark";

  const pillBg     = isDark ? "rgba(255,255,255,0.1)"  : "rgba(255,255,255,0.85)";
  const pillBorder = isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)";
  const pillText   = isDark ? "rgba(255,255,255,0.85)" : "var(--lf-dark)";
  const chevColor  = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.3)";

  const dropBg     = isDark ? "#1a1630"  : "#fff";
  const dropBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)";
  const dropText   = isDark ? "rgba(255,255,255,0.8)"  : "var(--lf-dark)";
  const dropHover  = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";
  const dropDanger = isDark ? "rgba(239,68,68,0.85)"   : "#ef4444";

  return (
    <div ref={ref} className="relative flex-shrink-0">
      {/* Pill button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-full transition-all hover:scale-105"
        style={{
          background: pillBg,
          border: `1.5px solid ${pillBorder}`,
          backdropFilter: "blur(8px)",
        }}
      >
        {/* Avatar */}
        <div
          className="rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center"
          style={{
            width: 28,
            height: 28,
            background: profilePhotoUrl ? "transparent" : grad,
            fontSize: "0.75rem",
            fontFamily: "'Baloo 2', sans-serif",
            fontWeight: 800,
            color: "#fff",
          }}
        >
          {profilePhotoUrl ? (
            <img src={profilePhotoUrl} alt={childName} className="w-full h-full object-cover" />
          ) : (
            initial
          )}
        </div>

        {/* Greeting */}
        <span
          style={{
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 700,
            fontSize: "0.85rem",
            color: pillText,
            whiteSpace: "nowrap",
          }}
        >
          Hi, {childName}!
        </span>

        <ChevronDown
          size={13}
          style={{
            color: chevColor,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-44 rounded-2xl overflow-hidden shadow-2xl z-50"
          style={{ background: dropBg, border: `1.5px solid ${dropBorder}` }}
        >
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-3 text-sm font-semibold transition-colors"
            style={{ color: dropText, fontFamily: "'Nunito', sans-serif" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = dropHover)}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <LayoutDashboard size={15} /> Dashboard
          </Link>
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-3 text-sm font-semibold transition-colors"
            style={{ color: dropText, fontFamily: "'Nunito', sans-serif" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = dropHover)}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <User size={15} /> Profile
          </Link>
          <div style={{ height: 1, background: dropBorder, margin: "0 12px" }} />
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-semibold transition-colors"
            style={{ color: dropDanger, fontFamily: "'Nunito', sans-serif" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = dropHover)}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <LogOut size={15} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
