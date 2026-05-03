"use client";

import Link from "next/link";
import { Sparkles, Play, Star } from "lucide-react";

const stats = [
  { value: "10,000+", label: "Happy families" },
  { value: "English & Hindi", label: "Languages" },
  { value: "100%", label: "Safe content" },
];

export function HeroSection() {
  return (
    <section
      className="relative min-h-[65vh] flex items-center overflow-hidden"
      style={{ paddingTop: 72 }}
    >
      {/* Background blobs */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute rounded-full blur-3xl opacity-40"
          style={{
            width: 500, height: 500,
            background: "radial-gradient(circle, #F9C700 0%, transparent 70%)",
            top: "-15%", right: "0%",
          }}
        />
        <div
          className="absolute rounded-full blur-3xl opacity-25"
          style={{
            width: 400, height: 400,
            background: "radial-gradient(circle, #1ABFA6 0%, transparent 70%)",
            bottom: "-10%", left: "-5%",
          }}
        />
      </div>

      {/* Floating decorations */}
      <span className="animate-float absolute top-24 left-[6%] text-3xl hidden lg:block select-none">⭐</span>
      <span className="animate-float-delay absolute top-32 right-[8%] text-2xl hidden lg:block select-none">✨</span>
      <span className="animate-float-slow absolute bottom-20 left-[10%] text-xl hidden lg:block select-none">🌙</span>
      <span className="animate-float absolute bottom-24 right-[6%] text-xl hidden lg:block select-none">🌟</span>

      {/* Content — centred single column */}
      <div className="mx-auto w-full px-6 py-10 lg:py-12" style={{ maxWidth: 760 }}>
        <div className="flex flex-col items-center text-center gap-6">

          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold"
            style={{
              background: "rgba(249,199,0,0.15)",
              color: "#b8860b",
              border: "1px solid rgba(249,199,0,0.4)",
            }}
          >
            <Star size={13} fill="currentColor" />
            Loved by 10,000+ families
            <Star size={13} fill="currentColor" />
          </div>

          {/* Headline */}
          <h1
            style={{
              fontFamily: "'Baloo 2', sans-serif",
              fontSize: "clamp(2.4rem, 6vw, 4rem)",
              fontWeight: 800,
              lineHeight: 1.1,
              color: "var(--lf-dark)",
            }}
          >
            Where every child{" "}
            <span className="text-gradient-sunshine">becomes</span>
            <br />
            the{" "}
            <span
              style={{
                position: "relative",
                display: "inline-block",
                color: "var(--lf-teal)",
              }}
            >
              hero
              <svg
                viewBox="0 0 120 12"
                className="absolute -bottom-1 left-0 w-full"
                style={{ fill: "none", stroke: "var(--lf-sunshine)", strokeWidth: 3, strokeLinecap: "round" }}
              >
                <path d="M4 8 Q30 2 60 8 Q90 14 116 6" />
              </svg>
            </span>{" "}
            of the story.
          </h1>

          {/* Sub */}
          <p
            style={{
              fontSize: "clamp(1rem, 2vw, 1.15rem)",
              color: "rgba(45,45,45,0.65)",
              maxWidth: 520,
              lineHeight: 1.7,
            }}
          >
            AI-powered personalised stories featuring{" "}
            <strong style={{ color: "var(--lf-dark)" }}>Lalli &amp; Fafa</strong> — with
            beautiful narration in <strong>English &amp; Hindi</strong>.
            Perfect for bedtime, screen time that matters, and growing little hearts.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <Link href="/sign-up" className="btn-primary" style={{ fontSize: "1.05rem", padding: "0.875rem 2.25rem" }}>
              <Sparkles size={18} />
              Start Free — No credit card
            </Link>
            <Link href="/stories" className="btn-ghost" style={{ fontSize: "1.05rem", padding: "0.875rem 2.25rem" }}>
              <Play size={16} fill="currentColor" />
              See a story
            </Link>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            {stats.map((s) => (
              <div
                key={s.label}
                className="flex flex-col items-center px-5 py-3 rounded-2xl"
                style={{
                  background: "rgba(255,255,255,0.75)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.9)",
                }}
              >
                <span
                  style={{
                    fontFamily: "'Baloo 2', sans-serif",
                    fontSize: "1.1rem",
                    fontWeight: 800,
                    color: "var(--lf-teal)",
                    lineHeight: 1.2,
                  }}
                >
                  {s.value}
                </span>
                <span style={{ fontSize: 12, color: "rgba(45,45,45,0.55)", fontWeight: 600 }}>{s.label}</span>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
