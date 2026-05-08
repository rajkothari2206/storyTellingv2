import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Check, Star, Zap, Shield, HelpCircle, X } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { PricingFAQ } from "./PricingFAQ";
import { PricingCTAButton } from "@/components/pricing/PricingCTAButton";

const BASE = "https://www.lallifafa.com";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Start free with 250 credits — no credit card needed. Upgrade to Magic Pass for ₹199/month and get 1,000 credits, Hindi narration, and unlimited AI-illustrated stories for your child.",
  alternates: { canonical: `${BASE}/pricing` },
  openGraph: {
    title: "Lalli Fafa Pricing — Free plan + Magic Pass from ₹199/month",
    description:
      "Start free with 250 credits (≈4 stories). Upgrade anytime to Magic Pass for ₹199/month.",
    url: `${BASE}/pricing`,
  },
};

/* ── FAQ schema for this page ── */
const pricingFaqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What are Lalli Fafa credits?",
      acceptedAnswer: { "@type": "Answer", text: "Credits are the currency used to generate stories on Lalli Fafa. A short illustrated story costs 60 credits, a medium story costs 80. Voice narration is included. Free accounts start with 250 credits — enough for about 4 stories." },
    },
    {
      "@type": "Question",
      name: "How much does Lalli Fafa cost?",
      acceptedAnswer: { "@type": "Answer", text: "Lalli Fafa has a free plan with 250 credits and no credit card required. The paid Magic Pass plan costs ₹199 per month and includes 1,000 credits per month, Hindi narration, and priority story generation." },
    },
    {
      "@type": "Question",
      name: "Can I try Lalli Fafa for free?",
      acceptedAnswer: { "@type": "Answer", text: "Yes. Sign up for free and receive 250 credits instantly — no credit card needed. That gives you approximately 4 fully illustrated and narrated stories to try." },
    },
    {
      "@type": "Question",
      name: "Can I cancel my Lalli Fafa subscription anytime?",
      acceptedAnswer: { "@type": "Answer", text: "Yes. Cancel anytime from your dashboard. You keep all features until the end of your current billing period. No hidden fees or long-term commitments." },
    },
  ],
};

/* ── Plan definitions ── */
const plans = [
  {
    id: "free",
    name: "Starter",
    emoji: "🌱",
    price: "₹0",
    period: "forever",
    tagline: "Try before you love it",
    accentColor: "#00c9a7",
    accentBg: "rgba(0,201,167,0.08)",
    accentBorder: "rgba(0,201,167,0.25)",
    features: [
      { text: "250 welcome credits", note: "~4 stories" },
      { text: "English & Hindi text" },
      { text: "Short & medium story lengths" },
      { text: "1 child profile" },
    ],
    locked: ["Voice narration", "AI illustrations", "Long stories", "Priority generation"],
    ctaGuest: "Start free — no card needed",
    ctaLoggedIn: "Go to Storyboard",
    planInterval: "free" as const,
    highlight: false,
  },
  {
    id: "monthly",
    name: "Magic Pass",
    emoji: "✨",
    price: "₹199",
    period: "/ month",
    badge: "Most popular",
    badgeColor: "#f9c700",
    badgeText: "#131020",
    tagline: "The full magical experience",
    accentColor: "#f9c700",
    accentBg: "rgba(249,199,0,0.06)",
    features: [
      { text: "1,000 credits / month", note: "~16 stories" },
      { text: "All story lengths" },
      { text: "Voice narration", note: "EN + HI" },
      { text: "AI scene illustrations" },
      { text: "Priority generation" },
      { text: "Unlimited retries" },
      { text: "Cancel anytime" },
    ],
    ctaGuest: "Subscribe — ₹199/mo",
    ctaLoggedIn: "Get Magic Pass",
    planInterval: "monthly" as const,
    highlight: true,
  },
  {
    id: "yearly",
    name: "Magic Pass Yearly",
    emoji: "👑",
    price: "₹1,999",
    period: "/ year",
    priceNote: "≈ ₹167/mo — save 20%",
    badge: "Best value",
    badgeColor: "#00c9a7",
    badgeText: "#fff",
    tagline: "Best value for growing families",
    accentColor: "#a855f7",
    accentBg: "rgba(168,85,247,0.06)",
    accentBorder: "rgba(168,85,247,0.2)",
    features: [
      { text: "2,000 credits + 100/day", note: "top-up" },
      { text: "Everything in Monthly" },
      { text: "Multiple child profiles" },
      { text: "Early feature access" },
      { text: "Highest credit value" },
    ],
    ctaGuest: "Go yearly & save 20%",
    ctaLoggedIn: "Get Yearly Plan",
    planInterval: "yearly" as const,
    highlight: false,
  },
];

