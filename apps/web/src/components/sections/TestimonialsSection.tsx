import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Abhishek S.",
    role: "Father of 1 · Mumbai",
    content:
      "Bedtime used to be a battle. Now my son asks to go to bed early! Hearing his own name in the stories makes him feel so special. Best ₹199 I've spent this month.",
    rating: 5,
    emoji: "👨",
    bg: "rgba(249,199,0,0.08)",
  },
  {
    name: "Priya M.",
    role: "Mother of 2 · Bengaluru",
    content:
      "My 5-year-old refuses English books, but she listens to Lalli Fafa stories in Hindi every single day. Finally something that teaches values in our own language.",
    rating: 5,
    emoji: "👩",
    bg: "rgba(26,191,166,0.08)",
  },
  {
    name: "Rekha K.",
    role: "Mother of 3 · Delhi",
    content:
      "The only app that actually teaches them something while keeping them quiet. The personalisation is genius — they think Lalli and Fafa are their real friends!",
    rating: 5,
    emoji: "👩‍👧",
    bg: "rgba(255,107,53,0.08)",
  },
  {
    name: "Vikram T.",
    role: "Father of 2 · Pune",
    content:
      "My mother-in-law (who speaks only Hindi) now listens to stories with the kids. It's become a family ritual every evening. Amazing product.",
    rating: 5,
    emoji: "👨‍👦",
    bg: "rgba(109,187,242,0.12)",
  },
  {
    name: "Ananya R.",
    role: "Mother of 1 · Hyderabad",
    content:
      "My 4-year-old now talks about 'courage' and 'kindness' — words he picked up from the stories. The lessons really do stick. Highly recommend.",
    rating: 5,
    emoji: "🧕",
    bg: "rgba(249,199,0,0.08)",
  },
  {
    name: "Rohan & Meena",
    role: "Parents · Chennai",
    content:
      "We play a story every night at 8pm. It's our daughter's signal that bedtime is coming — and she loves it. Screen time that actually helps.",
    rating: 5,
    emoji: "👨‍👩",
    bg: "rgba(26,191,166,0.08)",
  },
];

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} size={14} fill="var(--lf-sunshine)" style={{ color: "var(--lf-sunshine)" }} />
      ))}
    </div>
  );
}

export function TestimonialsSection() {
  return (
    <section className="py-10 lg:py-14" style={{ background: "var(--lf-mint)" }}>
      <div className="mx-auto px-6" style={{ maxWidth: 1200 }}>
        {/* Header */}
        <div className="text-center mb-8 flex flex-col items-center gap-3">
          <span
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider"
            style={{ background: "rgba(249,199,0,0.15)", color: "#b8860b" }}
          >
            <Star size={13} fill="currentColor" /> 10,000+ happy families
          </span>
          <h2
            style={{
              fontFamily: "'Baloo 2', sans-serif",
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 800,
              color: "var(--lf-dark)",
            }}
          >
            Parents love it.{" "}
            <span className="text-gradient-teal">Kids can't stop.</span>
          </h2>
        </div>

        {/* Grid */}
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 space-y-5">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="break-inside-avoid rounded-3xl p-6 flex flex-col gap-4"
              style={{
                background: t.bg,
                border: "1.5px solid rgba(0,0,0,0.05)",
              }}
            >
              <Stars count={t.rating} />
              <p
                style={{
                  color: "rgba(45,45,45,0.8)",
                  fontSize: "0.95rem",
                  lineHeight: 1.7,
                  fontStyle: "italic",
                }}
              >
                "{t.content}"
              </p>
              <div className="flex items-center gap-3 mt-auto pt-2" style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                <div
                  className="flex items-center justify-center rounded-full text-xl"
                  style={{ width: 40, height: 40, background: "rgba(255,255,255,0.8)" }}
                >
                  {t.emoji}
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--lf-dark)" }}>{t.name}</p>
                  <p style={{ fontSize: "0.78rem", color: "rgba(45,45,45,0.5)" }}>{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
