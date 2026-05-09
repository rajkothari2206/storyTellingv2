"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  useQuery,
  useAction,
  useConvexAuth,
  AuthLoading,
  Authenticated,
  Unauthenticated,
} from "convex/react";
import { api } from "../../../convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { UserPill } from "@/components/layout/UserPill";
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
  Globe,
  Ruler,
  Heart,
  FileText,
  Loader2,
  Check,
  X,
  Plus,
  Play,
} from "lucide-react";
import { toast } from "sonner";

/* ── Theme → scene image map ── */
const THEME_IMAGES: Record<string, string> = {
  adventure: "/lf-scene-jungle.png",
  friendship: "/lf-scene-balloons.png",
  courage: "/lf-scene-kite.png",
  kindness: "/lf-scene-puppy.png",
  bedtime: "/lf-scene-bedtime.png",
  space: "/lf-scene-planets.png",
  nature: "/lf-scene-orchard.png",
  culture: "/lf-scene-krishna.png",
  india: "/lf-scene-redfort.png",
  mythology: "/lf-scene-ganesha.png",
  animals: "/lf-scene-puppy.png",
  games: "/lf-scene-boardgame.png",
  travel: "/lf-scene-street.png",
};

function getSceneForTheme(theme?: string): string {
  if (!theme) return "/lf-scene-orchard.png";
  const key = theme.toLowerCase();
  for (const [k, v] of Object.entries(THEME_IMAGES)) {
    if (key.includes(k)) return v;
  }
  const all = Object.values(THEME_IMAGES);
  return all[Math.abs(theme.charCodeAt(0)) % all.length];
}

/* ── Generate form options ── */
const LANGUAGES = ["English", "Hindi"] as const;
const LENGTHS: { value: "short" | "medium" | "long"; label: string; desc: string; credits: number; premium?: boolean }[] = [
  { value: "short", label: "Short", desc: "~3 min", credits: 60 },
  { value: "medium", label: "Medium", desc: "~6 min", credits: 80 },
  { value: "long", label: "Long", desc: "~10 min", credits: 0, premium: true },
];

/* ── Stat card colours ── */
const STAT_COLORS = [
  { bg: "linear-gradient(135deg,#00c9a7 0%,#00a38d 100%)", icon: "rgba(255,255,255,0.3)", text: "#fff" },
  { bg: "linear-gradient(135deg,#ff6b35 0%,#e84e1b 100%)", icon: "rgba(255,255,255,0.3)", text: "#fff" },
  { bg: "linear-gradient(135deg,#f9c700 0%,#e6ac00 100%)", icon: "rgba(255,255,255,0.3)", text: "#fff" },
  { bg: "linear-gradient(135deg,#a855f7 0%,#8b2cf5 100%)", icon: "rgba(255,255,255,0.3)", text: "#fff" },
];

/* ── Floating sparkle decoration ── */
function FloatingSparkle({ style }: { style: React.CSSProperties }) {
  return (
    <div className="absolute pointer-events-none select-none" style={{ fontSize: "1.2rem", animation: "float 3s ease-in-out infinite", ...style }}>
      ✨
    </div>
  );
}

/* ================================================================
   MAIN PAGE
   ================================================================ */
export default function DashboardPage() {
  const { isAuthenticated } = useConvexAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <style>{`
        @keyframes float {
          0%,100%{transform:translateY(0px) rotate(0deg);}
          33%{transform:translateY(-8px) rotate(5deg);}
          66%{transform:translateY(-4px) rotate(-3deg);}
        }
        @keyframes pulse-glow {
          0%,100%{box-shadow:0 0 0 0 rgba(0,201,167,0.4);}
          50%{box-shadow:0 0 0 12px rgba(0,201,167,0);}
        }
        @keyframes shimmer {
          0%{background-position:-400px 0;}
          100%{background-position:400px 0;}
        }
        @keyframes slide-in-right {
          from{transform:translateX(100%);}
          to{transform:translateX(0);}
        }
        @keyframes fade-in {
          from{opacity:0;transform:translateY(16px);}
          to{opacity:1;transform:translateY(0);}
        }
        .stat-card{animation:fade-in 0.5s ease both;}
        .story-card{animation:fade-in 0.4s ease both;}
        .drawer-panel{animation:slide-in-right 0.35s cubic-bezier(0.34,1.2,0.64,1) both;}
      `}</style>

      <AuthLoading>
        <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg,#FFF8E7 0%,#E6FAF6 100%)" }}>
          <div className="flex flex-col items-center gap-4">
            <div className="relative" style={{ width: 64, height: 64 }}>
              <Image src="/lf-logo.png" alt="Lalli Fafa" fill className="object-contain animate-bounce" />
            </div>
            <p style={{ color: "var(--lf-dark)", fontFamily: "'Baloo 2', sans-serif", fontWeight: 700 }}>Loading your stories…</p>
          </div>
        </div>
      </AuthLoading>

      <Unauthenticated>
        <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg,#FFF8E7 0%,#E6FAF6 100%)" }}>
          <div className="text-center flex flex-col gap-4">
            <p style={{ color: "var(--lf-dark)", fontFamily: "'Nunito', sans-serif" }}>Please sign in to continue.</p>
            <Link href="/sign-in" className="btn-primary" style={{ justifyContent: "center" }}>Sign in</Link>
          </div>
        </div>
      </Unauthenticated>

      <Authenticated>
        <DashboardContent drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen} isAuthenticated={isAuthenticated} />
      </Authenticated>
    </>
  );
}