/* ── Credit comparison table ── */
const creditRows = [
  { action: "Short story (text + illustrations)", free: "60", magic: "60" },
  { action: "Medium story", free: "80", magic: "80" },
  { action: "Long story", free: "🔒", magic: "Available" },
  { action: "Monthly credit allowance", free: "250 (once)", magic: "1,000" },
  { action: "Voice narration (EN)", free: "🔒", magic: "Included" },
  { action: "Voice narration (HI)", free: "🔒", magic: "Included" },
];

/* ── Trust badges ── */
const trustItems = [
  { icon: <Shield size={20} />, label: "Secure payments", sub: "via Razorpay", color: "#00c9a7" },
  { icon: <Zap size={20} />, label: "Instant access", sub: "stories in 2 min", color: "#f9c700" },
  { icon: <Check size={20} />, label: "Cancel anytime", sub: "no questions asked", color: "#a855f7" },
  { icon: <Star size={20} fill="currentColor" />, label: "250 free credits", sub: "no card needed", color: "#ff6b35" },
];

export default function PricingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingFaqSchema) }}
      />
      <SiteHeader />
      <main>

        {/* ══════════════════════════════════════════
            HERO — compact bar
        ══════════════════════════════════════════ */}
        <section
          className="relative overflow-hidden"
          style={{
            background: "linear-gradient(160deg,#FFF8E7 0%,#E6FAF6 60%,#F3EEFF 100%)",
            paddingTop: 88,   /* clears sticky header (72px) + 16px breathing room */
            paddingBottom: 20,
          }}
        >
          <div className="mx-auto px-6 relative" style={{ maxWidth: 1120 }}>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">

              {/* Left: badge + headline + sub */}
              <div className="flex flex-col gap-1.5">
                <span
                  className="inline-flex items-center gap-1.5 self-start px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                  style={{ background: "rgba(249,199,0,0.18)", color: "#b8860b" }}
                >
                  <Star size={11} fill="currentColor" /> Simple Pricing
                </span>
                <h1
                  style={{
                    fontFamily: "'Baloo 2', sans-serif",
                    fontSize: "clamp(1.6rem,3vw,2.2rem)",
                    fontWeight: 800,
                    color: "var(--lf-dark)",
                    lineHeight: 1.15,
                  }}
                >
                  One price.{" "}
                  <span style={{ color: "var(--lf-teal)" }}>Infinite</span>{" "}
                  <span style={{ color: "var(--lf-sunshine)" }}>stories.</span>
                </h1>
                <p style={{ color: "rgba(45,45,45,0.55)", fontSize: "0.88rem", lineHeight: 1.6 }}>
                  Start free — no card needed. Upgrade when your child&apos;s eyes light up. ✨
                </p>
              </div>

              {/* Right: character + trust pills */}
              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="hidden sm:flex flex-col gap-1.5">
                  {["No credit card", "250 free credits", "Cancel anytime"].map((t) => (
                    <span key={t} className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "rgba(45,45,45,0.55)", fontFamily: "'Nunito', sans-serif" }}>
                      <Check size={13} style={{ color: "var(--lf-teal)" }} /> {t}
                    </span>
                  ))}
                </div>
                <div className="relative flex-shrink-0" style={{ width: 72, height: 72 }}>
                  <Image
                    src="/lf-hero.png"
                    alt="Lalli and Fafa"
                    fill
                    className="object-contain"
                    style={{ filter: "drop-shadow(0 4px 14px rgba(0,201,167,0.3))" }}
                  />
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            PRICING CARDS
        ══════════════════════════════════════════ */}
        <section
          className="py-8"
          style={{ background: "linear-gradient(180deg,#F2FFF9 0%,#fff 100%)" }}
        >
          <div className="mx-auto px-5" style={{ maxWidth: 1120 }}>
            <div className="grid md:grid-cols-3 gap-6 items-stretch">

              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className="relative flex flex-col rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-2"
                  style={
                    plan.highlight
                      ? {
                          background: "linear-gradient(160deg,#131020 0%,#1a1740 100%)",
                          border: "2px solid rgba(249,199,0,0.6)",
                          boxShadow: "0 24px 80px rgba(249,199,0,0.25), 0 8px 32px rgba(0,0,0,0.3)",
                          transform: "scale(1.03)",
                        }
                      : {
                          background: "#fff",
                          border: `1.5px solid ${plan.accentBorder ?? plan.accentColor + "33"}`,
                          boxShadow: `0 6px 32px ${plan.accentColor}18`,
                        }
                  }
                >
                  {/* Badge */}
                  {plan.badge && (
                    <div
                      className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold"
                      style={{ background: plan.badgeColor, color: plan.badgeText }}
                    >
                      {plan.badge}
                    </div>
                  )}

                  {/* Top accent bar */}
                  <div style={{ height: 4, background: plan.highlight ? "linear-gradient(90deg,#f9c700,#ffdc60)" : plan.accentColor }} />

                  <div className="p-7 flex flex-col gap-6 flex-1">

                    {/* Plan identity */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: "1.4rem" }}>{plan.emoji}</span>
                        <p style={{
                          fontFamily: "'Baloo 2', sans-serif",
                          fontWeight: 800,
                          fontSize: "0.85rem",
                          color: plan.highlight ? "rgba(255,255,255,0.5)" : "rgba(45,45,45,0.45)",
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                        }}>
                          {plan.name}
                        </p>
                      </div>
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <span style={{
                          fontFamily: "'Baloo 2', sans-serif",
                          fontSize: "3rem",
                          fontWeight: 800,
                          color: plan.highlight ? "#f9c700" : "var(--lf-dark)",
                          lineHeight: 1,
                        }}>
                          {plan.price}
                        </span>
                        <span style={{ color: plan.highlight ? "rgba(255,255,255,0.4)" : "rgba(45,45,45,0.45)", fontSize: "0.9rem" }}>
                          {plan.period}
                        </span>
                      </div>
                      {plan.priceNote && (
                        <p style={{ fontSize: "0.8rem", color: plan.highlight ? "rgba(255,255,255,0.5)" : "#a855f7", fontWeight: 600 }}>
                          {plan.priceNote}
                        </p>
                      )}
                      <p style={{ fontSize: "0.85rem", color: plan.highlight ? "rgba(255,255,255,0.45)" : "rgba(45,45,45,0.5)", marginTop: 2 }}>
                        {plan.tagline}
                      </p>
                    </div>

                    {/* Divider */}
                    <div style={{ height: 1, background: plan.highlight ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }} />

                    {/* Features */}
                    <ul className="flex flex-col gap-2.5 flex-1">
                      {plan.features.map((f) => (
                        <li key={f.text} className="flex items-start gap-2.5">
                          <div
                            className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5"
                            style={{ background: plan.highlight ? "rgba(249,199,0,0.2)" : `${plan.accentColor}20` }}
                          >
                            <Check size={12} style={{ color: plan.highlight ? "#f9c700" : plan.accentColor }} />
                          </div>
                          <span style={{ fontSize: "0.88rem", color: plan.highlight ? "rgba(255,255,255,0.85)" : "rgba(45,45,45,0.78)", fontWeight: 500 }}>
                            {f.text}
                            {f.note && (
                              <span style={{ marginLeft: 4, fontSize: "0.78rem", opacity: 0.6 }}>({f.note})</span>
                            )}
                          </span>
                        </li>
                      ))}
                      {plan.locked?.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 opacity-30">
                          <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5" style={{ background: "rgba(0,0,0,0.08)" }}>
                            <X size={10} style={{ color: "rgba(45,45,45,0.6)" }} />
                          </div>
                          <span style={{ fontSize: "0.85rem", color: plan.highlight ? "#fff" : "var(--lf-dark)", fontWeight: 500 }}>{f}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA button */}
                    <PricingCTAButton
                      planInterval={plan.planInterval}
                      ctaGuest={plan.ctaGuest}
                      ctaLoggedIn={plan.ctaLoggedIn}
                      className="py-3.5 rounded-2xl font-bold transition-all hover:scale-105 active:scale-95"
                      style={
                        plan.highlight
                          ? {
                              background: "linear-gradient(135deg,#f9c700,#e6ac00)",
                              color: "#131020",
                              fontFamily: "'Baloo 2', sans-serif",
                              fontSize: "0.95rem",
                              boxShadow: "0 6px 24px rgba(249,199,0,0.45)",
                              border: "none",
                            }
                          : plan.id === "yearly"
                          ? {
                              background: "linear-gradient(135deg,#a855f7,#8b2cf5)",
                              color: "#fff",
                              fontFamily: "'Baloo 2', sans-serif",
                              fontSize: "0.92rem",
                              boxShadow: "0 4px 16px rgba(168,85,247,0.35)",
                              border: "none",
                            }
                          : {
                              background: "linear-gradient(135deg,var(--lf-teal),#00a38d)",
                              color: "#fff",
                              fontFamily: "'Baloo 2', sans-serif",
                              fontSize: "0.92rem",
                              boxShadow: "0 4px 16px rgba(0,201,167,0.35)",
                              border: "none",
                            }
                      }
                    />
                  </div>
                </div>
              ))}
            </div>

            <p className="text-center mt-8" style={{ color: "rgba(45,45,45,0.4)", fontSize: "0.82rem", fontFamily: "'Nunito', sans-serif" }}>
              Secure payments via Razorpay · Cancel anytime · No hidden fees
            </p>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            CREDIT COMPARISON TABLE
        ══════════════════════════════════════════ */}
        <section className="py-14" style={{ background: "linear-gradient(160deg,#FFF8E7 0%,#FFFDE8 100%)" }}>
          <div className="mx-auto px-5" style={{ maxWidth: 820 }}>
            <div className="text-center mb-8">
              <span
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-3"
                style={{ background: "rgba(249,199,0,0.18)", color: "#b8860b" }}
              >
                <Zap size={12} /> What do credits get you?
              </span>
              <h2 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "clamp(1.5rem,3vw,2rem)", color: "var(--lf-dark)" }}>
                Credits, explained simply
              </h2>
            </div>

            <div className="rounded-3xl overflow-hidden" style={{ border: "1.5px solid rgba(0,0,0,0.08)", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
              {/* Table header */}
              <div
                className="grid grid-cols-3 px-6 py-3"
                style={{ background: "var(--lf-dark)", gridTemplateColumns: "1fr auto auto" }}
              >
                <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, fontSize: "0.82rem", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Action</span>
                <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, fontSize: "0.82rem", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "center", minWidth: 90 }}>Free</span>
                <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, fontSize: "0.82rem", color: "#f9c700", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "center", minWidth: 110 }}>Magic Pass ✨</span>
              </div>

              {/* Rows */}
              {creditRows.map((row, i) => (
                <div
                  key={row.action}
                  className="grid grid-cols-3 px-6 py-4 items-center"
                  style={{
                    gridTemplateColumns: "1fr auto auto",
                    background: i % 2 === 0 ? "#fff" : "rgba(0,0,0,0.015)",
                    borderTop: "1px solid rgba(0,0,0,0.05)",
                  }}
                >
                  <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.88rem", color: "var(--lf-dark)", fontWeight: 600 }}>{row.action}</span>
                  <span
                    style={{
                      fontFamily: "'Nunito', sans-serif",
                      fontSize: "0.88rem",
                      fontWeight: 700,
                      color: row.free === "🔒" ? "rgba(45,45,45,0.3)" : "rgba(45,45,45,0.7)",
                      textAlign: "center",
                      minWidth: 90,
                    }}
                  >
                    {row.free}
                  </span>
                  <span
                    style={{
                      fontFamily: "'Nunito', sans-serif",
                      fontSize: "0.88rem",
                      fontWeight: 700,
                      color: row.magic === "Included" || row.magic === "Available" ? "#00c9a7" : "var(--lf-dark)",
                      textAlign: "center",
                      minWidth: 110,
                    }}
                  >
                    {row.magic}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            TRUST BADGES
        ══════════════════════════════════════════ */}
        <section className="py-12" style={{ background: "#fff" }}>
          <div className="mx-auto px-5" style={{ maxWidth: 960 }}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {trustItems.map((item) => (
                <div
                  key={item.label}
                  className="flex flex-col items-center text-center gap-2.5 p-5 rounded-2xl transition-all hover:-translate-y-0.5"
                  style={{
                    background: `${item.color}0d`,
                    border: `1.5px solid ${item.color}28`,
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center"
                    style={{ background: `${item.color}18`, color: item.color }}
                  >
                    {item.icon}
                  </div>
                  <p style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "var(--lf-dark)" }}>{item.label}</p>
                  <p style={{ fontSize: "0.78rem", color: "rgba(45,45,45,0.5)", fontFamily: "'Nunito', sans-serif" }}>{item.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            SCENES STRIP — social proof
        ══════════════════════════════════════════ */}
        <section
          className="py-12"
          style={{ background: "linear-gradient(135deg,#E6FAF6 0%,#F3EEFF 100%)" }}
        >
          <div className="mx-auto px-5" style={{ maxWidth: 960 }}>
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Story world thumbnails */}
              <div className="flex items-center gap-3 flex-wrap justify-center md:justify-start">
                {[
                  "/lf-scene-jungle.png",
                  "/lf-scene-planets.png",
                  "/lf-scene-kite.png",
                  "/lf-scene-krishna.png",
                  "/lf-scene-balloons.png",
                ].map((src, i) => (
                  <div
                    key={i}
                    className="relative rounded-2xl overflow-hidden flex-shrink-0"
                    style={{
                      width: 64,
                      height: 64,
                      border: "2px solid rgba(255,255,255,0.8)",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  >
                    <Image src={src} alt="" fill className="object-cover" style={{ objectPosition: "center 30%" }} />
                  </div>
                ))}
              </div>
              <div className="flex-1 text-center md:text-left">
                <p style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.15rem", color: "var(--lf-dark)" }}>
                  12 magical story worlds, fully illustrated
                </p>
                <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.88rem", color: "rgba(45,45,45,0.55)", marginTop: 6 }}>
                  Adventures, mythology, space, nature &amp; more — with narration in English and Hindi.
                </p>
              </div>
              <Link
                href="/sign-up"
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold flex-shrink-0 transition-all hover:scale-105"
                style={{
                  background: "linear-gradient(135deg,var(--lf-teal),#00a38d)",
                  color: "#fff",
                  fontFamily: "'Baloo 2', sans-serif",
                  fontSize: "0.95rem",
                  boxShadow: "0 4px 20px rgba(0,201,167,0.35)",
                }}
              >
                <Sparkles size={16} /> Try free
              </Link>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            FAQ
        ══════════════════════════════════════════ */}
        <section
          className="py-16"
          style={{ background: "linear-gradient(160deg,#FFF0E6 0%,#FFE4D4 100%)" }}
        >
          <div className="mx-auto px-5" style={{ maxWidth: 760 }}>
            <div className="text-center mb-8">
              <span
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-3"
                style={{ background: "rgba(255,87,34,0.12)", color: "#bf360c" }}
              >
                <HelpCircle size={12} /> Questions answered
              </span>
              <h2 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "clamp(1.8rem,3.5vw,2.4rem)", color: "var(--lf-dark)" }}>
                Pricing FAQs
              </h2>
            </div>
            <PricingFAQ />
          </div>
        </section>

        {/* ══════════════════════════════════════════
            BOTTOM CTA
        ══════════════════════════════════════════ */}
        <section
          className="py-20 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg,#131020 0%,#1a1740 60%,#0d2d26 100%)" }}
        >
          {/* Glow orbs */}
          <div className="absolute pointer-events-none" style={{ top: -80, right: "10%", width: 400, height: 400, background: "radial-gradient(circle,rgba(0,201,167,0.2) 0%,transparent 70%)" }} />
          <div className="absolute pointer-events-none" style={{ bottom: -60, left: "5%", width: 300, height: 300, background: "radial-gradient(circle,rgba(249,199,0,0.18) 0%,transparent 70%)" }} />

          <div className="mx-auto px-6 text-center relative" style={{ maxWidth: 680 }}>
            {/* Character image */}
            <div className="relative inline-block mb-6" style={{ width: 100, height: 100 }}>
              <Image src="/lf-hero.png" alt="Lalli and Fafa" fill className="object-contain" style={{ filter: "drop-shadow(0 8px 28px rgba(0,201,167,0.4))" }} />
            </div>

            <h2
              style={{
                fontFamily: "'Baloo 2', sans-serif",
                fontSize: "clamp(1.9rem,4vw,3rem)",
                fontWeight: 800,
                color: "#fff",
                lineHeight: 1.15,
              }}
            >
              Start with{" "}
              <span style={{ color: "#f9c700" }}>250 free credits</span>
            </h2>

            <p className="mt-4 mb-8" style={{ color: "rgba(255,255,255,0.55)", fontSize: "1rem", lineHeight: 1.75 }}>
              No credit card. No commitment. Just your child&apos;s first magical Lalli &amp; Fafa story, ready in 2 minutes.
            </p>

            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href="/sign-up"
                className="flex items-center gap-2 px-8 py-4 rounded-2xl font-bold transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg,#f9c700,#e6ac00)", color: "#131020", fontFamily: "'Baloo 2', sans-serif", fontSize: "1.05rem", boxShadow: "0 6px 28px rgba(249,199,0,0.4)" }}
              >
                <Sparkles size={18} /> Start free today
              </Link>
              <Link
                href="/stories"
                className="flex items-center gap-2 px-8 py-4 rounded-2xl font-bold transition-all hover:bg-white/10"
                style={{ border: "1.5px solid rgba(255,255,255,0.2)", color: "#fff", fontFamily: "'Baloo 2', sans-serif", fontSize: "1.05rem" }}
              >
                See sample stories
              </Link>
            </div>

            <p className="mt-6" style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.3)", fontFamily: "'Nunito', sans-serif" }}>
              Trusted by families across India · Stories in English &amp; Hindi
            </p>
          </div>
        </section>

      </main>
      <SiteFooter />
    </>
  );
}
