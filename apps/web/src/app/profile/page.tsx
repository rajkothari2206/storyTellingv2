"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  useQuery,
  useConvexAuth,
  Authenticated,
  AuthLoading,
  Unauthenticated,
} from "convex/react";
import { api } from "../../../convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import {
  BookOpen,
  LogOut,
  LayoutDashboard,
  Library,
  Loader2,
  Sparkles,
  Star,
  PawPrint,
  Palette,
  Calendar,
  Users,
  Lock,
} from "lucide-react";

/* ── helpers ─────────────────────────────────────────── */

function avatarGradient(color?: string) {
  const map: Record<string, string> = {
    pink:   "linear-gradient(135deg,#FF6B9D 0%,#C850C0 100%)",
    red:    "linear-gradient(135deg,#FF6B6B 0%,#EE5A24 100%)",
    blue:   "linear-gradient(135deg,#74b9ff 0%,#0984e3 100%)",
    green:  "linear-gradient(135deg,#55efc4 0%,#00b894 100%)",
    purple: "linear-gradient(135deg,#a29bfe 0%,#6c5ce7 100%)",
    yellow: "linear-gradient(135deg,#ffeaa7 0%,#fdcb6e 100%)",
    orange: "linear-gradient(135deg,#ffa07a 0%,#FF6348 100%)",
    teal:   "linear-gradient(135deg,#81ecec 0%,#00cec9 100%)",
    white:  "linear-gradient(135deg,#dfe6e9 0%,#b2bec3 100%)",
    black:  "linear-gradient(135deg,#636e72 0%,#2d3436 100%)",
  };
  return map[(color ?? "").toLowerCase()] ?? "linear-gradient(135deg,var(--lf-teal) 0%,#00a38d 100%)";
}

function bannerBg(color?: string) {
  const map: Record<string, string> = {
    pink:   "linear-gradient(135deg,#3d1a2e 0%,#1e0d1a 100%)",
    red:    "linear-gradient(135deg,#3d1a1a 0%,#1e0d0d 100%)",
    blue:   "linear-gradient(135deg,#1a2a3d 0%,#0d1520 100%)",
    green:  "linear-gradient(135deg,#1a3d30 0%,#0d1e18 100%)",
    purple: "linear-gradient(135deg,#2a1a3d 0%,#150d20 100%)",
    yellow: "linear-gradient(135deg,#3d340d 0%,#1e1a06 100%)",
    orange: "linear-gradient(135deg,#3d2010 0%,#1e1008 100%)",
    teal:   "linear-gradient(135deg,#0d2a2a 0%,#081515 100%)",
  };
  return map[(color ?? "").toLowerCase()] ?? "linear-gradient(135deg,#131020 0%,#1c1640 100%)";
}

const ACHIEVEMENT_META: Record<string, { icon: string; description: string }> = {
  "First Story":    { icon: "📖", description: "Created your very first personalised story" },
  "7 Days in a Row":{ icon: "🔥", description: "Read stories 7 days in a row — on fire!" },
  "10 Stories":     { icon: "🌟", description: "Generated 10 magical stories" },
  "Night Owl":      { icon: "🦉", description: "Read a story after 9 pm" },
  "Early Bird":     { icon: "🐦", description: "Read a story before 7 am" },
  "Story Master":   { icon: "👑", description: "Generated 25 stories" },
};

/* ── component ──────────────────────────────────────── */