/* ================================================================
   DASHBOARD CONTENT
   ================================================================ */
function DashboardContent({
  drawerOpen,
  setDrawerOpen,
  isAuthenticated,
}: {
  drawerOpen: boolean;
  setDrawerOpen: (v: boolean) => void;
  isAuthenticated: boolean;
}) {
  const router = useRouter();

  const { data: session } = authClient.useSession();
  const isEmailVerified = session?.user?.emailVerified ?? true; // default true so banner doesn't flash on load
  const userEmail = session?.user?.email ?? "";
  const [verifyBannerDismissed, setVerifyBannerDismissed] = useState(false);
  const [resendingVerify, setResendingVerify] = useState(false);

  async function handleResendVerification() {
    if (!userEmail) return;
    setResendingVerify(true);
    try {
      await authClient.sendVerificationEmail({ email: userEmail, callbackURL: "/dashboard" });
      toast.success("Verification email sent! Check your inbox.");
    } catch {
      toast.error("Couldn't send verification email. Please try again.");
    } finally {
      setResendingVerify(false);
    }
  }

  const profile = useQuery(api.userProfiles.getProfile, isAuthenticated ? {} : "skip");
  const hasProfile = useQuery(api.userProfiles.hasProfile, isAuthenticated ? {} : "skip");
  const stories = useQuery(api.stories.list, isAuthenticated ? {} : "skip");
  const achievementsData = useQuery(api.userProfiles.getAchievements, isAuthenticated ? {} : "skip");
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
    return { storiesCreated, readingTime, favoriteTheme };
  }, [stories, achievementsData]);

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/");
    toast.success("Signed out successfully");
  }

  // Close drawer with Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setDrawerOpen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setDrawerOpen]);

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg,#FFF8E7 0%,#E6FAF6 50%,#F3EEFF 100%)" }}>

      {/* ── Header ── */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-5 py-3"
        style={{ background: "rgba(255,252,245,0.92)", backdropFilter: "blur(16px)", borderBottom: "1.5px solid rgba(0,0,0,0.07)", height: 72 }}
      >
        <Link href="/" className="flex items-center gap-3 flex-shrink-0">
          <div className="relative flex-shrink-0" style={{ width: 52, height: 52 }}>
            <Image src="/lf-logo.png" alt="Lalli Fafa" fill className="object-contain" priority />
          </div>
          <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.25rem", color: "var(--lf-dark)" }}>
            Lalli <span style={{ color: "var(--lf-teal)" }}>Fafa</span>
          </span>
        </Link>

        {/* Centre nav */}
        <nav className="hidden md:flex items-center gap-1">
          <Link href="/library" className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all hover:bg-black/5" style={{ color: "var(--lf-dark)", fontFamily: "'Nunito', sans-serif" }}>
            <Library size={15} /> Library
          </Link>
          <Link href="/profile" className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all hover:bg-black/5" style={{ color: "var(--lf-dark)", fontFamily: "'Nunito', sans-serif" }}>
            <User size={15} /> Profile
          </Link>
          <Link href="/checkout?plan=monthly" className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all hover:bg-black/5" style={{ color: "var(--lf-dark)", fontFamily: "'Nunito', sans-serif" }}>
            <Zap size={15} /> Upgrade
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {/* Credits pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: "linear-gradient(135deg,rgba(168,85,247,0.12),rgba(168,85,247,0.06))", border: "1.5px solid rgba(168,85,247,0.25)" }}>
            <Zap size={14} style={{ color: "#a855f7" }} />
            <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.82rem", color: "#7c3aed" }}>
              {availableCredits} credits
            </span>
          </div>
          <UserPill variant="light" />
        </div>
      </header>

      {/* Redirect to onboarding if no profile */}
      {hasProfile === false && <OnboardingRedirect />}

      {/* Email verification banner */}
      {!isEmailVerified && !verifyBannerDismissed && session && (
        <div
          className="flex items-center justify-between gap-3 px-5 py-3"
          style={{ background: "linear-gradient(90deg,#fff8e1,#fffde7)", borderBottom: "1.5px solid rgba(249,199,0,0.4)" }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span style={{ fontSize: "1rem", flexShrink: 0 }}>📧</span>
            <p style={{ fontSize: "0.85rem", color: "#7a5800", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              Please verify your email address to secure your account.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleResendVerification}
              disabled={resendingVerify}
              style={{ background: "#f9c700", border: "none", color: "#1a1a2e", fontSize: "0.8rem", fontWeight: 700, padding: "0.35rem 1rem", borderRadius: 50, cursor: "pointer" }}
            >
              {resendingVerify ? "Sending…" : "Resend email"}
            </button>
            <button
              onClick={() => setVerifyBannerDismissed(true)}
              style={{ background: "none", border: "none", color: "rgba(122,88,0,0.5)", cursor: "pointer", padding: "0.25rem", fontSize: "1rem", lineHeight: 1 }}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-5 py-8 flex flex-col gap-8">

        {/* ── Hero welcome banner ── */}
        <section
          className="relative overflow-hidden rounded-3xl"
          style={{
            background: "linear-gradient(135deg,#131020 0%,#1a1740 50%,#0d2d26 100%)",
            minHeight: 220,
          }}
        >
          {/* Floating sparkles */}
          <FloatingSparkle style={{ top: 20, left: "10%", animationDelay: "0s" }} />
          <FloatingSparkle style={{ top: 40, left: "25%", animationDelay: "0.8s", fontSize: "0.9rem" }} />
          <FloatingSparkle style={{ top: 15, left: "55%", animationDelay: "1.5s" }} />
          <FloatingSparkle style={{ top: 60, right: "30%", animationDelay: "0.4s", fontSize: "0.8rem" }} />
          <FloatingSparkle style={{ bottom: 30, left: "40%", animationDelay: "1.1s" }} />

          {/* Glow orbs */}
          <div className="absolute" style={{ top: -60, right: 120, width: 280, height: 280, background: "radial-gradient(circle,rgba(0,201,167,0.25) 0%,transparent 70%)", pointerEvents: "none" }} />
          <div className="absolute" style={{ bottom: -40, left: 80, width: 200, height: 200, background: "radial-gradient(circle,rgba(249,199,0,0.2) 0%,transparent 70%)", pointerEvents: "none" }} />

          <div className="relative flex flex-col md:flex-row items-center gap-6 px-8 py-8">
            {/* Text */}
            <div className="flex-1 flex flex-col gap-4">
              <div>
                <p style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 600, fontSize: "0.85rem", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                  Welcome back 👋
                </p>
                <h1 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "clamp(1.7rem,3.5vw,2.4rem)", color: "#fff", lineHeight: 1.2 }}>
                  Hey {userName}!{" "}
                  <span style={{ color: "var(--lf-sunshine)" }}>{childName}</span>'s next adventure awaits.
                </h1>
              </div>
              <p style={{ fontFamily: "'Nunito', sans-serif", color: "rgba(255,255,255,0.6)", fontSize: "0.95rem", lineHeight: 1.6 }}>
                Lalli &amp; Fafa are ready to tell a brand new tale — crafted just for your little one. 🌟
              </p>
              <button
                onClick={() => router.push('/generate')}
                className="flex items-center gap-2 self-start px-7 py-3.5 rounded-2xl font-bold transition-all hover:scale-105 active:scale-95"
                style={{
                  background: "linear-gradient(135deg,var(--lf-teal),#00a38d)",
                  color: "#fff",
                  fontFamily: "'Baloo 2', sans-serif",
                  fontSize: "1rem",
                  boxShadow: "0 4px 20px rgba(0,201,167,0.5)",
                  animation: "pulse-glow 2.5s ease-in-out infinite",
                }}
              >
                <Sparkles size={18} />
                Create a New Story
                <Plus size={16} />
              </button>
            </div>

            {/* Lalli Fafa character image */}
            <div className="relative flex-shrink-0" style={{ width: 180, height: 180 }}>
              <Image
                src="/lf-hero.png"
                alt="Lalli and Fafa"
                fill
                className="object-contain"
                style={{ filter: "drop-shadow(0 8px 24px rgba(0,201,167,0.4))" }}
              />
              {/* Name badges */}
              <div
                className="absolute flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold"
                style={{ bottom: 50, left: -10, background: "rgba(249,199,0,0.9)", color: "#131020", fontSize: "0.7rem", whiteSpace: "nowrap" }}
              >
                ⭐ Lalli · age 6
              </div>
              <div
                className="absolute flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold"
                style={{ bottom: 20, right: -10, background: "rgba(0,201,167,0.9)", color: "#fff", fontSize: "0.7rem", whiteSpace: "nowrap" }}
              >
                💙 Fafa · age 3
              </div>
            </div>
          </div>
        </section>

        {/* ── Low credits warning ── */}
        {availableCredits < 30 && availableCredits > 0 && (
          <div
            className="flex items-center justify-between p-4 rounded-2xl"
            style={{ background: "rgba(255,100,60,0.08)", border: "1.5px solid rgba(255,100,60,0.25)" }}
          >
            <div className="flex items-center gap-3">
              <Zap size={20} style={{ color: "#e84040" }} />
              <p style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 600, color: "#b83030", fontSize: "0.9rem" }}>
                Only {availableCredits} credits left — top up to keep the magic going!
              </p>
            </div>
            <Link href="/checkout?plan=monthly" className="btn-primary" style={{ padding: "0.5rem 1.2rem", fontSize: "0.85rem", flexShrink: 0 }}>
              Top up
            </Link>
          </div>
        )}

        {/* ── Stats row ── */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: <BookOpen size={22} />, label: "Stories created", value: stats.storiesCreated, delay: "0s" },
            { icon: <Flame size={22} />, label: "Reading minutes", value: `${stats.readingTime}m`, delay: "0.08s" },
            { icon: <Star size={22} />, label: "Fave theme", value: stats.favoriteTheme, delay: "0.16s" },
            { icon: <Zap size={22} />, label: "Credits left", value: availableCredits, delay: "0.24s" },
          ].map((s, i) => (
            <div
              key={s.label}
              className="stat-card flex flex-col gap-3 p-5 rounded-2xl relative overflow-hidden"
              style={{ background: STAT_COLORS[i].bg, animationDelay: s.delay }}
            >
              {/* Background glow */}
              <div className="absolute top-0 right-0 w-20 h-20 rounded-full" style={{ background: STAT_COLORS[i].icon, transform: "translate(30%,-30%)" }} />
              <div style={{ color: STAT_COLORS[i].text, opacity: 0.9, position: "relative" }}>{s.icon}</div>
              <p style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.7rem", color: STAT_COLORS[i].text, lineHeight: 1, position: "relative" }}>
                {s.value}
              </p>
              <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.78rem", color: STAT_COLORS[i].text, opacity: 0.8, fontWeight: 600, position: "relative" }}>
                {s.label}
              </p>
            </div>
          ))}
        </section>

        {/* ── Quick actions ── */}
        <section className="grid sm:grid-cols-3 gap-4">
          <button
            onClick={() => router.push('/generate')}
            className="flex flex-col items-start gap-3 p-5 rounded-2xl text-left transition-all hover:-translate-y-1 hover:shadow-lg active:scale-98"
            style={{ background: "linear-gradient(135deg,rgba(0,201,167,0.12),rgba(0,201,167,0.06))", border: "1.5px solid rgba(0,201,167,0.35)" }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--lf-teal)" }}>
              <Sparkles size={20} color="#fff" />
            </div>
            <div>
              <p style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, fontSize: "1rem", color: "var(--lf-dark)" }}>Generate Story</p>
              <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.82rem", color: "rgba(45,45,45,0.55)" }}>Ready in under 2 minutes</p>
            </div>
          </button>

          <Link
            href="/library"
            className="flex flex-col items-start gap-3 p-5 rounded-2xl transition-all hover:-translate-y-1 hover:shadow-lg"
            style={{ background: "linear-gradient(135deg,rgba(249,199,0,0.12),rgba(249,199,0,0.06))", border: "1.5px solid rgba(249,199,0,0.4)" }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#f9c700" }}>
              <Library size={20} color="#fff" />
            </div>
            <div>
              <p style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, fontSize: "1rem", color: "var(--lf-dark)" }}>My Library</p>
              <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.82rem", color: "rgba(45,45,45,0.55)" }}>All {stats.storiesCreated} stories</p>
            </div>
          </Link>

          <Link
            href="/profile"
            className="flex flex-col items-start gap-3 p-5 rounded-2xl transition-all hover:-translate-y-1 hover:shadow-lg"
            style={{ background: "linear-gradient(135deg,rgba(168,85,247,0.1),rgba(168,85,247,0.05))", border: "1.5px solid rgba(168,85,247,0.3)" }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#a855f7" }}>
              <User size={20} color="#fff" />
            </div>
            <div>
              <p style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, fontSize: "1rem", color: "var(--lf-dark)" }}>Child Profile</p>
              <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.82rem", color: "rgba(45,45,45,0.55)" }}>Update {childName}'s info</p>
            </div>
          </Link>
        </section>

        {/* ── Recent stories ── */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.3rem", color: "var(--lf-dark)" }}>
              Recent Stories 📖
            </h2>
            <Link
              href="/library"
              className="flex items-center gap-1 text-sm font-bold"
              style={{ color: "var(--lf-teal)", fontFamily: "'Nunito', sans-serif" }}
            >
              View all <ChevronRight size={15} />
            </Link>
          </div>

          {stories === undefined ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-56 rounded-2xl" style={{ background: "linear-gradient(90deg,rgba(0,0,0,0.06) 25%,rgba(0,0,0,0.1) 50%,rgba(0,0,0,0.06) 75%)", backgroundSize: "400px 100%", animation: "shimmer 1.4s ease-in-out infinite" }} />
              ))}
            </div>
          ) : stories.length === 0 ? (
            <div
              className="flex flex-col items-center gap-4 py-16 rounded-3xl relative overflow-hidden"
              style={{ background: "linear-gradient(135deg,rgba(255,193,7,0.1),rgba(0,201,167,0.08))", border: "2px dashed rgba(0,201,167,0.3)" }}
            >
              <div className="relative" style={{ width: 80, height: 80 }}>
                <Image src="/lf-hero.png" alt="Lalli Fafa" fill className="object-contain" />
              </div>
              <div className="text-center flex flex-col gap-1">
                <p style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, fontSize: "1.1rem", color: "var(--lf-dark)" }}>
                  No stories yet!
                </p>
                <p style={{ fontFamily: "'Nunito', sans-serif", color: "rgba(45,45,45,0.5)", fontSize: "0.9rem" }}>
                  Create {childName}'s first magical story with Lalli &amp; Fafa
                </p>
              </div>
              <button
                onClick={() => router.push('/generate')}
                className="btn-primary"
                style={{ padding: "0.7rem 1.6rem" }}
              >
                <Sparkles size={16} /> Create First Story
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(stories as Array<{ _id: string; title?: string; params?: { theme?: string; language?: string }; status?: string; coverImageUrl?: string }>)
                .slice(0, 6)
                .map((story, idx) => {
                  const sceneImg = story.coverImageUrl ?? getSceneForTheme(story.params?.theme);
                  return (
                    <Link
                      key={story._id}
                      href={`/story/${story._id}`}
                      className="story-card flex flex-col rounded-2xl overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl group"
                      style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,0.07)", animationDelay: `${idx * 0.06}s` }}
                    >
                      {/* Story scene image */}
                      <div className="relative overflow-hidden" style={{ height: 140 }}>
                        <Image
                          src={sceneImg}
                          alt={story.title ?? "Story"}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          style={{ objectPosition: "center 30%" }}
                        />
                        {/* Overlay gradient */}
                        <div className="absolute inset-0" style={{ background: "linear-gradient(to top,rgba(0,0,0,0.45) 0%,transparent 60%)" }} />

                        {/* Play button */}
                        <div
                          className="absolute bottom-3 right-3 w-9 h-9 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ background: "var(--lf-teal)", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}
                        >
                          <Play size={14} fill="#fff" color="#fff" />
                        </div>

                        {/* Status badge */}
                        {story.status === "generating" && (
                          <div
                            className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                            style={{ background: "rgba(249,199,0,0.95)", color: "#131020" }}
                          >
                            <Loader2 size={11} className="animate-spin" />
                            Generating…
                          </div>
                        )}

                        {/* Language badge */}
                        {story.params?.language && (
                          <div
                            className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-bold"
                            style={{ background: "rgba(255,255,255,0.9)", color: "var(--lf-dark)" }}
                          >
                            {story.params.language === "Hindi" ? "🇮🇳" : "🇬🇧"} {story.params.language}
                          </div>
                        )}
                      </div>

                      {/* Story info */}
                      <div className="flex flex-col gap-2 p-4">
                        <p style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, fontSize: "0.95rem", color: "var(--lf-dark)", lineHeight: 1.3 }}>
                          {story.title ?? "Untitled Story"}
                        </p>
                        {story.params?.theme && (
                          <span
                            className="self-start px-2.5 py-0.5 rounded-full text-xs font-semibold"
                            style={{ background: "rgba(0,201,167,0.1)", color: "var(--lf-teal)" }}
                          >
                            {story.params.theme}
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
            </div>
          )}
        </section>

        {/* ── Scenes strip — decorative ── */}
        <section
          className="rounded-3xl overflow-hidden relative"
          style={{ background: "linear-gradient(135deg,#131020 0%,#1a1740 100%)", padding: "24px 28px" }}
        >
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex -space-x-4">
              {["/lf-scene-jungle.png", "/lf-scene-balloons.png", "/lf-scene-kite.png", "/lf-scene-planets.png"].map((src, i) => (
                <div
                  key={i}
                  className="relative rounded-2xl overflow-hidden border-2 flex-shrink-0"
                  style={{ width: 56, height: 56, borderColor: "rgba(255,255,255,0.2)", zIndex: 4 - i }}
                >
                  <Image src={src} alt="" fill className="object-cover" style={{ objectPosition: "center 30%" }} />
                </div>
              ))}
              <div
                className="relative rounded-2xl flex-shrink-0 flex items-center justify-center text-white font-bold text-sm border-2"
                style={{ width: 56, height: 56, background: "var(--lf-teal)", borderColor: "rgba(255,255,255,0.2)", zIndex: 0 }}
              >
                +8
              </div>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <p style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.1rem", color: "#fff" }}>
                12 stunning adventure worlds to explore
              </p>
              <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.85rem", color: "rgba(255,255,255,0.55)", marginTop: 4 }}>
                Each story features unique AI illustrations tailored to your child
              </p>
            </div>
            <button
              onClick={() => router.push('/generate')}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold flex-shrink-0 transition-all hover:scale-105"
              style={{ background: "var(--lf-sunshine)", color: "#131020", fontFamily: "'Baloo 2', sans-serif", fontSize: "0.9rem" }}
            >
              <Sparkles size={16} /> Create Story
            </button>
          </div>
        </section>

      </main>

      {/* ── Story Creation Drawer ── */}
      {drawerOpen && (
        <StoryDrawer
          isAuthenticated={isAuthenticated}
          onClose={() => setDrawerOpen(false)}
        />
      )}
    </div>
  );
}

