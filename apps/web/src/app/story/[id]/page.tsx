"use client";

import { use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery, useConvexAuth, Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { ArrowLeft, BookOpen, Headphones, Loader2 } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export default function StoryPage({ params }: Props) {
  const { id } = use(params);
  const { isAuthenticated } = useConvexAuth();

  const story = useQuery(
    api.stories.get,
    isAuthenticated ? { storyId: id as Id<"stories"> } : "skip"
  );
  const imageUrls = useQuery(
    api.stories.getSceneImageUrls,
    isAuthenticated && story ? { storyId: id as Id<"stories"> } : "skip"
  );
  const narrationUrl = useQuery(
    api.stories.getNarrationFileUrl,
    isAuthenticated && story ? { storyId: id as Id<"stories"> } : "skip"
  );

  return (
    <>
      <AuthLoading>
        <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--lf-cream)" }}>
          <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "var(--lf-teal)", borderTopColor: "transparent" }} />
        </div>
      </AuthLoading>
      <Unauthenticated>
        <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--lf-cream)" }}>
          <Link href="/sign-in" className="btn-primary">Sign in</Link>
        </div>
      </Unauthenticated>
      <Authenticated>
        <div className="min-h-screen" style={{ background: "var(--lf-cream)" }}>
          {/* Nav */}
          <header
            className="sticky top-0 z-40 flex items-center gap-4 px-6 py-4"
            style={{ background: "rgba(255,252,245,0.9)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}
          >
            <Link
              href="/library"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold hover:bg-black/5 transition-all"
              style={{ color: "var(--lf-dark)", fontFamily: "'Nunito', sans-serif" }}
            >
              <ArrowLeft size={16} /> Library
            </Link>
            <div className="flex items-center gap-2">
              <div className="relative" style={{ width: 28, height: 28 }}>
                <Image src="/logoNoBg.png" alt="Lalli Fafa" fill className="object-contain" />
              </div>
              <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1rem", color: "var(--lf-dark)" }}>
                Lalli <span style={{ color: "var(--lf-teal)" }}>Fafa</span>
              </span>
            </div>
          </header>

          <main className="max-w-3xl mx-auto px-6 py-10">
            {story === undefined ? (
              <div className="flex flex-col items-center gap-4 py-20">
                <Loader2 size={32} className="animate-spin" style={{ color: "var(--lf-teal)" }} />
                <p style={{ fontFamily: "'Nunito', sans-serif", color: "rgba(45,45,45,0.5)" }}>Loading your story…</p>
              </div>
            ) : story === null ? (
              <div className="flex flex-col items-center gap-4 py-20">
                <BookOpen size={48} style={{ color: "var(--lf-teal)", opacity: 0.4 }} />
                <p style={{ fontFamily: "'Nunito', sans-serif", color: "rgba(45,45,45,0.5)" }}>Story not found.</p>
                <Link href="/library" className="btn-primary">Back to library</Link>
              </div>
            ) : (
              <div className="flex flex-col gap-8">
                {/* Title */}
                <div className="flex flex-col gap-3">
                  <h1 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "clamp(1.8rem,4vw,2.4rem)", color: "var(--lf-dark)", lineHeight: 1.2 }}>
                    {(story as { title?: string }).title ?? "Untitled Story"}
                  </h1>
                  <div className="flex flex-wrap gap-2">
                    {((story as { params?: { theme?: string; language?: string; lesson?: string } }).params?.theme) && (
                      <span className="px-3 py-1 rounded-full text-sm font-semibold" style={{ background: "rgba(0,184,166,0.1)", color: "var(--lf-teal)" }}>
                        {(story as { params: { theme: string } }).params.theme}
                      </span>
                    )}
                    {((story as { params?: { language?: string } }).params?.language) && (
                      <span className="px-3 py-1 rounded-full text-sm font-semibold" style={{ background: "rgba(0,0,0,0.05)", color: "rgba(45,45,45,0.6)" }}>
                        {(story as { params: { language: string } }).params.language}
                      </span>
                    )}
                  </div>
                </div>

                {/* Narration audio */}
                {(narrationUrl as { url?: string | null } | null)?.url && (
                  <div
                    className="flex items-center gap-4 p-4 rounded-2xl"
                    style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,0.06)" }}
                  >
                    <Headphones size={20} style={{ color: "var(--lf-teal)", flexShrink: 0 }} />
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <p style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.85rem", color: "var(--lf-dark)" }}>
                        Listen to the story
                      </p>
                      <audio controls className="w-full" src={(narrationUrl as { url: string }).url} style={{ height: 36 }} />
                    </div>
                  </div>
                )}

                {/* Generating state */}
                {(story as { status?: string }).status === "generating" && (
                  <div
                    className="flex items-center gap-3 p-5 rounded-2xl"
                    style={{ background: "rgba(249,199,0,0.1)", border: "1.5px solid rgba(249,199,0,0.25)" }}
                  >
                    <Loader2 size={20} className="animate-spin" style={{ color: "#b8860b" }} />
                    <p style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 600, color: "#7a5800", fontSize: "0.9rem" }}>
                      Your story is being generated… check back in a moment!
                    </p>
                  </div>
                )}

                {/* Scenes */}
                {Array.isArray((story as { sceneMetadata?: unknown[] }).sceneMetadata) && (
                  <div className="flex flex-col gap-10">
                    {((story as { sceneMetadata: Array<{ sceneNumber: number; text: string; imagePrompt?: string }> }).sceneMetadata).map((scene, i) => (
                      <div key={i} className="flex flex-col gap-4">
                        {/* Scene image — imageUrls is an array of {url, sceneNumber, ...} objects */}
                        {imageUrls && (imageUrls as Array<{ url?: string | null }>)[i]?.url && (
                          <div className="relative w-full rounded-2xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
                            <Image
                              src={(imageUrls as Array<{ url: string }>)[i].url}
                              alt={`Scene ${i + 1}`}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        {/* Scene text */}
                        <p
                          style={{
                            fontFamily: "'Nunito', sans-serif",
                            fontSize: "1.05rem",
                            lineHeight: 1.8,
                            color: "var(--lf-dark)",
                          }}
                        >
                          {scene.text}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Fallback: plain content */}
                {!(story as { sceneMetadata?: unknown[] }).sceneMetadata && (story as { content?: string }).content && (
                  <div
                    className="prose max-w-none"
                    style={{ fontFamily: "'Nunito', sans-serif", fontSize: "1.05rem", lineHeight: 1.8, color: "var(--lf-dark)" }}
                  >
                    {((story as { content: string }).content).split("\n").map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>
                )}

                {/* Back link */}
                <div className="pt-4 border-t" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                  <Link
                    href="/library"
                    className="flex items-center gap-2 text-sm font-semibold"
                    style={{ color: "var(--lf-teal)", fontFamily: "'Nunito', sans-serif" }}
                  >
                    <ArrowLeft size={16} /> Back to library
                  </Link>
                </div>
              </div>
            )}
          </main>
        </div>
      </Authenticated>
    </>
  );
}
