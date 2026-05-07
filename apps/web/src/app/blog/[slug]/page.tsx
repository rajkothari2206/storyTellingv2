import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Clock, Sparkles, ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { BLOG_POSTS, getBlogPost, getRecentPosts } from "@/lib/blog-data";

/* ── Static params for build ── */
export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

const BASE = "https://www.lallifafa.com";

/* ── Dynamic metadata ── */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return { title: "Not found" };
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `${BASE}/blog/${slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      url: `${BASE}/blog/${slug}`,
      images: [{ url: post.image, width: 1200, height: 630, alt: post.title }],
      publishedTime: post.date,
      authors: ["Lalli Fafa"],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [post.image],
    },
  };
}

/* ── Page ── */
export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const related = getRecentPosts(slug, 3);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: `${BASE}${post.image}`,
    datePublished: post.date,
    dateModified: post.date,
    author: { "@type": "Organization", name: "Lalli Fafa", url: BASE },
    publisher: {
      "@type": "Organization",
      name: "Lalli Fafa",
      logo: { "@type": "ImageObject", url: `${BASE}/lf-logo.png` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${BASE}/blog/${slug}` },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <SiteHeader />
      <main style={{ background: "linear-gradient(160deg,#FFF8E7 0%,#E6FAF6 50%,#F3EEFF 100%)" }}>

        {/* ── Hero image banner ── */}
        <div className="relative overflow-hidden" style={{ height: 340, marginTop: 72 }}>
          <Image
            src={post.image}
            alt={post.title}
            fill
            className="object-cover"
            style={{ objectPosition: post.imgPosition }}
            priority
          />
          {/* Dark overlay */}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom,rgba(19,16,32,0.35) 0%,rgba(19,16,32,0.75) 100%)" }} />

          {/* Back button */}
          <div className="absolute top-6 left-6">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all hover:bg-white/20"
              style={{ background: "rgba(255,255,255,0.12)", color: "#fff", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)", fontFamily: "'Nunito', sans-serif" }}
            >
              <ArrowLeft size={14} /> Blog
            </Link>
          </div>

          {/* Post meta on image */}
          <div className="absolute bottom-0 left-0 right-0 px-6 pb-8" style={{ maxWidth: 900, margin: "0 auto" }}>
            <div className="mx-auto" style={{ maxWidth: 820 }}>
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: post.tagColor, color: "#fff" }}>
                  {post.tag}
                </span>
                <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "rgba(255,255,255,0.7)", fontFamily: "'Nunito', sans-serif" }}>
                  <Clock size={12} /> {post.readTime}
                </span>
                <span style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.78rem", fontFamily: "'Nunito', sans-serif" }}>{post.date}</span>
              </div>
              <h1
                style={{
                  fontFamily: "'Baloo 2', sans-serif",
                  fontWeight: 800,
                  fontSize: "clamp(1.5rem,3.5vw,2.2rem)",
                  color: "#fff",
                  lineHeight: 1.25,
                  textShadow: "0 2px 12px rgba(0,0,0,0.4)",
                }}
              >
                {post.title}
              </h1>
            </div>
          </div>
        </div>

        {/* ── Article body ── */}
        <div className="mx-auto px-5 py-12" style={{ maxWidth: 820 }}>
          <div className="flex flex-col lg:flex-row gap-10">

            {/* Main content */}
            <article className="flex-1 min-w-0">
              {/* Excerpt / lede */}
              <p
                className="mb-8 pb-8"
                style={{
                  fontFamily: "'Nunito', sans-serif",
                  fontSize: "1.08rem",
                  color: "rgba(45,45,45,0.7)",
                  lineHeight: 1.8,
                  borderBottom: `3px solid ${post.tagColor}33`,
                  fontStyle: "italic",
                }}
              >
                {post.excerpt}
              </p>

              {/* Article HTML */}
              <div
                className="blog-content"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              {/* Author strip */}
              <div
                className="flex items-center gap-4 mt-12 p-5 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.8)", border: "1.5px solid rgba(0,0,0,0.07)" }}
              >
                <div className="relative flex-shrink-0" style={{ width: 52, height: 52 }}>
                  <Image src="/lf-logo.png" alt="Lalli Fafa" fill className="object-contain" />
                </div>
                <div>
                  <p style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, fontSize: "0.92rem", color: "var(--lf-dark)" }}>
                    The Lalli Fafa Team
                  </p>
                  <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.8rem", color: "rgba(45,45,45,0.5)" }}>
                    Building magical, personalised stories for children across India.
                  </p>
                </div>
              </div>

              {/* CTA */}
              <div
                className="mt-8 rounded-3xl overflow-hidden relative"
                style={{ background: "linear-gradient(135deg,#131020 0%,#1a1740 100%)", padding: "28px 28px" }}
              >
                <div className="absolute pointer-events-none" style={{ top: -40, right: 20, width: 200, height: 200, background: "radial-gradient(circle,rgba(0,201,167,0.2) 0%,transparent 70%)" }} />
                <div className="relative flex flex-col sm:flex-row items-center gap-5">
                  <div className="relative flex-shrink-0" style={{ width: 60, height: 60 }}>
                    <Image src="/lf-hero.png" alt="Lalli Fafa" fill className="object-contain" />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <p style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1rem", color: "#fff" }}>
                      Put this into practice tonight
                    </p>
                    <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.82rem", color: "rgba(255,255,255,0.5)", marginTop: 2 }}>
                      Create a personalised story for your child — free, in under 2 minutes.
                    </p>
                  </div>
                  <Link
                    href="/sign-up"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold flex-shrink-0 transition-all hover:scale-105 text-sm"
                    style={{ background: "linear-gradient(135deg,var(--lf-teal),#00a38d)", color: "#fff", fontFamily: "'Baloo 2', sans-serif", boxShadow: "0 4px 14px rgba(0,201,167,0.4)" }}
                  >
                    <Sparkles size={14} /> Try free
                  </Link>
                </div>
              </div>
            </article>

            {/* Sidebar — sticky on desktop */}
            <aside className="lg:w-64 flex-shrink-0">
              <div className="lg:sticky" style={{ top: 96 }}>
                <p style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "0.85rem", color: "var(--lf-dark)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
                  More articles
                </p>
                <div className="flex flex-col gap-3">
                  {related.map((p) => (
                    <Link
                      key={p.slug}
                      href={`/blog/${p.slug}`}
                      className="group flex gap-3 p-3 rounded-2xl transition-all hover:-translate-y-0.5 hover:shadow-md"
                      style={{ background: "#fff", border: `1.5px solid ${p.tagColor}22` }}
                    >
                      <div className="relative flex-shrink-0 rounded-xl overflow-hidden" style={{ width: 52, height: 52 }}>
                        <Image src={p.image} alt={p.title} fill className="object-cover" style={{ objectPosition: p.imgPosition }} />
                      </div>
                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold self-start" style={{ background: `${p.tagColor}15`, color: p.tagColor }}>
                          {p.tag}
                        </span>
                        <p style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, fontSize: "0.8rem", color: "var(--lf-dark)", lineHeight: 1.3 }}
                          className="line-clamp-2"
                        >
                          {p.title}
                        </p>
                        <span className="flex items-center gap-1 text-xs font-bold transition-all group-hover:gap-2 mt-auto" style={{ color: p.tagColor, fontFamily: "'Nunito', sans-serif" }}>
                          Read <ArrowRight size={10} />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Tag list */}
                <div className="mt-6">
                  <p style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "0.85rem", color: "var(--lf-dark)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
                    Topics
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(new Set(BLOG_POSTS.map((p) => p.tag))).map((tag) => {
                      const post = BLOG_POSTS.find((p) => p.tag === tag)!;
                      return (
                        <span key={tag} className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: `${post.tagColor}15`, color: post.tagColor }}>
                          {tag}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>

      </main>

      {/* Article typography styles */}
      <style>{`
        .blog-content p {
          font-family: 'Nunito', sans-serif;
          font-size: 1rem;
          line-height: 1.85;
          color: rgba(45,45,45,0.78);
          margin-bottom: 1.25rem;
        }
        .blog-content h2 {
          font-family: 'Baloo 2', sans-serif;
          font-weight: 800;
          font-size: 1.35rem;
          color: #0E0A1F;
          margin-top: 2.5rem;
          margin-bottom: 0.75rem;
          line-height: 1.25;
        }
        .blog-content h3 {
          font-family: 'Baloo 2', sans-serif;
          font-weight: 700;
          font-size: 1.05rem;
          color: #0E0A1F;
          margin-top: 1.75rem;
          margin-bottom: 0.5rem;
        }
        .blog-content ul, .blog-content ol {
          margin: 0 0 1.25rem 1.5rem;
        }
        .blog-content ul { list-style: disc; }
        .blog-content ol { list-style: decimal; }
        .blog-content li {
          font-family: 'Nunito', sans-serif;
          font-size: 0.97rem;
          line-height: 1.75;
          color: rgba(45,45,45,0.75);
          margin-bottom: 0.35rem;
        }
        .blog-content li strong {
          color: #0E0A1F;
          font-weight: 700;
        }
        .blog-content em {
          color: rgba(45,45,45,0.85);
          font-style: italic;
        }
        .blog-content strong {
          color: #0E0A1F;
          font-weight: 700;
        }
        .blog-content blockquote {
          border-left: 4px solid var(--lf-teal);
          padding: 0.75rem 1.25rem;
          margin: 1.5rem 0;
          background: rgba(0,201,167,0.05);
          border-radius: 0 12px 12px 0;
        }
        .blog-content blockquote p {
          margin-bottom: 0;
          font-style: italic;
          color: rgba(45,45,45,0.65);
        }
      `}</style>

      <SiteFooter />
    </>
  );
}
