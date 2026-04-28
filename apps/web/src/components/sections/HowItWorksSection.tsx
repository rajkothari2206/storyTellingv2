const steps = [
  {
    number: "01",
    emoji: "👶",
    title: "Tell us about your child",
    description:
      "Enter your child's name, age, favourite colour, and animal. Takes 2 minutes — and that's what makes every story feel like magic.",
    color: "var(--lf-sunshine)",
    bg: "rgba(249,199,0,0.1)",
  },
  {
    number: "02",
    emoji: "✨",
    title: "Pick a theme & lesson",
    description:
      "Choose from adventures, friendship, courage, kindness and more. Our AI weaves your child into the story as the hero alongside Lalli & Fafa.",
    color: "var(--lf-teal)",
    bg: "rgba(26,191,166,0.1)",
  },
  {
    number: "03",
    emoji: "🎧",
    title: "Watch, listen & grow",
    description:
      "In under 2 minutes, a fully narrated story with illustrations is ready — in English or Hindi. Hit play and let the magic begin.",
    color: "var(--lf-mango)",
    bg: "rgba(255,107,53,0.1)",
  },
];

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="py-20 lg:py-28"
      style={{ background: "var(--lf-peach)" }}
    >
      <div className="mx-auto px-6" style={{ maxWidth: 1200 }}>
        {/* Header */}
        <div className="text-center mb-16 flex flex-col items-center gap-3">
          <span
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider"
            style={{ background: "rgba(255,107,53,0.15)", color: "var(--lf-mango)" }}
          >
            How it works
          </span>
          <h2
            style={{
              fontFamily: "'Baloo 2', sans-serif",
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 800,
              color: "var(--lf-dark)",
            }}
          >
            A personalised story in{" "}
            <span className="text-gradient-sunshine">3 simple steps</span>
          </h2>
          <p style={{ color: "rgba(45,45,45,0.65)", fontSize: "1.05rem", maxWidth: 500 }}>
            No complicated setup. Just pure storytelling in minutes.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 relative">
          {/* Connector line — desktop only */}
          <div
            className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 -z-0"
            style={{ background: "linear-gradient(90deg, var(--lf-sunshine), var(--lf-teal), var(--lf-mango))", opacity: 0.3 }}
          />

          {steps.map((step, i) => (
            <div
              key={i}
              className="relative flex flex-col gap-5 rounded-3xl p-8"
              style={{ background: "#fff", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
            >
              {/* Step number badge */}
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center rounded-full text-2xl"
                  style={{ width: 56, height: 56, background: step.bg, flexShrink: 0 }}
                >
                  {step.emoji}
                </div>
                <span
                  style={{
                    fontFamily: "'Baloo 2', sans-serif",
                    fontSize: "2rem",
                    fontWeight: 800,
                    color: step.color,
                    opacity: 0.25,
                    lineHeight: 1,
                  }}
                >
                  {step.number}
                </span>
              </div>

              <h3
                style={{
                  fontFamily: "'Baloo 2', sans-serif",
                  fontSize: "1.3rem",
                  fontWeight: 700,
                  color: "var(--lf-dark)",
                }}
              >
                {step.title}
              </h3>
              <p style={{ color: "rgba(45,45,45,0.65)", fontSize: "0.95rem", lineHeight: 1.7 }}>
                {step.description}
              </p>

              {/* Bottom accent */}
              <div
                className="absolute bottom-0 left-8 right-8 h-1 rounded-full"
                style={{ background: step.color, opacity: 0.5 }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
