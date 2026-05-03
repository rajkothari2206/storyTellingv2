"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ArrowRight } from "lucide-react";

const faqs = [
  {
    q: "What age is Lalli Fafa for?",
    a: "Stories are crafted for children from toddlers (age 2+) who love narration, to older kids who enjoy following along with text. Themes and lesson complexity adapt based on the age you set.",
  },
  {
    q: "Is there a free plan?",
    a: "Yes — sign up for free and get 250 welcome credits. Generate multiple stories with no time limit. Upgrade to the Magic Pass to unlock voice narration, AI illustrations, and longer stories.",
  },
  {
    q: "How long does it take to generate a story?",
    a: "Under 2 minutes from clicking 'Generate' to a fully narrated story with illustrations. Text, images, and voice are generated simultaneously.",
  },
  {
    q: "Can I get stories in Hindi?",
    a: "Yes! Full Hindi narration with native-quality voices is available on all paid plans. English is available on all plans including free.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-200"
      style={{
        background: open ? "#fff" : "rgba(255,255,255,0.55)",
        border: open ? "1.5px solid rgba(0,201,167,0.35)" : "1.5px solid rgba(0,0,0,0.06)",
      }}
    >
      <button
        className="w-full flex items-center justify-between gap-4 p-5 text-left"
        onClick={() => setOpen(!open)}
      >
        <span
          style={{
            fontFamily: "'Baloo 2', sans-serif",
            fontWeight: 700,
            fontSize: "0.98rem",
            color: "var(--lf-dark)",
          }}
        >
          {q}
        </span>
        <ChevronDown
          size={18}
          className="flex-shrink-0 transition-transform duration-200"
          style={{
            color: "var(--lf-teal)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>
      {open && (
        <div className="px-5 pb-5">
          <p style={{ color: "rgba(14,10,31,0.65)", fontSize: "0.92rem", lineHeight: 1.7 }}>{a}</p>
        </div>
      )}
    </div>
  );
}

export function FAQSection() {
  return (
    <section className="py-10 lg:py-14" style={{ background: "var(--lf-peach)" }}>
      <div className="mx-auto px-6" style={{ maxWidth: 760 }}>
        <div className="text-center mb-8 flex flex-col items-center gap-2">
          <h2
            style={{
              fontFamily: "'Baloo 2', sans-serif",
              fontSize: "clamp(1.8rem, 3.5vw, 2.4rem)",
              fontWeight: 800,
              color: "var(--lf-dark)",
            }}
          >
            Quick answers
          </h2>
          <p style={{ color: "rgba(14,10,31,0.55)", fontSize: "0.95rem" }}>
            Still curious?{" "}
            <Link href="/learn" style={{ color: "var(--lf-teal)", fontWeight: 700 }}>
              Visit our Learn page
            </Link>{" "}
            for everything.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {faqs.map((faq, i) => (
            <FAQItem key={i} q={faq.q} a={faq.a} />
          ))}
        </div>

        <div className="text-center mt-6">
          <Link
            href="/learn"
            className="inline-flex items-center gap-2 font-bold"
            style={{ color: "var(--lf-teal)", fontSize: "0.95rem" }}
          >
            See all questions &amp; answers
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
