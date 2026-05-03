import Image from "next/image";

const steps = [
  {
    number: "01",
    emoji: "👶",
    label: "Personalise",
    title: "Tell us about your child",
    description: "Name, age, favourite colour & animal. Takes 2 minutes — and turns every story into magic.",
    color: "#b8860b",
    colorFull: "var(--lf-sunshine)",
    bg: "rgba(255,193,7,0.12)",
    border: "rgba(255,193,7,0.35)",
    image: "/land1.png",
    imgPosition: "center 30%",
  },
  {
    number: "02",
    emoji: "✨",
    label: "Create",
    title: "Pick a theme & lesson",
    description: "Adventures, friendship, courage, kindness and more. Your child becomes the hero alongside Lalli & Fafa.",
    color: "#00695c",
    colorFull: "var(--lf-teal)",
    bg: "rgba(0,201,167,0.1)",
    border: "rgba(0,201,167,0.35)",
    image: "/land2.png",
    imgPosition: "center 35%",
  },
  {
    number: "03",
    emoji: "🎧",
    label: "Enjoy",
    title: "Watch, listen & grow",
    description: "Ready in under 2 minutes — fully narrated with illustrations in English or Hindi. Hit play!",
    color: "#bf360c",
    colorFull: "var(--lf-mango)",
    bg: "rgba(255,87,34,0.1)",
    border: "rgba(255,87,34,0.35)",
    image: "/land3.png",
    imgPosition: "center 40%",
  },
];

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="py-7 lg:py-10"
      style={{ background: "linear-gradient(160deg, #FFFDE8 0%, #F2FFF9 100%)" }}
    >
      <div className="mx-auto px-6" style={{ maxWidth: 1100 }}>

        {/* Header */}
        <div className="text-center mb-7 flex flex-col items-center gap-2">
          <span
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider"
            style={{ background: "rgba(255,87,34,0.12)", color: "#bf360c" }}
          >
            How it works
          </span>
          <h2
            style={{
              fontFamily: "'Baloo 2', sans-serif",
              fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)",
              fontWeight: 800,
              color: "var(--lf-dark)",
              lineHeight: 1.15,
            }}
          >
            Your child's story in{" "}
            <span className="text-gradient-sunshine">3 simple steps</span>
          </h2>
        </div>

        {/* Steps — image cards with connecting arrows */}
        <div className="grid md:grid-cols-3 gap-5 lg:gap-6 relative">

          {/* Connecting arrows — desktop only */}
          <div className="hidden md:flex absolute inset-0 items-center justify-around pointer-events-none" style={{ zIndex: 10 }}>
            {[0, 1].map((i) => (
              <div
                key={i}
                className="flex items-center justify-center rounded-full"
                style={{
                  width: 32,
                  height: 32,
                  background: "#fff",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
                  marginLeft: i === 0 ? "calc(33.33% - 16px)" : "calc(33.33% - 16px)",
                  position: "absolute",
                  left: i === 0 ? "calc(33.33% - 16px)" : "calc(66.66% - 16px)",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 7h8M8 4l3 3-3 3" stroke="var(--lf-teal)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            ))}
          </div>

          {steps.map((step, i) => (
            <div
              key={i}
              className="flex flex-col rounded-3xl overflow-hidden transition-all duration-200 hover:-translate-y-1"
              style={{
                background: "#fff",
                border: `1.5px solid ${step.border}`,
                boxShadow: `0 6px 28px ${step.border}66`,
              }}
            >
              {/* Scene image */}
              <div className="relative flex-shrink-0" style={{ height: 200 }}>
                <Image
                  src={step.image}
                  alt={step.title}
                  fill
                  className="object-cover"
                  style={{ objectPosition: step.imgPosition }}
                />
                {/* Label badge over image */}
                <div className="absolute top-3 left-3">
                  <span
                    className="px-3 py-1 rounded-full text-xs font-bold"
                    style={{ background: step.colorFull, color: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}
                  >
                    Step {step.number} · {step.label}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div
                className="flex flex-col gap-2 p-5 flex-1"
                style={{ background: step.bg }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{step.emoji}</span>
                  <h3
                    style={{
                      fontFamily: "'Baloo 2', sans-serif",
                      fontSize: "1.1rem",
                      fontWeight: 700,
                      color: "var(--lf-dark)",
                      lineHeight: 1.3,
                    }}
                  >
                    {step.title}
                  </h3>
                </div>
                <p style={{ color: "rgba(14,10,31,0.6)", fontSize: "0.88rem", lineHeight: 1.65 }}>
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom strip — Lalli & Fafa + CTA */}
        <div
          className="mt-6 rounded-2xl flex flex-col sm:flex-row items-center gap-4 px-6 py-4"
          style={{ background: "rgba(255,193,7,0.12)", border: "1.5px solid rgba(255,193,7,0.3)" }}
        >
          <div className="relative flex-shrink-0" style={{ width: 72, height: 72 }}>
            <Image src="/lf-hero.png" alt="Lalli and Fafa" fill className="object-contain" style={{ mixBlendMode: "multiply" }} />
          </div>
          <p
            style={{
              fontFamily: "'Baloo 2', sans-serif",
              fontWeight: 700,
              fontSize: "1rem",
              color: "var(--lf-dark)",
              flex: 1,
            }}
          >
            Lalli &amp; Fafa are waiting — your child's first story is{" "}
            <span style={{ color: "#b8860b" }}>just 3 minutes away.</span>
          </p>
          <a
            href="/sign-up"
            className="btn-primary flex-shrink-0"
            style={{ fontSize: "0.9rem", padding: "0.6rem 1.4rem" }}
          >
            ✨ Try it free
          </a>
        </div>

      </div>
    </section>
  );
}
