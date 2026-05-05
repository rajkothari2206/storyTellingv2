"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Bell, Star, Package, Truck, ShieldCheck, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

const products = [
  {
    id: "creative-kit",
    name: "Lalli's Creative Adventure Kit",
    tagline: "Colour, create & explore",
    desc: "Coloring books, stickers, and activity sheets featuring Lalli & Fafa — inspired directly by the stories your child has heard.",
    price: "₹499",
    badge: null,
    category: "Activity Kit",
    image: "/LalliKit.jpg",
    accent: "rgba(249,199,0,0.12)",
    accentColor: "#b8860b",
    includes: ["48-page coloring book", "Character sticker sheets", "Story activity cards", "Mini poster of Lalli & Fafa"],
  },
  {
    id: "story-box",
    name: "Monthly Story Box",
    tagline: "A new adventure every month",
    desc: "New story themes, hands-on activities, and character collectibles delivered to your door every month. A subscription your child will run to the door for.",
    price: "₹999 / month",
    badge: "⭐ Featured",
    category: "Subscription",
    image: "/subscriptionBox.jpg",
    accent: "var(--lf-mint)",
    accentColor: "var(--lf-teal)",
    includes: ["Monthly story theme booklet", "Hands-on activity pack", "Character collectible", "Parent activity guide"],
  },
  {
    id: "fafa-kit",
    name: "Fafa's Building Adventure Kit",
    tagline: "Build, solve & discover",
    desc: "STEM-inspired building challenges and puzzles designed for little engineers — because Fafa believes every problem has a clever solution.",
    price: "₹599",
    badge: null,
    category: "STEM Kit",
    image: "/FafaKit.jpg",
    accent: "rgba(255,107,53,0.08)",
    accentColor: "var(--lf-mango)",
    includes: ["Building block challenge cards", "Logic puzzle booklet", "Mini engineer toolkit", "Fafa figurine"],
  },
];

const whyPhysical = [
  {
    icon: <Star size={20} />,
    title: "Extends the magic",
    desc: "Physical products make the characters feel real. Your child can colour Lalli and build like Fafa.",
  },
  {
    icon: <Package size={20} />,
    title: "Screen-free time",
    desc: "Activity kits give children meaningful screen-free time while staying connected to their favourite stories.",
  },
  {
    icon: <Truck size={20} />,
    title: "Delivered to your door",
    desc: "Monthly boxes delivered across India. No effort required — the fun just arrives.",
  },
  {
    icon: <ShieldCheck size={20} />,
    title: "Safe & child-tested",
    desc: "All materials are child-safe, age-appropriate, and designed with care. No sharp edges, no small parts for toddlers.",
  },
];

function NotifyButton({ productName }: { productName: string }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    // Simulate submission — replace with a real API call / Convex mutation when ready
    await new Promise((r) => setTimeout(r, 900));
    setLoading(false);
    setDone(true);
    toast.success(`We'll notify you when ${productName} launches! 🎉`);
  }

  if (done) {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold"
        style={{ background: "rgba(0,201,167,0.1)", color: "var(--lf-teal)", fontFamily: "'Nunito', sans-serif" }}>
        <CheckCircle2 size={16} /> You&apos;re on the list!
      </div>
    );
  }

  if (open) {
    return (
      <form onSubmit={handleSubmit} className="flex gap-2 flex-wrap">
        <input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
          className="flex-1 px-4 py-2.5 rounded-2xl outline-none text-sm"
          style={{
            background: "#fff",
            border: "1.5px solid rgba(0,0,0,0.12)",
            color: "var(--lf-dark)",
            fontFamily: "'Nunito', sans-serif",
            minWidth: 180,
          }}
        />
        <button
          type="submit"
          disabled={loading}
          className="btn-primary flex-shrink-0"
          style={{ fontSize: "0.88rem", padding: "0.55rem 1.1rem" }}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Bell size={14} />}
          {loading ? "…" : "Notify me"}
        </button>
      </form>
    );
  }

  return (
    <button
      onClick={() => setOpen(true)}
      className="btn-primary"
      style={{ fontSize: "0.95rem" }}
    >
      <Bell size={16} /> Notify me
    </button>
  );
}

function BottomNotifyForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    setLoading(false);
    setDone(true);
    toast.success("You're on the list! We'll let you know when the shop launches. 🎉");
    setEmail("");
  }

  if (done) {
    return (
      <div className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold"
        style={{ background: "rgba(0,201,167,0.15)", color: "var(--lf-teal)", fontFamily: "'Nunito', sans-serif" }}>
        <CheckCircle2 size={18} /> You&apos;re on the list — we&apos;ll be in touch!
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
      <input
        type="email"
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="flex-1 px-4 py-3 rounded-2xl outline-none"
        style={{
          background: "rgba(255,255,255,0.1)",
          border: "1.5px solid rgba(255,255,255,0.2)",
          color: "#fff",
          fontSize: "0.95rem",
          fontFamily: "'Nunito', sans-serif",
        }}
      />
      <button
        type="submit"
        disabled={loading}
        className="btn-primary flex-shrink-0"
        style={{ fontSize: "0.95rem" }}
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Bell size={16} />}
        {loading ? "Sending…" : "Notify me"}
      </button>
    </form>
  );
}

export default function ShopPage() {
  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero */}
        <section
          className="pt-32 pb-16"
          style={{
            background: "linear-gradient(160deg, var(--lf-peach) 0%, var(--lf-cream) 100%)",
          }}
        >
          <div className="mx-auto px-6 text-center" style={{ maxWidth: 700 }}>
            <span
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider mb-5"
              style={{ background: "rgba(255,107,53,0.12)", color: "var(--lf-mango)" }}
            >
              <Package size={13} /> Physical Products
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
              Bring the magic{" "}
              <span className="text-gradient-sunshine">into your home</span>
            </h1>
            <p
              className="mt-5"
              style={{ color: "rgba(45,45,45,0.65)", fontSize: "1.1rem", lineHeight: 1.7 }}
            >
              Stories are just the beginning. Our physical kits turn screen-time into
              hands-on adventures that children treasure long after the story ends.
            </p>

            <div
              className="inline-flex items-center gap-2 mt-6 px-5 py-3 rounded-2xl"
              style={{ background: "rgba(249,199,0,0.15)", border: "1.5px solid rgba(249,199,0,0.3)" }}
            >
              <Bell size={16} style={{ color: "#b8860b" }} />
              <p style={{ fontSize: "0.9rem", color: "#7a5800", fontWeight: 600 }}>
                Products launching soon — be the first to know
              </p>
            </div>
          </div>
        </section>

        {/* Products */}
        <section className="py-20" style={{ background: "#fff" }}>
          <div className="mx-auto px-6" style={{ maxWidth: 1100 }}>
            <div className="flex flex-col gap-16">
              {products.map((product, i) => (
                <div
                  key={product.id}
                  className={`flex flex-col ${i % 2 === 1 ? "md:flex-row-reverse" : "md:flex-row"} gap-8 md:gap-14 items-center`}
                >
                  {/* Product image */}
                  <div
                    className="w-full md:w-2/5 flex-shrink-0 rounded-3xl overflow-hidden relative"
                    style={{ aspectRatio: "4/3" }}
                  >
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                    {/* Overlay for "Coming Soon" */}
                    <div
                      className="absolute inset-0 flex flex-col items-end justify-start p-4 gap-2"
                      style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, transparent 40%)" }}
                    >
                      {product.badge && (
                        <div
                          className="px-3 py-1.5 rounded-full text-sm font-bold"
                          style={{ background: "var(--lf-sunshine)", color: "var(--lf-dark)" }}
                        >
                          {product.badge}
                        </div>
                      )}
                      <div
                        className="px-3 py-1.5 rounded-full text-xs font-bold"
                        style={{ background: "rgba(255,255,255,0.92)", color: "var(--lf-dark)", backdropFilter: "blur(4px)" }}
                      >
                        Coming Soon
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <span
                      className="inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4"
                      style={{ background: product.accent, color: product.accentColor }}
                    >
                      {product.category}
                    </span>
                    <h2
                      style={{
                        fontFamily: "'Baloo 2', sans-serif",
                        fontSize: "clamp(1.4rem, 3vw, 2rem)",
                        fontWeight: 800,
                        color: "var(--lf-dark)",
                        lineHeight: 1.2,
                      }}
                    >
                      {product.name}
                    </h2>
                    <p
                      className="mt-1 mb-4"
                      style={{ fontWeight: 700, color: "rgba(45,45,45,0.5)", fontSize: "0.9rem" }}
                    >
                      {product.tagline}
                    </p>
                    <p style={{ color: "rgba(45,45,45,0.68)", lineHeight: 1.75, fontSize: "0.95rem" }}>
                      {product.desc}
                    </p>

                    <div className="mt-6 flex flex-col gap-2">
                      <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "rgba(45,45,45,0.4)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        What&apos;s inside
                      </p>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {product.includes.map((item) => (
                          <li key={item} className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center"
                              style={{ background: "var(--lf-teal)" }}
                            >
                              <svg width="8" height="6" fill="none" viewBox="0 0 8 6">
                                <path d="M1 3l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                            <span style={{ fontSize: "0.85rem", color: "rgba(45,45,45,0.7)" }}>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-8 flex items-center gap-4 flex-wrap">
                      <span
                        style={{
                          fontFamily: "'Baloo 2', sans-serif",
                          fontWeight: 800,
                          fontSize: "1.8rem",
                          color: "var(--lf-dark)",
                        }}
                      >
                        {product.price}
                      </span>
                      <NotifyButton productName={product.name} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why physical */}
        <section className="py-20" style={{ background: "var(--lf-cream)" }}>
          <div className="mx-auto px-6" style={{ maxWidth: 1000 }}>
            <div className="text-center mb-12">
              <h2
                style={{
                  fontFamily: "'Baloo 2', sans-serif",
                  fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)",
                  fontWeight: 800,
                  color: "var(--lf-dark)",
                }}
              >
                Why physical products?
              </h2>
              <p className="mt-3" style={{ color: "rgba(45,45,45,0.55)", fontSize: "0.95rem" }}>
                Because magic shouldn&apos;t stay inside a screen.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {whyPhysical.map((item) => (
                <div
                  key={item.title}
                  className="p-6 rounded-3xl"
                  style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,0.06)" }}
                >
                  <div className="mb-3" style={{ color: "var(--lf-teal)" }}>{item.icon}</div>
                  <h3
                    style={{
                      fontFamily: "'Baloo 2', sans-serif",
                      fontWeight: 800,
                      fontSize: "0.95rem",
                      color: "var(--lf-dark)",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {item.title}
                  </h3>
                  <p style={{ fontSize: "0.85rem", color: "rgba(45,45,45,0.6)", lineHeight: 1.65 }}>
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Notify me CTA */}
        <section
          className="py-20"
          style={{ background: "linear-gradient(135deg, var(--lf-dark) 0%, #1a3a2e 100%)" }}
        >
          <div className="mx-auto px-6 text-center" style={{ maxWidth: 620 }}>
            <p style={{ fontSize: "2.5rem" }} className="mb-4">📦</p>
            <h2
              style={{
                fontFamily: "'Baloo 2', sans-serif",
                fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
                fontWeight: 800,
                color: "#fff",
                lineHeight: 1.15,
              }}
            >
              Be the first to know when{" "}
              <span className="text-gradient-sunshine">shop launches</span>
            </h2>
            <p className="mt-4 mb-8" style={{ color: "rgba(255,255,255,0.6)", fontSize: "1rem", lineHeight: 1.7 }}>
              Early subscribers get exclusive launch discounts and first pick of kits.
            </p>
            <BottomNotifyForm />
            <p className="mt-5" style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.8rem" }}>
              No spam. Unsubscribe anytime.{" "}
              <Link href="/sign-up" style={{ color: "var(--lf-teal)" }}>
                Or start free with digital stories →
              </Link>
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
