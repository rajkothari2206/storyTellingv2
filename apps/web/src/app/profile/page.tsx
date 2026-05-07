"use client";

import { useRef, useState, useEffect, useCallback } from "react";
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
  BookOpen,
  LogOut,
  LayoutDashboard,
  Library,
  Loader2,
  Sparkles,
  Star,
  PawPrint,
  Palette,
  Calendar,
  Users,
  Lock,
  Pencil,
  Camera,
  X,
  Save,
  Plus,
  ChevronRight,
} from "lucide-react";
import { UserPill } from "@/components/layout/UserPill";

/* ──────────────────── helpers ───────────────────────── */

const AVATAR_GRADIENTS: Record<string, string> = {
  pink:      "linear-gradient(135deg,#FF6B9D 0%,#C850C0 100%)",
  red:       "linear-gradient(135deg,#FF6B6B 0%,#EE5A24 100%)",
  blue:      "linear-gradient(135deg,#74b9ff 0%,#0984e3 100%)",
  green:     "linear-gradient(135deg,#55efc4 0%,#00b894 100%)",
  purple:    "linear-gradient(135deg,#a29bfe 0%,#6c5ce7 100%)",
  yellow:    "linear-gradient(135deg,#ffd93d 0%,#fdcb6e 100%)",
  orange:    "linear-gradient(135deg,#ffa07a 0%,#FF6348 100%)",
  teal:      "linear-gradient(135deg,#81ecec 0%,#00cec9 100%)",
  white:     "linear-gradient(135deg,#dfe6e9 0%,#b2bec3 100%)",
  mint:      "linear-gradient(135deg,#6ee7b7 0%,#10b981 100%)",
  lavender:  "linear-gradient(135deg,#c084fc 0%,#9333ea 100%)",
  coral:     "linear-gradient(135deg,#fb7185 0%,#e11d48 100%)",
  gold:      "linear-gradient(135deg,#fbbf24 0%,#d97706 100%)",
  navy:      "linear-gradient(135deg,#93c5fd 0%,#3b82f6 100%)",
  magenta:   "linear-gradient(135deg,#e879f9 0%,#a21caf 100%)",
  lime:      "linear-gradient(135deg,#bef264 0%,#65a30d 100%)",
  "sky blue":"linear-gradient(135deg,#7dd3fc 0%,#0ea5e9 100%)",
};

/* Vivid accent colour for the dark hero card */
const AVATAR_ACCENT: Record<string, string> = {
  pink:      "#FF6B9D", red:      "#ef4444", blue:      "#3b82f6",
  green:     "#22c55e", purple:   "#a855f7", yellow:    "#eab308",
  orange:    "#f97316", teal:     "#14b8a6", mint:      "#34d399",
  lavender:  "#c084fc", coral:    "#fb7185", gold:      "#f59e0b",
  navy:      "#93c5fd", magenta:  "#d946ef", lime:      "#84cc16",
  "sky blue":"#38bdf8", white:    "#94a3b8",
};

/* Glow colour for the radial behind avatar */
const GLOW_COLORS: Record<string, string> = {
  pink:      "rgba(255,107,157,0.45)", red:      "rgba(239,68,68,0.4)",
  blue:      "rgba(59,130,246,0.4)",   green:    "rgba(34,197,94,0.4)",
  purple:    "rgba(168,85,247,0.4)",   yellow:   "rgba(234,179,8,0.4)",
  orange:    "rgba(249,115,22,0.4)",   teal:     "rgba(20,184,166,0.4)",
  mint:      "rgba(52,211,153,0.4)",   lavender: "rgba(192,132,252,0.4)",
  coral:     "rgba(251,113,133,0.4)",  gold:     "rgba(245,158,11,0.4)",
  navy:      "rgba(147,197,253,0.3)",  magenta:  "rgba(217,70,239,0.4)",
  lime:      "rgba(132,204,22,0.4)",   "sky blue":"rgba(56,189,248,0.4)",
  white:     "rgba(148,163,184,0.3)",
};

