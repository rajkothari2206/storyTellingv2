"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  useQuery,
  useConvexAuth,
  AuthLoading,
  Authenticated,
  Unauthenticated,
} from "convex/react";
import { api } from "../../../convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { useEffect } from "react";
import {
  BookOpen,
  Sparkles,
  Flame,
  Star,
  LogOut,
  User,
  Library,
  ChevronRight,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();

  const profile = useQuery(
    api.userProfiles.getProfile,
    isAuthenticated ? {} : "skip"
  );
  const hasProfile = useQuery(
    api.userProfiles.hasProfile,
    isAuthenticated ? {} : "skip"
  );
  const stories = useQuery(
    api.stories.list,
    isAuthenticated ? {} : "skip"
  );
  const achievementsData = useQuery(
    api.userProfiles.getAchievements,
    isAuthenticated ? {} : "skip"
  );
  const credits = useQuery(api.credit.list, isAuthenticated ? {} : "skip");

  const userName = profile?.parentName ?? "Friend";
  const childName = profile?.childName ?? "your child";
  const availableCredits = credits?.[0]?.availableCredits ?? 0;

  const stats = useMemo(() => {
    const list = stories ?? [];
    const storiesCreated = list.length;
    const readingTime = storiesCreated * 3;
    let favoriteTheme = "Adventure";
    if (list.length > 0) {
      const counts = new Map<string, number>();
      for (const s of list) {
        const t = (s?.params?.theme as string) ?? "Adventure";
        counts.set(t, (counts.get(t) ?? 0) + 1);
      }
      let max = 0;
      for (const [t, c] of counts) {
        if (c > max) { max = c; favoriteTheme = t; }
      }
    }
    const earnedBadges =
      achievementsData?.achievements?.filter((a: { earned: boolean }) => a.earned).map((a: { name: string }) => a.name) ?? [];
    return { storiesCreated, readingTime, favoriteTheme, earnedBadges };
  }, [stories, achievementsData]);

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/");
    toast.success("Signed out successfully");
  }

  return (
    <>
      <AuthLoading>
        <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--lf-cream)" }}>
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "var(--lf-teal)", borderTopColor: "transparent" }} />
            <p style={{ color: "var(--lf-dark)", fontFamily: "'Nunito', sans-serif", opacity: 0.6 }}>Loading your stories…</p>
          </div>
        </div>
      </AuthLoading>

      <Unauthenticated>
        <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--lf-cream)" }}>
          <div className="text-center flex flex-col gap-4">
            <p style={{ color: "var(--lf-dark)", fontFamily: "'Nunito', sans-serif" }}>Please sign in to continue.</p>
            <Link href="/sign-in" className="btn-primary" style={{ justifyContent: "center" }}>Sign in</Link>
          </div>
        </div>
      </Unauthenticated>

      <Authenticated>
        {/* Redirect to onboarding if no profile */}
        {hasProfile === false && (
          <OnboardingRedirect />
        )}

        <div className="min-h-screen" style={{ background: "var(--lf-cream)" }}>
          {/* Top nav */}
          <header
            className="sticky top-0 z-40 flex items-center justify-between px-6 py-4"
            style={{ background: "rgba(255,252,245,0.9)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}
          >
            <Link href="/" className="flex items-center gap-2">
              <div className="relative" style={{ width: 32, height: 32 }}>
                <Image src="/logoNoBg.png" alt="Lalli Fafa" fill className="object-contain" />
              </div>
              <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.1rem", color: "var(--lf-dark)" }}>
                Lalli <span style={{ color: "var(--lf-teal)" }}>Fafa</span>
              </span>
            </Link>

            <nav className="flex items-center gap-2">
              <Link
                href="/library"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-black/5"
                style={{ color: "var(--lf-dark)", fontFamily: "'Nunito', sans-serif" }}
              >
                <Library size={16} /> Library
              </Link>
              <Link
                href="/profile"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-black/5"
                style={{ color: "var(--lf-dark)", fontFamily: "'Nunito', sans-serif" }}
              >
                <User size={16} /> Profile
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-black/5"
                style={{ color: "rgba(45,45,45,0.5)", fontFamily: "'Nunito', sans-serif" }}
              >
                <LogOut size={16} /> Sign out
              </button>
            </nav>
          </header>

          <main className="max-w-5xl mx-auto px-6 py-10 flex flex-col gap-10">
            {/* Welcome */}
            <section className="flex flex-col gap-1">
              <h1 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "clamp(1.8rem,4vw,2.4rem)", color: "var(--lf-dark)" }}>
                Welcome back, {userName}! 👋
              </h1>
              <p style={{ color: "rgba(45,45,45,0.55)", fontFamily: "'Nunito', sans-serif", fontSize: "1rem" }}>
                Ready to create a magical story for {childName}?
              </p>
            </section>

            {/* Credits banner */}
            {availableCredits < 30 && (
              <div
                className="flex items-center justify-between p-4 rounded-2xl"
                style={{ background: "rgba(255,100,60,0.08)", border: "1.5px solid rgba(255,100,60,0.2)" }}
              >
                <div className="flex items-center gap-3">
                  <Zap size={20} style={{ color: "#e84040" }} />
                  <p style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 600, color: "#b83030", fontSize: "0.9rem" }}>
                    Only {availableCredits} credits left. Top up to keep the stories going!
                  </p>
                </div>
                <Link href="/pricing" className="btn-primary" style={{ padding: "0.5rem 1.2rem", fontSize: "0.85rem" }}>
                  Top up
                </Link>
              </div>
            )}

            {/* Stats */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: <BookOpen size={20} />, label: "Stories created", value: stats.storiesCreated, color: "var(--lf-teal)" },
                { icon: <Flame size={20} />, label: "Reading minutes", value: `${stats.readingTime}m`, color: "#ff6b35" },
                { icon: <Star size={20} />, label: "Favourite theme", value: stats.favoriteTheme, color: "#f9c700" },
                { icon: <Sparkles size={20} />, label: "Credits left", value: availableCredits, color: "#a855f7" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex flex-col gap-2 p-5 rounded-2xl"
                  style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,0.06)" }}
                >
                  <div style={{ color: s.color }}>{s.icon}</div>
                  <p style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.5rem", color: "var(--lf-dark)" }}>
                    {s.value}
                  </p>
                  <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.8rem", color: "rgba(45,45,45,0.5)" }}>
                    {s.label}
                  </p>
                </div>
              ))}
            </section>

            {/* Generate CTA */}
            <section
              className="flex flex-col md:flex-row items-center justify-between gap-6 p-8 rounded-3xl"
              style={{ background: "var(--lf-dark)" }}
            >
              <div className="flex flex-col gap-2">
                <h2 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.5rem", color: "#fff" }}>
                  Create a new story ✨
                </h2>
                <p style={{ color: "rgba(255,255,255,0.6)", fontFamily: "'Nunito', sans-serif", fontSize: "0.9rem" }}>
                  Pick a theme, lesson, and language — your story is ready in seconds.
                </p>
              </div>
              <Link
                href="/generate"
                className="btn-primary flex-shrink-0"
                style={{ fontSize: "1rem", padding: "0.85rem 2rem" }}
              >
                <Sparkles size={18} /> Generate story
              </Link>
            </section>

            {/* Recent stories */}
            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.2rem", color: "var(--lf-dark)" }}>
                  Recent stories
                </h2>
                <Link
                  href="/library"
                  className="flex items-center gap-1 text-sm font-semibold"
                  style={{ color: "var(--lf-teal)", fontFamily: "'Nunito', sans-serif" }}
                >
                  View all <ChevronRight size={16} />
                </Link>
              </div>

              {stories === undefined ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-36 rounded-2xl animate-pulse" style={{ background: "rgba(0,0,0,0.06)" }} />
                  ))}
                </div>
              ) : stories.length === 0 ? (
                <div
                  className="flex flex-col items-center gap-3 py-12 rounded-2xl"
                  style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,0.06)" }}
                >
                  <BookOpen size={36} style={{ color: "var(--lf-teal)", opacity: 0.5 }} />
                  <p style={{ fontFamily: "'Nunito', sans-serif", color: "rgba(45,45,45,0.5)" }}>
                    No stories yet — create your first one!
                  </p>
                  <Link href="/generate" className="btn-primary" style={{ padding: "0.6rem 1.4rem", fontSize: "0.9rem" }}>
                    <Sparkles size={16} /> Create story
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(stories as Array<{ _id: string; title?: string; params?: { theme?: string; language?: string }; status?: string }>).slice(0, 6).map((story) => (
                    <Link
                      key={story._id}
                      href={`/story/${story._id}`}
                      className="flex flex-col gap-3 p-5 rounded-2xl transition-all hover:-translate-y-0.5 hover:shadow-md"
                      style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,0.06)" }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p
                          style={{
                            fontFamily: "'Baloo 2', sans-serif",
                            fontWeight: 700,
                            fontSize: "0.95rem",
                            color: "var(--lf-dark)",
                            lineHeight: 1.3,
                          }}
                        >
                          {story.title ?? "Untitled Story"}
                        </p>
                        <ChevronRight size={16} style={{ color: "var(--lf-teal)", flexShrink: 0, marginTop: 2 }} />
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {story.params?.theme && (
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-semibold"
                            style={{ background: "rgba(0,184,166,0.1)", color: "var(--lf-teal)" }}
                          >
                            {story.params.theme}
                          </span>
                        )}
                        {story.params?.language && (
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-semibold"
                            style={{ background: "rgba(0,0,0,0.05)", color: "rgba(45,45,45,0.6)" }}
                          >
                            {story.params.language}
                          </span>
                        )}
                        {story.status === "generating" && (
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-semibold"
                            style={{ background: "rgba(249,199,0,0.15)", color: "#b8860b" }}
                          >
                            Generating…
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </main>
        </div>
      </Authenticated>
    </>
  );
}

function OnboardingRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/onboarding");
  }, [router]);
  return null;
}
