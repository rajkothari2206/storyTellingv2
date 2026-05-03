"use client";

import { useState, useMemo } from "react";
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
import {
  BookOpen,
  Search,
  Sparkles,
  LogOut,
  User,
  Play,
  LayoutDashboard,
  Zap,
  Library,
  Loader2,
  X,
  SlidersHorizontal,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

/* ── Theme → scene image ── */
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

/* ── Theme accent colours (for card borders / badges) ── */
const THEME_ACCENTS: Record<string, string> = {
  adventure: "#00c9a7",
  friendship: "#f9c700",
  courage: "#ff6b35",
  kindness: "#e84040",
  bedtime: "#a855f7",
  space: "#2979ff",
  nature: "#00c9a7",
  culture: "#f9c700",
  india: "#ff6b35",
  mythology: "#a855f7",
  animals: "#00c9a7",
  games: "#2979ff",
  travel: "#f9c700",
};

function getAccentForTheme(theme?: string): string {
  if (!theme) return "#00c9a7";
  const key = theme.toLowerCase();
  for (const [k, v] of Object.entries(THEME_ACCENTS)) {
    if (key.includes(k)) return v;
  }
  const all = Object.values(THEME_ACCENTS);
  return all[Math.abs((theme.charCodeAt(0) ?? 0)) % all.length];
}

function formatDate(ts?: number): string {
  if (!ts) return "";
  return new Date(ts).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/* ================================================================
   PAGE
   ================================================================ */
export default function LibraryPage() {
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();

  const stories = useQuery(api.stories.list, isAuthenticated ? {} : "skip");
  const credits = useQuery(api.credit.list, isAuthenticated ? {} : "skip");
  const availableCredits = credits?.[0]?.availableCredits ?? 0;

  const [search, setSearch] = useState("");
  const [filterTheme, setFilterTheme] = useState("All");
  const [filterLang, setFilterLang] = useState("All");

  const themes = useMemo(() => {
    const set = new Set<string>();
    (stories ?? []).forEach((s: { params?: { theme?: string } }) => {
      if (s.params?.theme) set.add(s.params.theme as string);
    });
    return ["All", ...Array.from(set)];
  }, [stories]);

  const filtered = useMemo(() => {
    return (stories ?? []).filter((s: { title?: string; params?: { theme?: string; language?: string } }) => {
      const matchesSearch =
        !search ||
        (s.title ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (s.params?.theme ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesTheme = filterTheme === "All" || s.params?.theme === filterTheme;
      const matchesLang = filterLang === "All" || s.params?.language === filterLang;
      return matchesSearch && matchesTheme && matchesLang;
    });
  }, [stories, search, filterTheme, filterLang]);

  const hasActiveFilters = search || filterTheme !== "All" || filterLang !== "All";

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/");
    toast.success("Signed out");
  }

  return (
    <>
      <style>{`
        @keyframes fade-in {
          from{opacity:0;transform:translateY(14px);}
          to{opacity:1;transform:translateY(0);}
        }
        @keyframes shimmer {
          0%{background-position:-400px 0;}
          100%{background-position:400px 0;}
        }
        @keyframes float {
          0%,100%{transform:translateY(0px);}
          50%{transform:translateY(-6px);}
        }
        .story-card{animation:fade-in 0.4s ease both;}
        .shimmer-card{
          background:linear-gradient(90deg,rgba(0,0,0,0.06) 25%,rgba(0,0,0,0.1) 50%,rgba(0,0,0,0.06) 75%);
          background-size:400px 100%;
          animation:shimmer 1.4s ease-in-out infinite;
        }
      `}</style>

      <AuthLoading>
        <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg,#FFF8E7 0%,#E6FAF6 100%)" }}>
          <div className="flex flex-col items-center gap-4">
            <div className="relative" style={{ width: 60, height: 60 }}>
              <Image src="/lf-logo.png" alt="Lalli Fafa" fill className="object-contain animate-bounce" />
            </div>
            <p style={{ color: "var(--lf-dark)", fontFamily: "'Baloo 2', sans-serif", fontWeight: 700 }}>
              Loading your library…
            </p>
          </div>
        </div>
      </AuthLoading>

      <Unauthenticated>
        <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg,#FFF8E7 0%,#E6FAF6 100%)" }}>
          <div className="flex flex-col items-center gap-4">
            <p style={{ color: "var(--lf-dark)", fontFamily: "'Nunito', sans-serif" }}>Please sign in to view your library.</p>
            <Link href="/sign-in" className="btn-primary">Sign in</Link>
          </div>
        </div>
      </Unauthenticated>

      <Authenticated>
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

            <nav className="hidden md:flex items-center gap-1">
              <Link href="/dashboard" className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all hover:bg-black/5" style={{ color: "var(--lf-dark)", fontFamily: "'Nunito', sans-serif" }}>
                <LayoutDashboard size={15} /> Dashboard
              </Link>
              <Link href="/library" className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all" style={{ color: "var(--lf-teal)", fontFamily: "'Nunito', sans-serif", background: "rgba(0,201,167,0.1)" }}>
                <Library size={15} /> Library
              </Link>
              <Link href="/profile" className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all hover:bg-black/5" style={{ color: "var(--lf-dark)", fontFamily: "'Nunito', sans-serif" }}>
                <User size={15} /> Profile
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: "linear-gradient(135deg,rgba(168,85,247,0.12),rgba(168,85,247,0.06))", border: "1.5px solid rgba(168,85,247,0.25)" }}>
                <Zap size={14} style={{ color: "#a855f7" }} />
                <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.82rem", color: "#7c3aed" }}>
                  {availableCredits} credits
                </span>
              </div>
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-bold transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg,var(--lf-teal),#00a38d)", color: "#fff", fontFamily: "'Nunito', sans-serif" }}
              >
                <Sparkles size={14} /> New Story
              </Link>
              <button onClick={handleSignOut} className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-semibold transition-all hover:bg-black/5" style={{ color: "rgba(45,45,45,0.45)", fontFamily: "'Nunito', sans-serif" }}>
                <LogOut size={15} />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          </header>

          <main className="max-w-6xl mx-auto px-5 py-8 flex flex-col gap-8">

            {/* ── Hero banner ── */}
            <section
              className="relative overflow-hidden rounded-3xl"
              style={{ background: "linear-gradient(135deg,#131020 0%,#1a1740 60%,#0d2d26 100%)", padding: "32px 36px" }}
            >
              {/* Glow orbs */}
              <div className="absolute pointer-events-none" style={{ top: -80, right: 60, width: 320, height: 320, background: "radial-gradient(circle,rgba(0,201,167,0.2) 0%,transparent 70%)" }} />
              <div className="absolute pointer-events-none" style={{ bottom: -60, left: 40, width: 220, height: 220, background: "radial-gradient(circle,rgba(249,199,0,0.18) 0%,transparent 70%)" }} />

              {/* Floating emoji decorations */}
              <span className="absolute text-2xl pointer-events-none" style={{ top: 18, right: "18%", animation: "float 3.2s ease-in-out infinite" }}>📚</span>
              <span className="absolute text-xl pointer-events-none" style={{ bottom: 20, right: "35%", animation: "float 2.8s ease-in-out infinite", animationDelay: "1s" }}>✨</span>
              <span className="absolute text-lg pointer-events-none" style={{ top: 30, left: "45%", animation: "float 3.6s ease-in-out infinite", animationDelay: "0.5s" }}>⭐</span>

              <div className="relative flex flex-col sm:flex-row items-center gap-6">
                <div className="flex-1 flex flex-col gap-3">
                  <p style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 600, fontSize: "0.82rem", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    Your Story Library
                  </p>
                  <h1 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "clamp(1.7rem,3.5vw,2.5rem)", color: "#fff", lineHeight: 1.2 }}>
                    Every story,{" "}
                    <span style={{ color: "var(--lf-sunshine)" }}>ready to revisit</span> 🌟
                  </h1>
                  <p style={{ fontFamily: "'Nunito', sans-serif", color: "rgba(255,255,255,0.55)", fontSize: "0.92rem", lineHeight: 1.6 }}>
                    All your personalised Lalli &amp; Fafa stories in one magical place.
                  </p>

                  {/* Story count badges */}
                  <div className="flex items-center gap-3 flex-wrap mt-1">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "rgba(0,201,167,0.2)", border: "1px solid rgba(0,201,167,0.3)" }}>
                      <BookOpen size={14} style={{ color: "#00c9a7" }} />
                      <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.82rem", color: "#00c9a7" }}>
                        {stories === undefined ? "…" : stories.length} {stories?.length === 1 ? "story" : "stories"}
                      </span>
                    </div>
                    {themes.length > 1 && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "rgba(249,199,0,0.15)", border: "1px solid rgba(249,199,0,0.3)" }}>
                        <Sparkles size={14} style={{ color: "#f9c700" }} />
                        <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.82rem", color: "#f9c700" }}>
                          {themes.length - 1} {themes.length - 1 === 1 ? "theme" : "themes"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Character stack */}
                <div className="relative flex-shrink-0" style={{ width: 140, height: 140 }}>
                  <Image
                    src="/lf-hero.png"
                    alt="Lalli and Fafa reading"
                    fill
                    className="object-contain"
                    style={{ filter: "drop-shadow(0 8px 24px rgba(0,201,167,0.35))" }}
                  />
                </div>
              </div>
            </section>

            {/* ── Search + Filters ── */}
            <section className="flex flex-col gap-4">
              {/* Search bar */}
              <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "rgba(45,45,45,0.35)" }} />
                <input
                  type="text"
                  placeholder="Search by title or theme…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 rounded-2xl outline-none transition-all"
                  style={{
                    background: "#fff",
                    border: "1.5px solid rgba(0,0,0,0.08)",
                    fontFamily: "'Nunito', sans-serif",
                    fontSize: "0.95rem",
                    color: "var(--lf-dark)",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
                  }}
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(0,0,0,0.1)", color: "rgba(45,45,45,0.6)" }}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Filter pills row */}
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <div className="flex items-center gap-1.5 flex-shrink-0" style={{ color: "rgba(45,45,45,0.45)" }}>
                  <SlidersHorizontal size={15} />
                  <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.82rem", fontWeight: 600 }}>Filter:</span>
                </div>

                {/* Theme pills */}
                <div className="flex flex-wrap gap-2 flex-1">
                  {themes.map((t) => (
                    <button
                      key={t}
                      onClick={() => setFilterTheme(t)}
                      className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                      style={{
                        background: filterTheme === t
                          ? (t === "All" ? "var(--lf-dark)" : getAccentForTheme(t))
                          : "rgba(255,255,255,0.8)",
                        color: filterTheme === t ? "#fff" : "rgba(45,45,45,0.7)",
                        border: `1.5px solid ${filterTheme === t ? "transparent" : "rgba(0,0,0,0.1)"}`,
                        fontFamily: "'Nunito', sans-serif",
                        boxShadow: filterTheme === t ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
                      }}
                    >
                      {t === "All" ? "🌍 All themes" : t}
                    </button>
                  ))}
                </div>

                {/* Language toggle */}
                <div className="flex items-center gap-1 flex-shrink-0 p-1 rounded-full" style={{ background: "rgba(255,255,255,0.8)", border: "1.5px solid rgba(0,0,0,0.08)" }}>
                  {["All", "English", "Hindi"].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setFilterLang(lang)}
                      className="px-3 py-1 rounded-full text-xs font-bold transition-all"
                      style={{
                        background: filterLang === lang ? "var(--lf-teal)" : "transparent",
                        color: filterLang === lang ? "#fff" : "rgba(45,45,45,0.55)",
                        fontFamily: "'Nunito', sans-serif",
                      }}
                    >
                      {lang === "English" ? "🇬🇧 EN" : lang === "Hindi" ? "🇮🇳 HI" : "All"}
                    </button>
                  ))}
                </div>

                {/* Clear filters */}
                {hasActiveFilters && (
                  <button
                    onClick={() => { setSearch(""); setFilterTheme("All"); setFilterLang("All"); }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all flex-shrink-0"
                    style={{ background: "rgba(232,64,64,0.1)", color: "#e84040", border: "1px solid rgba(232,64,64,0.2)", fontFamily: "'Nunito', sans-serif" }}
                  >
                    <X size={11} /> Clear
                  </button>
                )}
              </div>

              {/* Results count */}
              {stories !== undefined && (
                <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.82rem", color: "rgba(45,45,45,0.45)" }}>
                  {hasActiveFilters
                    ? `${filtered.length} of ${stories.length} stories`
                    : `${stories.length} ${stories.length === 1 ? "story" : "stories"} in your library`}
                </p>
              )}
            </section>

            {/* ── Story grid ── */}
            {stories === undefined ? (
              /* Skeleton loaders */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="rounded-3xl overflow-hidden" style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,0.07)" }}>
                    <div className="shimmer-card" style={{ height: 160 }} />
                    <div className="p-4 flex flex-col gap-2">
                      <div className="shimmer-card rounded-full" style={{ height: 16, width: "70%" }} />
                      <div className="shimmer-card rounded-full" style={{ height: 12, width: "45%" }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              /* Empty state */
              <div
                className="flex flex-col items-center gap-5 py-20 rounded-3xl"
                style={{ background: "linear-gradient(135deg,rgba(255,193,7,0.08),rgba(0,201,167,0.06))", border: "2px dashed rgba(0,201,167,0.25)" }}
              >
                <div className="relative" style={{ width: 90, height: 90 }}>
                  <Image src="/lf-hero.png" alt="Lalli Fafa" fill className="object-contain" style={{ animation: "float 3s ease-in-out infinite" }} />
                </div>
                <div className="text-center flex flex-col gap-1.5">
                  <p style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.2rem", color: "var(--lf-dark)" }}>
                    {stories.length === 0 ? "No stories yet!" : "No stories match your search"}
                  </p>
                  <p style={{ fontFamily: "'Nunito', sans-serif", color: "rgba(45,45,45,0.5)", fontSize: "0.9rem" }}>
                    {stories.length === 0
                      ? "Create your first magical Lalli & Fafa story"
                      : "Try adjusting your search or filters"}
                  </p>
                </div>
                {stories.length === 0 ? (
                  <Link href="/dashboard" className="btn-primary">
                    <Sparkles size={16} /> Create First Story
                  </Link>
                ) : (
                  <button
                    onClick={() => { setSearch(""); setFilterTheme("All"); setFilterLang("All"); }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm"
                    style={{ background: "var(--lf-teal)", color: "#fff", fontFamily: "'Nunito', sans-serif" }}
                  >
                    <X size={14} /> Clear filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {(filtered as Array<{
                  _id: string;
                  title?: string;
                  params?: { theme?: string; language?: string; lesson?: string; length?: string };
                  status?: string;
                  _creationTime?: number;
                  coverImageUrl?: string;
                }>).map((story, idx) => {
                  const sceneImg = story.coverImageUrl ?? getSceneForTheme(story.params?.theme);
                  const accent = getAccentForTheme(story.params?.theme);
                  const date = formatDate(story._creationTime);

                  return (
                    <Link
                      key={story._id}
                      href={`/story/${story._id}`}
                      className="story-card group flex flex-col rounded-3xl overflow-hidden transition-all hover:-translate-y-1.5 hover:shadow-2xl"
                      style={{
                        background: "#fff",
                        border: `1.5px solid ${accent}33`,
                        boxShadow: `0 4px 20px ${accent}18`,
                        animationDelay: `${Math.min(idx * 0.05, 0.4)}s`,
                      }}
                    >
                      {/* Scene image */}
                      <div className="relative overflow-hidden flex-shrink-0" style={{ height: 160 }}>
                        <Image
                          src={sceneImg}
                          alt={story.title ?? "Story"}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-108"
                          style={{ objectPosition: "center 30%" }}
                        />
                        {/* Gradient overlay */}
                        <div className="absolute inset-0" style={{ background: "linear-gradient(to top,rgba(0,0,0,0.5) 0%,rgba(0,0,0,0.1) 50%,transparent 100%)" }} />

                        {/* Top badges */}
                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                          {story.params?.language && (
                            <span
                              className="px-2.5 py-1 rounded-full text-xs font-bold"
                              style={{ background: "rgba(255,255,255,0.92)", color: "var(--lf-dark)", backdropFilter: "blur(4px)" }}
                            >
                              {story.params.language === "Hindi" ? "🇮🇳 Hindi" : "🇬🇧 English"}
                            </span>
                          )}
                          {story.status === "generating" && (
                            <span
                              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ml-auto"
                              style={{ background: "rgba(249,199,0,0.95)", color: "#131020" }}
                            >
                              <Loader2 size={10} className="animate-spin" /> Generating…
                            </span>
                          )}
                        </div>

                        {/* Play button — appears on hover */}
                        <div className="absolute bottom-3 right-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100"
                            style={{ background: accent, boxShadow: `0 4px 16px ${accent}66` }}
                          >
                            <Play size={16} fill="#fff" color="#fff" />
                          </div>
                        </div>

                        {/* Theme accent bar at bottom of image */}
                        <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: accent }} />
                      </div>

                      {/* Card body */}
                      <div className="flex flex-col gap-2.5 p-4 flex-1">
                        <p style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, fontSize: "0.97rem", color: "var(--lf-dark)", lineHeight: 1.35 }}>
                          {story.title ?? "Untitled Story"}
                        </p>

                        <div className="flex flex-wrap items-center gap-1.5">
                          {story.params?.theme && (
                            <span
                              className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                              style={{ background: `${accent}18`, color: accent }}
                            >
                              {story.params.theme}
                            </span>
                          )}
                          {story.params?.lesson && (
                            <span
                              className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                              style={{ background: "rgba(0,0,0,0.05)", color: "rgba(45,45,45,0.6)" }}
                            >
                              {story.params.lesson}
                            </span>
                          )}
                          {story.params?.length && (
                            <span
                              className="px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize"
                              style={{ background: "rgba(0,0,0,0.05)", color: "rgba(45,45,45,0.6)" }}
                            >
                              {story.params.length}
                            </span>
                          )}
                        </div>

                        {date && (
                          <div className="flex items-center gap-1 mt-auto" style={{ color: "rgba(45,45,45,0.38)" }}>
                            <Clock size={11} />
                            <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.75rem" }}>{date}</span>
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* ── Bottom CTA strip ── */}
            {stories !== undefined && stories.length > 0 && (
              <section
                className="rounded-3xl overflow-hidden relative"
                style={{ background: "linear-gradient(135deg,#131020 0%,#1a1740 100%)", padding: "24px 28px" }}
              >
                <div className="absolute pointer-events-none" style={{ top: -40, right: 20, width: 200, height: 200, background: "radial-gradient(circle,rgba(0,201,167,0.2) 0%,transparent 70%)" }} />
                <div className="relative flex flex-col sm:flex-row items-center gap-5">
                  <div className="relative flex-shrink-0" style={{ width: 64, height: 64 }}>
                    <Image src="/lf-hero.png" alt="Lalli Fafa" fill className="object-contain" />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <p style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.1rem", color: "#fff" }}>
                      Ready for another adventure?
                    </p>
                    <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.85rem", color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
                      Lalli &amp; Fafa have more stories to tell — each one unique.
                    </p>
                  </div>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold flex-shrink-0 transition-all hover:scale-105"
                    style={{ background: "linear-gradient(135deg,var(--lf-teal),#00a38d)", color: "#fff", fontFamily: "'Baloo 2', sans-serif", fontSize: "0.95rem", boxShadow: "0 4px 16px rgba(0,201,167,0.4)" }}
                  >
                    <Sparkles size={16} /> Create New Story
                  </Link>
                </div>
              </section>
            )}

          </main>
        </div>
      </Authenticated>
    </>
  );
}
