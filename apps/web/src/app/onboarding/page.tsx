"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useMutation, useQuery, useConvexAuth, Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { Loader2, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";

const STEPS = 4;

const COLORS = ["Red", "Blue", "Green", "Yellow", "Purple", "Pink", "Orange", "Teal"];
const ANIMALS = ["Lion", "Elephant", "Tiger", "Monkey", "Dolphin", "Dragon", "Unicorn", "Owl", "Fox", "Rabbit"];

type Gender = "male" | "female" | "other";

interface FormData {
  parentName: string;
  childName: string;
  childAge: string;
  childNickName: string;
  childGender: Gender;
  favoriteColor: string;
  favoriteAnimal: string;
}

const STEP_META = [
  {
    heading: "Welcome to\nLalli Fafa! 👋",
    sub: "Let's create your family profile so every story feels like it was made just for your child.",
    emoji: "👨‍👩‍👧‍👦",
  },
  {
    heading: "Tell us about\nyour little hero 🌟",
    sub: "Your child becomes the main character in every story we create.",
    emoji: "⭐",
  },
  {
    heading: "What colours does\nyour child love? 🎨",
    sub: "We'll weave their favourite colour into the story's world and illustrations.",
    emoji: "🎨",
  },
  {
    heading: "One last thing —\nfavourite animal? 🦁",
    sub: "This character will appear in every adventure. Choose wisely!",
    emoji: "🐾",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const hasProfile = useQuery(api.userProfiles.hasProfile, isAuthenticated ? {} : "skip");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/sign-in");
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (hasProfile === true) router.replace("/dashboard");
  }, [hasProfile, router]);

  const spinner = (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--lf-dark)" }}>
      <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "var(--lf-teal)", borderTopColor: "transparent" }} />
    </div>
  );

  return (
    <>
      <AuthLoading>{spinner}</AuthLoading>
      <Unauthenticated>{spinner}</Unauthenticated>
      <Authenticated>
        {hasProfile === true ? spinner : hasProfile === false ? <OnboardingForm /> : spinner}
      </Authenticated>
    </>
  );
}

