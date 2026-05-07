"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  useMutation,
  useQuery,
  useConvexAuth,
  Authenticated,
  AuthLoading,
  Unauthenticated,
} from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { Loader2, ChevronRight, ChevronLeft, Sparkles, Camera } from "lucide-react";

const STEPS = 5;

const COLORS = [
  { name: "Red",      hex: "#ef4444" },
  { name: "Pink",     hex: "#ec4899" },
  { name: "Orange",   hex: "#f97316" },
  { name: "Yellow",   hex: "#eab308" },
  { name: "Lime",     hex: "#84cc16" },
  { name: "Green",    hex: "#22c55e" },
  { name: "Mint",     hex: "#34d399" },
  { name: "Teal",     hex: "#14b8a6" },
  { name: "Sky Blue", hex: "#38bdf8" },
  { name: "Blue",     hex: "#3b82f6" },
  { name: "Navy",     hex: "#1e3a8a" },
  { name: "Purple",   hex: "#a855f7" },
  { name: "Lavender", hex: "#c084fc" },
  { name: "Magenta",  hex: "#d946ef" },
  { name: "Coral",    hex: "#fb7185" },
  { name: "Gold",     hex: "#f59e0b" },
];

const ANIMALS = [
  { name: "Lion",     emoji: "🦁" },
  { name: "Elephant", emoji: "🐘" },
  { name: "Tiger",    emoji: "🐯" },
  { name: "Panda",    emoji: "🐼" },
  { name: "Unicorn",  emoji: "🦄" },
  { name: "Dragon",   emoji: "🐉" },
  { name: "Dolphin",  emoji: "🐬" },
  { name: "Giraffe",  emoji: "🦒" },
  { name: "Owl",      emoji: "🦉" },
  { name: "Fox",      emoji: "🦊" },
  { name: "Rabbit",   emoji: "🐰" },
  { name: "Penguin",  emoji: "🐧" },
  { name: "Monkey",   emoji: "🐒" },
  { name: "Parrot",   emoji: "🦜" },
  { name: "Cat",      emoji: "🐱" },
  { name: "Dog",      emoji: "🐶" },
];

type Gender = "male" | "female" | "other";

interface FormData {
  parentName: string;
  childName: string;
  childNickName: string;
  childDateOfBirth: string;
  childGender: Gender;
  favoriteColor: string;
  favoriteAnimal: string;
}

const STEP_META = [
  {
    heading: "Welcome to\nLalli Fafa! 👋",
    sub: "Let's create your family profile. Takes about 2 minutes and every story will feel made just for your child.",
  },
  {
    heading: "Who's the\nhero? 🌟",
    sub: "Your child becomes the star of every adventure we create together.",
  },
  {
    heading: "Add a photo\n(optional) 📸",
    sub: "We use it to generate a personalised cartoon avatar that appears in every story.",
  },
  {
    heading: "Pick a\nfavourite colour 🎨",
    sub: "We weave it into every story illustration — their world, their colours.",
  },
  {
    heading: "Choose a\ncompanion! 🐾",
    sub: "This animal friend will join every single adventure. Choose wisely!",
  },
];