const ANIMAL_EMOJI: Record<string, string> = {
  rabbit: "🐇", dog: "🐶", cat: "🐱", elephant: "🐘", lion: "🦁",
  tiger: "🐯", bear: "🐻", panda: "🐼", unicorn: "🦄", dragon: "🐲",
  butterfly: "🦋", penguin: "🐧", owl: "🦉", fox: "🦊", deer: "🦌",
};

const ACHIEVEMENT_META: Record<string, { icon: string; description: string }> = {
  "First Story":     { icon: "📖", description: "Created your very first personalised story" },
  "7 Days in a Row": { icon: "🔥", description: "Read stories 7 days in a row — on fire!" },
  "10 Stories":      { icon: "🌟", description: "Generated 10 magical stories" },
  "Night Owl":       { icon: "🦉", description: "Read a story after 9 pm" },
  "Early Bird":      { icon: "🐦", description: "Read a story before 7 am" },
  "Story Master":    { icon: "👑", description: "Generated 25 stories" },
};

const COLORS = ["Pink","Red","Blue","Green","Purple","Yellow","Orange","Teal","White"];
const ANIMALS = ["Rabbit","Dog","Cat","Elephant","Lion","Tiger","Bear","Panda","Unicorn","Dragon","Butterfly","Penguin","Owl","Fox","Deer"];

function avatarGrad(color?: string) {
  return AVATAR_GRADIENTS[(color ?? "").toLowerCase()] ?? "linear-gradient(135deg,var(--lf-teal) 0%,#00a38d 100%)";
}
function accentClr(color?: string) {
  return AVATAR_ACCENT[(color ?? "").toLowerCase()] ?? "#00c9a7";
}
function glowClr(color?: string) {
  return GLOW_COLORS[(color ?? "").toLowerCase()] ?? "rgba(0,201,167,0.35)";
}
function animalEmoji(animal?: string) {
  return ANIMAL_EMOJI[(animal ?? "").toLowerCase()] ?? "🐾";
}

/* ──────────────────── Edit modal ───────────────────── */

type ProfileFields = {
  parentName: string; childName: string; childNickName: string;
  childAge: string; childGender: string; favoriteColor: string; favoriteAnimal: string;
};

