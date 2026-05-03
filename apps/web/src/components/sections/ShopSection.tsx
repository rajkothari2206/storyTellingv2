import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, Bell } from "lucide-react";

const products = [
  {
    title: "Lalli's Creative Adventure Kit",
    description: "Coloring books, stickers, and activity sheets inspired by the stories.",
    price: "₹499",
    image: "/LalliKit.jpg",
    tag: "Coming soon",
    tagColor: "var(--lf-sunshine)",
    tagTextColor: "var(--lf-dark)",
    testId: "lalli-kit",
  },
  {
    title: "Monthly Story Box",
    description: "New adventures + hands-on activities delivered to your door every month.",
    price: "₹999 / month",
    image: "/subscriptionBox.jpg",
    tag: "⭐ Featured",
    tagColor: "var(--lf-mango)",
    tagTextColor: "#fff",
    featured: true,
    testId: "story-box",
  },
  {
    title: "Fafa's Building Adventure Kit",
    description: "STEM-inspired building challenges and puzzles for little engineers.",
    price: "₹599",
    image: "/FafaKit.jpg",
    tag: "Coming soon",
    tagColor: "var(--lf-teal)",
    tagTextColor: "#fff",
    testId: "fafa-kit",
  },
];

export function ShopSection() {
  return (
    <section
      id="shop"
      className="py-7 lg:py-10"
      style={{ background: "linear-gradient(135deg, #FFF8E1 0%, #FFEDB0 100%)" }}
    >
      <div className="mx-auto px-6" style={{ maxWidth: 1200 }}>
        {/* Header */}
        <div className="text-center mb-5 flex flex-col items-center gap-2">
          <span
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider"
            style={{ background: "rgba(255,107,53,0.15)", color: "var(--lf-mango)" }}
          >
            <ShoppingBag size={13} /> Shop
          </span>
          <h2
            style={{
              fontFamily: "'Baloo 2', sans-serif",
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 800,
              color: "var(--lf-dark)",
            }}
          >
            Bring the magic{" "}
            <span className="text-gradient-sunshine">home</span>
          </h2>
          <p style={{ color: "rgba(45,45,45,0.65)", fontSize: "1.05rem", maxWidth: 500 }}>
            Stories are just the beginning. Our physical kits turn screen-time into hands-on adventures.
          </p>
        </div>

        {/* Products */}
        <div className="grid md:grid-cols-3 gap-6">
          {products.map((p) => (
            <div
              key={p.testId}
              className="group relative flex flex-col rounded-3xl overflow-hidden transition-all duration-200 hover:-translate-y-1"
              style={{
                background: "#fff",
                border: p.featured ? "2px solid rgba(255,107,53,0.3)" : "1.5px solid rgba(0,0,0,0.05)",
                boxShadow: p.featured
                  ? "0 12px 40px rgba(255,107,53,0.12)"
                  : "0 4px 20px rgba(0,0,0,0.06)",
              }}
            >
              {/* Image */}
              <div className="relative overflow-hidden" style={{ height: 175 }}>
                <Image
                  src={p.image}
                  alt={p.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {/* Tag */}
                <div
                  className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold"
                  style={{ background: p.tagColor, color: p.tagTextColor }}
                >
                  {p.tag}
                </div>
              </div>

              {/* Info */}
              <div className="p-4 flex flex-col gap-2 flex-1">
                <h3
                  style={{
                    fontFamily: "'Baloo 2', sans-serif",
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    color: "var(--lf-dark)",
                  }}
                >
                  {p.title}
                </h3>
                <p style={{ color: "rgba(45,45,45,0.6)", fontSize: "0.88rem", lineHeight: 1.6 }}>
                  {p.description}
                </p>
                <div
                  className="mt-auto pt-3 flex items-center justify-between"
                  style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}
                >
                  <span
                    style={{
                      fontFamily: "'Baloo 2', sans-serif",
                      fontSize: "1.4rem",
                      fontWeight: 800,
                      color: "var(--lf-mango)",
                    }}
                  >
                    {p.price}
                  </span>
                  <button
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 hover:scale-105"
                    style={{
                      background: "rgba(249,199,0,0.12)",
                      color: "#b8860b",
                      border: "1.5px solid rgba(249,199,0,0.4)",
                      cursor: "pointer",
                    }}
                  >
                    <Bell size={13} />
                    Notify me
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-10">
          <Link href="/shop" className="btn-secondary">
            <ShoppingBag size={18} />
            Explore all products
          </Link>
        </div>
      </div>
    </section>
  );
}