function OnboardingForm() {
  const router = useRouter();
  const createProfile = useMutation(api.userProfiles.createProfile);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormData>({
    parentName: "",
    childName: "",
    childAge: "",
    childNickName: "",
    childGender: "male",
    favoriteColor: "",
    favoriteAnimal: "",
  });

  function update(field: keyof FormData, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleNext() {
    if (step === 1 && !form.parentName.trim()) { toast.error("Please enter your name"); return; }
    if (step === 2 && (!form.childName.trim() || !form.childAge || !form.childNickName.trim())) {
      toast.error("Please fill in all fields"); return;
    }
    setStep((s) => s + 1);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await createProfile({
        parentName: form.parentName,
        childName: form.childName,
        childAge: parseInt(form.childAge),
        childGender: form.childGender,
        childNickName: form.childNickName,
        favoriteColor: form.favoriteColor,
        favoriteAnimal: form.favoriteAnimal,
      });
      toast.success("Welcome to Lalli Fafa! 🎉");
      router.replace("/dashboard");
    } catch {
      toast.error("Failed to create profile. Please try again.");
      setLoading(false);
    }
  }

  const inputStyle = {
    background: "rgba(255,255,255,0.08)",
    border: "1.5px solid rgba(255,255,255,0.15)",
    fontSize: "0.95rem",
    color: "#fff",
    fontFamily: "'Nunito', sans-serif",
  };

  const meta = STEP_META[step - 1];

  return (
    <div className="min-h-screen flex" style={{ background: "var(--lf-dark)" }}>

      {/* ── Left panel: character + progress ── */}
      <div
        className="hidden lg:flex flex-col justify-between p-12 w-[420px] flex-shrink-0 relative overflow-hidden"
        style={{ background: "linear-gradient(160deg,#131020 0%,#1c1640 100%)" }}
      >
        {/* Glow orbs */}
        <div className="absolute pointer-events-none" style={{ top: -80, right: -60, width: 300, height: 300, background: "radial-gradient(circle,rgba(0,201,167,0.18) 0%,transparent 70%)" }} />
        <div className="absolute pointer-events-none" style={{ bottom: 60, left: -60, width: 240, height: 240, background: "radial-gradient(circle,rgba(249,199,0,0.12) 0%,transparent 70%)" }} />

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 relative z-10">
          <div className="relative" style={{ width: 44, height: 44 }}>
            <Image src="/lf-logo.png" alt="Lalli Fafa" fill className="object-contain" />
          </div>
          <span style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: 20, fontWeight: 700, color: "#fff" }}>
            Lalli <span style={{ color: "var(--lf-teal)" }}>Fafa</span>
          </span>
        </Link>

        {/* Character image */}
        <div className="flex flex-col items-center gap-6 relative z-10">
          <div className="relative" style={{ width: 180, height: 180 }}>
            <Image src="/lf-hero.png" alt="Lalli and Fafa" fill className="object-contain animate-float-slow" />
          </div>

          {/* Step copy */}
          <div className="flex flex-col gap-3 text-center">
            <h2 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.45rem", color: "#fff", lineHeight: 1.25, whiteSpace: "pre-line" }}>
              {meta.heading}
            </h2>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.88rem", lineHeight: 1.7 }}>
              {meta.sub}
            </p>
          </div>

          {/* Step dots */}
          <div className="flex items-center gap-2">
            {Array.from({ length: STEPS }).map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-400"
                style={{
                  width: i + 1 === step ? 24 : 8,
                  height: 8,
                  background: i + 1 === step ? "var(--lf-teal)" : i + 1 < step ? "rgba(0,201,167,0.4)" : "rgba(255,255,255,0.15)",
                }}
              />
            ))}
          </div>
        </div>

        <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.8rem", position: "relative", zIndex: 10 }}>
          &copy; {new Date().getFullYear()} Lalli Fafa
        </p>
      </div>

      {/* ── Right panel: form ── */}
      <div className="flex-1 flex flex-col" style={{ background: "#0e0c1a" }}>

        {/* Mobile header */}
        <header className="flex items-center justify-between px-6 py-4 lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative" style={{ width: 36, height: 36 }}>
              <Image src="/lf-logo.png" alt="Lalli Fafa" fill className="object-contain" />
            </div>
            <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.1rem", color: "#fff" }}>
              Lalli <span style={{ color: "var(--lf-teal)" }}>Fafa</span>
            </span>
          </Link>
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.82rem", color: "rgba(255,255,255,0.35)" }}>
            Step {step} of {STEPS}
          </p>
        </header>

        {/* Progress bar */}
        <div className="px-6 pb-1">
          <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(step / STEPS) * 100}%`, background: "var(--lf-teal)" }}
            />
          </div>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full" style={{ maxWidth: 480 }}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">

              {/* Step 1 — Parent name */}
              {step === 1 && (
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <h1 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.9rem", color: "#fff" }}>
                      Hey there! 👋
                    </h1>
                    <p style={{ fontFamily: "'Nunito', sans-serif", color: "rgba(255,255,255,0.45)" }}>
                      Let&apos;s set up your family profile. What&apos;s your name?
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "rgba(255,255,255,0.65)" }}>Your name</label>
                    <input
                      type="text"
                      placeholder="e.g. Priya Sharma"
                      value={form.parentName}
                      onChange={(e) => update("parentName", e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl outline-none"
                      style={inputStyle}
                    />
                  </div>
                </div>
              )}

              {/* Step 2 — Child info */}
              {step === 2 && (
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <h1 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.9rem", color: "#fff" }}>
                      Tell us about your child 🌟
                    </h1>
                    <p style={{ fontFamily: "'Nunito', sans-serif", color: "rgba(255,255,255,0.45)" }}>
                      They&apos;ll be the hero of every story!
                    </p>
                  </div>
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "rgba(255,255,255,0.65)" }}>Child&apos;s name</label>
                      <input type="text" placeholder="e.g. Aryan" value={form.childName} onChange={(e) => update("childName", e.target.value)} className="w-full px-4 py-3 rounded-2xl outline-none" style={inputStyle} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "rgba(255,255,255,0.65)" }}>Nickname (used in stories)</label>
                      <input type="text" placeholder="e.g. Aru" value={form.childNickName} onChange={(e) => update("childNickName", e.target.value)} className="w-full px-4 py-3 rounded-2xl outline-none" style={inputStyle} />
                    </div>
                    <div className="flex gap-4">
                      <div className="flex flex-col gap-1.5 flex-1">
                        <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "rgba(255,255,255,0.65)" }}>Age</label>
                        <input type="number" placeholder="e.g. 5" min="1" max="15" value={form.childAge} onChange={(e) => update("childAge", e.target.value)} className="w-full px-4 py-3 rounded-2xl outline-none" style={inputStyle} />
                      </div>
                      <div className="flex flex-col gap-1.5 flex-1">
                        <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "rgba(255,255,255,0.65)" }}>Gender</label>
                        <select value={form.childGender} onChange={(e) => update("childGender", e.target.value)} className="w-full px-4 py-3 rounded-2xl outline-none" style={{ ...inputStyle, appearance: "none" as React.CSSProperties["appearance"] }}>
                          <option value="male">Boy</option>
                          <option value="female">Girl</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3 — Favourite colour */}
              {step === 3 && (
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <h1 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.9rem", color: "#fff" }}>
                      What&apos;s {form.childName || "their"}&apos;s favourite colour? 🎨
                    </h1>
                    <p style={{ fontFamily: "'Nunito', sans-serif", color: "rgba(255,255,255,0.45)" }}>
                      We&apos;ll weave it into the story illustrations.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => update("favoriteColor", c)}
                        className="px-4 py-2 rounded-full font-semibold text-sm transition-all"
                        style={{
                          fontFamily: "'Nunito', sans-serif",
                          border: "1.5px solid",
                          borderColor: form.favoriteColor === c ? "var(--lf-teal)" : "rgba(255,255,255,0.15)",
                          background: form.favoriteColor === c ? "rgba(0,201,167,0.15)" : "rgba(255,255,255,0.05)",
                          color: form.favoriteColor === c ? "var(--lf-teal)" : "rgba(255,255,255,0.65)",
                        }}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4 — Favourite animal */}
              {step === 4 && (
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <h1 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.9rem", color: "#fff" }}>
                      Favourite animal? 🦁
                    </h1>
                    <p style={{ fontFamily: "'Nunito', sans-serif", color: "rgba(255,255,255,0.45)" }}>
                      This character will appear in {form.childName || "their"}&apos;s adventures!
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {ANIMALS.map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => update("favoriteAnimal", a)}
                        className="px-4 py-2 rounded-full font-semibold text-sm transition-all"
                        style={{
                          fontFamily: "'Nunito', sans-serif",
                          border: "1.5px solid",
                          borderColor: form.favoriteAnimal === a ? "var(--lf-teal)" : "rgba(255,255,255,0.15)",
                          background: form.favoriteAnimal === a ? "rgba(0,201,167,0.15)" : "rgba(255,255,255,0.05)",
                          color: form.favoriteAnimal === a ? "var(--lf-teal)" : "rgba(255,255,255,0.65)",
                        }}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex gap-3 mt-2">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={() => setStep((s) => s - 1)}
                    className="flex items-center gap-1.5 px-5 py-3 rounded-2xl font-semibold transition-all"
                    style={{
                      border: "1.5px solid rgba(255,255,255,0.12)",
                      color: "rgba(255,255,255,0.6)",
                      background: "rgba(255,255,255,0.05)",
                      fontFamily: "'Nunito', sans-serif",
                    }}
                  >
                    <ChevronLeft size={18} /> Back
                  </button>
                )}

                {step < STEPS ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold transition-all hover:scale-105"
                    style={{
                      background: "linear-gradient(135deg,var(--lf-teal),#00a38d)",
                      color: "#fff",
                      fontFamily: "'Baloo 2', sans-serif",
                      fontSize: "1rem",
                      boxShadow: "0 4px 16px rgba(0,201,167,0.35)",
                      border: "none",
                    }}
                  >
                    Continue <ChevronRight size={18} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold transition-all hover:scale-105"
                    style={{
                      background: "linear-gradient(135deg,var(--lf-sunshine),#e6ac00)",
                      color: "var(--lf-dark)",
                      fontFamily: "'Baloo 2', sans-serif",
                      fontSize: "1rem",
                      boxShadow: "0 4px 16px rgba(255,193,7,0.4)",
                      border: "none",
                      opacity: loading ? 0.7 : 1,
                    }}
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                    {loading ? "Setting up…" : "Start the adventure!"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
