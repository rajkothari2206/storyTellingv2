import { Globe, Heart, Sparkles, Shield, Zap, Users, BookOpen, Music } from "lucide-react";

const features = [
  {
    icon: Heart,
    title: "Your child is the hero",
    description:
      "Every story is built around your child's name and personality — they adventure alongside Lalli & Fafa, not just watch from the sidelines.",
    color: "#FF6B35",
    bg: "rgba(255,107,53,0.1)",
  },
  {
    icon: Globe,
    title: "English & Hindi",
    description:
      "Full narration in both languages with native-quality voices. Perfect for bilingual families and kids learning their mother tongue.",
    color: "#1ABFA6",
    bg: "rgba(26,191,166,0.1)",
  },
  {
    icon: Sparkles,
    title: "AI stories, human heart",
    description:
      "Powered by GPT-4o with hand-crafted story structures, themes, and lessons. The AI is smart — but the soul comes from careful design.",
    color: "#F9C700",
    bg: "rgba(249,199,0,0.15)",
  },
  {
    icon: BookOpen,
    title: "Lessons that stick",
    description:
      "Kindness, courage, honesty, sharing — life values woven naturally into every adventure. Learning feels like play, not school.",
    color: "#6DBBF2",
    bg: "rgba(109,187,242,0.15)",
  },
  {
    icon: Music,
    title: "Multi-voice narration",
    description:
      "Separate voices for Narrator, Lalli, Fafa, and your child — making each story feel like a full audio performance.",
    color: "#FF6B35",
    bg: "rgba(255,107,53,0.1)",
  },
  {
    icon: Shield,
    title: "Safe for all ages",
    description:
      "Every story is age-appropriate and parent-reviewed. No ads, no random content, no surprises. A calm, trusted space for little minds.",
    color: "#1ABFA6",
    bg: "rgba(26,191,166,0.1)",
  },
  {
    icon: Zap,
    title: "Ready in under 2 minutes",
    description:
      "Story text, AI illustrations, and voice narration — all generated together and ready to play almost instantly.",
    color: "#F9C700",
    bg: "rgba(249,199,0,0.15)",
  },
  {
    icon: Users,
    title: "Builds family bonds",
    description:
      "Designed for shared listening — parents, grandparents, and children experiencing a story together, not just screen time alone.",
    color: "#6DBBF2",
    bg: "rgba(109,187,242,0.15)",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-7 lg:py-10" style={{ background: "#fff" }}>
      <div className="mx-auto px-6" style={{ maxWidth: 1200 }}>
        {/* Header */}
        <div className="text-center mb-5 flex flex-col items-center gap-2">
          <span
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider"
            style={{ background: "rgba(26,191,166,0.12)", color: "var(--lf-teal)" }}
          >
            ✨ What makes us different
          </span>
          <h2
            style={{
              fontFamily: "'Baloo 2', sans-serif",
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 800,
              color: "var(--lf-dark)",
            }}
          >
            Stories built for{" "}
            <span className="text-gradient-teal">giggle &amp; grow</span>
          </h2>
          <p style={{ color: "rgba(45,45,45,0.65)", fontSize: "1.05rem", maxWidth: 520 }}>
            Not just another kids app. A storytelling ecosystem designed around your child.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="group flex flex-col gap-3 p-4 rounded-3xl transition-all duration-200 hover:-translate-y-1"
                style={{
                  background: "var(--lf-cream)",
                  border: "1.5px solid rgba(0,0,0,0.04)",
                  cursor: "default",
                }}
              >
                <div
                  className="flex items-center justify-center rounded-2xl w-12 h-12 transition-transform duration-200 group-hover:scale-110"
                  style={{ background: f.bg }}
                >
                  <Icon size={22} style={{ color: f.color }} />
                </div>
                <h3
                  style={{
                    fontFamily: "'Baloo 2', sans-serif",
                    fontSize: "1.05rem",
                    fontWeight: 700,
                    color: "var(--lf-dark)",
                    lineHeight: 1.3,
                  }}
                >
                  {f.title}
                </h3>
                <p style={{ color: "rgba(45,45,45,0.6)", fontSize: "0.88rem", lineHeight: 1.65 }}>
                  {f.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
