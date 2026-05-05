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
  Library,
  User,
  Zap,
  BookOpen,
  Globe,
  Ruler,
  Heart,
  FileText,
  Loader2,
  Check,
} from "lucide-react";
import { toast } from "sonner";

const LANGUAGES = ["English", "Hindi"] as const;
const LENGTHS: { value: "short" | "medium" | "long"; label: string; desc: string; credits: number; premium?: boolean }[] = [
  { value: "short", label: "Short", desc: "~3 min read", credits: 60 },
  { value: "medium", label: "Medium", desc: "~6 min read", credits: 80 },
  { value: "long", label: "Long", desc: "~10 min read", credits: 0, premium: true },
];

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

  const isLoading = profile === undefined || themes === undefined || lessons === undefined || credits === undefined;

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
        <nav className="flex items-center gap-1">
          <Link href="/dashboard" className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-white/10" style={{ color: "rgba(255,255,255,0.6)", fontFamily: "'Nunito', sans-serif" }}>
            <ChevronLeft size={15} /> Dashboard
          </Link>
          <Link href="/library" className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-white/10" style={{ color: "rgba(255,255,255,0.6)", fontFamily: "'Nunito', sans-serif" }}>
            <Library size={15} /> Library
          </Link>
          <Link href="/profile" className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-white/10" style={{ color: "rgba(255,255,255,0.6)", fontFamily: "'Nunito', sans-serif" }}>
            <User size={15} /> Profile
          </Link>
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
          {availableCredits < 80 && (
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

            {/* Language */}
            <Section icon={<Globe size={18} />} title="Language">
              <div className="flex gap-3">
                {LANGUAGES.map((lang) => (
                  <OptionButton
                    key={lang}
                    selected={language === lang}
                    onClick={() => setLanguage(lang)}
                    label={lang === "English" ? "🇬🇧 English" : "🇮🇳 Hindi"}
                  />
                ))}
              </div>
            </Section>

            {/* Length */}
            <Section icon={<Ruler size={18} />} title="Story length">
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
                        border: `1.5px solid ${length === l.value ? "var(--lf-teal)" : "rgba(0,0,0,0.08)"}`,
                        color: length === l.value ? "#fff" : "var(--lf-dark)",
                        opacity: locked ? 0.5 : 1,
                        cursor: locked ? "not-allowed" : "pointer",
                        minWidth: 110,
                      }}
                    >
                      <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, fontSize: "0.95rem" }}>
                        {l.label} {locked ? "🔒" : ""}
                      </span>
                      <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.78rem", opacity: 0.75 }}>
                        {l.desc}
                      </span>
                      {!l.premium && (
                        <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.75rem", fontWeight: 600, opacity: 0.85 }}>
                          {l.credits} credits
                        </span>
                      )}
                    </button>
                  );
                })}
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

            {/* Extra options */}
            <Section icon={<Heart size={18} />} title="Personalisation">
              <div className="flex flex-col gap-3">
                <Checkbox
                  checked={useFavorites}
                  onChange={setUseFavorites}
                  label="Personalise with favourites"
                  desc="Include your child's favourite colour, animal, and interests"
                />
                <Checkbox
                  checked={textOnly}
                  onChange={(v) => {
                    setTextOnly(v);
                    if (v) setLength("short");
                  }}
                  label={<span className="flex items-center gap-1.5"><FileText size={14} /> Text only (20 credits)</span>}
                  desc="Skip AI illustrations — just the story text"
                />
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
                    Not enough credits ({availableCredits} available, {creditCost} needed).{" "}
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
                      Generating your story…
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      Generate story {creditCost > 0 ? `· ${creditCost} credits` : ""}
                    </>
                  )}
                </button>
                {generating && (
                  <p className="text-center text-sm" style={{ color: "rgba(45,45,45,0.5)", fontFamily: "'Nunito', sans-serif" }}>
                    Lalli & Fafa are crafting your story — this takes about 20 seconds ✨
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

function Checkbox({
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
      className="flex items-start gap-3 text-left transition-all rounded-xl p-3"
      style={{ background: checked ? "rgba(0,184,166,0.06)" : "transparent", border: `1.5px solid ${checked ? "var(--lf-teal)" : "rgba(0,0,0,0.06)"}` }}
    >
      <div
        className="flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center mt-0.5 transition-all"
        style={{ background: checked ? "var(--lf-teal)" : "#fff", border: `2px solid ${checked ? "var(--lf-teal)" : "rgba(0,0,0,0.2)"}` }}
      >
        {checked && <Check size={12} color="#fff" />}
      </div>
      <div className="flex flex-col gap-0.5">
        <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "var(--lf-dark)" }}>
          {label}
        </span>
        <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.8rem", color: "rgba(45,45,45,0.5)" }}>
          {desc}
        </span>
      </div>
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
