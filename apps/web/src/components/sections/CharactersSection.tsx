import Image from "next/image";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export function CharactersSection() {
  return (
    <section id="characters" className="overflow-hidden" style={{ background: "#fff" }}>
      {/* Section label */}
      <div className="text-center pt-10 lg:pt-14 pb-6">
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
            fontSize: "clamp(1.9rem, 4vw, 2.8rem)",
            fontWeight: 800,
            color: "var(--lf-dark)",
            lineHeight: 1.15,
          }}
        >
          Your child's forever companions
        </h2>
        <p
          className="mt-2 mx-auto"
          style={{ color: "rgba(14,10,31,0.55)", fontSize: "1rem", maxWidth: 480 }}
        >
          Every story, Lalli &amp; Fafa make room for one more hero — yours.
        </p>
      </div>

      {/* Bold split panel */}
      <div className="grid md:grid-cols-2" style={{ minHeight: 480 }}>

        {/* LALLI — left panel, sunshine */}
        <div
          className="relative flex flex-col justify-end overflow-hidden"
          style={{
            background: "linear-gradient(160deg, #FFC107 0%, #FF8F00 100%)",
            minHeight: 420,
          }}
        >
          {/* Decorative circle */}
          <div
            className="absolute"
            style={{
              width: 320, height: 320,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.08)",
              top: -60, right: -60,
            }}
          />

          {/* Character art */}
          <div className="absolute bottom-0 right-8 md:right-12" style={{ zIndex: 2 }}>
            <Image
              src="/Lalli-new.png"
              alt="Lalli"
              width={220}
              height={300}
              className="object-contain drop-shadow-2xl"
              style={{ mixBlendMode: "multiply" }}
            />
          </div>

          {/* Info overlay */}
          <div className="relative z-10 p-8 md:p-10" style={{ maxWidth: 280 }}>
            <div
              className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-3"
              style={{ background: "rgba(0,0,0,0.15)", color: "#fff" }}
            >
              Age 6
            </div>
            <h3
              style={{
                fontFamily: "'Baloo 2', sans-serif",
                fontSize: "2.4rem",
                fontWeight: 800,
                color: "#fff",
                lineHeight: 1,
              }}
            >
              Lalli
            </h3>
            <p
              className="mt-2 mb-4"
              style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.95rem", lineHeight: 1.5 }}
            >
              Brave. Curious. Always first to say yes to adventure.
            </p>
            <div className="flex flex-wrap gap-2">
              {["🌟 Natural leader", "💛 Warm-hearted", "🦁 Fearless explorer"].map((t) => (
                <span
                  key={t}
                  className="px-3 py-1 rounded-full text-xs font-bold"
                  style={{ background: "rgba(255,255,255,0.25)", color: "#fff" }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* FAFA — right panel, teal */}
        <div
          className="relative flex flex-col justify-end overflow-hidden"
          style={{
            background: "linear-gradient(160deg, #00C9A7 0%, #007A65 100%)",
            minHeight: 420,
          }}
        >
          {/* Decorative circle */}
          <div
            className="absolute"
            style={{
              width: 280, height: 280,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.08)",
              top: -40, left: -60,
            }}
          />

          {/* Character art */}
          <div className="absolute bottom-0 left-6 md:left-10" style={{ zIndex: 2 }}>
            <Image
              src="/Fafa_1.jpg"
              alt="Fafa"
              width={190}
              height={260}
              className="object-contain drop-shadow-2xl rounded-2xl"
              style={{ mixBlendMode: "multiply" }}
            />
          </div>

          {/* Info overlay */}
          <div className="relative z-10 p-8 md:p-10 self-end" style={{ maxWidth: 280 }}>
            <div
              className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-3"
              style={{ background: "rgba(0,0,0,0.15)", color: "#fff" }}
            >
              Age 3
            </div>
            <h3
              style={{
                fontFamily: "'Baloo 2', sans-serif",
                fontSize: "2.4rem",
                fontWeight: 800,
                color: "#fff",
                lineHeight: 1,
              }}
            >
              Fafa
            </h3>
            <p
              className="mt-2 mb-4"
              style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.95rem", lineHeight: 1.5 }}
            >
              Thoughtful. Funny. Carries his lucky bunny everywhere.
            </p>
            <div className="flex flex-wrap gap-2">
              {["🐰 Bunny's BFF", "💙 Big ideas, small body", "😄 The comic relief"].map((t) => (
                <span
                  key={t}
                  className="px-3 py-1 rounded-full text-xs font-bold"
                  style={{ background: "rgba(255,255,255,0.25)", color: "#fff" }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom strip — "your child joins" */}
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
          <Sparkles size={15} />
          Start a story
        </Link>
      </div>
    </section>
  );
}
