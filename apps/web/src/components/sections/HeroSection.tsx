"use client";

import Link from "next/link";
import Image from "next/image";
import { Sparkles, Play, Star } from "lucide-react";

const stats = [
  { value: "10,000+", label: "Happy families" },
  { value: "English & Hindi", label: "Languages" },
  { value: "100%", label: "Safe & ad-free" },
];

export function HeroSection() {
  return (
    <section
      className="relative overflow-hidden"
      style={{ paddingTop: 72, background: "var(--lf-cream)" }}
    >
      {/* Soft background gradients */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div
          className="absolute rounded-full blur-3xl"
          style={{
            width: 600, height: 600,
            background: "radial-gradient(circle, rgba(255,193,7,0.18) 0%, transparent 70%)",
            top: "-20%", right: "-8%",
          }}
        />
        <div
          className="absolute rounded-full blur-3xl"
          style={{
            width: 400, height: 400,
            background: "radial-gradient(circle, rgba(0,201,167,0.12) 0%, transparent 70%)",
            bottom: "0%", left: "-5%",
          }}
        />
      </div>

      {/* Floating decorations — desktop only */}
      <span className="animate-float absolute top-28 left-[4%] text-3xl hidden xl:block select-none" style={{ opacity: 0.7 }}>⭐</span>
      <span className="animate-float-slow absolute bottom-16 left-[6%] text-2xl hidden xl:block select-none" style={{ opacity: 0.6 }}>🌙</span>

      <div className="mx-auto w-full px-6" style={{ maxWidth: 1180 }}>
        <div className="grid lg:grid-cols-[1fr_480px] items-center gap-0">

          {/* ── Left: copy ── */}
          <div className="flex flex-col gap-5 py-12 lg:py-16 text-center lg:text-left">

            {/* Badge */}
            <div className="flex justify-center lg:justify-start">
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold"
                style={{
                  background: "rgba(255,193,7,0.14)",
                  color: "#9a6e00",
                  border: "1px solid rgba(255,193,7,0.35)",
                }}
              >
                <Star size={12} fill="currentColor" />
                Loved by 10,000+ families
                <Star size={12} fill="currentColor" />
              </div>
            </div>

            {/* Headline */}
            <h1
              style={{
                fontFamily: "'Baloo 2', sans-serif",
                fontSize: "clamp(2.5rem, 5.2vw, 3.9rem)",
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
                  style={{ fill: "none", stroke: "var(--lf-sunshine)", strokeWidth: 3.5, strokeLinecap: "round" }}
                >
                  <path d="M4 8 Q30 2 60 8 Q90 14 116 6" />
                </svg>
              </span>{" "}
              of the story.
            </h1>

            {/* Sub */}
            <p
              style={{
                fontSize: "clamp(1rem, 1.8vw, 1.1rem)",
                color: "rgba(14,10,31,0.58)",
                maxWidth: 480,
                lineHeight: 1.75,
              }}
              className="mx-auto lg:mx-0"
            >
              AI-powered personalised stories featuring{" "}
              <strong style={{ color: "var(--lf-dark)", fontWeight: 700 }}>Lalli &amp; Fafa</strong> — with
              beautiful narration in <strong style={{ color: "var(--lf-dark)" }}>English &amp; Hindi</strong>.
              Perfect for bedtime, screen time that matters, and growing little hearts.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start pt-1">
              <Link
                href="/sign-up"
                className="btn-primary"
                style={{ fontSize: "1.05rem", padding: "0.9rem 2.25rem" }}
              >
                <Sparkles size={17} />
                Start Free — No credit card
              </Link>
              <Link
                href="/stories"
                className="btn-ghost"
                style={{ fontSize: "1.05rem", padding: "0.9rem 2.25rem" }}
              >
                <Play size={15} fill="currentColor" />
                See a story
              </Link>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-3 pt-2">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="flex flex-col items-center lg:items-start px-5 py-3 rounded-2xl"
                  style={{
                    background: "rgba(255,255,255,0.8)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(0,0,0,0.06)",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Baloo 2', sans-serif",
                      fontSize: "1rem",
                      fontWeight: 800,
                      color: "var(--lf-teal)",
                      lineHeight: 1.2,
                    }}
                  >
                    {s.value}
                  </span>
                  <span style={{ fontSize: 11, color: "rgba(14,10,31,0.45)", fontWeight: 600 }}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: Lalli & Fafa — desktop ── */}
          <div className="relative hidden lg:flex items-end justify-center" style={{ height: 540 }}>

            {/* Warm glow that echoes the characters' own aura */}
            <div
              className="absolute"
              style={{
                width: 420, height: 420,
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(255,193,7,0.22) 0%, rgba(255,140,0,0.08) 50%, transparent 75%)",
                bottom: "4%", left: "50%",
                transform: "translateX(-50%)",
                filter: "blur(24px)",
              }}
            />

            {/* Characters — no blend mode needed, PNG has transparent bg */}
            <div className="animate-float-slow relative z-10 w-full flex justify-center">
              <Image
                src="/lf-hero.png"
                alt="Lalli and Fafa — your child's forever story companions"
                width={480}
                height={540}
                className="object-contain"
                style={{ objectPosition: "bottom", maxWidth: "100%" }}
                priority
              />
            </div>

            {/* Name badges pinned at the bottom */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-3 z-20">
              <span
                className="px-3.5 py-1.5 rounded-full text-xs font-bold shadow-md whitespace-nowrap"
                style={{ background: "var(--lf-sunshine)", color: "var(--lf-dark)" }}
              >
                ⭐ Lalli · age 6
              </span>
              <span
                className="px-3.5 py-1.5 rounded-full text-xs font-bold shadow-md whitespace-nowrap"
                style={{ background: "var(--lf-teal)", color: "#fff" }}
              >
                💙 Fafa · age 3
              </span>
            </div>

            {/* Floating info card — top left of image */}
            <div
              className="absolute top-10 left-2 z-20 rounded-2xl px-4 py-3 shadow-xl"
              style={{
                background: "rgba(255,255,255,0.95)",
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(255,255,255,1)",
                maxWidth: 180,
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span style={{ fontSize: 18 }}>✨</span>
                <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, fontSize: 12, color: "var(--lf-dark)", lineHeight: 1.3 }}>
                  Personalised<br />just for your child
                </span>
              </div>
              <div className="flex gap-1 mt-1.5">
                {["🌟","🌙","🎨","📖"].map(e => (
                  <span key={e} className="text-sm">{e}</span>
                ))}
              </div>
            </div>

            {/* Floating sparkle — top right */}
            <span className="animate-float-delay absolute top-14 right-6 text-2xl select-none z-10">✨</span>
          </div>

          {/* ── Mobile: characters below copy ── */}
          <div className="flex lg:hidden justify-center relative pb-4" style={{ minHeight: 300 }}>
            <div
              className="absolute inset-0"
              style={{
                background: "radial-gradient(ellipse, rgba(255,193,7,0.18) 0%, transparent 70%)",
              }}
            />
            <Image
              src="/lf-hero.png"
              alt="Lalli and Fafa"
              width={300}
              height={340}
              className="object-contain relative z-10"
              priority
            />
          </div>

        </div>
      </div>
    </section>
  );
}
