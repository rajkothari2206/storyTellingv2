"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqItems = [
  {
    q: "What are credits?",
    a: "Credits are the currency for generating stories. A short story (text + illustrations) costs 60 credits, a medium story costs 80. Voice narration is included in those costs. On the free plan you get 250 credits — plenty to explore.",
  },
  {
    q: "Is there really a free plan?",
    a: "Absolutely. Sign up with your email and get 250 credits instantly — no credit card needed. That's around 4 illustrated stories to try before you decide.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel anytime from your dashboard — you keep all features until the end of your current billing period. No hidden fees, no long-term commitment, no awkward phone calls.",
  },
  {
    q: "What happens when credits run out?",
    a: "On the free plan, you can top up or upgrade to Magic Pass. On Magic Pass you get 1,000 credits refreshed every month — most families never run out.",
  },
  {
    q: "Are payments secure?",
    a: "Yes. All payments are processed by Razorpay, India's most trusted payment gateway. We never store your card details.",
  },
  {
    q: "Can I switch plans?",
    a: "You can upgrade or downgrade at any time. Upgrading takes effect immediately. Downgrading takes effect at the next billing cycle.",
  },
  {
    q: "Does Magic Pass support Hindi stories?",
    a: "Yes — full Hindi narration with native-quality voices is available on all Magic Pass plans. English is available on every plan including free.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-200"
      style={{
        background: open ? "#fff" : "rgba(255,255,255,0.6)",
        border: open ? "1.5px solid rgba(0,201,167,0.35)" : "1.5px solid rgba(0,0,0,0.07)",
        boxShadow: open ? "0 4px 20px rgba(0,201,167,0.1)" : "none",
      }}
    >
      <button
        className="w-full flex items-center justify-between gap-4 p-5 text-left"
        onClick={() => setOpen(!open)}
      >
        <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, fontSize: "0.98rem", color: "var(--lf-dark)" }}>
          {q}
        </span>
        <ChevronDown
          size={18}
          className="flex-shrink-0 transition-transform duration-200"
          style={{ color: "var(--lf-teal)", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>
      {open && (
        <div className="px-5 pb-5">
          <p style={{ color: "rgba(14,10,31,0.65)", fontSize: "0.92rem", lineHeight: 1.75 }}>{a}</p>
        </div>
      )}
    </div>
  );
}

export function PricingFAQ() {
  return (
    <div className="flex flex-col gap-3">
      {faqItems.map((item) => (
        <FAQItem key={item.q} q={item.q} a={item.a} />
      ))}
    </div>
  );
}
