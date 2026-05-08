"use client";

import Link from "next/link";
import { Sparkles, Play } from "lucide-react";
import { authClient } from "@/lib/auth-client";

/** Hero CTA — "Create a story free" / "Go to Storyboard" */
export function HeroCTA() {
  const { data: session } = authClient.useSession();
  const isLoggedIn = !!session;
  return (
    <Link
      href={isLoggedIn ? "/dashboard" : "/sign-up"}
      className="btn-primary"
      style={{ fontSize: "1rem" }}
    >
      <Sparkles size={18} />
      {isLoggedIn ? "Go to Storyboard" : "Create a story free"}
    </Link>
  );
}

/** Per-theme card CTA — "Create this story" / "Start this story" */
export function ThemeCTA() {
  const { data: session } = authClient.useSession();
  const isLoggedIn = !!session;
  return (
    <Link
      href={isLoggedIn ? "/dashboard" : "/sign-up"}
      className="btn-primary w-full justify-center"
      style={{ fontSize: "0.9rem" }}
    >
      <Play size={14} />
      {isLoggedIn ? "Start this story" : "Create this story"}
    </Link>
  );
}

/** Bottom CTA — "Start free today" / "Open Storyboard" */
export function BottomCTA() {
  const { data: session } = authClient.useSession();
  const isLoggedIn = !!session;
  return (
    <Link
      href={isLoggedIn ? "/dashboard" : "/sign-up"}
      className="btn-primary"
      style={{ fontSize: "1rem", padding: "0.85rem 2.2rem" }}
    >
      <Sparkles size={18} />
      {isLoggedIn ? "Open Storyboard" : "Start free today"}
    </Link>
  );
}