function computeAge(dob: string): number {
  if (!dob) return 0;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// ─── Page shell ───────────────────────────────────────────────────────────────

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
      <div
        className="w-10 h-10 rounded-full border-4 animate-spin"
        style={{ borderColor: "rgba(0,201,167,0.25)", borderTopColor: "var(--lf-teal)" }}
      />
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

// ─── Form ─────────────────────────────────────────────────────────────────────

function OnboardingForm() {
  const router = useRouter();
  const createProfile = useMutation(api.userProfiles.createProfile);
  const generateUploadUrl = useMutation(api.userProfiles.generateProfilePictureUploadUrl);
  const setProfilePicture = useMutation(api.userProfiles.setProfilePicture);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [form, setForm] = useState<FormData>({
    parentName: "",
    childName: "",
    childNickName: "",
    childDateOfBirth: "",
    childGender: "male",
    favoriteColor: "",
    favoriteAnimal: "",
  });

  function update(field: keyof FormData, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Photo must be under 5 MB");
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function clearPhoto() {
    setPhotoFile(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleNext() {
    if (step === 1 && !form.parentName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (step === 2) {
      if (!form.childName.trim()) { toast.error("Please enter your child's name"); return; }
      if (!form.childDateOfBirth) { toast.error("Please enter your child's date of birth"); return; }
      const age = computeAge(form.childDateOfBirth);
      if (age < 1 || age > 15) { toast.error("Child must be between 1 and 15 years old"); return; }
    }
    setStep((s) => s + 1);
  }

  async function doSubmit() {
    setLoading(true);
    try {
      const age = computeAge(form.childDateOfBirth);
      await createProfile({
        parentName: form.parentName.trim(),
        childName: form.childName.trim(),
        childAge: age,
        childGender: form.childGender,
        childNickName: form.childNickName.trim() || undefined,
        favoriteColor: form.favoriteColor || undefined,
        favoriteAnimal: form.favoriteAnimal || undefined,
      });

      // Upload photo if provided (non-fatal if it fails)
      if (photoFile) {
        try {
          const uploadUrl = await generateUploadUrl();
          const res = await fetch(uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": photoFile.type },
            body: photoFile,
          });
          const { storageId } = await res.json();
          await setProfilePicture({ storageId });
        } catch {
          toast.error("Profile created but photo upload failed. You can add it from your profile settings.");
        }
      }

      toast.success("Welcome to Lalli Fafa! 🎉");
      router.replace("/dashboard");
    } catch {
      toast.error("Failed to create profile. Please try again.");
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await doSubmit();
  }

  // ── Shared styles ──────────────────────────────────────────────────────────

  const inputStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.07)",
    border: "1.5px solid rgba(255,255,255,0.13)",
    borderRadius: "0.9rem",
    padding: "12px 16px",
    fontSize: "0.95rem",
    color: "#fff",
    fontFamily: "'Nunito', sans-serif",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "0.78rem",
    fontWeight: 700,
    color: "rgba(255,255,255,0.4)",
    fontFamily: "'Nunito', sans-serif",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
  };

  const meta = STEP_META[step - 1];
  const childFirstName = form.childName.split(" ")[0] || "your child";

  // ── Today and 15-years-ago for DOB bounds ──────────────────────────────────
  const maxDob = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const minDob = new Date(Date.now() - 16 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  return (
    <div className="min-h-screen flex" style={{ background: "var(--lf-dark)" }}>

      {/* ── Left panel (desktop) ── */}
      <div
        className="hidden lg:flex flex-col justify-between p-12 flex-shrink-0 relative overflow-hidden"
        style={{ width: 400, background: "linear-gradient(160deg,#131020 0%,#1c1640 100%)" }}
      >
        {/* Glow orbs */}
        <div className="absolute pointer-events-none" style={{ top: -80, right: -60, width: 300, height: 300, background: "radial-gradient(circle,rgba(0,201,167,0.18) 0%,transparent 70%)" }} />
        <div className="absolute pointer-events-none" style={{ bottom: 60, left: -60, width: 240, height: 240, background: "radial-gradient(circle,rgba(249,199,0,0.12) 0%,transparent 70%)" }} />

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 relative z-10">
          <div className="relative" style={{ width: 44, height: 44 }}>
            <Image src="/lf-logo.png" alt="Lalli Fafa" fill className="object-contain" />
          </div>
          <span style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: 20, fontWeight: 800, color: "#fff" }}>
            Lalli <span style={{ color: "var(--lf-teal)" }}>Fafa</span>
          </span>
        </Link>

        {/* Character + step copy */}
        <div className="flex flex-col items-center gap-6 relative z-10">
          <div className="relative" style={{ width: 180, height: 180 }}>
            <Image src="/lf-hero.png" alt="Lalli and Fafa" fill className="object-contain animate-float-slow" />
          </div>
          <div className="flex flex-col gap-3 text-center">
            <h2 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.45rem", color: "#fff", lineHeight: 1.25, whiteSpace: "pre-line" }}>
              {meta.heading}
            </h2>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.88rem", lineHeight: 1.7 }}>
              {meta.sub}
            </p>
          </div>

          {/* Step indicator dots */}
          <div className="flex items-center gap-2">
            {Array.from({ length: STEPS }).map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-400"
                style={{
                  width: i + 1 === step ? 24 : 8,
                  height: 8,
                  background:
                    i + 1 === step
                      ? "var(--lf-teal)"
                      : i + 1 < step
                      ? "rgba(0,201,167,0.45)"
                      : "rgba(255,255,255,0.15)",
                }}
              />
            ))}
          </div>
        </div>

        <p style={{ color: "rgba(255,255,255,0.18)", fontSize: "0.8rem", position: "relative", zIndex: 10 }}>
          &copy; {new Date().getFullYear()} Lalli Fafa
        </p>
      </div>

      {/* ── Right panel: form ── */}
      <div className="flex-1 flex flex-col" style={{ background: "#0e0c1a", minHeight: "100vh" }}>

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
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.82rem", color: "rgba(255,255,255,0.3)" }}>
            Step {step} of {STEPS}
          </p>
        </header>

        {/* Progress bar */}
        <div className="px-6 lg:px-12 pb-1">
          <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(step / STEPS) * 100}%`, background: "linear-gradient(90deg, var(--lf-teal), #00e5c9)" }}
            />
          </div>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-6 py-8 lg:px-12">
          <div className="w-full" style={{ maxWidth: 500 }}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-7">

              {/* ────────────── Step 1: Parent name ────────────── */}
              {step === 1 && (
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <h1 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "2rem", color: "#fff", lineHeight: 1.2 }}>
                      Hey there! 👋
                    </h1>
                    <p style={{ fontFamily: "'Nunito', sans-serif", color: "rgba(255,255,255,0.4)", lineHeight: 1.65 }}>
                      Let&apos;s set up your family profile. What shall we call you?
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label style={labelStyle}>Your name</label>
                    <input
                      type="text"
                      placeholder="e.g. Priya Sharma"
                      value={form.parentName}
                      onChange={(e) => update("parentName", e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleNext()}
                      style={inputStyle}
                      autoFocus
                    />
                  </div>

                  {/* What to expect callout */}
                  <div style={{ background: "rgba(0,201,167,0.07)", border: "1px solid rgba(0,201,167,0.16)", borderRadius: "1rem", padding: "16px 20px" }}>
                    <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.88rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.75, margin: 0 }}>
                      ✨ <strong style={{ color: "rgba(255,255,255,0.75)" }}>Takes about 2 minutes.</strong> You&apos;ll set your child&apos;s character, pick their favourite colour &amp; animal, and optionally add a photo so we can generate their personalised cartoon avatar.
                    </p>
                  </div>
                </div>
              )}

              {/* ────────────── Step 2: Child info ────────────── */}
              {step === 2 && (
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <h1 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "2rem", color: "#fff", lineHeight: 1.2 }}>
                      About your little hero 🌟
                    </h1>
                    <p style={{ fontFamily: "'Nunito', sans-serif", color: "rgba(255,255,255,0.4)", lineHeight: 1.65 }}>
                      They&apos;ll be the star of every adventure we create!
                    </p>
                  </div>

                  <div className="flex flex-col gap-5">
                    {/* Name + Nickname row */}
                    <div className="flex gap-3">
                      <div className="flex flex-col gap-2" style={{ flex: 3 }}>
                        <label style={labelStyle}>Child&apos;s full name</label>
                        <input
                          type="text"
                          placeholder="e.g. Aryan Sharma"
                          value={form.childName}
                          onChange={(e) => update("childName", e.target.value)}
                          style={inputStyle}
                          autoFocus
                        />
                      </div>
                      <div className="flex flex-col gap-2" style={{ flex: 2 }}>
                        <label style={labelStyle}>Nickname</label>
                        <input
                          type="text"
                          placeholder="e.g. Aru"
                          value={form.childNickName}
                          onChange={(e) => update("childNickName", e.target.value)}
                          style={inputStyle}
                        />
                      </div>
                    </div>

                    {/* Date of birth */}
                    <div className="flex flex-col gap-2">
                      <label style={labelStyle}>Date of birth</label>
                      <input
                        type="date"
                        value={form.childDateOfBirth}
                        onChange={(e) => update("childDateOfBirth", e.target.value)}
                        max={maxDob}
                        min={minDob}
                        style={{ ...inputStyle, colorScheme: "dark" }}
                      />
                      {form.childDateOfBirth && computeAge(form.childDateOfBirth) >= 1 && (
                        <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.82rem", color: "var(--lf-teal)", marginTop: 2, marginLeft: 4 }}>
                          🎂 {computeAge(form.childDateOfBirth)} years old
                        </p>
                      )}
                    </div>

                    {/* Gender — visual pill buttons */}
                    <div className="flex flex-col gap-3">
                      <label style={labelStyle}>Gender</label>
                      <div className="flex gap-3">
                        {(
                          [
                            { value: "male",   label: "Boy",   emoji: "👦" },
                            { value: "female", label: "Girl",  emoji: "👧" },
                            { value: "other",  label: "Other", emoji: "✨" },
                          ] as const
                        ).map((g) => {
                          const sel = form.childGender === g.value;
                          return (
                            <button
                              key={g.value}
                              type="button"
                              onClick={() => update("childGender", g.value)}
                              className="flex-1 flex flex-col items-center gap-1.5 py-4 rounded-2xl transition-all"
                              style={{
                                border: "1.5px solid",
                                borderColor: sel ? "var(--lf-teal)" : "rgba(255,255,255,0.1)",
                                background: sel ? "rgba(0,201,167,0.1)" : "rgba(255,255,255,0.04)",
                                cursor: "pointer",
                              }}
                            >
                              <span style={{ fontSize: "1.6rem", lineHeight: 1 }}>{g.emoji}</span>
                              <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.88rem", color: sel ? "var(--lf-teal)" : "rgba(255,255,255,0.45)" }}>
                                {g.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ────────────── Step 3: Photo upload ────────────── */}
              {step === 3 && (
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <h1 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "2rem", color: "#fff", lineHeight: 1.2 }}>
                      Add {childFirstName}&apos;s photo 📸
                    </h1>
                    <p style={{ fontFamily: "'Nunito', sans-serif", color: "rgba(255,255,255,0.4)", lineHeight: 1.65 }}>
                      We&apos;ll generate a personalised cartoon avatar that appears in every story. Completely optional — you can add it later from your profile.
                    </p>
                  </div>

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />

                  {photoPreview ? (
                    /* Preview state */
                    <div className="flex flex-col items-center gap-5">
                      <div
                        style={{
                          width: 160,
                          height: 160,
                          borderRadius: "50%",
                          overflow: "hidden",
                          border: "3px solid var(--lf-teal)",
                          boxShadow: "0 0 0 6px rgba(0,201,167,0.12), 0 8px 32px rgba(0,0,0,0.4)",
                          position: "relative",
                          flexShrink: 0,
                        }}
                      >
                        <Image src={photoPreview} alt="Child photo preview" fill className="object-cover" />
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          style={{
                            padding: "9px 20px",
                            borderRadius: "0.8rem",
                            border: "1.5px solid rgba(255,255,255,0.14)",
                            background: "rgba(255,255,255,0.06)",
                            color: "rgba(255,255,255,0.6)",
                            fontFamily: "'Nunito', sans-serif",
                            fontWeight: 700,
                            fontSize: "0.88rem",
                            cursor: "pointer",
                          }}
                        >
                          Change photo
                        </button>
                        <button
                          type="button"
                          onClick={clearPhoto}
                          style={{
                            padding: "9px 20px",
                            borderRadius: "0.8rem",
                            border: "1.5px solid rgba(239,68,68,0.3)",
                            background: "rgba(239,68,68,0.07)",
                            color: "#f87171",
                            fontFamily: "'Nunito', sans-serif",
                            fontWeight: 700,
                            fontSize: "0.88rem",
                            cursor: "pointer",
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Upload zone */
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center gap-4 w-full py-14 rounded-2xl transition-all group"
                      style={{
                        border: "2px dashed rgba(255,255,255,0.13)",
                        background: "rgba(255,255,255,0.02)",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,201,167,0.4)";
                        (e.currentTarget as HTMLElement).style.background = "rgba(0,201,167,0.04)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.13)";
                        (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)";
                      }}
                    >
                      <div style={{ width: 60, height: 60, borderRadius: "50%", background: "rgba(0,201,167,0.1)", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }}>
                        <Camera size={26} style={{ color: "var(--lf-teal)" }} />
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <p style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.98rem", color: "rgba(255,255,255,0.6)", margin: 0 }}>
                          Tap to upload a photo
                        </p>
                        <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.8rem", color: "rgba(255,255,255,0.27)", margin: 0 }}>
                          JPG, PNG or WebP · Max 5 MB
                        </p>
                      </div>
                    </button>
                  )}

                  <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "0.9rem", padding: "14px 18px" }}>
                    <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.82rem", color: "rgba(255,255,255,0.32)", margin: 0, lineHeight: 1.75 }}>
                      🔒 Your photo is private and only used to personalise story illustrations. We never share it.
                    </p>
                  </div>
                </div>
              )}

              {/* ────────────── Step 4: Favourite colour ────────────── */}
              {step === 4 && (
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <h1 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "2rem", color: "#fff", lineHeight: 1.2 }}>
                      {childFirstName}&apos;s favourite colour? 🎨
                    </h1>
                    <p style={{ fontFamily: "'Nunito', sans-serif", color: "rgba(255,255,255,0.4)", lineHeight: 1.65 }}>
                      We&apos;ll weave it into every story illustration.
                    </p>
                  </div>

                  <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
                    {COLORS.map((c) => {
                      const sel = form.favoriteColor === c.name;
                      return (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => update("favoriteColor", c.name)}
                          className="flex flex-col items-center gap-2 py-3 rounded-2xl transition-all"
                          style={{
                            border: "2px solid",
                            borderColor: sel ? c.hex : "rgba(255,255,255,0.07)",
                            background: sel ? `${c.hex}1a` : "rgba(255,255,255,0.03)",
                            cursor: "pointer",
                          }}
                        >
                          <div
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: "50%",
                              background: c.hex,
                              boxShadow: sel ? `0 0 14px ${c.hex}99` : "none",
                              transition: "box-shadow 0.2s",
                            }}
                          />
                          <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.7rem", color: sel ? "#fff" : "rgba(255,255,255,0.38)", lineHeight: 1, textAlign: "center" }}>
                            {c.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ────────────── Step 5: Favourite animal ────────────── */}
              {step === 5 && (
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <h1 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "2rem", color: "#fff", lineHeight: 1.2 }}>
                      {childFirstName}&apos;s favourite animal? 🐾
                    </h1>
                    <p style={{ fontFamily: "'Nunito', sans-serif", color: "rgba(255,255,255,0.4)", lineHeight: 1.65 }}>
                      This companion joins every single adventure!
                    </p>
                  </div>

                  <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
                    {ANIMALS.map((a) => {
                      const sel = form.favoriteAnimal === a.name;
                      return (
                        <button
                          key={a.name}
                          type="button"
                          onClick={() => update("favoriteAnimal", a.name)}
                          className="flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all"
                          style={{
                            border: "2px solid",
                            borderColor: sel ? "var(--lf-teal)" : "rgba(255,255,255,0.07)",
                            background: sel ? "rgba(0,201,167,0.1)" : "rgba(255,255,255,0.03)",
                            cursor: "pointer",
                          }}
                        >
                          <span style={{ fontSize: "1.8rem", lineHeight: 1 }}>{a.emoji}</span>
                          <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.7rem", color: sel ? "var(--lf-teal)" : "rgba(255,255,255,0.38)" }}>
                            {a.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Navigation ── */}
              <div className="flex gap-3 mt-1">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={() => setStep((s) => s - 1)}
                    className="flex items-center gap-1.5 px-5 py-3 rounded-2xl font-semibold transition-all"
                    style={{
                      border: "1.5px solid rgba(255,255,255,0.1)",
                      color: "rgba(255,255,255,0.45)",
                      background: "rgba(255,255,255,0.04)",
                      fontFamily: "'Nunito', sans-serif",
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    <ChevronLeft size={18} />
                    Back
                  </button>
                )}

                <div className="flex flex-col flex-1 gap-2">
                  {step < STEPS ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold transition-all hover:scale-[1.02]"
                      style={{
                        background: "linear-gradient(135deg, var(--lf-teal), #00a38d)",
                        color: "#fff",
                        fontFamily: "'Baloo 2', sans-serif",
                        fontSize: "1.05rem",
                        boxShadow: "0 4px 20px rgba(0,201,167,0.3)",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      Continue <ChevronRight size={18} />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold transition-all hover:scale-[1.02]"
                      style={{
                        background: "linear-gradient(135deg, var(--lf-sunshine), #e6ac00)",
                        color: "var(--lf-dark)",
                        fontFamily: "'Baloo 2', sans-serif",
                        fontSize: "1.05rem",
                        boxShadow: "0 4px 20px rgba(255,193,7,0.35)",
                        border: "none",
                        opacity: loading ? 0.7 : 1,
                        cursor: loading ? "not-allowed" : "pointer",
                      }}
                    >
                      {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                      {loading ? "Setting up your adventure…" : "Start the adventure! 🚀"}
                    </button>
                  )}

                  {/* Skip option for optional steps */}
                  {step === 3 && (
                    <button
                      type="button"
                      onClick={() => setStep((s) => s + 1)}
                      style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.85rem", color: "rgba(255,255,255,0.25)", background: "none", border: "none", cursor: "pointer", padding: "4px", textAlign: "center" }}
                    >
                      Skip for now →
                    </button>
                  )}
                  {step === 4 && (
                    <button
                      type="button"
                      onClick={() => setStep((s) => s + 1)}
                      style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.85rem", color: "rgba(255,255,255,0.25)", background: "none", border: "none", cursor: "pointer", padding: "4px", textAlign: "center" }}
                    >
                      Skip for now →
                    </button>
                  )}
                  {step === 5 && !loading && (
                    <button
                      type="button"
                      onClick={doSubmit}
                      style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.85rem", color: "rgba(255,255,255,0.25)", background: "none", border: "none", cursor: "pointer", padding: "4px", textAlign: "center" }}
                    >
                      Skip &amp; finish →
                    </button>
                  )}
                </div>
              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
