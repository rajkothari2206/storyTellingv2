"use client";

import { useState } from "react";
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
import {
  Sparkles,
  ChevronLeft,
  User,
  Zap,
  BookOpen,
  Globe,
  Loader2,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { UserPill } from "@/components/layout/UserPill";

export default function GeneratePage() {
  const { isAuthenticated } = useConvexAuth();

  return (
    <>
      <AuthLoading>
        <FullPageSpinner />
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
        <GenerateForm isAuthenticated={isAuthenticated} />
      </Authenticated>
    </>
  );
}

function GenerateForm({ isAuthenticated }: { isAuthenticated: boolean }) {
  const router = useRouter();

  const profile = useQuery(api.userProfiles.getProfile, isAuthenticated ? {} : "skip");
  const credits = useQuery(api.credit.list, isAuthenticated ? {} : "skip");
  const themes = useQuery(api["migration/theme"].list, isAuthenticated ? {} : "skip");
  const lessons = useQuery(api["migration/lesson"].list, isAuthenticated ? {} : "skip");
  // Languages come from DB so the admin panel toggle (isActive) controls what users see.
  const dbLanguages = useQuery((api as any)["migration/languages"].list, isAuthenticated ? {} : "skip");

  const generateStory = useAction(api.generateStory.enqueueStory);

  const availableCredits = credits?.[0]?.availableCredits ?? 0;
  const hasSecondChild = !!(profile as { child2Name?: string } | null | undefined)?.child2Name;

  const [childId, setChildId] = useState<"1" | "2">("1");
  const [storyType, setStoryType] = useState<string>("adventure");
  const [languageCode, setLanguageCode] = useState<string>("en");
  const [theme, setTheme] = useState("");
  const [lesson, setLesson] = useState("");
  const [generating, setGenerating] = useState(false);

  const CREDIT_COST = 80;
  const canAfford = availableCredits >= CREDIT_COST;
  const canGenerate = !!theme && canAfford && !generating;

  async function handleGenerate() {
    if (!canGenerate) return;
    setGenerating(true);
    try {
      // Resolve language name from code
      const langRecord = resolvedLanguages.find((l: any) => l.code === languageCode);
      const languageName = langRecord?.name ?? "English";

      const result = await generateStory({
        params: {
          theme,
          lesson: lesson || undefined,
          storyType,
          language: languageName,
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

  // Fallback story types if DB not yet seeded
  const FALLBACK_STORY_TYPES = [
    { code: "adventure", name: "Big Adventure", emoji: "🗺️", description: "A quest full of discovery, teamwork, and a twist that changes everything." },
    { code: "silly", name: "Silly & Funny", emoji: "🌀", description: "Chaotic fun where Fafa's impossible ideas somehow save the day." },
    { code: "cozy", name: "Cozy Bedtime", emoji: "🌙", description: "A gentle, slow story full of warmth — perfect for winding down." },
  ];
  const FALLBACK_LANGUAGES = [
    { code: "en", name: "English", nativeName: "English", flag: "🇬🇧" },
    { code: "hi", name: "Hindi", nativeName: "हिंदी", flag: "🇮🇳" },
    // Regional languages hidden until proper voice IDs are configured per language.
    // Re-enable from Admin → Languages when ready.
    { code: "bn", name: "Bengali", nativeName: "বাংলা", flag: "🇧🇩" },
    { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", flag: "🇮🇳" },
    { code: "ta", name: "Tamil", nativeName: "தமிழ்", flag: "🇮🇳" },
    { code: "mr", name: "Marathi", nativeName: "मराठी", flag: "🇮🇳" },
    { code: "te", name: "Telugu", nativeName: "తెలుగు", flag: "🇮🇳" },
  ];

  const resolvedStoryTypes = FALLBACK_STORY_TYPES;
  // Use DB list (respects isActive toggle from admin panel); fall back to EN+HI only if DB is empty or loading.
  const resolvedLanguages = (dbLanguages && dbLanguages.length > 0)
    ? dbLanguages
    : FALLBACK_LANGUAGES.filter((l: any) => l.code === "en" || l.code === "hi");

  const isLoading =
    profile === undefined ||
    themes === undefined ||
    lessons === undefined ||
    credits === undefined;

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg,#FFF8E7 0%,#E6FAF6 60%,#F3EEFF 100%)" }}>
      {/* Header */}
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
        <nav className="flex items-center gap-2">
          <Link href="/dashboard" className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-white/10" style={{ color: "rgba(255,255,255,0.6)", fontFamily: "'Nunito', sans-serif" }}>
            <ChevronLeft size={15} /> Dashboard
          </Link>
          <UserPill variant="dark" />
        </nav>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10 flex flex-col gap-8">
        {/* Page title */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "clamp(1.8rem,4vw,2.4rem)", color: "var(--lf-dark)" }}>
              Create a new story ✨
            </h1>
            <p style={{ color: "rgba(45,45,45,0.55)", fontFamily: "'Nunito', sans-serif", fontSize: "1rem" }}>
              Pick your options below — your personalised story is ready in seconds.
            </p>
          </div>
          <div className="relative flex-shrink-0 hidden sm:block" style={{ width: 64, height: 64 }}>
            <Image src="/lf-hero.png" alt="Lalli Fafa" fill className="object-contain" style={{ filter: "drop-shadow(0 4px 12px rgba(0,201,167,0.3))" }} />
          </div>
        </div>

        {/* Credits */}
        <div className="flex items-center justify-between px-5 py-3 rounded-2xl" style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,0.06)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div className="flex items-center gap-2">
            <Zap size={18} style={{ color: "#a855f7" }} />
            <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 600, color: "var(--lf-dark)", fontSize: "0.9rem" }}>
              {isLoading ? "—" : availableCredits} credits available
            </span>
          </div>
          {!isLoading && availableCredits < 120 && (
            <Link href="/pricing" className="text-xs font-semibold" style={{ color: "var(--lf-teal)", fontFamily: "'Nunito', sans-serif" }}>
              Top up →
            </Link>
          )}
        </div>

        {isLoading ? (
          <FullPageSpinner />
        ) : (
          <div className="flex flex-col gap-6">

            {/* Child selector */}
            {hasSecondChild && (
              <Section icon={<User size={18} />} title="Which child?">
                <div className="flex gap-3">
                  {(["1", "2"] as const).map((id) => {
                    const name = id === "1" ? profile?.childName : (profile as { child2Name?: string })?.child2Name;
                    return (
                      <OptionButton
                        key={id}
                        selected={childId === id}
                        onClick={() => setChildId(id)}
                        label={name ?? `Child ${id}`}
                      />
                    );
                  })}
                </div>
              </Section>
            )}

            {/* Story Type */}
            <Section icon={<Sparkles size={18} />} title="Story type">
              <div className="flex flex-col gap-3">
                {resolvedStoryTypes.map((st: any) => (
                  <button
                    key={st.code}
                    onClick={() => setStoryType(st.code)}
                    className="flex items-start gap-4 p-4 rounded-2xl text-left transition-all"
                    style={{
                      background: storyType === st.code ? "var(--lf-dark)" : "#fff",
                      border: `2px solid ${storyType === st.code ? "var(--lf-dark)" : "rgba(0,0,0,0.08)"}`,
                      color: storyType === st.code ? "#fff" : "var(--lf-dark)",
                    }}
                  >
                    <span style={{ fontSize: "1.8rem", flexShrink: 0, lineHeight: 1 }}>{st.emoji}</span>
                    <div className="flex flex-col gap-0.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1rem" }}>
                          {st.name}
                        </span>
                        {storyType === st.code && <Check size={15} style={{ color: "var(--lf-teal)" }} />}
                      </div>
                      <span style={{
                        fontFamily: "'Nunito', sans-serif",
                        fontSize: "0.83rem",
                        opacity: storyType === st.code ? 0.75 : 0.55,
                      }}>
                        {st.description}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.78rem", color: "rgba(45,45,45,0.4)", marginTop: 4 }}>
                Each story is ~300 words · ~2 min read · 80 credits
              </p>
            </Section>

            {/* Language */}
            <Section icon={<Globe size={18} />} title="Language">
              <div className="flex flex-wrap gap-2">
                {resolvedLanguages.map((lang: any) => (
                  <button
                    key={lang.code}
                    onClick={() => setLanguageCode(lang.code)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all"
                    style={{
                      background: languageCode === lang.code ? "var(--lf-teal)" : "#fff",
                      border: `1.5px solid ${languageCode === lang.code ? "var(--lf-teal)" : "rgba(0,0,0,0.1)"}`,
                      color: languageCode === lang.code ? "#fff" : "var(--lf-dark)",
                      fontFamily: "'Nunito', sans-serif",
                    }}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                    {lang.nativeName !== lang.name && (
                      <span style={{ opacity: 0.7, fontSize: "0.78rem" }}>({lang.nativeName})</span>
                    )}
                  </button>
                ))}
              </div>
            </Section>

            {/* Theme */}
            <Section icon={<Sparkles size={18} />} title="Theme *">
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
                    }}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
              {!theme && (
                <p className="text-xs mt-1" style={{ color: "rgba(45,45,45,0.4)", fontFamily: "'Nunito', sans-serif" }}>
                  Select a theme to continue
                </p>
              )}
            </Section>

            {/* Lesson */}
            <Section icon={<BookOpen size={18} />} title="Lesson (optional)">
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
            </Section>

            {/* Generate button */}
            {availableCredits < 20 ? (
              <div className="flex flex-col gap-3 items-center py-6 px-6 rounded-2xl" style={{ background: "rgba(255,100,60,0.06)", border: "1.5px solid rgba(255,100,60,0.2)" }}>
                <p style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 600, color: "#b83030", textAlign: "center", fontSize: "0.95rem" }}>
                  You&apos;re out of credits. Top up to generate stories!
                </p>
                <Link href="/pricing" className="btn-primary" style={{ justifyContent: "center" }}>
                  <Zap size={16} /> View plans
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {!canAfford && (
                  <p className="text-sm text-center" style={{ color: "#b83030", fontFamily: "'Nunito', sans-serif" }}>
                    Not enough credits ({availableCredits} available, {CREDIT_COST} needed).{" "}
                    <Link href="/pricing" style={{ color: "var(--lf-teal)", fontWeight: 600 }}>Top up →</Link>
                  </p>
                )}
                <button
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  className="btn-primary w-full justify-center"
                  style={{
                    fontSize: "1.05rem",
                    padding: "1rem",
                    opacity: canGenerate ? 1 : 0.45,
                    cursor: canGenerate ? "pointer" : "not-allowed",
                  }}
                >
                  {generating ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Starting your story…
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      Generate story · {CREDIT_COST} credits
                    </>
                  )}
                </button>
                {generating && (
                  <p className="text-center text-sm" style={{ color: "rgba(45,45,45,0.5)", fontFamily: "'Nunito', sans-serif" }}>
                    Opening your story… ✨
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

/* ── Small helpers ── */

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 p-5 rounded-2xl" style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,0.06)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
      <div className="flex items-center gap-2" style={{ color: "var(--lf-dark)" }}>
        <span style={{ color: "var(--lf-teal)" }}>{icon}</span>
        <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, fontSize: "0.95rem" }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function OptionButton({ selected, onClick, label }: { selected: boolean; onClick: () => void; label: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-semibold transition-all"
      style={{
        background: selected ? "var(--lf-teal)" : "#f7f5f0",
        border: `1.5px solid ${selected ? "var(--lf-teal)" : "rgba(0,0,0,0.08)"}`,
        color: selected ? "#fff" : "var(--lf-dark)",
        fontFamily: "'Nunito', sans-serif",
        fontSize: "0.9rem",
      }}
    >
      {selected && <Check size={14} />}
      {label}
    </button>
  );
}

function FullPageSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(160deg,#FFF8E7 0%,#E6FAF6 60%,#F3EEFF 100%)" }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "var(--lf-teal)", borderTopColor: "transparent" }} />
        <p style={{ color: "var(--lf-dark)", fontFamily: "'Nunito', sans-serif", opacity: 0.6 }}>Loading…</p>
      </div>
    </div>
  );
}
