"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

export function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan"); // "monthly" | "yearly" | null
  const isMonthly = plan === "monthly";
  const isYearly = plan === "yearly";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    await authClient.signUp.email(
      { name, email, password },
      {
        onSuccess: () => router.push("/onboarding"),
        onError: (ctx) => {
          console.error("[sign-up] full error object:", JSON.stringify(ctx.error));
          console.error("[sign-up] error message:", ctx.error?.message);
          console.error("[sign-up] error status:", ctx.error?.status);
          toast.error(ctx.error.message || JSON.stringify(ctx.error) || "Sign up failed.");
          setLoading(false);
        },
      }
    );
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    try {
      const callbackURL = `${window.location.origin}/onboarding`;
      await authClient.signIn.social(
        { provider: "google", callbackURL },
        {
          onError: (ctx) => {
            toast.error(ctx.error.message ?? "Google sign up failed.");
            setGoogleLoading(false);
          },
        }
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Google sign up failed.";
      toast.error(msg);
      setGoogleLoading(false);
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
    <div className="min-h-screen flex" style={{ background: "var(--lf-cream)" }}>
      {/* Left panel — branding */}
      <div
        className="hidden lg:flex flex-col justify-between p-12 w-[420px] flex-shrink-0"
        style={{ background: "var(--lf-dark)" }}
      >
        <Link href="/" className="flex items-center gap-2">
          <div className="relative" style={{ width: 40, height: 40 }}>
            <Image src="/logoNoBg.png" alt="Lalli Fafa" fill className="object-contain" />
          </div>
          <span style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: 20, fontWeight: 700, color: "#fff" }}>
            Lalli <span style={{ color: "var(--lf-teal)" }}>Fafa</span>
          </span>
        </Link>

        <div>
          <div className="flex flex-col gap-5">
            {[
              { emoji: "🌟", text: "Your child is the hero of every story" },
              { emoji: "🎧", text: "Beautiful narration in English & Hindi" },
              { emoji: "🎨", text: "AI illustrations in every tale" },
              { emoji: "💛", text: "250 free credits on signup — no card needed" },
            ].map((item) => (
              <div key={item.emoji} className="flex items-start gap-3">
                <span style={{ fontSize: "1.3rem" }}>{item.emoji}</span>
                <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.95rem", lineHeight: 1.5 }}>
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.8rem" }}>
          Loved by 10,000+ Indian families
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <Link href="/" className="flex items-center gap-2 mb-10 lg:hidden">
          <div className="relative" style={{ width: 36, height: 36 }}>
            <Image src="/logoNoBg.png" alt="Lalli Fafa" fill className="object-contain" />
          </div>
          <span style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: 18, fontWeight: 700, color: "var(--lf-dark)" }}>
            Lalli <span style={{ color: "var(--lf-teal)" }}>Fafa</span>
          </span>
        </Link>

        <div className="w-full" style={{ maxWidth: 420 }}>
          {(isMonthly || isYearly) && (
            <div
              className="mb-6 p-4 rounded-2xl flex items-center gap-3"
              style={{ background: "rgba(249,199,0,0.12)", border: "1.5px solid rgba(249,199,0,0.3)" }}
            >
              <Sparkles size={18} style={{ color: "#b8860b", flexShrink: 0 }} />
              <p style={{ fontSize: "0.88rem", color: "#7a5800", fontWeight: 600 }}>
                {isYearly
                  ? "Magic Pass Yearly — ₹1,999/year selected. Start your free trial first."
                  : "Magic Pass Monthly — ₹199/month selected. Start your free trial first."}
              </p>
            </div>
          )}

          <h1
            style={{
              fontFamily: "'Baloo 2', sans-serif",
              fontSize: "clamp(1.7rem, 3vw, 2.2rem)",
              fontWeight: 800,
              color: "var(--lf-dark)",
              lineHeight: 1.2,
            }}
          >
            Create your free account
          </h1>
          <p className="mt-2 mb-8" style={{ color: "rgba(45,45,45,0.55)", fontSize: "0.9rem" }}>
            250 credits on signup · No credit card needed
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--lf-dark)" }}>
                Your name
              </label>
              <input
                type="text"
                placeholder="e.g. Priya Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-3 rounded-2xl outline-none transition-all"
                style={inputStyle}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--lf-dark)" }}>
                Email address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-3 rounded-2xl outline-none transition-all"
                style={inputStyle}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--lf-dark)" }}>
                Password
              </label>
              <input
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-3 rounded-2xl outline-none transition-all"
                style={inputStyle}
              />
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="btn-primary mt-2"
              style={{ width: "100%", justifyContent: "center", fontSize: "1rem", padding: "0.85rem" }}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
              {loading ? "Creating account…" : "Create account — it's free"}
            </button>

            <div className="flex items-center gap-3 my-1">
              <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.08)" }} />
              <span style={{ fontSize: "0.8rem", color: "rgba(45,45,45,0.4)" }}>or</span>
              <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.08)" }} />
            </div>

            <button
              type="button"
              onClick={handleGoogle}
              disabled={loading || googleLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-2xl font-semibold transition-all"
              style={{
                background: "#fff",
                border: "1.5px solid rgba(0,0,0,0.1)",
                color: "var(--lf-dark)",
                fontSize: "0.9rem",
                fontFamily: "'Nunito', sans-serif",
              }}
            >
              {googleLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              )}
              {googleLoading ? "Redirecting…" : "Continue with Google"}
            </button>
          </form>

          <p className="text-center mt-6" style={{ fontSize: "0.85rem", color: "rgba(45,45,45,0.5)" }}>
            Already have an account?{" "}
            <Link href="/sign-in" style={{ color: "var(--lf-teal)", fontWeight: 600 }}>
              Sign in
            </Link>
          </p>

          <p className="text-center mt-4" style={{ fontSize: "0.75rem", color: "rgba(45,45,45,0.35)", lineHeight: 1.6 }}>
            By signing up you agree to our{" "}
            <Link href="/legal/terms" style={{ color: "var(--lf-teal)" }}>Terms</Link>{" "}
            and{" "}
            <Link href="/legal/privacy" style={{ color: "var(--lf-teal)" }}>Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
