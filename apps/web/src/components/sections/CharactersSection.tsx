"use client";

import Image from "next/image";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useState } from "react";

const scenes = [
  { src: "/lf-scene-orchard.png",   label: "🍊 The Orange Orchard" },
  { src: "/lf-scene-planets.png",   label: "🪐 Solar system lesson" },
  { src: "/lf-scene-puppy.png",     label: "🐶 A new furry friend" },
  { src: "/lf-scene-kite.png",      label: "🪁 Up, up and away!" },
  { src: "/lf-scene-jungle.png",    label: "🌿 Jungle explorers" },
  { src: "/lf-scene-bedtime.png",   label: "📖 Bedtime stories" },
  { src: "/lf-scene-balloons.png",  label: "🎈 Fafa takes flight!" },
  { src: "/lf-scene-boardgame.png", label: "🎲 Game night!" },
  { src: "/lf-scene-krishna.png",   label: "✨ Magic in the meadow" },
  { src: "/lf-scene-redfort.png",   label: "🇮🇳 At the Red Fort" },
  { src: "/lf-scene-ganesha.png",   label: "🙏 Blessed beginnings" },
  { src: "/lf-scene-street.png",    label: "🔦 Mystery on the street" },
];

export function CharactersSection() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const featured = scenes[selectedIndex];

  return (
    <section id="characters" style={{ background: "linear-gradient(160deg, #FFF8E7 0%, #FFE8A8 100%)" }}>

      {/* ── Header ── */}
      <div className="text-center pt-7 pb-5 px-6">
        <span
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider"
          style={{ background: "rgba(255,193,7,0.15)", color: "#92680a" }}
        >
          Meet the characters
        </span>
        <h2
          className="mt-3"
          style={{
            fontFamily: "'Baloo 2', sans-serif",
            fontSize: "clamp(1.9rem,4vw,2.8rem)",
            fontWeight: 800,
            color: "var(--lf-dark)",
            lineHeight: 1.2,
          }}
        >
          Your child's forever companions
        </h2>
        <p
          className="mt-2 mx-auto"
          style={{ color: "rgba(14,10,31,0.5)", fontSize: "1rem", maxWidth: 460 }}
        >
          Two best friends on endless adventures — and they always save a spot for your child.
        </p>
      </div>

      {/* ── Main: Lalli card | hero image | Fafa card ── */}
      <div className="mx-auto px-6 pb-6" style={{ maxWidth: 1200 }}>
        <div className="grid md:grid-cols-[220px_1fr_220px] gap-6 items-stretch">

          {/* Lalli card — desktop only */}
          <div
            className="hidden md:flex rounded-3xl p-5 flex-col gap-4"
            style={{
              background: "#fff",
              border: "2px solid rgba(255,193,7,0.3)",
              boxShadow: "0 8px 40px rgba(255,193,7,0.12)",
            }}
          >
            <div>
              <span
                className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-3"
                style={{ background: "rgba(255,193,7,0.15)", color: "#92680a" }}
              >
                Age 6
              </span>
              <h3
                style={{
                  fontFamily: "'Baloo 2', sans-serif",
                  fontWeight: 800,
                  fontSize: "2.4rem",
                  color: "var(--lf-dark)",
                  lineHeight: 1,
                }}
              >
                Lalli
              </h3>
              <div className="mt-2 h-1 w-14 rounded-full" style={{ background: "var(--lf-sunshine)" }} />
            </div>

            <p
              style={{
                fontStyle: "italic",
                color: "rgba(14,10,31,0.6)",
                fontSize: "0.9rem",
                lineHeight: 1.7,
              }}
            >
              "I believe there's always something new to learn — if you look closely enough. Come along, let's explore!"
            </p>

            <div className="flex flex-col gap-2 mt-auto">
              {["🌸 Explorer & leader", "🎨 Crayons & curiosity", "💛 Always there for Fafa"].map((t) => (
                <span
                  key={t}
                  className="px-3 py-2 rounded-xl text-sm font-semibold"
                  style={{ background: "rgba(255,193,7,0.1)", color: "#7a5200" }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Hero image — updates when a thumbnail is clicked */}
          <div
            className="relative rounded-3xl overflow-hidden shadow-2xl"
            style={{ minHeight: 400 }}
          >
            <Image
              key={featured.src}
              src={featured.src}
              alt={featured.label}
              fill
              className="object-cover transition-opacity duration-300"
              style={{ objectPosition: "center 30%" }}
              priority
            />
            {/* Bottom gradient */}
            <div
              className="absolute inset-x-0 bottom-0 h-28"
              style={{ background: "linear-gradient(to top, rgba(14,10,31,0.55), transparent)" }}
            />
            {/* Scene label */}
            <div className="absolute bottom-5 left-0 right-0 flex justify-center">
              <span
                className="px-4 py-1.5 rounded-full text-sm font-bold transition-all duration-300"
                style={{
                  background: "rgba(255,255,255,0.92)",
                  color: "var(--lf-dark)",
                  backdropFilter: "blur(8px)",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
                }}
              >
                {featured.label}
              </span>
            </div>
          </div>

          {/* Fafa card — desktop only */}
          <div
            className="hidden md:flex rounded-3xl p-5 flex-col gap-4"
            style={{
              background: "#fff",
              border: "2px solid rgba(0,201,167,0.3)",
              boxShadow: "0 8px 40px rgba(0,201,167,0.1)",
            }}
          >
            <div>
              <span
                className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-3"
                style={{ background: "rgba(0,201,167,0.12)", color: "#00695c" }}
              >
                Age 3
              </span>
              <h3
                style={{
                  fontFamily: "'Baloo 2', sans-serif",
                  fontWeight: 800,
                  fontSize: "2.4rem",
                  color: "var(--lf-dark)",
                  lineHeight: 1,
                }}
              >
                Fafa
              </h3>
              <div className="mt-2 h-1 w-14 rounded-full" style={{ background: "var(--lf-teal)" }} />
            </div>

            <p
              style={{
                fontStyle: "italic",
                color: "rgba(14,10,31,0.6)",
                fontSize: "0.9rem",
                lineHeight: 1.7,
              }}
            >
              "When you're Fafa, the world is full of wonder! Every day is an adventure — even the puddles."
            </p>

            <div className="flex flex-col gap-2 mt-auto">
              {["🐰 Never without his bunny", "💙 Biggest imagination ever", "✨ Finds magic everywhere"].map((t) => (
                <span
                  key={t}
                  className="px-3 py-2 rounded-xl text-sm font-semibold"
                  style={{ background: "rgba(0,201,167,0.08)", color: "#005a4f" }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile: compact 2-col character cards */}
        <div className="grid grid-cols-2 gap-4 mt-5 md:hidden">
          <div
            className="rounded-2xl p-4"
            style={{ background: "#fff", border: "2px solid rgba(255,193,7,0.25)" }}
          >
            <p className="text-xs font-bold mb-1" style={{ color: "#92680a" }}>Lalli · Age 6</p>
            <div className="h-0.5 w-8 rounded-full mb-3" style={{ background: "var(--lf-sunshine)" }} />
            <div className="flex flex-col gap-1.5">
              {["🌟 Leader", "💛 Loyal", "🦁 Fearless"].map((t) => (
                <span
                  key={t}
                  className="text-xs px-2 py-1 rounded-lg font-semibold"
                  style={{ background: "rgba(255,193,7,0.1)", color: "#7a5200" }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div
            className="rounded-2xl p-4"
            style={{ background: "#fff", border: "2px solid rgba(0,201,167,0.25)" }}
          >
            <p className="text-xs font-bold mb-1" style={{ color: "#00695c" }}>Fafa · Age 3</p>
            <div className="h-0.5 w-8 rounded-full mb-3" style={{ background: "var(--lf-teal)" }} />
            <div className="flex flex-col gap-1.5">
              {["🐰 Bunny BFF", "💙 Big ideas", "😄 Funny"].map((t) => (
                <span
                  key={t}
                  className="text-xs px-2 py-1 rounded-lg font-semibold"
                  style={{ background: "rgba(0,201,167,0.08)", color: "#005a4f" }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Scene strip — clickable thumbnails ── */}
      <div
        className="overflow-hidden pb-4"
        style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}
      >
        <p
          className="text-center text-xs font-bold uppercase tracking-widest pt-4 pb-3"
          style={{ color: "rgba(14,10,31,0.3)", letterSpacing: "0.15em" }}
        >
          Their adventures so far · <span style={{ color: "rgba(14,10,31,0.45)", fontWeight: 500, textTransform: "none", letterSpacing: 0 }}>tap any scene to preview</span>
        </p>
        <div className="flex gap-3 animate-marquee" style={{ width: "max-content" }}>
          {[...scenes, ...scenes].map((scene, i) => {
            const sceneIdx = i % scenes.length;
            const isSelected = sceneIdx === selectedIndex;
            return (
              <button
                key={i}
                onClick={() => setSelectedIndex(sceneIdx)}
                className="flex-shrink-0 rounded-2xl overflow-hidden relative focus:outline-none"
                style={{
                  width: 220,
                  height: 148,
                  cursor: "pointer",
                  border: isSelected ? "3px solid var(--lf-teal)" : "3px solid transparent",
                  boxShadow: isSelected ? "0 0 0 2px rgba(0,201,167,0.4), 0 8px 24px rgba(0,0,0,0.18)" : "none",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
              >
                <Image
                  src={scene.src}
                  alt={scene.label}
                  fill
                  className="object-cover transition-transform duration-500 hover:scale-105"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background: isSelected
                      ? "linear-gradient(to top, rgba(0,100,85,0.75) 0%, transparent 55%)"
                      : "linear-gradient(to top, rgba(14,10,31,0.7) 0%, transparent 55%)",
                  }}
                />
                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: "var(--lf-teal)" }}>
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4l2.5 2.5L9 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
                <p className="absolute bottom-3 left-3 right-3 text-white text-xs font-semibold leading-tight">
                  {scene.label}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── CTA strip ── */}
      <div
        className="flex flex-col sm:flex-row items-center justify-between gap-4 px-8 py-5"
        style={{ background: "var(--lf-dark)" }}
      >
        <p
          style={{
            fontFamily: "'Baloo 2', sans-serif",
            fontWeight: 700,
            fontSize: "1.05rem",
            color: "#fff",
          }}
        >
          ✨ In every story, your child is the{" "}
          <span style={{ color: "var(--lf-sunshine)" }}>third hero</span> alongside them.
        </p>
        <Link
          href="/sign-up"
          className="btn-primary"
          style={{ fontSize: "0.9rem", padding: "0.65rem 1.5rem", flexShrink: 0 }}
        >
          <Sparkles size={15} /> Start a story
        </Link>
      </div>
    </section>
  );
}
