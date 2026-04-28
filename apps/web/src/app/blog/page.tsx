import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles, PenLine } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Stories, tips, and insights on raising curious, creative, and kind children. The Lalli Fafa blog on storytelling, parenting, and child development.",
};

const upcomingTopics = [
  {
    emoji: "📖",
    title: "Why personalised stories build confidence in children",
    tag: "Child Development",
  },
  {
    emoji: "🌙",
    title: "The bedtime routine that actually works (for 2–8 year olds)",
    tag: "Parenting Tips",
  },
  {
    emoji: "🇮🇳",
    title: "Why Hindi storytelling matters for bilingual families",
    tag: "Language & Culture",
  },
  {
    emoji: "🤖",
    title: "How we use AI to create stories that feel human",
    tag: "Behind the Scenes",
  },
  {
    emoji: "💛",
    title: "Teaching kindness through storytelling — it really works",
    tag: "Values & Learning",
  },
  {
    emoji: "🎧",
    title: "The science behind audio stories and children's memory",
    tag: "Research",
  },
];

export default function BlogPage() {
  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero */}
        <section
          className="pt-32 pb-20"
          style={{
            background: "linear-gradient(160deg, var(--lf-cream) 0%, var(--lf-mint) 100%)",
          }}
        >
          <div className="mx-auto px-6 text-center" style={{ maxWidth: 680 }}>
            <span
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider mb-5"
              style={{ background: "rgba(249,199,0,0.15)", color: "#b8860b" }}
            >
              <PenLine size={13} /> Blog
            </span>
            <h1
              style={{
                fontFamily: "'Baloo 2', sans-serif",
                fontSize: "clamp(2.2rem, 5vw, 3.2rem)",
                fontWeight: 800,
                color: "var(--lf-dark)",
                lineHeight: 1.15,
              }}
            >
              Stories for parents,{" "}
              <span className="text-gradient-sunshine">not just kids</span>
            </h1>
            <p
              className="mt-5"
              style={{ color: "rgba(45,45,45,0.65)", fontSize: "1.05rem", lineHeight: 1.75 }}
            >
              Tips, insights, and honest conversations about raising curious,
              creative, and kind children. Coming soon.
            </p>
          </div>
        </section>

        {/* Coming soon block */}
        <section className="py-20" style={{ background: "#fff" }}>
          <div className="mx-auto px-6" style={{ maxWidth: 860 }}>
            <div
              className="rounded-3xl p-10 text-center mb-14"
              style={{
                background: "linear-gradient(135deg, var(--lf-dark) 0%, #1a3a2e 100%)",
              }}
            >
              <p style={{ fontSize: "3rem" }} className="mb-4">✍️</p>
              <h2
                style={{
                  fontFamily: "'Baloo 2', sans-serif",
                  fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)",
                  fontWeight: 800,
                  color: "#fff",
                  lineHeight: 1.2,
                }}
              >
                Our blog is{" "}
                <span className="text-gradient-sunshine">almost ready</span>
              </h2>
              <p
                className="mt-4 mb-8"
                style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.95rem", maxWidth: 460, margin: "1rem auto 2rem" }}
              >
                We&apos;re writing thoughtful pieces on child development, storytelling, and
                the magic of raising little readers. Subscribe to be notified first.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-sm mx-auto">
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="flex-1 px-4 py-3 rounded-2xl outline-none"
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    border: "1.5px solid rgba(255,255,255,0.2)",
                    color: "#fff",
                    fontSize: "0.9rem",
                    fontFamily: "'Nunito', sans-serif",
                  }}
                />
                <button
                  className="btn-primary"
                  style={{ fontSize: "0.9rem", flexShrink: 0, padding: "0.7rem 1.5rem" }}
                >
                  Notify me
                </button>
              </div>
            </div>

            {/* Upcoming topics */}
            <h2
              className="text-center mb-8"
              style={{
                fontFamily: "'Baloo 2', sans-serif",
                fontSize: "1.6rem",
                fontWeight: 800,
                color: "var(--lf-dark)",
              }}
            >
              Topics we&apos;re writing about
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingTopics.map((topic) => (
                <div
                  key={topic.title}
                  className="p-5 rounded-2xl flex flex-col gap-3 transition-all hover:-translate-y-0.5"
                  style={{
                    background: "var(--lf-cream)",
                    border: "1.5px solid rgba(0,0,0,0.06)",
                  }}
                >
                  <span style={{ fontSize: "1.8rem" }}>{topic.emoji}</span>
                  <div>
                    <span
                      className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold mb-2"
                      style={{ background: "var(--lf-mint)", color: "var(--lf-teal)" }}
                    >
                      {topic.tag}
                    </span>
                    <p
                      style={{
                        fontFamily: "'Baloo 2', sans-serif",
                        fontWeight: 700,
                        fontSize: "0.92rem",
                        color: "var(--lf-dark)",
                        lineHeight: 1.4,
                      }}
                    >
                      {topic.title}
                    </p>
                  </div>
                  <span
                    className="text-sm font-semibold mt-auto"
                    style={{ color: "rgba(45,45,45,0.35)" }}
                  >
                    Coming soon
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16" style={{ background: "var(--lf-peach)" }}>
          <div className="mx-auto px-6 text-center" style={{ maxWidth: 560 }}>
            <h2
              style={{
                fontFamily: "'Baloo 2', sans-serif",
                fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)",
                fontWeight: 800,
                color: "var(--lf-dark)",
              }}
            >
              While we write — start your child&apos;s story
            </h2>
            <p className="mt-3 mb-7" style={{ color: "rgba(45,45,45,0.6)", fontSize: "0.95rem" }}>
              250 free credits. No credit card. Your child in a personalised story in 2 minutes.
            </p>
            <Link href="/sign-up" className="btn-primary" style={{ fontSize: "1rem" }}>
              <Sparkles size={18} /> Start free today
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
