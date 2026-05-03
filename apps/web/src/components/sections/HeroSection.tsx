"use client";

import Link from "next/link";
import Image from "next/image";
import { Sparkles, Play, Star } from "lucide-react";

const stats = [
  { value: "10,000+", label: "Happy families" },
  { value: "English\n& Hindi", label: "Languages" },
  { value: "100%", label: "Safe content" },
];

export function HeroSection() {
  return (
    <section
      className="relative min-h-[88vh] flex items-center overflow-hidden"
      style={{ paddingTop: 72 }}
    >
      {/* Background blobs */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute rounded-full blur-3xl opacity-40"
          style={{
            width: 500, height: 500,
            background: "radial-gradient(circle, #F9C700 0%, transparent 70%)",
            top: "-10%", right: "5%",
          }}
        />
        <div
          className="absolute rounded-full blur-3xl opacity-30"
          style={{
            width: 400, height: 400,
            background: "radial-gradient(circle, #1ABFA6 0%, transparent 70%)",
            bottom: "5%", left: "-5%",
          }}
        />
        <div
          className="absolute rounded-full blur-3xl opacity-20"
          style={{
            width: 300, height: 300,
            background: "radial-gradient(circle, #FF6B35 0%, transparent 70%)",
            top: "40%", left: "40%",
          }}
        />
      </div>

      {/* Floating decorations */}
      <span className="animate-float absolute top-24 left-[8%] text-3xl hidden lg:block select-none">⭐</span>
      <span className="animate-float-delay absolute top-40 right-[12%] text-2xl hidden lg:block select-none">✨</span>
      <span className="animate-float-slow absolute bottom-32 left-[15%] text-2xl hidden lg:block select-none">🌙</span>
      <span className="animate-float absolute bottom-40 right-[8%] text-xl hidden lg:block select-none">🌟</span>

      <div className="mx-auto w-full px-6" style={{ maxWidth: 1200 }}>
        <div className="grid lg:grid-cols-2 gap-10 items-center py-10 lg:py-14">

          {/* Left — copy */}
          <div className="flex flex-col gap-6 text-center lg:text-left">

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
                <Star size={14} fill="currentColor" />
                Loved by 10,000+ families
                <Star size={14} fill="currentColor" />
              </div>
            </div>

            {/* Headline */}
            <h1
              style={{
                fontFamily: "'Baloo 2', sans-serif",
                fontSize: "clamp(2.6rem, 6vw, 4.2rem)",
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
                fontSize: "clamp(1rem, 2vw, 1.2rem)",
                color: "rgba(45,45,45,0.7)",
                maxWidth: 480,
                margin: "0 auto",
                lineHeight: 1.7,
              }}
              className="lg:mx-0"
            >
              AI-powered personalised stories featuring{" "}
              <strong style={{ color: "var(--lf-dark)" }}>Lalli &amp; Fafa</strong> — with
              beautiful narration in <strong>English &amp; Hindi</strong>.
              Perfect for bedtime, screen time that matters, and growing little hearts.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start pt-2">
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
            <div className="flex flex-wrap justify-center lg:justify-start gap-4 pt-4">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="flex flex-col items-center lg:items-start px-5 py-3 rounded-2xl"
                  style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.9)" }}
                >
                  <span
                    style={{
                      fontFamily: "'Baloo 2', sans-serif",
                      fontSize: "1.2rem",
                      fontWeight: 800,
                      color: "var(--lf-teal)",
                      whiteSpace: "pre-line",
                      textAlign: "center",
                      lineHeight: 1.2,
                    }}
                  >
                    {s.value}
                  </span>
                  <span style={{ fontSize: 12, color: "rgba(45,45,45,0.6)", fontWeight: 600 }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — characters */}
          <div className="relative flex items-center justify-center" style={{ minHeight: 420 }}>
            {/* Glow ring */}
            <div
              className="absolute rounded-full"
              style={{
                width: 360, height: 360,
                background: "radial-gradient(circle, rgba(249,199,0,0.18) 0%, rgba(26,191,166,0.12) 60%, transparent 80%)",
              }}
            />

            {/* Lalli */}
            <div
              className="animate-float absolute"
              style={{ left: "2%", bottom: "5%", zIndex: 2 }}
            >
              <div className="relative">
                <Image
                  src="/Lalli-new.png"
                  alt="Lalli — brave adventurer"
                  width={210}
                  height={280}
                  className="object-contain drop-shadow-2xl"
                  style={{ mixBlendMode: "multiply" }}
                  priority
                />
                <div
                  className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap"
                  style={{ background: "var(--lf-sunshine)", color: "var(--lf-dark)" }}
                >
                  ⭐ Lalli, 6
                </div>
              </div>
            </div>

            {/* Fafa */}
            <div
              className="animate-float-delay absolute"
              style={{ right: "2%", bottom: "8%", zIndex: 1 }}
            >
              <div className="relative">
                <Image
                  src="/Fafa_1.jpg"
                  alt="Fafa — curious explorer"
                  width={170}
                  height={230}
                  className="object-contain drop-shadow-2xl rounded-3xl"
                  style={{ mixBlendMode: "multiply" }}
                  priority
                />
                <div
                  className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap"
                  style={{ background: "var(--lf-teal)", color: "#fff" }}
                >
                  💙 Fafa, 3
                </div>
              </div>
            </div>

            {/* Floating story card */}
            <div
              className="absolute top-4 right-0 rounded-2xl p-4 shadow-xl hidden sm:block"
              style={{
                background: "rgba(255,255,255,0.95)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.9)",
                maxWidth: 190,
                zIndex: 5,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">📖</span>
                <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, fontSize: 13, color: "var(--lf-dark)" }}>
                  New story ready!
                </span>
              </div>
              <p style={{ fontSize: 12, color: "rgba(45,45,45,0.6)", lineHeight: 1.5 }}>
                "Arjun &amp; the Magic Forest" — 3 min, Hindi
              </p>
              <div
                className="mt-2 text-center py-1 rounded-full text-xs font-bold"
                style={{ background: "var(--lf-mint)", color: "var(--lf-teal)" }}
              >
                ▶ Play story
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wave divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ display: "block", width: "100%", height: 60 }}>
          <path d="M0 60 L0 30 Q180 0 360 20 Q540 40 720 20 Q900 0 1080 20 Q1260 40 1440 20 L1440 60 Z" fill="white" opacity="0.5"/>
          <path d="M0 60 L0 40 Q200 10 400 30 Q600 50 800 30 Q1000 10 1200 30 Q1350 45 1440 35 L1440 60 Z" fill="var(--lf-peach)"/>
        </svg>
      </div>
    </section>
  );
}
