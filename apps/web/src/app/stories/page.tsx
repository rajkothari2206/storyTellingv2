import type { Metadata } from "next";
import Link from "next/link";
import { Star, BookOpen } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { HeroCTA, ThemeCTA, BottomCTA } from "./StoryCTA";

export const metadata: Metadata = {
  title: "Story Themes — Adventure, Friendship, Space & More",
  description:
    "Choose from 10+ story themes — adventure, friendship, courage, kindness, space, Indian mythology and more. Every story is personalised with your child as the hero alongside Lalli & Fafa.",
  alternates: { canonical: "https://www.lallifafa.com/stories" },
  openGraph: {
    title: "Lalli Fafa Story Themes — Personalised for your child",
    description: "10+ story themes. Your child is always the hero.",
    url: "https://www.lallifafa.com/stories",
  },
};

const themes = [
  {
    emoji: "🗺️",
    title: "The Adventure Quest",
    tagline: "Brave journeys into unknown lands",
    tags: ["courage", "exploration", "friendship"],
    sample:
      "Arjun raced through the whispering forest, Lalli by his side. 'The golden key must be here,' Fafa squeaked from Arjun's pocket...",
    color: "var(--lf-sunshine)",
    bg: "rgba(249,199,0,0.1)",
  },
  {
    emoji: "🤝",
    title: "The Kindness Mission",
    tagline: "Small acts that change everything",
    tags: ["kindness", "empathy", "sharing"],
    sample:
      "Aanya noticed the little bird sitting alone. 'Everyone deserves a friend,' she told Lalli. Together, they built the most wonderful nest...",
    color: "var(--lf-teal)",
    bg: "var(--lf-mint)",
  },
  {
    emoji: "🌟",
    title: "The Everyday Wonder",
    tagline: "Magic hiding in plain sight",
    tags: ["curiosity", "wonder", "imagination"],
    sample:
      "Rohan thought ordinary days were boring. Until Fafa pointed up. 'Look!' Between the clouds — a whole world Rohan had never seen...",
    color: "var(--lf-mango)",
    bg: "rgba(255,107,53,0.08)",
  },
  {
    emoji: "🦁",
    title: "Courage Under Stars",
    tagline: "Face your fears, find your strength",
    tags: ["bravery", "self-belief", "growth"],
    sample:
      "Maya was scared of the dark. But tonight was different. Lalli whispered, 'Darkness isn&apos;t empty. It&apos;s just waiting for your light...'",
    color: "#8B5CF6",
    bg: "rgba(139,92,246,0.08)",
  },
  {
    emoji: "🎯",
    title: "The Big Dream",
    tagline: "Every great journey starts with one step",
    tags: ["perseverance", "goals", "belief"],
    sample:
      "Dev wanted to be the best kite-flyer in all of India. Fafa had a plan. 'We&apos;ll need string, courage, and one really windy day...'",
    color: "var(--lf-sunshine)",
    bg: "rgba(249,199,0,0.1)",
  },
  {
    emoji: "💚",
    title: "Nature's Secret",
    tagline: "The earth has stories to tell",
    tags: ["nature", "environment", "wonder"],
    sample:
      "Isha planted a tiny seed. 'Will it grow?' she asked. Lalli smiled. 'Everything that matters starts small. Just like you did...'",
    color: "var(--lf-teal)",
    bg: "var(--lf-mint)",
  },
];

const stats = [
  { value: "3", label: "Story structures" },
  { value: "20+", label: "Unique openings" },
  { value: "8", label: "Character dynamics" },
  { value: "English & Hindi", label: "Narration languages" },
];

