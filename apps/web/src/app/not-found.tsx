import Link from "next/link";
import { Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main
        className="flex-1 flex flex-col items-center justify-center px-6 py-32 text-center"
        style={{ background: "var(--lf-cream)", minHeight: "70vh" }}
      >
        <p style={{ fontSize: "5rem", lineHeight: 1 }} className="mb-6">🗺️</p>
        <h1
          style={{
            fontFamily: "'Baloo 2', sans-serif",
            fontSize: "clamp(2rem, 5vw, 3.2rem)",
            fontWeight: 800,
            color: "var(--lf-dark)",
            lineHeight: 1.15,
          }}
        >
          Oops! This page went on an{" "}
          <span className="text-gradient-sunshine">adventure</span>
        </h1>
        <p
          className="mt-5"
          style={{ color: "rgba(45,45,45,0.6)", fontSize: "1.05rem", maxWidth: 440, lineHeight: 1.7 }}
        >
          Lalli &amp; Fafa looked everywhere, but couldn&apos;t find this page.
          Let&apos;s get you back to the stories.
        </p>
        <div className="flex flex-wrap gap-3 justify-center mt-8">
          <Link href="/" className="btn-primary" style={{ fontSize: "1rem" }}>
            <Sparkles size={18} /> Back to home
          </Link>
          <Link href="/stories" className="btn-ghost" style={{ fontSize: "1rem" }}>
            Browse stories
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
