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

  return (
    <>
      <AuthLoading>
        <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--lf-cream)" }}>
          <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "var(--lf-teal)", borderTopColor: "transparent" }} />
        </div>
      </AuthLoading>
      <Unauthenticated>
        <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--lf-cream)" }}>
          <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "var(--lf-teal)", borderTopColor: "transparent" }} />
        </div>
      </Unauthenticated>
      <Authenticated>
        {hasProfile === true ? (
          <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--lf-cream)" }}>
            <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "var(--lf-teal)", borderTopColor: "transparent" }} />
          </div>
        ) : hasProfile === false ? (
          <OnboardingForm />
        ) : (
          <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--lf-cream)" }}>
            <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "var(--lf-teal)", borderTopColor: "transparent" }} />
          </div>
        )}
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
    background: "#fff",
    border: "1.5px solid rgba(0,0,0,0.1)",
    fontSize: "0.95rem",
    color: "var(--lf-dark)",
    fontFamily: "'Nunito', sans-serif",
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--lf-cream)" }}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="relative" style={{ width: 32, height: 32 }}>
            <Image src="/logoNoBg.png" alt="Lalli Fafa" fill className="object-contain" />
          </div>
          <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.1rem", color: "var(--lf-dark)" }}>
            Lalli <span style={{ color: "var(--lf-teal)" }}>Fafa</span>
          </span>
        </Link>
        <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.85rem", color: "rgba(45,45,45,0.5)" }}>
          Step {step} of {STEPS}
        </p>
      </header>

      {/* Progress bar */}
      <div className="px-6">
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.08)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${(step / STEPS) * 100}%`, background: "var(--lf-teal)" }}
          />
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full" style={{ maxWidth: 480 }}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">

            {/* Step 1 — Parent name */}
            {step === 1 && (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <h1 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "2rem", color: "var(--lf-dark)" }}>
                    Hey there! 👋
                  </h1>
                  <p style={{ fontFamily: "'Nunito', sans-serif", color: "rgba(45,45,45,0.55)" }}>
                    Let&apos;s set up your family profile. What&apos;s your name?
                  </p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--lf-dark)" }}>Your name</label>
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
                  <h1 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "2rem", color: "var(--lf-dark)" }}>
                    Tell us about your child 🌟
                  </h1>
                  <p style={{ fontFamily: "'Nunito', sans-serif", color: "rgba(45,45,45,0.55)" }}>
                    They&apos;ll be the hero of every story!
                  </p>
                </div>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--lf-dark)" }}>Child&apos;s name</label>
                    <input type="text" placeholder="e.g. Aryan" value={form.childName} onChange={(e) => update("childName", e.target.value)} className="w-full px-4 py-3 rounded-2xl outline-none" style={inputStyle} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--lf-dark)" }}>Nickname (for stories)</label>
                    <input type="text" placeholder="e.g. Aru" value={form.childNickName} onChange={(e) => update("childNickName", e.target.value)} className="w-full px-4 py-3 rounded-2xl outline-none" style={inputStyle} />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex flex-col gap-1.5 flex-1">
                      <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--lf-dark)" }}>Age</label>
                      <input type="number" placeholder="e.g. 5" min="1" max="15" value={form.childAge} onChange={(e) => update("childAge", e.target.value)} className="w-full px-4 py-3 rounded-2xl outline-none" style={inputStyle} />
                    </div>
                    <div className="flex flex-col gap-1.5 flex-1">
                      <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--lf-dark)" }}>Gender</label>
                      <select value={form.childGender} onChange={(e) => update("childGender", e.target.value)} className="w-full px-4 py-3 rounded-2xl outline-none" style={inputStyle}>
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
                  <h1 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "2rem", color: "var(--lf-dark)" }}>
                    What&apos;s {form.childName || "their"}&apos;s favourite colour? 🎨
                  </h1>
                  <p style={{ fontFamily: "'Nunito', sans-serif", color: "rgba(45,45,45,0.55)" }}>
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
                        border: "2px solid",
                        borderColor: form.favoriteColor === c ? "var(--lf-teal)" : "rgba(0,0,0,0.1)",
                        background: form.favoriteColor === c ? "rgba(0,184,166,0.1)" : "#fff",
                        color: form.favoriteColor === c ? "var(--lf-teal)" : "var(--lf-dark)",
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
                  <h1 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "2rem", color: "var(--lf-dark)" }}>
                    Favourite animal? 🦁
                  </h1>
                  <p style={{ fontFamily: "'Nunito', sans-serif", color: "rgba(45,45,45,0.55)" }}>
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
                        border: "2px solid",
                        borderColor: form.favoriteAnimal === a ? "var(--lf-teal)" : "rgba(0,0,0,0.1)",
                        background: form.favoriteAnimal === a ? "rgba(0,184,166,0.1)" : "#fff",
                        color: form.favoriteAnimal === a ? "var(--lf-teal)" : "var(--lf-dark)",
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
                  style={{ border: "1.5px solid rgba(0,0,0,0.1)", color: "var(--lf-dark)", background: "#fff", fontFamily: "'Nunito', sans-serif" }}
                >
                  <ChevronLeft size={18} /> Back
                </button>
              )}

              {step < STEPS ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="btn-primary flex-1"
                  style={{ justifyContent: "center" }}
                >
                  Continue <ChevronRight size={18} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex-1"
                  style={{ justifyContent: "center" }}
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
  );
}