export default function StoriesPage() {
  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero */}
        <section
          className="pt-32 pb-20"
          style={{
            background: "linear-gradient(160deg, var(--lf-cream) 0%, rgba(26,191,166,0.08) 100%)",
          }}
        >
          <div className="mx-auto px-6 text-center" style={{ maxWidth: 760 }}>
            <span
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider mb-5"
              style={{ background: "var(--lf-mint)", color: "var(--lf-teal)" }}
            >
              <BookOpen size={13} /> Story Themes
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
              Every story is{" "}
              <span className="text-gradient-teal">made for your child</span>
            </h1>
            <p
              className="mt-5"
              style={{ color: "rgba(45,45,45,0.65)", fontSize: "1.1rem", lineHeight: 1.7 }}
            >
              Choose a theme, tell us about your child, and our AI weaves them
              into the story as the hero — alongside Lalli &amp; Fafa.
            </p>

            <div className="flex flex-wrap gap-3 justify-center mt-8">
              <HeroCTA />
              <Link href="#themes" className="btn-ghost" style={{ fontSize: "1rem" }}>
                Browse themes
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="mx-auto mt-16 px-6" style={{ maxWidth: 800 }}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="flex flex-col items-center text-center p-5 rounded-2xl"
                  style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,0.06)" }}
                >
                  <span
                    style={{
                      fontFamily: "'Baloo 2', sans-serif",
                      fontWeight: 800,
                      fontSize: "1.5rem",
                      color: "var(--lf-teal)",
                    }}
                  >
                    {s.value}
                  </span>
                  <span style={{ fontSize: "0.8rem", color: "rgba(45,45,45,0.55)", marginTop: 2 }}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Story themes */}
        <section id="themes" className="py-20" style={{ background: "#fff" }}>
          <div className="mx-auto px-6" style={{ maxWidth: 1100 }}>
            <div className="text-center mb-14">
              <h2
                style={{
                  fontFamily: "'Baloo 2', sans-serif",
                  fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)",
                  fontWeight: 800,
                  color: "var(--lf-dark)",
                }}
              >
                Browse story themes
              </h2>
              <p className="mt-3" style={{ color: "rgba(45,45,45,0.55)", fontSize: "0.95rem" }}>
                Each theme comes with unique story structures, characters, and lessons.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {themes.map((theme) => (
                <div
                  key={theme.title}
                  className="group flex flex-col rounded-3xl overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
                  style={{
                    background: theme.bg,
                    border: "1.5px solid rgba(0,0,0,0.06)",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                  }}
                >
                  <div className="p-6 flex flex-col gap-4 flex-1">
                    <div className="flex items-start justify-between">
                      <span style={{ fontSize: "2.5rem" }}>{theme.emoji}</span>
                      <span
                        className="px-3 py-1 rounded-full text-xs font-bold"
                        style={{ background: theme.color, color: theme.color === "var(--lf-teal)" ? "#fff" : "var(--lf-dark)", opacity: 0.9 }}
                      >
                        {theme.tags[0]}
                      </span>
                    </div>

                    <div>
                      <h3
                        style={{
                          fontFamily: "'Baloo 2', sans-serif",
                          fontWeight: 800,
                          fontSize: "1.15rem",
                          color: "var(--lf-dark)",
                        }}
                      >
                        {theme.title}
                      </h3>
                      <p style={{ fontSize: "0.85rem", color: "rgba(45,45,45,0.55)", marginTop: 2 }}>
                        {theme.tagline}
                      </p>
                    </div>

                    <div
                      className="p-4 rounded-2xl italic"
                      style={{
                        background: "rgba(255,255,255,0.7)",
                        fontSize: "0.85rem",
                        color: "rgba(45,45,45,0.7)",
                        lineHeight: 1.65,
                        flex: 1,
                      }}
                    >
                      &ldquo;{theme.sample}&rdquo;
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {theme.tags.slice(1).map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{ background: "rgba(255,255,255,0.8)", color: "rgba(45,45,45,0.6)" }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="px-6 pb-6">
                    <ThemeCTA />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How a story is built */}
        <section className="py-20" style={{ background: "var(--lf-peach)" }}>
          <div className="mx-auto px-6" style={{ maxWidth: 900 }}>
            <div className="text-center mb-12">
              <h2
                style={{
                  fontFamily: "'Baloo 2', sans-serif",
                  fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)",
                  fontWeight: 800,
                  color: "var(--lf-dark)",
                }}
              >
                What makes each story{" "}
                <span className="text-gradient-sunshine">truly unique</span>
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  emoji: "👦",
                  title: "Your child's identity",
                  desc: "Name, age, favourite colour, and animal are woven directly into the story — not just once, but throughout.",
                },
                {
                  emoji: "🧠",
                  title: "Smart story structure",
                  desc: "Our AI uses 3 tested narrative structures with 20 unique openings and 12 different endings. No two stories feel the same.",
                },
                {
                  emoji: "💡",
                  title: "A lesson that sticks",
                  desc: "Every story carries a life value — courage, kindness, honesty — woven naturally into the adventure. Not preachy. Just real.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="p-7 rounded-3xl"
                  style={{ background: "#fff", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}
                >
                  <span style={{ fontSize: "2.2rem" }}>{item.emoji}</span>
                  <h3
                    className="mt-4"
                    style={{
                      fontFamily: "'Baloo 2', sans-serif",
                      fontWeight: 800,
                      fontSize: "1rem",
                      color: "var(--lf-dark)",
                    }}
                  >
                    {item.title}
                  </h3>
                  <p
                    className="mt-2"
                    style={{ fontSize: "0.88rem", color: "rgba(45,45,45,0.65)", lineHeight: 1.7 }}
                  >
                    {item.desc}
                  </p>
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
          <div className="mx-auto px-6 text-center" style={{ maxWidth: 620 }}>
            <Star size={32} fill="var(--lf-sunshine)" color="var(--lf-sunshine)" className="mx-auto mb-4" />
            <h2
              style={{
                fontFamily: "'Baloo 2', sans-serif",
                fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
                fontWeight: 800,
                color: "#fff",
                lineHeight: 1.15,
              }}
            >
              Ready for your child&apos;s{" "}
              <span className="text-gradient-sunshine">first story?</span>
            </h2>
            <p className="mt-4 mb-8" style={{ color: "rgba(255,255,255,0.6)", fontSize: "1rem", lineHeight: 1.7 }}>
              250 free credits. No credit card. Your child&apos;s name in a story in under 2 minutes.
            </p>
            <BottomCTA />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