export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();

  const profile       = useQuery(api.userProfiles.getProfile,    isAuthenticated ? {} : "skip");
  const credits       = useQuery(api.credit.list,                isAuthenticated ? {} : "skip");
  const stories       = useQuery(api.stories.list,               isAuthenticated ? {} : "skip");
  const achievementsData = useQuery(api.userProfiles.getAchievements, isAuthenticated ? {} : "skip");

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/");
    toast.success("Signed out successfully");
  }

  return (
    <>
      <AuthLoading>
        <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--lf-dark)" }}>
          <Loader2 size={32} className="animate-spin" style={{ color: "var(--lf-teal)" }} />
        </div>
      </AuthLoading>

      <Unauthenticated>
        <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--lf-cream)" }}>
          <Link href="/sign-in" className="btn-primary">Sign in</Link>
        </div>
      </Unauthenticated>

      <Authenticated>
        <div className="min-h-screen" style={{ background: "linear-gradient(160deg,#FFF8E7 0%,#E6FAF6 60%,#F3EEFF 100%)" }}>

          {/* ── Nav ── */}
          <header
            className="sticky top-0 z-40 flex items-center justify-between px-6 py-3"
            style={{ background: "rgba(14,12,26,0.97)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.07)", height: 62 }}
          >
            <Link href="/" className="flex items-center gap-2.5">
              <div className="relative" style={{ width: 44, height: 44 }}>
                <Image src="/lf-logo.png" alt="Lalli Fafa" fill className="object-contain" />
              </div>
              <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.1rem", color: "#fff" }}>
                Lalli <span style={{ color: "var(--lf-teal)" }}>Fafa</span>
              </span>
            </Link>
            <nav className="flex items-center gap-1">
              <Link href="/dashboard" className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold hover:bg-white/10 transition-all" style={{ color: "rgba(255,255,255,0.6)", fontFamily: "'Nunito', sans-serif" }}>
                <LayoutDashboard size={15} /> Dashboard
              </Link>
              <Link href="/library" className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold hover:bg-white/10 transition-all" style={{ color: "rgba(255,255,255,0.6)", fontFamily: "'Nunito', sans-serif" }}>
                <Library size={15} /> Library
              </Link>
              <button onClick={handleSignOut} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold hover:bg-white/10 transition-all" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'Nunito', sans-serif" }}>
                <LogOut size={15} /> Sign out
              </button>
            </nav>
          </header>

          {/* ── Loading ── */}
          {profile === undefined && (
            <div className="flex justify-center items-center py-40">
              <Loader2 size={36} className="animate-spin" style={{ color: "var(--lf-teal)" }} />
            </div>
          )}

          {/* ── No profile ── */}
          {profile === null && (
            <div className="flex flex-col items-center gap-4 py-32">
              <Image src="/lf-hero.png" alt="Lalli Fafa" width={100} height={100} className="opacity-60" />
              <p style={{ fontFamily: "'Nunito', sans-serif", color: "rgba(45,45,45,0.5)", fontSize: "1rem" }}>
                No profile yet — let's set one up!
              </p>
              <Link href="/onboarding" className="btn-primary">
                <Sparkles size={16} /> Set up profile
              </Link>
            </div>
          )}

          {/* ── Profile content ── */}
          {profile && (() => {
            const p = profile as {
              parentName?: string; childName?: string; childNickName?: string;
              childAge?: number; childGender?: string; favoriteColor?: string; favoriteAnimal?: string;
            };
            const initial = (p.childName ?? p.childNickName ?? "?")[0].toUpperCase();
            const earnedCount = (achievementsData?.achievements as Array<{ earned: boolean }> | undefined)?.filter(a => a.earned).length ?? 0;
            const availableCredits = (credits as Array<{ availableCredits?: number }> | undefined)?.[0]?.availableCredits ?? 0;
            const storyCount = (stories as unknown[])?.length ?? 0;

            return (
              <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">

                {/* ══ HERO BANNER ══ */}
                <div
                  className="relative overflow-hidden rounded-3xl"
                  style={{ background: bannerBg(p.favoriteColor), minHeight: 220 }}
                >
                  {/* Glow orbs */}
                  <div className="absolute top-0 right-0 w-72 h-72 rounded-full pointer-events-none"
                    style={{ background: "radial-gradient(circle,rgba(0,184,166,0.18) 0%,transparent 70%)", transform: "translate(30%,-30%)" }} />
                  <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full pointer-events-none"
                    style={{ background: "radial-gradient(circle,rgba(249,199,0,0.12) 0%,transparent 70%)", transform: "translate(-30%,30%)" }} />

                  {/* Lalli Fafa character — top right */}
                  <div className="absolute right-6 bottom-0 hidden sm:block" style={{ width: 130, height: 130 }}>
                    <Image src="/lf-hero.png" alt="Lalli Fafa" fill className="object-contain object-bottom" />
                  </div>

                  <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-end gap-6 p-8">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      {/* Outer glow ring */}
                      <div className="absolute inset-0 rounded-full"
                        style={{ background: avatarGradient(p.favoriteColor), filter: "blur(14px)", opacity: 0.55, transform: "scale(1.18)" }} />
                      <div
                        className="relative flex items-center justify-center rounded-full"
                        style={{
                          width: 100, height: 100,
                          background: avatarGradient(p.favoriteColor),
                          border: "4px solid rgba(255,255,255,0.25)",
                          boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
                          fontSize: "2.6rem",
                          fontFamily: "'Baloo 2', sans-serif",
                          fontWeight: 800,
                          color: "#fff",
                          textShadow: "0 2px 8px rgba(0,0,0,0.3)",
                        }}
                      >
                        {initial}
                      </div>
                      {/* Sparkle badge */}
                      <div
                        className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center"
                        style={{ background: "var(--lf-sunshine)", border: "2px solid rgba(255,255,255,0.8)", fontSize: "0.8rem" }}
                      >
                        ✨
                      </div>
                    </div>

                    {/* Name block */}
                    <div className="flex flex-col gap-1 text-center sm:text-left">
                      <p style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "clamp(1.8rem,4vw,2.4rem)", color: "#fff", lineHeight: 1.1 }}>
                        {p.childName ?? "—"}
                        {p.childNickName && p.childNickName !== p.childName && (
                          <span style={{ fontWeight: 600, fontSize: "0.55em", color: "rgba(255,255,255,0.5)", marginLeft: "0.4em" }}>
                            "{p.childNickName}"
                          </span>
                        )}
                      </p>
                      <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start">
                        {p.childAge && (
                          <span className="flex items-center gap-1" style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.85rem", color: "rgba(255,255,255,0.6)" }}>
                            <Calendar size={13} /> Age {p.childAge}
                          </span>
                        )}
                        {p.childGender && (
                          <span className="flex items-center gap-1 capitalize" style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.85rem", color: "rgba(255,255,255,0.6)" }}>
                            <Users size={13} /> {p.childGender}
                          </span>
                        )}
                        {p.favoriteColor && (
                          <span className="flex items-center gap-1 capitalize" style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.85rem", color: "rgba(255,255,255,0.6)" }}>
                            <Palette size={13} /> {p.favoriteColor}
                          </span>
                        )}
                        {p.favoriteAnimal && (
                          <span className="flex items-center gap-1 capitalize" style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.85rem", color: "rgba(255,255,255,0.6)" }}>
                            <PawPrint size={13} /> {p.favoriteAnimal}
                          </span>
                        )}
                      </div>
                      <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.8rem", color: "rgba(255,255,255,0.35)", marginTop: 2 }}>
                        Parent: {p.parentName ?? "—"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ══ STATS ══ */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    {
                      icon: <BookOpen size={22} />,
                      label: "Stories",
                      value: storyCount,
                      color: "var(--lf-teal)",
                      bg: "rgba(0,184,166,0.08)",
                      border: "rgba(0,184,166,0.2)",
                      sub: storyCount === 1 ? "story created" : "stories created",
                    },
                    {
                      icon: <Sparkles size={22} />,
                      label: "Credits",
                      value: availableCredits,
                      color: "#a855f7",
                      bg: "rgba(168,85,247,0.08)",
                      border: "rgba(168,85,247,0.2)",
                      sub: "available to use",
                    },
                    {
                      icon: <Star size={22} />,
                      label: "Badges",
                      value: earnedCount,
                      color: "#f9c700",
                      bg: "rgba(249,199,0,0.08)",
                      border: "rgba(249,199,0,0.2)",
                      sub: "achievements earned",
                    },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="flex flex-col gap-3 p-5 rounded-2xl"
                      style={{ background: s.bg, border: `1.5px solid ${s.border}` }}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: s.bg, color: s.color, border: `1.5px solid ${s.border}` }}
                      >
                        {s.icon}
                      </div>
                      <div>
                        <p style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "2rem", color: "var(--lf-dark)", lineHeight: 1 }}>
                          {s.value}
                        </p>
                        <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.75rem", color: "rgba(45,45,45,0.45)", marginTop: 2 }}>
                          {s.sub}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ══ ACHIEVEMENTS ══ */}
                {achievementsData?.achievements && (
                  <div
                    className="flex flex-col gap-5 p-6 rounded-2xl"
                    style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,0.06)" }}
                  >
                    <div className="flex items-center justify-between">
                      <h2 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.2rem", color: "var(--lf-dark)" }}>
                        Achievements
                      </h2>
                      <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.8rem", color: "rgba(45,45,45,0.4)", fontWeight: 600 }}>
                        {earnedCount} / {(achievementsData.achievements as unknown[]).length} unlocked
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.06)" }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(earnedCount / Math.max((achievementsData.achievements as unknown[]).length, 1)) * 100}%`,
                          background: "linear-gradient(90deg,var(--lf-teal),#00a38d)",
                        }}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(achievementsData.achievements as Array<{ name: string; earned: boolean; description?: string }>).map((a) => {
                        const meta = ACHIEVEMENT_META[a.name];
                        return (
                          <div
                            key={a.name}
                            className="flex items-center gap-4 p-4 rounded-xl transition-all"
                            style={{
                              background: a.earned ? "rgba(0,184,166,0.06)" : "rgba(0,0,0,0.025)",
                              border: `1.5px solid ${a.earned ? "rgba(0,184,166,0.2)" : "rgba(0,0,0,0.06)"}`,
                            }}
                          >
                            {/* Badge icon */}
                            <div
                              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
                              style={{
                                background: a.earned ? "rgba(0,184,166,0.12)" : "rgba(0,0,0,0.05)",
                                filter: a.earned ? "none" : "grayscale(1)",
                                opacity: a.earned ? 1 : 0.45,
                                fontSize: "1.5rem",
                              }}
                            >
                              {meta?.icon ?? "🏅"}
                            </div>
                            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                              <p
                                style={{
                                  fontFamily: "'Nunito', sans-serif",
                                  fontWeight: 800,
                                  fontSize: "0.9rem",
                                  color: a.earned ? "var(--lf-dark)" : "rgba(45,45,45,0.4)",
                                }}
                              >
                                {a.name}
                              </p>
                              <p
                                style={{
                                  fontFamily: "'Nunito', sans-serif",
                                  fontSize: "0.75rem",
                                  color: a.earned ? "rgba(45,45,45,0.5)" : "rgba(45,45,45,0.3)",
                                  lineHeight: 1.3,
                                }}
                              >
                                {meta?.description ?? a.description ?? "Keep reading to unlock!"}
                              </p>
                            </div>
                            {/* Status */}
                            {a.earned ? (
                              <div
                                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
                                style={{ background: "var(--lf-teal)", fontSize: "0.65rem", color: "#fff", fontWeight: 800 }}
                              >
                                ✓
                              </div>
                            ) : (
                              <Lock size={14} style={{ color: "rgba(45,45,45,0.25)", flexShrink: 0 }} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ══ ACTIONS ══ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-6">
                  <Link
                    href="/pricing"
                    className="btn-primary"
                    style={{ justifyContent: "center", padding: "0.9rem", fontSize: "1rem" }}
                  >
                    <Sparkles size={18} /> Get more credits
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-semibold transition-all hover:bg-black/5"
                    style={{
                      background: "#fff",
                      border: "1.5px solid rgba(0,0,0,0.1)",
                      color: "rgba(45,45,45,0.6)",
                      fontFamily: "'Nunito', sans-serif",
                      fontSize: "1rem",
                    }}
                  >
                    <LogOut size={18} /> Sign out
                  </button>
                </div>

              </main>
            );
          })()}
        </div>
      </Authenticated>
    </>
  );
}
