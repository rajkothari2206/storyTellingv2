import Link from "next/link";
import { Check, Star, Sparkles } from "lucide-react";

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
      "English & Hindi",
      "1 child profile",
    ],
    locked: ["5-min stories", "Voice narration", "AI illustrations"],
    cta: "Start free",
    href: "/sign-up",
    style: "ghost",
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
      "Cancel anytime",
    ],
    cta: "Start Magic Pass",
    href: "/sign-up?plan=monthly",
    style: "primary",
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
      "2,000 credits + 100/day",
      "Everything in Monthly",
      "Early access to new features",
      "Multiple child profiles",
      "Highest credit value",
    ],
    cta: "Go yearly",
    href: "/sign-up?plan=yearly",
    style: "secondary",
  },
];

export function PricingSection() {
  return (
    <section
      id="pricing"
      className="py-7 lg:py-10"
      style={{ background: "linear-gradient(160deg, #F3EEFF 0%, #EBF2FF 100%)" }}
    >
      <div className="mx-auto px-6" style={{ maxWidth: 1100 }}>
        {/* Header */}
        <div className="text-center mb-5 flex flex-col items-center gap-2">
          <span
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider"
            style={{ background: "rgba(249,199,0,0.15)", color: "#b8860b" }}
          >
            <Star size={13} fill="currentColor" /> Pricing
          </span>
          <h2
            style={{
              fontFamily: "'Baloo 2', sans-serif",
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 800,
              color: "var(--lf-dark)",
            }}
          >
            Choose your{" "}
            <span className="text-gradient-sunshine">Magic Pass</span>
          </h2>
          <p style={{ color: "rgba(45,45,45,0.65)", fontSize: "1.05rem", maxWidth: 480 }}>
            Start free and upgrade when you see your child's eyes light up.
          </p>
        </div>

        {/* Cards */}
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
                boxShadow: plan.highlight ? "0 20px 60px rgba(249,199,0,0.2)" : "0 4px 20px rgba(0,0,0,0.05)",
                transform: plan.highlight ? "scale(1.03)" : undefined,
              }}
            >
              {/* Badge */}
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

              <div className="p-5 flex flex-col gap-4 flex-1">
                {/* Name & price */}
                <div>
                  <p
                    style={{
                      fontFamily: "'Baloo 2', sans-serif",
                      fontWeight: 700,
                      fontSize: "1rem",
                      color: plan.highlight ? "rgba(255,255,255,0.6)" : "rgba(45,45,45,0.5)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
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
                    <span style={{ color: plan.highlight ? "rgba(255,255,255,0.5)" : "rgba(45,45,45,0.45)", fontSize: "0.95rem" }}>
                      {plan.period}
                    </span>
                  </div>
                  <p
                    className="mt-2"
                    style={{ fontSize: "0.9rem", color: plan.highlight ? "rgba(255,255,255,0.5)" : "rgba(45,45,45,0.5)" }}
                  >
                    {plan.tagline}
                  </p>
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: plan.highlight ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }} />

                {/* Features */}
                <ul className="flex flex-col gap-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check
                        size={16}
                        className="flex-shrink-0 mt-0.5"
                        style={{ color: plan.highlight ? "var(--lf-teal)" : "var(--lf-teal)" }}
                      />
                      <span
                        style={{
                          fontSize: "0.9rem",
                          color: plan.highlight ? "rgba(255,255,255,0.8)" : "rgba(45,45,45,0.75)",
                          fontWeight: 500,
                        }}
                      >
                        {f}
                      </span>
                    </li>
                  ))}
                  {plan.locked?.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 opacity-35">
                      <span style={{ fontSize: "0.85rem", color: plan.highlight ? "#fff" : "var(--lf-dark)", fontWeight: 500 }}>
                        🔒 {f}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div className="mt-auto pt-2">
                  <Link
                    href={plan.href}
                    className={plan.style === "primary" ? "btn-primary" : plan.style === "secondary" ? "btn-secondary" : "btn-ghost"}
                    style={{
                      display: "flex",
                      width: "100%",
                      justifyContent: "center",
                      ...(plan.style === "ghost" && plan.highlight
                        ? { borderColor: "rgba(255,255,255,0.3)", color: "#fff" }
                        : {}),
                    }}
                  >
                    {plan.id !== "free" && <Sparkles size={15} />}
                    {plan.cta}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p
          className="text-center mt-8"
          style={{ color: "rgba(45,45,45,0.45)", fontSize: "0.85rem" }}
        >
          All plans include a 7-day free trial · Secure payments via Razorpay · Cancel anytime
        </p>
      </div>
    </section>
  );
}
