import type { Metadata } from "next";
import Link from "next/link";
import { Check, Sparkles, Star, Zap, Shield, HelpCircle } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Start free with 250 credits. Upgrade to Magic Pass for ₹199/month — unlimited stories, voice narration, and AI illustrations for your child.",
};

const plans = [
  {
    id: "free",
    name: "Free",
    price: "₹0",
    period: "Forever free",
    tagline: "Try before you love it",
    features: [
      "250 welcome credits",
      "Text-only stories",
      "2-min & 3-min story lengths",
      "English & Hindi text",
      "1 child profile",
    ],
    locked: ["5-min stories", "Voice narration", "AI illustrations", "Priority generation"],
    cta: "Start free",
    href: "/sign-up",
    style: "ghost" as const,
  },
  {
    id: "monthly",
    name: "Magic Pass",
    price: "₹199",
    period: "/ month",
    badge: "Most popular",
    tagline: "The full magical experience",
    features: [
      "1,000 credits instantly",
      "All story lengths unlocked",
      "Voice narration (EN + HI)",
      "AI scene illustrations",
      "Priority generation",
      "Unlimited retries",
      "7-day free trial",
      "Cancel anytime",
    ],
    cta: "Start Magic Pass",
    href: "/sign-up?plan=monthly",
    style: "primary" as const,
    highlight: true,
  },
  {
    id: "yearly",
    name: "Magic Pass Yearly",
    price: "₹1,999",
    period: "/ year",
    badge: "Save 20%",
    tagline: "Best value for growing families",
    features: [
      "2,000 credits + 100/day top-up",
      "Everything in Monthly",
      "Early access to new features",
      "Multiple child profiles",
      "Highest credit value",
      "Annual billing flexibility",
    ],
    cta: "Go yearly",
    href: "/sign-up?plan=yearly",
    style: "secondary" as const,
  },
];

const faqItems = [
  {
    q: "What are credits?",
    a: "Credits are the currency for generating stories. A 2-minute story costs roughly 10 credits, a 3-minute story around 20, and a 5-minute story around 35. Credits also cover voice narration and AI illustration generation.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel anytime from your dashboard — you keep all features until the end of your current billing period. No hidden fees, no long-term commitment.",
  },
  {
    q: "Is there really a free plan?",
    a: "Absolutely. You get 250 credits on signup — that's around 15–20 stories with text output. No credit card needed. Upgrade when you're ready.",
  },
  {
    q: "What happens when credits run out?",
    a: "On the free plan, you can purchase additional credits. On Magic Pass, you get 1,000 credits per month automatically — most families never run out.",
  },
  {
    q: "Are payments secure?",
    a: "Yes. All payments are processed by Razorpay, India's most trusted payment gateway. We never store your card details.",
  },
  {
    q: "Can I switch plans?",
    a: "You can upgrade or downgrade at any time. Upgrading is instant. Downgrading takes effect at the next billing cycle.",
  },
];

