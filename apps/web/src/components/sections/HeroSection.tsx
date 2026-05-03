"use client";

import Link from "next/link";
import Image from "next/image";
import { Sparkles, Play, Star } from "lucide-react";

const stats = [
  { value: "10,000+", label: "Happy families" },
  { value: "English & Hindi", label: "Languages" },
  { value: "100%", label: "Safe content" },
];

export function HeroSection() {
  return (
    <section
      className="relative min-h-[70vh] flex items-center overflow-hidden"
      style={{ paddingTop: 72 }}
    >
      {/* Background blobs */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute rounded-full blur-3xl opacity-40"
          style={{
            width: 520, height: 520,
            background: "radial-gradient(circle, #F9C700 0%, transparent 70%)",
            top: "-15%", right: "-5%",
          }}
        />
        <div
          className="absolute rounded-full blur-3xl opacity-25"
          style={{
            width: 380, height: 380,
            background: "radial-gradient(circle, #1ABFA6 0%, transparent 70%)",
            bottom: "-10%", left: "-5%",
          }}
        />
      </div>

      {/* Floating decorations */}
      <span className="animate-float absolute top-28 left-[5%] text-3xl hidden lg:block select-none">⭐</span>
      <span className="animate-float-slow absolute bottom-24 left-[8%] text-xl hidden lg:block select-none">🌙</span>

      <div className="mx-auto w-full px-6 py-8 lg:py-10" style={{ maxWidth: 1160 }}>
        <div className="grid lg:grid-cols-[1fr_440px] gap-8 items-center">

          {/* Left — copy */}
          <div className="flex flex-col gap-5 text-center lg:text-left">

            {/* Badge */}
            <div className="flex justify-center lg:justify-start">
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
            </div>

            {/* Headline */}
            <h1
              style={{
                fontFamily: "'Baloo 2', sans-serif",
                fontSize: "clamp(2.4rem, 5.5vw, 3.8rem)",
                fontWeight: 800,
                lineHeight: 1.1,
                color: "var(--lf-dark)",
              }}
            >
              Where every child{" "}
              <span className="text-gradient-sunshine">becomes</span>
              <br />
              the{" "}
              <span style={{ position: "relative", display: "inline-block", color: "var(--lf-teal)" }}>
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
                fontSize: "clamp(1rem, 2vw, 1.12rem)",
                color: "rgba(45,45,45,0.65)",
                maxWidth: 500,
                lineHeight: 1.7,
              }}
              className="mx-auto lg:mx-0"
            >
              AI-powered personalised stories featuring{" "}
              <strong style={{ color: "var(--lf-dark)" }}>Lalli &amp; Fafa</strong> — with
              beautiful narration in <strong>English &amp; Hindi</strong>.
              Perfect for bedtime, screen time that matters, and growing little hearts.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start pt-1">
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
            <div className="flex flex-wrap justify-center lg:justify-start gap-3 pt-1">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="flex flex-col items-center lg:items-start px-5 py-3 rounded-2xl"
                  style={{
                    background: "rgba(255,255,255,0.75)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(255,255,255,0.9)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Baloo 2', sans-serif",
                      fontSize: "1.05rem",
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

          {/* Right — Lalli & Fafa showcase */}
          <div className="relative flex items-end justify-center hidden lg:flex" style={{ minHeight: 420 }}>

            {/* Big soft glow behind characters */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: "radial-gradient(ellipse at 50% 80%, rgba(255,193,7,0.28) 0%, rgba(0,201,167,0.18) 50%, transparent 75%)",
                transform: "scale(1.1)",
              }}
            />

            {/* Floating story card — top left */}
            <div
              className="absolute top-6 left-0 rounded-2xl p-3.5 shadow-xl z-10"
              style={{
                background: "rgba(255,255,255,0.95)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.9)",
                maxWidth: 175,
              }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-base">📖</span>
                <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, fontSize: 12, color: "var(--lf-dark)" }}>
                  New story ready!
                </span>
              </div>
              <p style={{ fontSize: 11, color: "rgba(45,45,45,0.6)", lineHeight: 1.5 }}>
                "Arjun &amp; the Magic Forest" — 3 min, Hindi
              </p>
              <div
                className="mt-2 text-center py-1 rounded-full text-xs font-bold"
                style={{ background: "var(--lf-mint)", color: "var(--lf-teal)" }}
              >
                ▶ Play story
              </div>
            </div>

            {/* Sparkle top-right */}
            <span className="animate-float-delay absolute top-10 right-4 text-2xl select-none z-10">✨</span>
            <span className="animate-float absolute top-36 right-2 text-xl select-none z-10">🌟</span>

            {/* Characters image */}
            <div className="animate-float-slow relative z-10 w-full flex justify-center">
              <Image
                src="/LalliFafa.png"
                alt="Lalli and Fafa — your child's story companions"
                width={420}
                height={460}
                className="object-contain drop-shadow-2xl"
                style={{ mixBlendMode: "multiply", maxWidth: "100%" }}
                priority
              />
            </div>

            {/* Name badges at the bottom */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-3 z-10">
              <span
                className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shadow-md"
                style={{ background: "var(--lf-sunshine)", color: "var(--lf-dark)" }}
              >
                ⭐ Lalli, age 6
              </span>
              <span
                className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shadow-md"
                style={{ background: "var(--lf-teal)", color: "#fff" }}
              >
                💙 Fafa, age 3
              </span>
            </div>
          </div>

          {/* Mobile — characters image (shows below text) */}
          <div className="flex lg:hidden justify-center relative" style={{ minHeight: 260 }}>
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: "radial-gradient(ellipse, rgba(255,193,7,0.2) 0%, transparent 70%)",
              }}
            />
            <Image
              src="/LalliFafa.png"
              alt="Lalli and Fafa"
              width={280}
              height={300}
              className="object-contain drop-shadow-xl relative z-10"
              style={{ mixBlendMode: "multiply" }}
            />
          </div>

        </div>
      </div>
    </section>
  );
}
