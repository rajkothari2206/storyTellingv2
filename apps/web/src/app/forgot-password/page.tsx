"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Mail, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await authClient.forgetPassword({
        email,
        redirectTo: "https://www.lallifafa.com/reset-password",
      });
      setSent(true);
    } catch {
      toast.error("Something went wrong. Please try again.");
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
            <Mail size={28} style={{ color: "var(--lf-teal)" }} />
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
            Don&apos;t worry —<br />
            <span style={{ color: "var(--lf-teal)" }}>we&apos;ll get you back in.</span>
          </h2>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.9rem", lineHeight: 1.7 }}>
            Enter your email address and we&apos;ll send you a secure link to reset your password.
          </p>
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
          {sent ? (
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
                  Check your inbox!
                </h1>
                <p style={{ color: "rgba(45,45,45,0.55)", fontSize: "0.92rem", lineHeight: 1.7 }}>
                  We&apos;ve sent a reset link to <strong style={{ color: "var(--lf-dark)" }}>{email}</strong>.
                  It may take a minute to arrive. Check your spam folder if you don&apos;t see it.
                </p>
              </div>
              <Link
                href="/sign-in"
                className="flex items-center gap-2 text-sm font-semibold mt-2"
                style={{ color: "var(--lf-teal)", fontFamily: "'Nunito', sans-serif" }}
              >
                <ArrowLeft size={15} /> Back to sign in
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
                Forgot your password?
              </h1>
              <p className="mt-2 mb-8" style={{ color: "rgba(45,45,45,0.55)", fontSize: "0.9rem" }}>
                No problem. Enter your email and we&apos;ll send a reset link.
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary mt-1"
                  style={{ width: "100%", justifyContent: "center", fontSize: "1rem", padding: "0.85rem" }}
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />}
                  {loading ? "Sending…" : "Send reset link"}
                </button>
              </form>

              <p className="text-center mt-6" style={{ fontSize: "0.85rem", color: "rgba(45,45,45,0.5)" }}>
                Don&apos;t have an account?{" "}
                <Link href="/sign-up" style={{ color: "var(--lf-teal)", fontWeight: 600 }}>
                  Sign up free
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