/* ================================================================
   STORY CREATION DRAWER
   ================================================================ */
function StoryDrawer({
  isAuthenticated,
  onClose,
}: {
  isAuthenticated: boolean;
  onClose: () => void;
}) {
  const router = useRouter();

  const profile = useQuery(api.userProfiles.getProfile, isAuthenticated ? {} : "skip");
  const credits = useQuery(api.credit.list, isAuthenticated ? {} : "skip");
  const subscription = useQuery(api.subscription.getSubscription, isAuthenticated ? {} : "skip");
  const themes = useQuery(api["migration/theme"].list, isAuthenticated ? {} : "skip");
  const lessons = useQuery(api["migration/lesson"].list, isAuthenticated ? {} : "skip");
  const generateStory = useAction(api.generateStory.generateStoryText);

  const availableCredits = credits?.[0]?.availableCredits ?? 0;
  const isPremium = subscription?.status === "active";
  const hasSecondChild = !!(profile as { child2Name?: string } | null | undefined)?.child2Name;

  const [childId, setChildId] = useState<"1" | "2">("1");
  const [length, setLength] = useState<"short" | "medium" | "long">("short");
  const [language, setLanguage] = useState<"English" | "Hindi">("English");
  const [theme, setTheme] = useState("");
  const [lesson, setLesson] = useState("");
  const [useFavorites, setUseFavorites] = useState(true);
  const [textOnly, setTextOnly] = useState(false);
  const [generating, setGenerating] = useState(false);

  const creditCost = textOnly ? 20 : length === "short" ? 60 : length === "medium" ? 80 : 0;
  const canAfford = availableCredits >= creditCost;
  const canGenerate = !!theme && canAfford && !generating;

  const isLoading = profile === undefined || themes === undefined || lessons === undefined || credits === undefined;

  async function handleGenerate() {
    if (!canGenerate) return;
    setGenerating(true);
    try {
      const result = await generateStory({
        params: {
          theme,
          lesson: lesson || undefined,
          length,
          language,
          useFavorites,
          textOnly,
          childId: hasSecondChild ? childId : undefined,
        },
      });
      router.push(`/story/${result.storyId}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Story generation failed. Please try again.";
      toast.error(msg);
      setGenerating(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50"
        style={{ background: "rgba(19,16,32,0.6)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="drawer-panel fixed right-0 top-0 bottom-0 z-50 flex flex-col overflow-hidden"
        style={{
          width: "min(560px, 100vw)",
          background: "linear-gradient(160deg,#FFF8E7 0%,#F2FFF9 100%)",
          boxShadow: "-8px 0 60px rgba(0,0,0,0.25)",
        }}
      >
        {/* Drawer header */}
        <div
          className="flex items-center justify-between px-6 py-5 flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#131020,#1a1740)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="flex items-center gap-3">
            <div className="relative" style={{ width: 40, height: 40 }}>
              <Image src="/lf-hero.png" alt="Lalli Fafa" fill className="object-contain" />
            </div>
            <div>
              <h2 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.15rem", color: "#fff" }}>
                Create a Story ✨
              </h2>
              <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.78rem", color: "rgba(255,255,255,0.5)" }}>
                Pick options — ready in under 2 minutes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:bg-white/10"
            style={{ color: "rgba(255,255,255,0.6)" }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Credits bar */}
        <div
          className="flex items-center justify-between px-6 py-2.5 flex-shrink-0"
          style={{ background: "rgba(168,85,247,0.08)", borderBottom: "1px solid rgba(168,85,247,0.15)" }}
        >
          <div className="flex items-center gap-2">
            <Zap size={15} style={{ color: "#a855f7" }} />
            <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.82rem", color: "#7c3aed" }}>
              {isLoading ? "—" : availableCredits} credits available
            </span>
          </div>
          {availableCredits < 80 && (
            <Link href="/checkout?plan=monthly" onClick={onClose} className="text-xs font-bold" style={{ color: "var(--lf-teal)" }}>
              Top up →
            </Link>
          )}
        </div>

        {/* Scrollable form */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20">
              <div className="relative" style={{ width: 48, height: 48 }}>
                <Image src="/lf-logo.png" alt="loading" fill className="object-contain animate-bounce" />
              </div>
              <p style={{ fontFamily: "'Nunito', sans-serif", color: "rgba(45,45,45,0.5)" }}>Loading your options…</p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">

              {/* Child selector */}
              {hasSecondChild && (
                <DrawerSection icon={<User size={16} />} title="Which child?" color="var(--lf-teal)">
                  <div className="flex gap-3">
                    {(["1", "2"] as const).map((id) => {
                      const name = id === "1" ? profile?.childName : (profile as { child2Name?: string })?.child2Name;
                      return (
                        <OptionChip key={id} selected={childId === id} onClick={() => setChildId(id)} label={name ?? `Child ${id}`} />
                      );
                    })}
                  </div>
                </DrawerSection>
              )}

              {/* Language */}
              <DrawerSection icon={<Globe size={16} />} title="Language" color="#f9c700">
                <div className="flex gap-3">
                  {LANGUAGES.map((lang) => (
                    <OptionChip
                      key={lang}
                      selected={language === lang}
                      onClick={() => setLanguage(lang)}
                      label={lang === "English" ? "🇬🇧 English" : "🇮🇳 Hindi"}
                    />
                  ))}
                </div>
              </DrawerSection>

              {/* Story length */}
              <DrawerSection icon={<Ruler size={16} />} title="Story length" color="#ff6b35">
                <div className="flex gap-3 flex-wrap">
                  {LENGTHS.map((l) => {
                    const locked = l.premium && !isPremium;
                    return (
                      <button
                        key={l.value}
                        onClick={() => !locked && setLength(l.value)}
                        disabled={locked}
                        className="flex flex-col gap-0.5 px-5 py-3 rounded-2xl text-left transition-all"
                        style={{
                          background: length === l.value ? "var(--lf-teal)" : "#fff",
                          border: `1.5px solid ${length === l.value ? "var(--lf-teal)" : "rgba(0,0,0,0.1)"}`,
                          color: length === l.value ? "#fff" : "var(--lf-dark)",
                          opacity: locked ? 0.5 : 1,
                          cursor: locked ? "not-allowed" : "pointer",
                          minWidth: 100,
                          boxShadow: length === l.value ? "0 4px 12px rgba(0,201,167,0.3)" : "none",
                        }}
                      >
                        <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, fontSize: "0.9rem" }}>
                          {l.label} {locked ? "🔒" : ""}
                        </span>
                        <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.75rem", opacity: 0.8 }}>{l.desc}</span>
                        {!l.premium && (
                          <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.72rem", fontWeight: 700, opacity: 0.85 }}>
                            {l.credits} credits
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </DrawerSection>

              {/* Theme */}
              <DrawerSection icon={<Sparkles size={16} />} title="Theme *" color="#a855f7">
                <div className="flex flex-wrap gap-2">
                  {(themes ?? []).map((t: { name: string }) => (
                    <button
                      key={t.name}
                      onClick={() => setTheme(theme === t.name ? "" : t.name)}
                      className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
                      style={{
                        background: theme === t.name ? "var(--lf-dark)" : "#fff",
                        border: `1.5px solid ${theme === t.name ? "var(--lf-dark)" : "rgba(0,0,0,0.1)"}`,
                        color: theme === t.name ? "#fff" : "var(--lf-dark)",
                        fontFamily: "'Nunito', sans-serif",
                        boxShadow: theme === t.name ? "0 2px 8px rgba(0,0,0,0.2)" : "none",
                      }}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
                {!theme && (
                  <p className="text-xs mt-1" style={{ color: "rgba(45,45,45,0.4)", fontFamily: "'Nunito', sans-serif" }}>
                    ↑ Select a theme to continue
                  </p>
                )}
              </DrawerSection>

              {/* Lesson */}
              <DrawerSection icon={<BookOpen size={16} />} title="Lesson (optional)" color="var(--lf-teal)">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setLesson("")}
                    className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
                    style={{
                      background: lesson === "" ? "var(--lf-teal)" : "#fff",
                      border: `1.5px solid ${lesson === "" ? "var(--lf-teal)" : "rgba(0,0,0,0.1)"}`,
                      color: lesson === "" ? "#fff" : "var(--lf-dark)",
                      fontFamily: "'Nunito', sans-serif",
                    }}
                  >
                    None
                  </button>
                  {(lessons ?? []).map((l: { name: string }) => (
                    <button
                      key={l.name}
                      onClick={() => setLesson(lesson === l.name ? "" : l.name)}
                      className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
                      style={{
                        background: lesson === l.name ? "var(--lf-teal)" : "#fff",
                        border: `1.5px solid ${lesson === l.name ? "var(--lf-teal)" : "rgba(0,0,0,0.1)"}`,
                        color: lesson === l.name ? "#fff" : "var(--lf-dark)",
                        fontFamily: "'Nunito', sans-serif",
                      }}
                    >
                      {l.name}
                    </button>
                  ))}
                </div>
              </DrawerSection>

              {/* Personalisation */}
              <DrawerSection icon={<Heart size={16} />} title="Personalisation" color="#ff6b35">
                <div className="flex flex-col gap-2.5">
                  <DrawerCheckbox
                    checked={useFavorites}
                    onChange={setUseFavorites}
                    label="Personalise with favourites"
                    desc="Include your child's favourite colour, animal & interests"
                  />
                  <DrawerCheckbox
                    checked={textOnly}
                    onChange={(v) => { setTextOnly(v); if (v) setLength("short"); }}
                    label={<span className="flex items-center gap-1.5"><FileText size={13} /> Text only (20 credits)</span>}
                    desc="Skip AI illustrations — just the story text"
                  />
                </div>
              </DrawerSection>

            </div>
          )}
        </div>

        {/* ── Sticky generate button ── */}
        <div
          className="flex-shrink-0 px-6 py-5"
          style={{ borderTop: "1.5px solid rgba(0,0,0,0.08)", background: "rgba(255,252,245,0.95)", backdropFilter: "blur(8px)" }}
        >
          {availableCredits < 20 ? (
            <div className="flex flex-col gap-3 items-center py-4 px-5 rounded-2xl" style={{ background: "rgba(255,100,60,0.06)", border: "1.5px solid rgba(255,100,60,0.2)" }}>
              <p style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 600, color: "#b83030", textAlign: "center", fontSize: "0.9rem" }}>
                You&apos;re out of credits. Top up to generate stories!
              </p>
              <Link href="/checkout?plan=monthly" onClick={onClose} className="btn-primary" style={{ justifyContent: "center", padding: "0.6rem 1.4rem" }}>
                <Zap size={15} /> Get Magic Pass
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {!canAfford && (
                <p className="text-sm text-center" style={{ color: "#b83030", fontFamily: "'Nunito', sans-serif" }}>
                  Not enough credits ({availableCredits} available, {creditCost} needed).{" "}
                  <Link href="/checkout?plan=monthly" onClick={onClose} style={{ color: "var(--lf-teal)", fontWeight: 700 }}>Top up →</Link>
                </p>
              )}
              <button
                onClick={handleGenerate}
                disabled={!canGenerate}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-lg transition-all"
                style={{
                  background: canGenerate ? "linear-gradient(135deg,var(--lf-teal),#00a38d)" : "rgba(0,0,0,0.1)",
                  color: canGenerate ? "#fff" : "rgba(45,45,45,0.35)",
                  fontFamily: "'Baloo 2', sans-serif",
                  cursor: canGenerate ? "pointer" : "not-allowed",
                  boxShadow: canGenerate ? "0 6px 24px rgba(0,201,167,0.45)" : "none",
                }}
              >
                {generating ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Lalli &amp; Fafa are writing…
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    Generate Story {creditCost > 0 ? `· ${creditCost} credits` : ""}
                  </>
                )}
              </button>
              {generating && (
                <p className="text-center text-xs" style={{ color: "rgba(45,45,45,0.45)", fontFamily: "'Nunito', sans-serif" }}>
                  ✨ Crafting your personalised story — about 20 seconds…
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ── Drawer sub-components ── */

function DrawerSection({
  icon,
  title,
  color,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 p-4 rounded-2xl" style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,0.07)" }}>
      <div className="flex items-center gap-2">
        <span style={{ color }}>{icon}</span>
        <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "var(--lf-dark)" }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function OptionChip({ selected, onClick, label }: { selected: boolean; onClick: () => void; label: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition-all"
      style={{
        background: selected ? "var(--lf-teal)" : "#f7f5f0",
        border: `1.5px solid ${selected ? "var(--lf-teal)" : "rgba(0,0,0,0.08)"}`,
        color: selected ? "#fff" : "var(--lf-dark)",
        fontFamily: "'Nunito', sans-serif",
        fontSize: "0.88rem",
        boxShadow: selected ? "0 2px 8px rgba(0,201,167,0.3)" : "none",
      }}
    >
      {selected && <Check size={13} />}
      {label}
    </button>
  );
}

function DrawerCheckbox({
  checked,
  onChange,
  label,
  desc,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: React.ReactNode;
  desc: string;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex items-start gap-3 text-left rounded-xl p-3 transition-all"
      style={{
        background: checked ? "rgba(0,201,167,0.06)" : "transparent",
        border: `1.5px solid ${checked ? "var(--lf-teal)" : "rgba(0,0,0,0.08)"}`,
      }}
    >
      <div
        className="flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center mt-0.5 transition-all"
        style={{ background: checked ? "var(--lf-teal)" : "#fff", border: `2px solid ${checked ? "var(--lf-teal)" : "rgba(0,0,0,0.2)"}` }}
      >
        {checked && <Check size={11} color="#fff" />}
      </div>
      <div className="flex flex-col gap-0.5">
        <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.88rem", color: "var(--lf-dark)" }}>{label}</span>
        <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.78rem", color: "rgba(45,45,45,0.5)" }}>{desc}</span>
      </div>
    </button>
  );
}

/* ── Onboarding redirect ── */
function OnboardingRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/onboarding"); }, [router]);
  return null;
}