function EditModal({
  initial,
  onSave,
  onClose,
}: {
  initial: ProfileFields;
  onSave: (f: ProfileFields) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<ProfileFields>(initial);
  const [saving, setSaving] = useState(false);

  function set(k: keyof ProfileFields, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.childName.trim()) { toast.error("Child name is required"); return; }
    setSaving(true);
    try { await onSave(form); onClose(); }
    finally { setSaving(false); }
  }

  const labelStyle = {
    fontFamily: "'Nunito', sans-serif", fontSize: "0.75rem", fontWeight: 700,
    color: "rgba(255,255,255,0.5)", textTransform: "uppercase" as const, letterSpacing: "0.05em",
  };
  const inputStyle = {
    width: "100%", padding: "0.7rem 0.9rem", borderRadius: "0.8rem",
    background: "rgba(255,255,255,0.08)", border: "1.5px solid rgba(255,255,255,0.15)",
    color: "#fff", fontFamily: "'Nunito', sans-serif", fontSize: "0.95rem", fontWeight: 600,
    outline: "none",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-6 flex flex-col gap-5"
        style={{ background: "#1a1630" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.3rem", color: "#fff" }}>
            Edit Profile
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-all" style={{ color: "rgba(255,255,255,0.4)" }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-4">
          {/* Parent name */}
          <div className="flex flex-col gap-1.5">
            <label style={labelStyle}>Your name (parent)</label>
            <input style={inputStyle} value={form.parentName} onChange={(e) => set("parentName", e.target.value)} placeholder="e.g. Raj" />
          </div>

          <div className="h-px" style={{ background: "rgba(255,255,255,0.08)" }} />

          {/* Child name + nickname */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label style={labelStyle}>Child's name</label>
              <input style={inputStyle} value={form.childName} onChange={(e) => set("childName", e.target.value)} placeholder="e.g. Vanya" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label style={labelStyle}>Nickname</label>
              <input style={inputStyle} value={form.childNickName} onChange={(e) => set("childNickName", e.target.value)} placeholder="e.g. Vany" />
            </div>
          </div>

          {/* Age + gender */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label style={labelStyle}>Age</label>
              <input style={inputStyle} type="number" min={1} max={12} value={form.childAge} onChange={(e) => set("childAge", e.target.value)} placeholder="e.g. 6" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label style={labelStyle}>Gender</label>
              <select
                style={{ ...inputStyle, appearance: "none" }}
                value={form.childGender}
                onChange={(e) => set("childGender", e.target.value)}
              >
                <option value="male">Boy</option>
                <option value="female">Girl</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Fav colour */}
          <div className="flex flex-col gap-2">
            <label style={labelStyle}>Favourite colour</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c} type="button"
                  onClick={() => set("favoriteColor", c)}
                  className="px-3 py-1.5 rounded-xl text-sm font-bold transition-all"
                  style={{
                    fontFamily: "'Nunito', sans-serif",
                    background: form.favoriteColor.toLowerCase() === c.toLowerCase() ? avatarGrad(c) : "rgba(255,255,255,0.08)",
                    color: form.favoriteColor.toLowerCase() === c.toLowerCase() ? "#fff" : "rgba(255,255,255,0.5)",
                    border: `1.5px solid ${form.favoriteColor.toLowerCase() === c.toLowerCase() ? "transparent" : "rgba(255,255,255,0.1)"}`,
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Fav animal */}
          <div className="flex flex-col gap-2">
            <label style={labelStyle}>Favourite animal</label>
            <div className="flex flex-wrap gap-2">
              {ANIMALS.map((a) => (
                <button
                  key={a} type="button"
                  onClick={() => set("favoriteAnimal", a)}
                  className="px-3 py-1.5 rounded-xl text-sm font-bold transition-all"
                  style={{
                    fontFamily: "'Nunito', sans-serif",
                    background: form.favoriteAnimal.toLowerCase() === a.toLowerCase() ? "rgba(0,184,166,0.3)" : "rgba(255,255,255,0.08)",
                    color: form.favoriteAnimal.toLowerCase() === a.toLowerCase() ? "var(--lf-teal)" : "rgba(255,255,255,0.5)",
                    border: `1.5px solid ${form.favoriteAnimal.toLowerCase() === a.toLowerCase() ? "rgba(0,184,166,0.4)" : "rgba(255,255,255,0.1)"}`,
                  }}
                >
                  {animalEmoji(a)} {a}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold transition-all"
            style={{
              background: "linear-gradient(135deg,var(--lf-teal),#00a38d)",
              color: "#fff",
              fontFamily: "'Nunito', sans-serif",
              fontSize: "1rem",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {saving ? "Saving…" : "Save changes"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ──────────────────── main page ─────────────────────── */

export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const profile          = useQuery(api.userProfiles.getProfile,    isAuthenticated ? {} : "skip");
  const credits          = useQuery(api.credit.list,                isAuthenticated ? {} : "skip");
  const stories          = useQuery(api.stories.list,               isAuthenticated ? {} : "skip");
  const achievementsData = useQuery(api.userProfiles.getAchievements, isAuthenticated ? {} : "skip");
  const updateProfile    = useMutation(api.userProfiles.updateProfile);

  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const [editOpen, setEditOpen]   = useState(false);

  // Load avatar from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("lf_avatar");
    if (stored) setAvatarSrc(stored);
  }, []);

  function handleAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Image must be under 2 MB"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const b64 = ev.target?.result as string;
      setAvatarSrc(b64);
      localStorage.setItem("lf_avatar", b64);
      toast.success("Profile picture updated!");
    };
    reader.readAsDataURL(file);
  }

  const handleSaveProfile = useCallback(async (form: ProfileFields) => {
    await updateProfile({
      parentName: form.parentName,
      childName: form.childName,
      childAge: parseInt(form.childAge) || 0,
      childGender: form.childGender as "male" | "female" | "other",
      childNickName: form.childNickName || undefined,
      favoriteColor: form.favoriteColor || undefined,
      favoriteAnimal: form.favoriteAnimal || undefined,
    });
    toast.success("Profile updated! ✨");
  }, [updateProfile]);

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/");
    toast.success("Signed out successfully");
  }

  return (
    <>
      <AuthLoading>
        <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--lf-dark)" }}>
          <Loader2 size={32} className="animate-spin" style={{ color: "var(--lf-teal)" }} />
        </div>
      </AuthLoading>

      <Unauthenticated>
        <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--lf-cream)" }}>
          <Link href="/sign-in" className="btn-primary">Sign in</Link>
        </div>
      </Unauthenticated>

      <Authenticated>
        {/* Edit modal */}
        {editOpen && profile && (() => {
          const p = profile as ProfileFields & { childAge?: number };
          return (
            <EditModal
              initial={{
                parentName:    (p as { parentName?: string }).parentName    ?? "",
                childName:     (p as { childName?: string }).childName      ?? "",
                childNickName: (p as { childNickName?: string }).childNickName ?? "",
                childAge:      String((p as { childAge?: number }).childAge ?? ""),
                childGender:   (p as { childGender?: string }).childGender  ?? "female",
                favoriteColor: (p as { favoriteColor?: string }).favoriteColor ?? "",
                favoriteAnimal:(p as { favoriteAnimal?: string }).favoriteAnimal ?? "",
              }}
              onSave={handleSaveProfile}
              onClose={() => setEditOpen(false)}
            />
          );
        })()}

        <div className="min-h-screen" style={{ background: "linear-gradient(160deg,#FFF8E7 0%,#E6FAF6 60%,#F3EEFF 100%)" }}>

          {/* ── Nav ── */}
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
              <Link href="/dashboard" className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold hover:bg-white/10 transition-all" style={{ color: "rgba(255,255,255,0.6)", fontFamily: "'Nunito', sans-serif" }}>
                <LayoutDashboard size={15} /> Dashboard
              </Link>
              <Link href="/library" className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold hover:bg-white/10 transition-all" style={{ color: "rgba(255,255,255,0.6)", fontFamily: "'Nunito', sans-serif" }}>
                <Library size={15} /> Library
              </Link>
              <UserPill variant="dark" />
            </nav>
          </header>

          {/* ── Loading ── */}
          {profile === undefined && (
            <div className="flex justify-center items-center py-40">
              <Loader2 size={36} className="animate-spin" style={{ color: "var(--lf-teal)" }} />
            </div>
          )}

          {/* ── No profile ── */}
          {profile === null && (
            <div className="flex flex-col items-center gap-4 py-32">
              <Image src="/lf-hero.png" alt="Lalli Fafa" width={100} height={100} className="opacity-60" />
              <p style={{ fontFamily: "'Nunito', sans-serif", color: "rgba(45,45,45,0.5)", fontSize: "1rem" }}>
                No profile yet — let's set one up!
              </p>
              <Link href="/onboarding" className="btn-primary">
                <Sparkles size={16} /> Set up profile
              </Link>
            </div>
          )}

          {/* ── Full profile ── */}
          {profile && (() => {
            const p = profile as {
              parentName?: string; childName?: string; childNickName?: string;
              childAge?: number; childGender?: string; favoriteColor?: string; favoriteAnimal?: string;
            };

            const initial = (p.childName ?? p.childNickName ?? "?")[0].toUpperCase();
            const earnedCount = (achievementsData?.achievements as Array<{ earned: boolean }> | undefined)?.filter(a => a.earned).length ?? 0;
            const totalCount  = (achievementsData?.achievements as unknown[] | undefined)?.length ?? 0;
            const availableCredits = (credits as Array<{ availableCredits?: number }> | undefined)?.[0]?.availableCredits ?? 0;
            const storyCount = (stories as unknown[])?.length ?? 0;
            const animal = animalEmoji(p.favoriteAnimal);

            return (
              <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">

                {/* ══ KID CARD — dark hero style ══ */}
                <div
                  className="relative overflow-hidden rounded-3xl"
                  style={{
                    background: "linear-gradient(145deg,#160d35 0%,#1e1247 40%,#0f2240 100%)",
                    boxShadow: `0 24px 64px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.07), 0 0 80px ${glowClr(p.favoriteColor)}`,
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  {/* Colour glow orb */}
                  <div className="absolute pointer-events-none" style={{ top: -60, left: -60, width: 320, height: 320, background: `radial-gradient(circle, ${glowClr(p.favoriteColor)} 0%, transparent 65%)` }} />
                  {/* Right side shimmer */}
                  <div className="absolute pointer-events-none" style={{ bottom: -40, right: -40, width: 200, height: 200, background: "radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)" }} />

                  {/* Floating sparkles */}
                  <div className="absolute pointer-events-none select-none" style={{ top: 18, right: "38%", fontSize: "1rem", opacity: 0.55, animation: "float 3s ease-in-out infinite" }}>✨</div>
                  <div className="absolute pointer-events-none select-none" style={{ top: 46, right: "22%", fontSize: "0.7rem", opacity: 0.4, animation: "float 3s ease-in-out infinite", animationDelay: "1.1s" }}>⭐</div>
                  <div className="absolute pointer-events-none select-none" style={{ bottom: 32, right: "12%", fontSize: "0.75rem", opacity: 0.3, animation: "float 3s ease-in-out infinite", animationDelay: "0.6s" }}>✨</div>

                  {/* Large faded animal watermark */}
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 select-none pointer-events-none hidden sm:block" style={{ fontSize: "9rem", opacity: 0.06, lineHeight: 1 }} aria-hidden>{animal}</div>

                  {/* Lalli Fafa character */}
                  <div className="absolute right-24 bottom-0 hidden md:block pointer-events-none" style={{ width: 95, height: 95, opacity: 0.65 }}>
                    <Image src="/lf-hero.png" alt="" fill className="object-contain object-bottom" />
                  </div>

                  {/* ── Top row: Hero badge + Edit ── */}
                  <div className="relative z-10 flex items-center justify-between px-6 pt-5 pb-1">
                    <div
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                      style={{ background: `${accentClr(p.favoriteColor)}1a`, border: `1px solid ${accentClr(p.favoriteColor)}40` }}
                    >
                      <span style={{ fontSize: "0.7rem" }}>⭐</span>
                      <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: "0.68rem", color: accentClr(p.favoriteColor), letterSpacing: "0.08em", textTransform: "uppercase" }}>
                        Story Hero
                      </span>
                    </div>
                    <button
                      onClick={() => setEditOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold transition-all hover:scale-105"
                      style={{ background: "rgba(255,255,255,0.09)", backdropFilter: "blur(8px)", color: "rgba(255,255,255,0.7)", fontFamily: "'Nunito', sans-serif", border: "1px solid rgba(255,255,255,0.15)" }}
                    >
                      <Pencil size={12} /> Edit
                    </button>
                  </div>

                  {/* ── Main content: avatar + info ── */}
                  <div className="relative z-10 flex items-center gap-5 px-6 py-4">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFile} />
                      <button className="relative group cursor-pointer" onClick={() => fileRef.current?.click()} title="Change photo">
                        {/* Glow behind avatar */}
                        <div className="absolute inset-0 rounded-full pointer-events-none" style={{ background: avatarGrad(p.favoriteColor), filter: "blur(18px)", opacity: 0.6, transform: "scale(1.35)" }} />
                        {/* Avatar circle */}
                        <div
                          className="relative rounded-full overflow-hidden flex items-center justify-center"
                          style={{
                            width: 100, height: 100,
                            background: avatarSrc ? "transparent" : avatarGrad(p.favoriteColor),
                            border: `3px solid ${accentClr(p.favoriteColor)}60`,
                            boxShadow: `0 0 0 2px rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.5)`,
                            fontSize: "2.6rem", fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, color: "#fff",
                          }}
                        >
                          {avatarSrc ? <img src={avatarSrc} alt="Profile" className="w-full h-full object-cover" /> : initial}
                          <div className="absolute inset-0 rounded-full flex flex-col items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(0,0,0,0.65)" }}>
                            <Camera size={22} style={{ color: "#fff" }} />
                            <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.52rem", color: "#fff", fontWeight: 800, letterSpacing: "0.06em" }}>CHANGE</span>
                          </div>
                        </div>
                        {/* Animal badge */}
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: avatarGrad(p.favoriteColor), border: "2.5px solid #160d35", fontSize: "1rem", boxShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>
                          {animal}
                        </div>
                      </button>
                    </div>

                    {/* Info */}
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <h1 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 900, fontSize: "clamp(2rem,5vw,2.8rem)", color: "#fff", lineHeight: 1.05, textShadow: `0 0 40px ${accentClr(p.favoriteColor)}60` }}>
                        {p.childName ?? "—"}
                      </h1>
                      {p.childNickName && p.childNickName !== p.childName && (
                        <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.95rem", fontWeight: 700, color: "rgba(255,255,255,0.4)" }}>
                          &ldquo;{p.childNickName}&rdquo;
                        </p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap mt-0.5">
                        {p.childAge && (
                          <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.85rem", color: "rgba(255,255,255,0.55)" }}>
                            Age {p.childAge}
                          </span>
                        )}
                        {p.childAge && p.childGender && <span style={{ color: "rgba(255,255,255,0.2)" }}>·</span>}
                        {p.childGender && (
                          <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.85rem", color: "rgba(255,255,255,0.55)", textTransform: "capitalize" }}>
                            {p.childGender === "male" ? "Boy" : p.childGender === "female" ? "Girl" : "Other"}
                          </span>
                        )}
                      </div>
                      <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.77rem", color: "rgba(255,255,255,0.25)", fontWeight: 600, marginTop: 2 }}>
                        ✨ {p.parentName ?? "—"}&apos;s little hero
                      </p>
                    </div>
                  </div>

                  {/* ── Bottom attribute strip ── */}
                  <div className="relative z-10 flex gap-2 px-6 pb-5 flex-wrap">
                    {p.favoriteColor && (
                      <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: accentClr(p.favoriteColor), boxShadow: `0 0 8px ${accentClr(p.favoriteColor)}` }} />
                        <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.78rem", color: "rgba(255,255,255,0.6)" }}>{p.favoriteColor}</span>
                      </div>
                    )}
                    {p.favoriteAnimal && (
                      <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                        <span style={{ fontSize: "0.9rem" }}>{animal}</span>
                        <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.78rem", color: "rgba(255,255,255,0.6)" }}>{p.favoriteAnimal}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                      <BookOpen size={13} style={{ color: "rgba(255,255,255,0.45)" }} />
                      <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.78rem", color: "rgba(255,255,255,0.6)" }}>{storyCount} {storyCount === 1 ? "story" : "stories"}</span>
                    </div>
                  </div>
                </div>

                {/* ══ STATS ══ */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { icon: <BookOpen size={20} />, label: "Stories created", value: storyCount, bg: "linear-gradient(135deg,#00c9a7 0%,#00a38d 100%)", glow: "rgba(0,201,167,0.35)", textColor: "#fff" },
                    { icon: <Sparkles size={20} />, label: "Credits left", value: availableCredits, bg: "linear-gradient(135deg,#a855f7 0%,#7c3aed 100%)", glow: "rgba(168,85,247,0.35)", textColor: "#fff" },
                    { icon: <Star size={20} />, label: `Badges ${earnedCount}/${totalCount}`, value: earnedCount, bg: "linear-gradient(135deg,#f9c700 0%,#e6ac00 100%)", glow: "rgba(249,199,0,0.4)", textColor: "#1a1630" },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="relative flex flex-col gap-3 p-5 rounded-2xl overflow-hidden"
                      style={{ background: s.bg, boxShadow: `0 8px 24px ${s.glow}` }}
                    >
                      {/* Background orb */}
                      <div className="absolute top-0 right-0 w-16 h-16 rounded-full pointer-events-none" style={{ background: "rgba(255,255,255,0.15)", transform: "translate(35%,-35%)" }} />
                      <div style={{ color: s.textColor, opacity: 0.85, position: "relative" }}>{s.icon}</div>
                      <div style={{ position: "relative" }}>
                        <p style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 900, fontSize: "1.9rem", color: s.textColor, lineHeight: 1 }}>
                          {s.value}
                        </p>
                        <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.72rem", color: s.textColor, opacity: 0.75, marginTop: 4, fontWeight: 700 }}>
                          {s.label}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ══ ACHIEVEMENTS ══ */}
                {achievementsData?.achievements && totalCount > 0 && (
                  <div
                    className="flex flex-col gap-5 p-6 rounded-2xl"
                    style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,0.06)", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}
                  >
                    <div className="flex items-center justify-between">
                      <h2 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.15rem", color: "var(--lf-dark)" }}>
                        🏆 Achievements
                      </h2>
                      <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.8rem", color: "rgba(45,45,45,0.4)", fontWeight: 700 }}>
                        {earnedCount}/{totalCount} unlocked
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.06)" }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${(earnedCount / Math.max(totalCount, 1)) * 100}%`, background: "linear-gradient(90deg,var(--lf-teal),#00a38d)" }}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(achievementsData.achievements as Array<{ name: string; earned: boolean; description?: string }>).map((a) => {
                        const meta = ACHIEVEMENT_META[a.name];
                        return (
                          <div
                            key={a.name}
                            className="flex items-center gap-4 p-4 rounded-xl"
                            style={{
                              background: a.earned ? "rgba(0,184,166,0.05)" : "rgba(0,0,0,0.02)",
                              border: `1.5px solid ${a.earned ? "rgba(0,184,166,0.18)" : "rgba(0,0,0,0.06)"}`,
                            }}
                          >
                            <div
                              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ background: a.earned ? "rgba(0,184,166,0.1)" : "rgba(0,0,0,0.04)", fontSize: "1.4rem", filter: a.earned ? "none" : "grayscale(1)", opacity: a.earned ? 1 : 0.4 }}
                            >
                              {meta?.icon ?? "🏅"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: "0.88rem", color: a.earned ? "var(--lf-dark)" : "rgba(45,45,45,0.35)" }}>
                                {a.name}
                              </p>
                              <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.73rem", color: a.earned ? "rgba(45,45,45,0.5)" : "rgba(45,45,45,0.25)", lineHeight: 1.3 }}>
                                {meta?.description ?? a.description ?? "Keep reading to unlock!"}
                              </p>
                            </div>
                            {a.earned
                              ? <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ background: "var(--lf-teal)", color: "#fff" }}>✓</div>
                              : <Lock size={13} style={{ color: "rgba(45,45,45,0.2)", flexShrink: 0 }} />
                            }
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ══ ADD ANOTHER CHILD ══ */}
                <div
                  className="flex items-center gap-4 p-5 rounded-2xl"
                  style={{ background: "rgba(249,199,0,0.06)", border: "1.5px dashed rgba(249,199,0,0.4)" }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(249,199,0,0.15)" }}
                  >
                    <Plus size={20} style={{ color: "#d4aa00" }} />
                  </div>
                  <div className="flex-1">
                    <p style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: "0.95rem", color: "var(--lf-dark)" }}>
                      Add another child
                    </p>
                    <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.78rem", color: "rgba(45,45,45,0.45)" }}>
                      Multi-child support coming soon — stories for every little one!
                    </p>
                  </div>
                  <span
                    className="flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold"
                    style={{ background: "rgba(249,199,0,0.15)", color: "#b8920a", fontFamily: "'Nunito', sans-serif" }}
                  >
                    Soon
                  </span>
                </div>

                {/* ══ ACTIONS ══ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-6">
                  <Link
                    href="/pricing"
                    className="btn-primary"
                    style={{ justifyContent: "center", padding: "0.9rem", fontSize: "1rem" }}
                  >
                    <Sparkles size={18} /> Get more credits
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-semibold transition-all hover:bg-black/5"
                    style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,0.1)", color: "rgba(45,45,45,0.6)", fontFamily: "'Nunito', sans-serif", fontSize: "1rem" }}
                  >
                    <LogOut size={18} /> Sign out
                  </button>
                </div>

              </main>
            );
          })()}
        </div>
      </Authenticated>
    </>
  );
}
