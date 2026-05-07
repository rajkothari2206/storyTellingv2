"use client";

import { use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "convex/react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { Sparkles, BookOpen, Loader2, Lock } from "lucide-react";

/* ── Convex client (unauthenticated, public read only) ── */
const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <ConvexProvider client={convex}>
      <ShareView storyId={id} />
    </ConvexProvider>
  );
}

/* ── SVG icons for social platforms ── */
function WhatsAppIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12.05 2.095C6.495 2.095 1.984 6.616 1.984 12.178c0 1.768.47 3.431 1.296 4.875L2.013 22l5.087-1.331a9.924 9.924 0 004.95 1.31c5.555 0 10.066-4.52 10.066-10.083 0-2.697-1.05-5.23-2.958-7.14A9.98 9.98 0 0012.05 2.095zm.003 18.365a8.244 8.244 0 01-4.22-1.156l-.302-.18-3.13.82.834-3.053-.196-.315A8.24 8.24 0 013.67 12.18c0-4.566 3.718-8.28 8.283-8.28 2.213 0 4.29.863 5.854 2.43a8.23 8.23 0 012.422 5.85c0 4.565-3.718 8.28-8.176 8.28z"/>
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
  );
}

/* ── Main share view (public, no auth needed) ── */
function ShareView({ storyId }: { storyId: string }) {
  const story = useQuery(api.stories.getLightMetadata, { storyId: storyId as Id<"stories"> });
  const imageUrls = useQuery(api.stories.getSceneImageUrls, story ? { storyId: storyId as Id<"stories"> } : "skip");
  const contentData = useQuery(api.stories.getContentOnly, story ? { storyId: storyId as Id<"stories"> } : "skip");

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const storyPageUrl = shareUrl.replace("/share/", "/story/");

  const firstImage = imageUrls?.[0]?.url ?? null;
  const preview = contentData?.content
    ? contentData.content.split("\n").filter(Boolean).slice(0, 2).join(" ").slice(0, 220) + "…"
    : null;

  const waText = encodeURIComponent(`✨ Look at this personalised Lalli & Fafa story: "${story?.title ?? "A magical story"}" ${shareUrl}`);
  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
  const waUrl = `https://wa.me/?text=${waText}`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl).catch(() => {});
  };

  if (story === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0e0c1a" }}>
        <Loader2 size={32} className="animate-spin" style={{ color: "var(--lf-teal)" }} />
      </div>
    );
  }

  if (story === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "#0e0c1a" }}>
        <BookOpen size={48} style={{ color: "rgba(255,255,255,0.2)" }} />
        <p style={{ fontFamily: "'Nunito', sans-serif", color: "rgba(255,255,255,0.4)" }}>
          Story not found or no longer available.
        </p>
        <Link href="/" className="btn-primary">Go to Lalli Fafa</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg,#0e0c1a 0%,#0d2d26 100%)" }}>

      {/* Top bar */}
      <header className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <Link href="/" className="flex items-center gap-2">
          <div className="relative" style={{ width: 36, height: 36 }}>
            <Image src="/lf-logo.png" alt="Lalli Fafa" fill className="object-contain" />
          </div>
          <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.1rem", color: "#fff" }}>
            Lalli <span style={{ color: "var(--lf-teal)" }}>Fafa</span>
          </span>
        </Link>
        <Link
          href="/sign-up"
          className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-bold"
          style={{ background: "var(--lf-teal)", color: "#fff", fontFamily: "'Nunito', sans-serif" }}
        >
          <Sparkles size={14} /> Create your own
        </Link>
      </header>

      {/* Story preview card */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 gap-6" style={{ maxWidth: 520, margin: "0 auto", width: "100%" }}>

        {/* Scene image */}
        {firstImage ? (
          <div className="w-full rounded-3xl overflow-hidden shadow-2xl relative" style={{ aspectRatio: "4/3" }}>
            <Image src={firstImage} alt={story.title ?? "Story scene"} fill className="object-cover" priority />
            {/* Gradient + title overlay */}
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 50%)" }} />
            <div className="absolute bottom-5 left-5 right-5">
              <p style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "clamp(1.1rem,4vw,1.5rem)", color: "#fff", textShadow: "0 2px 12px rgba(0,0,0,0.8)", lineHeight: 1.2 }}>
                {story.title}
              </p>
            </div>
            {/* Lalli Fafa watermark */}
            <div className="absolute top-4 right-4 opacity-70" style={{ width: 28, height: 28 }}>
              <Image src="/lf-logo.png" alt="" fill className="object-contain" />
            </div>
          </div>
        ) : (
          /* Placeholder if image not yet generated */
          <div className="w-full rounded-3xl flex flex-col items-center justify-center gap-4" style={{ aspectRatio: "4/3", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="relative" style={{ width: 80, height: 80 }}>
              <Image src="/lf-hero.png" alt="Lalli and Fafa" fill className="object-contain" />
            </div>
            <p style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.3rem", color: "#fff", textAlign: "center", padding: "0 1rem" }}>
              {story.title}
            </p>
          </div>
        )}

        {/* Story preview text */}
        {preview && (
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.95rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.7, textAlign: "center", fontStyle: "italic" }}>
            "{preview}"
          </p>
        )}

        {/* Lock notice */}
        <div
          className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <Lock size={18} style={{ color: "var(--lf-teal)", flexShrink: 0 }} />
          <div>
            <p style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.88rem", color: "#fff" }}>
              Full story · narration · illustrations
            </p>
            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.8rem", color: "rgba(255,255,255,0.45)", marginTop: 2 }}>
              Sign in to Lalli Fafa to read the complete story with audio narration.
            </p>
          </div>
        </div>

        {/* CTA */}
        <Link
          href={`/sign-in?redirect=${encodeURIComponent(storyPageUrl)}`}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-base transition-all hover:scale-105"
          style={{ background: "linear-gradient(135deg,var(--lf-teal),#00a38d)", color: "#fff", fontFamily: "'Baloo 2', sans-serif", boxShadow: "0 4px 24px rgba(0,201,167,0.4)" }}
        >
          <BookOpen size={18} /> Read the full story
        </Link>

        <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.8rem", color: "rgba(255,255,255,0.3)", textAlign: "center" }}>
          Don't have an account?{" "}
          <Link href="/sign-up" style={{ color: "var(--lf-teal)", fontWeight: 700, textDecoration: "underline" }}>
            Create one free
          </Link>
          {" "}— your first story is on us ✨
        </p>

        {/* Social sharing strip */}
        <div className="w-full flex flex-col gap-3 mt-2">
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.75rem", fontWeight: 700, color: "rgba(255,255,255,0.3)", textAlign: "center", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Share this story
          </p>
          <div className="flex gap-3 justify-center">
            {/* WhatsApp */}
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all hover:scale-105 hover:brightness-110"
              style={{ background: "#25D366", color: "#fff", fontFamily: "'Nunito', sans-serif" }}
            >
              <WhatsAppIcon /> WhatsApp
            </a>
            {/* Facebook */}
            <a
              href={fbUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all hover:scale-105 hover:brightness-110"
              style={{ background: "#1877F2", color: "#fff", fontFamily: "'Nunito', sans-serif" }}
            >
              <FacebookIcon /> Facebook
            </a>
            {/* Copy link */}
            <button
              onClick={copyLink}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all hover:scale-105"
              style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.15)", fontFamily: "'Nunito', sans-serif" }}
            >
              🔗 Copy link
            </button>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="text-center py-5 px-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.8rem", color: "rgba(255,255,255,0.25)" }}>
          Personalised stories by{" "}
          <Link href="/" style={{ color: "var(--lf-teal)", fontWeight: 700 }}>Lalli Fafa</Link>
          {" "}— where every child is the hero ✨
        </p>
      </footer>

    </div>
  );
}
