"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Lock, Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords don't match.");
      return;
    }
    if (!token) {
      toast.error("Invalid or expired reset link. Please request a new one.");
      return;
    }
    setLoading(true);
    try {
      await authClient.resetPassword({ newPassword: password, token });
      setDone(true);
      setTimeout(() => router.push("/sign-in"), 2500);
    } catch {
      toast.error("Reset link is invalid or has expired. Please request a new one.");
    } finally {
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
    <div className="min-h-screen flex" style={{ background: "var(--lf-cream)" }}>
      {/* Left panel */}
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

        <div className="flex flex-col gap-5">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: "rgba(0,201,167,0.15)" }}
          >
            <Lock size={28} style={{ color: "var(--lf-teal)" }} />
          </div>
          <h2
            style={{
              fontFamily: "'Baloo 2', sans-serif",
              fontSize: "1.6rem",
              fontWeight: 800,
              color: "#fff",
              lineHeight: 1.25,
            }}
          >
            Set a new password
          </h2>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.9rem", lineHeight: 1.7 }}>
            Choose something strong that you haven&apos;t used before. At least 8 characters.
          </p>
          <div className="flex flex-col gap-2 mt-2">
            {["At least 8 characters", "Mix of letters and numbers", "Something only you know"].map((tip) => (
              <div key={tip} className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: "var(--lf-teal)" }}>
                  <svg width="8" height="6" fill="none" viewBox="0 0 8 6">
                    <path d="M1 3l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.85rem" }}>{tip}</p>
              </div>
            ))}
          </div>
        </div>

        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.8rem" }}>
          &copy; {new Date().getFullYear()} Lalli Fafa
        </p>
      </div>

      {/* Right panel */}
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
          {done ? (
            /* ── Success state ── */
            <div className="flex flex-col items-center text-center gap-5">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "rgba(0,201,167,0.12)" }}
              >
                <CheckCircle2 size={32} style={{ color: "var(--lf-teal)" }} />
              </div>
              <div className="flex flex-col gap-2">
                <h1
                  style={{
                    fontFamily: "'Baloo 2', sans-serif",
                    fontSize: "clamp(1.6rem,3vw,2rem)",
                    fontWeight: 800,
                    color: "var(--lf-dark)",
                    lineHeight: 1.2,
                  }}
                >
                  Password updated!
                </h1>
                <p style={{ color: "rgba(45,45,45,0.55)", fontSize: "0.92rem", lineHeight: 1.7 }}>
                  Your password has been reset. Redirecting you to sign in…
                </p>
              </div>
              <Link
                href="/sign-in"
                className="flex items-center gap-2 text-sm font-semibold"
                style={{ color: "var(--lf-teal)", fontFamily: "'Nunito', sans-serif" }}
              >
                Sign in now →
              </Link>
            </div>
          ) : !token ? (
            /* ── No token ── */
            <div className="flex flex-col items-center text-center gap-5">
              <p style={{ fontFamily: "'Nunito', sans-serif", color: "rgba(45,45,45,0.6)", fontSize: "0.95rem" }}>
                This reset link is missing or invalid.
              </p>
              <Link href="/forgot-password" className="btn-primary" style={{ justifyContent: "center" }}>
                Request a new link
              </Link>
            </div>
          ) : (
            /* ── Form state ── */
            <>
              <Link
                href="/sign-in"
                className="inline-flex items-center gap-1.5 mb-6 text-sm font-semibold transition-all hover:opacity-70"
                style={{ color: "var(--lf-teal)", fontFamily: "'Nunito', sans-serif" }}
              >
                <ArrowLeft size={15} /> Back to sign in
              </Link>

              <h1
                style={{
                  fontFamily: "'Baloo 2', sans-serif",
                  fontSize: "clamp(1.7rem,3vw,2.2rem)",
                  fontWeight: 800,
                  color: "var(--lf-dark)",
                  lineHeight: 1.2,
                }}
              >
                Set a new password
              </h1>
              <p className="mt-2 mb-8" style={{ color: "rgba(45,45,45,0.55)", fontSize: "0.9rem" }}>
                Choose a strong password to protect your account.
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--lf-dark)" }}>
                    New password
                  </label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      placeholder="At least 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="w-full px-4 py-3 rounded-2xl outline-none pr-11 transition-all"
                      style={inputStyle}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: "rgba(45,45,45,0.4)" }}
                    >
                      {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--lf-dark)" }}>
                    Confirm password
                  </label>
                  <input
                    type={showPw ? "text" : "password"}
                    placeholder="Same password again"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full px-4 py-3 rounded-2xl outline-none transition-all"
                    style={inputStyle}
                  />
                  {confirm && password !== confirm && (
                    <p style={{ fontSize: "0.78rem", color: "#dc2626", fontFamily: "'Nunito', sans-serif" }}>
                      Passwords don&apos;t match
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !password || password !== confirm}
                  className="btn-primary mt-1"
                  style={{
                    width: "100%",
                    justifyContent: "center",
                    fontSize: "1rem",
                    padding: "0.85rem",
                    opacity: loading || !password || password !== confirm ? 0.5 : 1,
                  }}
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
                  {loading ? "Updating…" : "Update password"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
