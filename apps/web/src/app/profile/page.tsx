"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  useQuery,
  useMutation,
  useConvexAuth,
  Authenticated,
  AuthLoading,
  Unauthenticated,
} from "convex/react";
import { api } from "../../../convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import {
  User,
  BookOpen,
  Star,
  LogOut,
  LayoutDashboard,
  Library,
  Loader2,
  Save,
  Sparkles,
} from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();

  const profile = useQuery(api.userProfiles.getProfile, isAuthenticated ? {} : "skip");
  const credits = useQuery(api.credit.list, isAuthenticated ? {} : "skip");
  const stories = useQuery(api.stories.list, isAuthenticated ? {} : "skip");
  const achievementsData = useQuery(api.userProfiles.getAchievements, isAuthenticated ? {} : "skip");

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/");
    toast.success("Signed out");
  }

  return (
    <>
      <AuthLoading>
        <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--lf-cream)" }}>
          <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "var(--lf-teal)", borderTopColor: "transparent" }} />
        </div>
      </AuthLoading>
      <Unauthenticated>
        <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--lf-cream)" }}>
          <Link href="/sign-in" className="btn-primary">Sign in</Link>
        </div>
      </Unauthenticated>
      <Authenticated>
        <div className="min-h-screen" style={{ background: "linear-gradient(160deg,#FFF8E7 0%,#E6FAF6 60%,#F3EEFF 100%)" }}>
          {/* Nav */}
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

          <main className="max-w-3xl mx-auto px-6 py-10 flex flex-col gap-8">
            <h1 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "clamp(1.8rem,4vw,2.4rem)", color: "var(--lf-dark)" }}>
              Your Profile
            </h1>

            {profile === undefined ? (
              <div className="flex justify-center py-20">
                <Loader2 size={32} className="animate-spin" style={{ color: "var(--lf-teal)" }} />
              </div>
            ) : profile === null ? (
              <div className="flex flex-col items-center gap-4 py-16">
                <p style={{ fontFamily: "'Nunito', sans-serif", color: "rgba(45,45,45,0.5)" }}>
                  No profile found. Please complete onboarding.
                </p>
                <Link href="/onboarding" className="btn-primary">
                  <Sparkles size={16} /> Set up profile
                </Link>
              </div>
            ) : (
              <>
                {/* Family info card */}
                <div
                  className="flex flex-col gap-6 p-6 rounded-2xl"
                  style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,0.06)" }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ background: "rgba(0,184,166,0.1)" }}
                    >
                      👨‍👧
                    </div>
                    <div>
                      <p style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.3rem", color: "var(--lf-dark)" }}>
                        {(profile as { parentName?: string }).parentName ?? "—"}
                      </p>
                      <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.85rem", color: "rgba(45,45,45,0.5)" }}>
                        Parent
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: "Child's name", value: (profile as { childName?: string }).childName },
                      { label: "Nickname", value: (profile as { childNickName?: string }).childNickName },
                      { label: "Age", value: (profile as { childAge?: number }).childAge },
                      { label: "Gender", value: (profile as { childGender?: string }).childGender },
                      { label: "Favourite colour", value: (profile as { favoriteColor?: string }).favoriteColor },
                      { label: "Favourite animal", value: (profile as { favoriteAnimal?: string }).favoriteAnimal },
                    ].map((row) => (
                      <div key={row.label} className="flex flex-col gap-0.5">
                        <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.75rem", fontWeight: 600, color: "rgba(45,45,45,0.4)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                          {row.label}
                        </p>
                        <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.95rem", color: "var(--lf-dark)", fontWeight: 600 }}>
                          {row.value ?? "—"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { icon: <BookOpen size={20} />, label: "Stories", value: stories?.length ?? "—", color: "var(--lf-teal)" },
                    { icon: <Sparkles size={20} />, label: "Credits left", value: credits?.[0]?.availableCredits ?? "—", color: "#a855f7" },
                    { icon: <Star size={20} />, label: "Badges", value: achievementsData?.achievements?.filter((a: { earned: boolean }) => a.earned).length ?? 0, color: "#f9c700" },
                  ].map((s) => (
                    <div key={s.label} className="flex flex-col gap-2 p-5 rounded-2xl" style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,0.06)" }}>
                      <div style={{ color: s.color }}>{s.icon}</div>
                      <p style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.5rem", color: "var(--lf-dark)" }}>{s.value}</p>
                      <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.8rem", color: "rgba(45,45,45,0.5)" }}>{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Badges */}
                {achievementsData?.achievements && (
                  <div className="flex flex-col gap-4 p-6 rounded-2xl" style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,0.06)" }}>
                    <h2 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.1rem", color: "var(--lf-dark)" }}>
                      Achievements
                    </h2>
                    <div className="flex flex-wrap gap-3">
                      {(achievementsData.achievements as Array<{ name: string; earned: boolean; description?: string }>).map((a) => (
                        <div
                          key={a.name}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold"
                          style={{
                            background: a.earned ? "rgba(0,184,166,0.1)" : "rgba(0,0,0,0.04)",
                            color: a.earned ? "var(--lf-teal)" : "rgba(45,45,45,0.35)",
                            border: `1.5px solid ${a.earned ? "rgba(0,184,166,0.2)" : "rgba(0,0,0,0.06)"}`,
                            fontFamily: "'Nunito', sans-serif",
                          }}
                        >
                          {a.earned ? "🏆" : "🔒"} {a.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col gap-3">
                  <Link
                    href="/pricing"
                    className="btn-primary"
                    style={{ justifyContent: "center", padding: "0.85rem" }}
                  >
                    <Sparkles size={18} /> Get more credits
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-semibold transition-all"
                    style={{
                      background: "#fff",
                      border: "1.5px solid rgba(0,0,0,0.1)",
                      color: "rgba(45,45,45,0.6)",
                      fontFamily: "'Nunito', sans-serif",
                      fontSize: "0.95rem",
                    }}
                  >
                    <LogOut size={18} /> Sign out
                  </button>
                </div>
              </>
            )}
          </main>
        </div>
      </Authenticated>
    </>
  );
}
