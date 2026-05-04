import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Clock, PenLine, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { BLOG_POSTS, getFeaturedPost } from "@/lib/blog-data";

export const metadata: Metadata = {
  title: "Blog — Lalli Fafa",
  description:
    "Tips, insights, and honest conversations about raising curious, creative, and kind children. Stories for parents, not just kids.",
};

export default function BlogPage() {
  const featured = getFeaturedPost();
  const rest = BLOG_POSTS.filter((p) => !p.featured);

  return (
    <>
      <SiteHeader />
      <main style={{ background: "linear-gradient(160deg,#FFF8E7 0%,#E6FAF6 50%,#F3EEFF 100%)" }}>

        {/* ── Compact hero bar ── */}
        <section
          className="relative overflow-hidden"
          style={{ paddingTop: 88, paddingBottom: 24 }}
        >
          {/* Glow */}
          <div className="absolute pointer-events-none" style={{ top: 0, right: "8%", width: 340, height: 340, background: "radial-gradient(circle,rgba(0,201,167,0.13) 0%,transparent 70%)" }} />
          <div className="absolute pointer-events-none" style={{ bottom: -40, left: "5%", width: 260, height: 260, background: "radial-gradient(circle,rgba(249,199,0,0.15) 0%,transparent 70%)" }} />

          <div className="mx-auto px-6 relative" style={{ maxWidth: 1120 }}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex flex-col gap-2">
                <span
                  className="inline-flex items-center gap-1.5 self-start px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                  style={{ background: "rgba(249,199,0,0.18)", color: "#b8860b" }}
                >
                  <PenLine size={11} /> Lalli Fafa Blog
                </span>
                <h1 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "clamp(1.6rem,3vw,2.2rem)", color: "var(--lf-dark)", lineHeight: 1.15 }}>
                  Stories for parents,{" "}
                  <span style={{ color: "var(--lf-teal)" }}>not just kids</span>
                </h1>
                <p style={{ color: "rgba(45,45,45,0.55)", fontSize: "0.88rem", lineHeight: 1.6, maxWidth: 480 }}>
                  Child development, parenting tips, and honest thoughts on raising curious, kind little humans.
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="hidden sm:flex flex-col gap-1.5">
                  <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.8rem", fontWeight: 700, color: "rgba(45,45,45,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    {BLOG_POSTS.length} articles
                  </span>
                  {["Child Development", "Parenting Tips", "Language & Culture"].map((t) => (
                    <span key={t} style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.78rem", color: "rgba(45,45,45,0.5)" }}>· {t}</span>
                  ))}
                </div>
                <div className="relative" style={{ width: 68, height: 68 }}>
                  <Image src="/lf-hero.png" alt="Lalli Fafa" fill className="object-contain" style={{ filter: "drop-shadow(0 4px 12px rgba(0,201,167,0.25))" }} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto px-5 pb-20" style={{ maxWidth: 1120 }}>

          {/* ── Featured post ── */}
          <Link
            href={`/blog/${featured.slug}`}
            className="group flex flex-col lg:flex-row rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl mb-10"
            style={{ background: "#fff", border: `2px solid ${featured.tagColor}33`, boxShadow: `0 6px 32px ${featured.tagColor}18` }}
          >
            {/* Image */}
            <div className="relative flex-shrink-0 overflow-hidden" style={{ height: 260, minWidth: 0 }}>
              <div className="lg:hidden relative w-full h-full">
                <Image src={featured.image} alt={featured.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" style={{ objectPosition: featured.imgPosition }} />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top,rgba(0,0,0,0.45) 0%,transparent 60%)" }} />
              </div>
            </div>
            <div className="hidden lg:block relative flex-shrink-0 overflow-hidden" style={{ width: 420 }}>
              <Image src={featured.image} alt={featured.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" style={{ objectPosition: featured.imgPosition }} />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to right,transparent 60%,rgba(255,255,255,0.05))" }} />
              {/* Featured badge */}
              <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold" style={{ background: "rgba(255,255,255,0.92)", color: "var(--lf-dark)", backdropFilter: "blur(4px)" }}>
                ⭐ Featured
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-col justify-center gap-4 p-7 flex-1">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: `${featured.tagColor}18`, color: featured.tagColor }}>
                  {featured.tag}
                </span>
                <span className="flex items-center gap-1 text-xs" style={{ color: "rgba(45,45,45,0.4)", fontFamily: "'Nunito', sans-serif" }}>
                  <Clock size={11} /> {featured.readTime}
                </span>
                <span style={{ color: "rgba(45,45,45,0.35)", fontSize: "0.75rem", fontFamily: "'Nunito', sans-serif" }}>{featured.date}</span>
              </div>

              <h2 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "clamp(1.25rem,2.5vw,1.65rem)", color: "var(--lf-dark)", lineHeight: 1.25 }}>
                {featured.title}
              </h2>
              <p style={{ color: "rgba(45,45,45,0.6)", fontSize: "0.92rem", lineHeight: 1.7 }}>
                {featured.excerpt}
              </p>

              <div className="flex items-center gap-2 font-bold text-sm mt-1 transition-all group-hover:gap-3" style={{ color: featured.tagColor, fontFamily: "'Nunito', sans-serif" }}>
                Read article <ArrowRight size={15} />
              </div>
            </div>
          </Link>

          {/* ── Rest of posts ── */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rest.map((post, idx) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group flex flex-col rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl"
                style={{
                  background: "#fff",
                  border: `1.5px solid ${post.tagColor}28`,
                  boxShadow: `0 4px 20px ${post.tagColor}12`,
                  animationDelay: `${idx * 0.06}s`,
                }}
              >
                {/* Scene image */}
                <div className="relative overflow-hidden flex-shrink-0" style={{ height: 180 }}>
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    style={{ objectPosition: post.imgPosition }}
                  />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top,rgba(0,0,0,0.4) 0%,transparent 55%)" }} />
                  {/* Accent bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: post.tagColor }} />
                  {/* Emoji */}
                  <div className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center text-lg" style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(4px)" }}>
                    {post.emoji}
                  </div>
                </div>

                {/* Card body */}
                <div className="flex flex-col gap-3 p-5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold" style={{ background: `${post.tagColor}15`, color: post.tagColor }}>
                      {post.tag}
                    </span>
                    <span className="flex items-center gap-1 text-xs" style={{ color: "rgba(45,45,45,0.38)", fontFamily: "'Nunito', sans-serif" }}>
                      <Clock size={10} /> {post.readTime}
                    </span>
                  </div>

                  <h3 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, fontSize: "1rem", color: "var(--lf-dark)", lineHeight: 1.35 }}>
                    {post.title}
                  </h3>

                  <p className="flex-1" style={{ color: "rgba(45,45,45,0.55)", fontSize: "0.83rem", lineHeight: 1.65 }}>
                    {post.excerpt}
                  </p>

                  <div className="flex items-center justify-between mt-auto pt-2" style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                    <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.75rem", color: "rgba(45,45,45,0.35)" }}>{post.date}</span>
                    <span className="flex items-center gap-1 text-xs font-bold transition-all group-hover:gap-2" style={{ color: post.tagColor, fontFamily: "'Nunito', sans-serif" }}>
                      Read <ArrowRight size={12} />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* ── Bottom CTA ── */}
          <div
            className="mt-14 rounded-3xl overflow-hidden relative"
            style={{ background: "linear-gradient(135deg,#131020 0%,#1a1740 100%)", padding: "32px 36px" }}
          >
            <div className="absolute pointer-events-none" style={{ top: -60, right: 40, width: 280, height: 280, background: "radial-gradient(circle,rgba(0,201,167,0.2) 0%,transparent 70%)" }} />
            <div className="relative flex flex-col sm:flex-row items-center gap-6">
              <div className="relative flex-shrink-0" style={{ width: 72, height: 72 }}>
                <Image src="/lf-hero.png" alt="Lalli Fafa" fill className="object-contain" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <p style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.15rem", color: "#fff" }}>
                  Ready to put these ideas into practice?
                </p>
                <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.85rem", color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
                  Create a personalised story for your child — free, in under 2 minutes.
                </p>
              </div>
              <Link
                href="/sign-up"
                className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold flex-shrink-0 transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg,var(--lf-teal),#00a38d)", color: "#fff", fontFamily: "'Baloo 2', sans-serif", fontSize: "0.95rem", boxShadow: "0 4px 16px rgba(0,201,167,0.4)" }}
              >
                <Sparkles size={16} /> Try it free
              </Link>
            </div>
          </div>

        </div>
      </main>
      <SiteFooter />
    </>
  );
}