export default function PricingPage() {
  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero */}
        <section
          className="pt-32 pb-16"
          style={{ background: "linear-gradient(160deg, var(--lf-cream) 0%, var(--lf-mint) 100%)" }}
        >
          <div className="mx-auto px-6 text-center" style={{ maxWidth: 700 }}>
            <span
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider mb-5"
              style={{ background: "rgba(249,199,0,0.18)", color: "#b8860b" }}
            >
              <Star size={13} fill="currentColor" /> Simple Pricing
            </span>
            <h1
              style={{
                fontFamily: "'Baloo 2', sans-serif",
                fontSize: "clamp(2.2rem, 5vw, 3.5rem)",
                fontWeight: 800,
                color: "var(--lf-dark)",
                lineHeight: 1.1,
              }}
            >
              One price.{" "}
              <span className="text-gradient-sunshine">Infinite stories.</span>
            </h1>
            <p
              className="mt-5"
              style={{ color: "rgba(45,45,45,0.65)", fontSize: "1.1rem", lineHeight: 1.7 }}
            >
              Start free — no credit card required. Upgrade to Magic Pass when
              you see your child&apos;s eyes light up.
            </p>
          </div>
        </section>

        {/* Pricing cards */}
        <section className="py-20" style={{ background: "#fff" }}>
          <div className="mx-auto px-6" style={{ maxWidth: 1100 }}>
            <div className="grid md:grid-cols-3 gap-6 items-start">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className="relative flex flex-col rounded-3xl overflow-hidden transition-all duration-200 hover:-translate-y-1"
                  style={{
                    background: plan.highlight ? "var(--lf-dark)" : "var(--lf-cream)",
                    border: plan.highlight
                      ? "2px solid var(--lf-sunshine)"
                      : "1.5px solid rgba(0,0,0,0.07)",
                    boxShadow: plan.highlight
                      ? "0 20px 60px rgba(249,199,0,0.2)"
                      : "0 4px 20px rgba(0,0,0,0.05)",
                    transform: plan.highlight ? "scale(1.03)" : undefined,
                  }}
                >
                  {plan.badge && (
                    <div
                      className="absolute top-5 right-5 px-3 py-1 rounded-full text-xs font-bold"
                      style={{
                        background: plan.id === "yearly" ? "var(--lf-teal)" : "var(--lf-sunshine)",
                        color: plan.id === "yearly" ? "#fff" : "var(--lf-dark)",
                      }}
                    >
                      {plan.badge}
                    </div>
                  )}

                  <div className="p-8 flex flex-col gap-5 flex-1">
                    <div>
                      <p
                        style={{
                          fontFamily: "'Baloo 2', sans-serif",
                          fontWeight: 700,
                          fontSize: "0.9rem",
                          color: plan.highlight ? "rgba(255,255,255,0.55)" : "rgba(45,45,45,0.5)",
                          textTransform: "uppercase",
                          letterSpacing: "0.07em",
                        }}
                      >
                        {plan.name}
                      </p>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span
                          style={{
                            fontFamily: "'Baloo 2', sans-serif",
                            fontSize: "2.8rem",
                            fontWeight: 800,
                            color: plan.highlight ? "var(--lf-sunshine)" : "var(--lf-dark)",
                            lineHeight: 1,
                          }}
                        >
                          {plan.price}
                        </span>
                        <span
                          style={{
                            color: plan.highlight ? "rgba(255,255,255,0.45)" : "rgba(45,45,45,0.45)",
                            fontSize: "0.95rem",
                          }}
                        >
                          {plan.period}
                        </span>
                      </div>
                      <p
                        className="mt-2"
                        style={{
                          fontSize: "0.88rem",
                          color: plan.highlight ? "rgba(255,255,255,0.5)" : "rgba(45,45,45,0.5)",
                        }}
                      >
                        {plan.tagline}
                      </p>
                    </div>

                    <div style={{ height: 1, background: plan.highlight ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }} />

                    <ul className="flex flex-col gap-2.5">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5">
                          <Check size={16} className="flex-shrink-0 mt-0.5" style={{ color: "var(--lf-teal)" }} />
                          <span
                            style={{
                              fontSize: "0.88rem",
                              color: plan.highlight ? "rgba(255,255,255,0.82)" : "rgba(45,45,45,0.78)",
                              fontWeight: 500,
                            }}
                          >
                            {f}
                          </span>
                        </li>
                      ))}
                      {plan.locked?.map((f) => (
                        <li key={f} className="flex items-start gap-2 opacity-30">
                          <span style={{ fontSize: "0.85rem", color: plan.highlight ? "#fff" : "var(--lf-dark)", fontWeight: 500 }}>
                            🔒 {f}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-auto pt-2">
                      <Link
                        href={plan.href}
                        className={plan.style === "primary" ? "btn-primary" : plan.style === "secondary" ? "btn-secondary" : "btn-ghost"}
                        style={{ display: "flex", width: "100%", justifyContent: "center" }}
                      >
                        {plan.id !== "free" && <Sparkles size={15} />}
                        {plan.cta}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-center mt-10" style={{ color: "rgba(45,45,45,0.45)", fontSize: "0.85rem" }}>
              All plans include a 7-day free trial · Secure payments via Razorpay · Cancel anytime
            </p>
          </div>
        </section>

        {/* Trust row */}
        <section className="py-14" style={{ background: "var(--lf-cream)" }}>
          <div className="mx-auto px-6" style={{ maxWidth: 900 }}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { icon: <Shield size={22} />, label: "Secure payments", sub: "via Razorpay" },
                { icon: <Zap size={22} />, label: "Instant access", sub: "on signup" },
                { icon: <Check size={22} />, label: "Cancel anytime", sub: "no questions asked" },
                { icon: <Star size={22} fill="currentColor" />, label: "7-day free trial", sub: "on paid plans" },
              ].map((item) => (
                <div key={item.label} className="flex flex-col items-center text-center gap-2 p-5 rounded-2xl" style={{ background: "#fff" }}>
                  <div style={{ color: "var(--lf-teal)" }}>{item.icon}</div>
                  <p style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "var(--lf-dark)" }}>{item.label}</p>
                  <p style={{ fontSize: "0.78rem", color: "rgba(45,45,45,0.5)" }}>{item.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20" style={{ background: "#fff" }}>
          <div className="mx-auto px-6" style={{ maxWidth: 720 }}>
            <div className="text-center mb-12">
              <span
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider mb-4"
                style={{ background: "var(--lf-mint)", color: "var(--lf-teal)" }}
              >
                <HelpCircle size={13} /> FAQs
              </span>
              <h2
                style={{
                  fontFamily: "'Baloo 2', sans-serif",
                  fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)",
                  fontWeight: 800,
                  color: "var(--lf-dark)",
                }}
              >
                Pricing questions answered
              </h2>
            </div>
            <div className="flex flex-col gap-4">
              {faqItems.map((item) => (
                <div
                  key={item.q}
                  className="rounded-2xl p-6"
                  style={{ background: "var(--lf-cream)", border: "1.5px solid rgba(0,0,0,0.06)" }}
                >
                  <p style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, color: "var(--lf-dark)", fontSize: "1rem", marginBottom: "0.5rem" }}>
                    {item.q}
                  </p>
                  <p style={{ color: "rgba(45,45,45,0.7)", fontSize: "0.9rem", lineHeight: 1.7 }}>{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section
          className="py-20"
          style={{ background: "linear-gradient(135deg, var(--lf-dark) 0%, #1a3a2e 100%)" }}
        >
          <div className="mx-auto px-6 text-center" style={{ maxWidth: 640 }}>
            <p style={{ fontSize: "2.5rem" }} className="mb-4">✨</p>
            <h2
              style={{
                fontFamily: "'Baloo 2', sans-serif",
                fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
                fontWeight: 800,
                color: "#fff",
                lineHeight: 1.15,
              }}
            >
              Start with{" "}
              <span className="text-gradient-sunshine">250 free credits</span>
            </h2>
            <p className="mt-4 mb-8" style={{ color: "rgba(255,255,255,0.6)", fontSize: "1rem", lineHeight: 1.7 }}>
              No credit card. No commitment. Just your child&apos;s first magical story.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/sign-up" className="btn-primary" style={{ fontSize: "1rem", padding: "0.8rem 2rem" }}>
                <Sparkles size={18} /> Start free today
              </Link>
              <Link href="/stories" className="btn-ghost" style={{ fontSize: "1rem", padding: "0.8rem 2rem", borderColor: "rgba(255,255,255,0.25)", color: "#fff" }}>
                See sample stories
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
