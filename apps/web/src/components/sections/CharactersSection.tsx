import Image from "next/image";

const characters = [
  {
    name: "Lalli",
    age: "6 years old",
    image: "/Lalli-new.png",
    blendMode: "multiply" as const,
    tagline: "Brave. Curious. Always first to say yes to adventure.",
    traits: ["🌟 Natural leader", "💛 Warm-hearted", "🦁 Fearless explorer"],
    color: "var(--lf-sunshine)",
    bg: "linear-gradient(135deg, rgba(249,199,0,0.15) 0%, rgba(255,232,214,0.4) 100%)",
    accentBg: "rgba(249,199,0,0.12)",
    tagBg: "var(--lf-sunshine)",
    tagColor: "var(--lf-dark)",
    align: "left" as const,
  },
  {
    name: "Fafa",
    age: "3 years old",
    image: "/Fafa_1.jpg",
    blendMode: "multiply" as const,
    tagline: "Thoughtful. Funny. Carries his lucky bunny everywhere.",
    traits: ["🐰 Bunny's best friend", "💙 Big ideas, small body", "😄 The comic relief"],
    color: "var(--lf-teal)",
    bg: "linear-gradient(135deg, rgba(26,191,166,0.15) 0%, rgba(224,247,243,0.4) 100%)",
    accentBg: "rgba(26,191,166,0.12)",
    tagBg: "var(--lf-teal)",
    tagColor: "#fff",
    align: "right" as const,
  },
];

export function CharactersSection() {
  return (
    <section
      id="characters"
      className="py-20 lg:py-28"
      style={{ background: "var(--lf-mint)" }}
    >
      <div className="mx-auto px-6" style={{ maxWidth: 1200 }}>
        {/* Header */}
        <div className="text-center mb-14 flex flex-col items-center gap-3">
          <span
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider"
            style={{ background: "rgba(249,199,0,0.2)", color: "#b8860b" }}
          >
            Meet the characters
          </span>
          <h2
            style={{
              fontFamily: "'Baloo 2', sans-serif",
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 800,
              color: "var(--lf-dark)",
            }}
          >
            Lalli &amp; Fafa —{" "}
            <span className="text-gradient-sunshine">your child's forever friends</span>
          </h2>
          <p style={{ color: "rgba(45,45,45,0.65)", fontSize: "1.05rem", maxWidth: 520 }}>
            Two characters designed to feel like family. In every story, they make room for
            one more hero — yours.
          </p>
        </div>

        {/* Character cards */}
        <div className="grid md:grid-cols-2 gap-8">
          {characters.map((c) => (
            <div
              key={c.name}
              className="rounded-3xl overflow-hidden flex flex-col"
              style={{ background: c.bg, border: "1.5px solid rgba(0,0,0,0.05)" }}
            >
              {/* Image area */}
              <div
                className="relative flex items-end justify-center pt-8"
                style={{ minHeight: 280, background: c.accentBg }}
              >
                {/* Name badge */}
                <div
                  className="absolute top-5 left-5 px-3 py-1 rounded-full text-sm font-bold"
                  style={{ background: c.tagBg, color: c.tagColor }}
                >
                  {c.name}, {c.age}
                </div>

                <Image
                  src={c.image}
                  alt={c.name}
                  width={200}
                  height={260}
                  className="object-contain drop-shadow-xl"
                  style={{ mixBlendMode: c.blendMode, maxHeight: 260 }}
                />
              </div>

              {/* Info area */}
              <div className="p-8 flex flex-col gap-4">
                <p
                  style={{
                    fontFamily: "'Baloo 2', sans-serif",
                    fontSize: "1.2rem",
                    fontWeight: 700,
                    color: "var(--lf-dark)",
                    fontStyle: "italic",
                  }}
                >
                  "{c.tagline}"
                </p>
                <ul className="flex flex-col gap-2">
                  {c.traits.map((trait) => (
                    <li
                      key={trait}
                      className="flex items-center gap-2 rounded-2xl px-4 py-2.5"
                      style={{
                        background: "rgba(255,255,255,0.7)",
                        fontSize: "0.95rem",
                        fontWeight: 600,
                        color: "var(--lf-dark)",
                      }}
                    >
                      {trait}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom note */}
        <p
          className="text-center mt-10"
          style={{ color: "rgba(45,45,45,0.5)", fontSize: "0.9rem", fontStyle: "italic" }}
        >
          In every story, your child's name, favourite animal, and personality are woven right alongside them 🌟
        </p>
      </div>
    </section>
  );
}
