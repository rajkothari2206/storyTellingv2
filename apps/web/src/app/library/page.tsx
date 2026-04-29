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
  ChevronRight,
  LayoutDashboard,
} from "lucide-react";
import { toast } from "sonner";

export default function LibraryPage() {
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  const stories = useQuery(api.stories.list, isAuthenticated ? {} : "skip");

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
        <div className="min-h-screen" style={{ background: "var(--lf-cream)" }}>
          {/* Nav */}
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
              <Link href="/dashboard" className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-black/5 transition-all" style={{ color: "var(--lf-dark)", fontFamily: "'Nunito', sans-serif" }}>
                <LayoutDashboard size={16} /> Dashboard
              </Link>
              <Link href="/profile" className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-black/5 transition-all" style={{ color: "var(--lf-dark)", fontFamily: "'Nunito', sans-serif" }}>
                <User size={16} /> Profile
              </Link>
              <button onClick={handleSignOut} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-black/5 transition-all" style={{ color: "rgba(45,45,45,0.5)", fontFamily: "'Nunito', sans-serif" }}>
                <LogOut size={16} /> Sign out
              </button>
            </nav>
          </header>

          <main className="max-w-5xl mx-auto px-6 py-10 flex flex-col gap-8">
            <div className="flex flex-col gap-1">
              <h1 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "clamp(1.8rem,4vw,2.4rem)", color: "var(--lf-dark)" }}>
                Story Library 📚
              </h1>
              <p style={{ color: "rgba(45,45,45,0.55)", fontFamily: "'Nunito', sans-serif" }}>
                All your personalised stories, ready to read anytime.
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "rgba(45,45,45,0.35)" }} />
                <input
                  type="text"
                  placeholder="Search stories…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl outline-none"
                  style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,0.08)", fontFamily: "'Nunito', sans-serif", fontSize: "0.9rem", color: "var(--lf-dark)" }}
                />
              </div>
              <select
                value={filterTheme}
                onChange={(e) => setFilterTheme(e.target.value)}
                className="px-4 py-3 rounded-2xl outline-none"
                style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,0.08)", fontFamily: "'Nunito', sans-serif", fontSize: "0.9rem", color: "var(--lf-dark)" }}
              >
                {themes.map((t) => <option key={t}>{t}</option>)}
              </select>
              <select
                value={filterLang}
                onChange={(e) => setFilterLang(e.target.value)}
                className="px-4 py-3 rounded-2xl outline-none"
                style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,0.08)", fontFamily: "'Nunito', sans-serif", fontSize: "0.9rem", color: "var(--lf-dark)" }}
              >
                {["All", "English", "Hindi"].map((l) => <option key={l}>{l}</option>)}
              </select>
            </div>

            {/* Grid */}
            {stories === undefined ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-40 rounded-2xl animate-pulse" style={{ background: "rgba(0,0,0,0.06)" }} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-4 py-20">
                <BookOpen size={48} style={{ color: "var(--lf-teal)", opacity: 0.4 }} />
                <p style={{ fontFamily: "'Nunito', sans-serif", color: "rgba(45,45,45,0.5)", fontSize: "1rem" }}>
                  {stories.length === 0 ? "No stories yet. Create your first one!" : "No stories match your search."}
                </p>
                {stories.length === 0 && (
                  <Link href="/generate" className="btn-primary">
                    <Sparkles size={16} /> Create story
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {(filtered as Array<{ _id: string; title?: string; params?: { theme?: string; language?: string; lesson?: string }; status?: string; _creationTime?: number }>).map((story) => (
                  <Link
                    key={story._id}
                    href={`/story/${story._id}`}
                    className="group flex flex-col gap-4 p-5 rounded-2xl transition-all hover:-translate-y-0.5 hover:shadow-md"
                    style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,0.06)" }}
                  >
                    {/* Colourful top strip */}
                    <div className="h-2 rounded-full" style={{ background: "linear-gradient(90deg, var(--lf-teal), #a855f7)" }} />
                    <div className="flex items-start justify-between gap-2">
                      <p style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, fontSize: "0.95rem", color: "var(--lf-dark)", lineHeight: 1.3 }}>
                        {story.title ?? "Untitled Story"}
                      </p>
                      <ChevronRight size={16} style={{ color: "var(--lf-teal)", flexShrink: 0, marginTop: 2 }} className="transition-transform group-hover:translate-x-0.5" />
                    </div>
                    <div className="flex flex-wrap gap-2 mt-auto">
                      {story.params?.theme && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: "rgba(0,184,166,0.1)", color: "var(--lf-teal)" }}>
                          {story.params.theme}
                        </span>
                      )}
                      {story.params?.language && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: "rgba(0,0,0,0.05)", color: "rgba(45,45,45,0.6)" }}>
                          {story.params.language}
                        </span>
                      )}
                      {story.status === "generating" && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: "rgba(249,199,0,0.15)", color: "#b8860b" }}>
                          Generating…
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </main>
        </div>
      </Authenticated>
    </>
  );
}
