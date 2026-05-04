"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, RefreshCw, BookOpen } from "lucide-react";

export default function StoryError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error so we can debug it in Vercel
    console.error("[StoryError]", error);
  }, [error]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center"
      style={{ background: "#0e0c1a" }}
    >
      {/* Logo */}
      <div className="relative" style={{ width: 72, height: 72, opacity: 0.8 }}>
        <Image src="/lf-hero.png" alt="Lalli Fafa" fill className="object-contain" />
      </div>

      {/* Icon */}
      <div
        className="flex items-center justify-center rounded-full"
        style={{ width: 64, height: 64, background: "rgba(0,201,167,0.12)", border: "1.5px solid rgba(0,201,167,0.25)" }}
      >
        <BookOpen size={28} style={{ color: "var(--lf-teal)" }} />
      </div>

      {/* Message */}
      <div className="flex flex-col gap-2 max-w-sm">
        <h1
          style={{
            fontFamily: "'Baloo 2', sans-serif",
            fontWeight: 800,
            fontSize: "1.4rem",
            color: "#fff",
            lineHeight: 1.3,
          }}
        >
          Oops — couldn&apos;t open the story
        </h1>
        <p
          style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: "0.9rem",
            color: "rgba(255,255,255,0.45)",
            lineHeight: 1.7,
          }}
        >
          Something went wrong while loading this story. It might be a
          temporary hiccup — try again or head back to your library.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all hover:scale-105"
          style={{
            background: "linear-gradient(135deg,var(--lf-teal),#00a38d)",
            color: "#fff",
            fontFamily: "'Baloo 2', sans-serif",
            boxShadow: "0 4px 16px rgba(0,201,167,0.35)",
            border: "none",
            cursor: "pointer",
          }}
        >
          <RefreshCw size={14} /> Try again
        </button>

        <Link
          href="/library"
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all hover:opacity-80"
          style={{
            background: "rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.7)",
            fontFamily: "'Baloo 2', sans-serif",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <ArrowLeft size={14} /> Back to library
        </Link>
      </div>
    </div>
  );
}
