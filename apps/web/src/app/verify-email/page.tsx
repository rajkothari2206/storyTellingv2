import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Verify Your Email",
  robots: { index: false },
};

export default function VerifyEmailPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: "var(--lf-cream)" }}
    >
      <div className="w-full text-center" style={{ maxWidth: 460 }}>
        <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>✅</div>
        <h1
          style={{
            fontFamily: "'Baloo 2', sans-serif",
            fontSize: "clamp(1.7rem, 3vw, 2.2rem)",
            fontWeight: 800,
            color: "var(--lf-dark)",
            lineHeight: 1.2,
            marginBottom: "0.75rem",
          }}
        >
          Email verified!
        </h1>
        <p
          style={{
            color: "rgba(45,45,45,0.6)",
            fontSize: "1rem",
            lineHeight: 1.6,
            marginBottom: "2rem",
          }}
        >
          Your Lalli Fafa account is now active. Time to create your child's first magical story!
        </p>
        <Link
          href="/onboarding"
          className="btn-primary"
          style={{ display: "inline-flex", justifyContent: "center", fontSize: "1rem", padding: "0.85rem 2rem" }}
        >
          ✨ Let's get started
        </Link>
        <p style={{ marginTop: "1.5rem" }}>
          <Link
            href="/dashboard"
            style={{ color: "rgba(45,45,45,0.4)", fontSize: "0.85rem" }}
          >
            Already set up? Go to dashboard →
          </Link>
        </p>
      </div>
    </div>
  );
}
