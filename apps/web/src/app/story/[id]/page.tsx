"use client";

import { use, useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  useQuery,
  useConvexAuth,
  Authenticated,
  AuthLoading,
  Unauthenticated,
} from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import {
  ArrowLeft,
  BookOpen,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  Library,
  Sparkles,
} from "lucide-react";

/* ────────────────────────────────────────────────────────────────
   Helpers
──────────────────────────────────────────────────────────────── */
function formatTime(s: number) {
  if (!isFinite(s) || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

/* ────────────────────────────────────────────────────────────────
   Types
──────────────────────────────────────────────────────────────── */
interface SceneMeta {
  sceneNumber: number;
  text: string;
  imagePrompt?: string;
}
interface StoryShape {
  title?: string;
  status?: string;
  content?: string;
  sceneMetadata?: SceneMeta[];
  params?: { theme?: string; language?: string; lesson?: string };
}

/* ────────────────────────────────────────────────────────────────
   Page shell
──────────────────────────────────────────────────────────────── */
export default function StoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { isAuthenticated } = useConvexAuth();

  const story = useQuery(api.stories.get, isAuthenticated ? { storyId: id as Id<"stories"> } : "skip");
  const imageUrls = useQuery(api.stories.getSceneImageUrls, isAuthenticated && story ? { storyId: id as Id<"stories"> } : "skip");
  const narrationUrl = useQuery(api.stories.getNarrationFileUrl, isAuthenticated && story ? { storyId: id as Id<"stories"> } : "skip");

  return (
    <>
      <style>{`
        @keyframes fade-slide {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes img-fade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes float-star {
          0%,100% { transform: translateY(0px) rotate(0deg); opacity: 0.55; }
          50%      { transform: translateY(-14px) rotate(20deg); opacity: 0.9; }
        }
        @keyframes twinkle {
          0%,100% { opacity: 0.2; transform: scale(0.8); }
          50%      { opacity: 0.9; transform: scale(1.2); }
        }
        @keyframes drift {
          0%   { transform: translateX(0) translateY(0) rotate(0deg); }
          33%  { transform: translateX(12px) translateY(-8px) rotate(15deg); }
          66%  { transform: translateX(-8px) translateY(-14px) rotate(-10deg); }
          100% { transform: translateX(0) translateY(0) rotate(0deg); }
        }
        .scene-img { animation: img-fade 0.4s ease; }
        .scene-text-card { animation: fade-slide 0.35s ease; }
        .float-star { animation: float-star ease-in-out infinite; }
        .twinkle { animation: twinkle ease-in-out infinite; }
        .drift { animation: drift ease-in-out infinite; }
      `}</style>

      <AuthLoading>
        <LoadingScreen />
      </AuthLoading>
      <Unauthenticated>
        <div className="min-h-screen flex items-center justify-center" style={{ background: "#131020" }}>
          <Link href="/sign-in" className="btn-primary">Sign in</Link>
        </div>
      </Unauthenticated>
      <Authenticated>
        <StoryViewer
          story={story as StoryShape | null | undefined}
          imageUrls={imageUrls as Array<{ url?: string | null }> | null | undefined}
          narrationUrl={(narrationUrl as { url?: string | null } | null)?.url ?? null}
        />
      </Authenticated>
    </>
  );
}

/* ────────────────────────────────────────────────────────────────
   Story viewer
──────────────────────────────────────────────────────────────── */
function StoryViewer({
  story,
  imageUrls,
  narrationUrl,
}: {
  story: StoryShape | null | undefined;
  imageUrls: Array<{ url?: string | null }> | null | undefined;
  narrationUrl: string | null;
}) {
  /* Scene state */
  const scenes: SceneMeta[] = story?.sceneMetadata ?? [];
  const numScenes = scenes.length;
  const [currentScene, setCurrentSceneRaw] = useState(0);

  /* Audio state */
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [seeking, setSeeking] = useState(false);
  const manualNavRef = useRef(false); // suppress auto-advance briefly after manual nav

  /* Seek audio to scene's start position */
  const seekToScene = useCallback(
    (idx: number) => {
      if (!audioRef.current || !duration || numScenes === 0) return;
      const target = (idx / numScenes) * duration;
      audioRef.current.currentTime = target;
    },
    [duration, numScenes]
  );

  const setCurrentScene = useCallback(
    (idx: number, seekAudio = true) => {
      const clamped = Math.max(0, Math.min(numScenes - 1, idx));
      setCurrentSceneRaw(clamped);
      if (seekAudio) {
        manualNavRef.current = true;
        seekToScene(clamped);
        setTimeout(() => { manualNavRef.current = false; }, 600);
      }
    },
    [numScenes, seekToScene]
  );

  /* Auto-advance scene as audio plays */
  useEffect(() => {
    if (manualNavRef.current || numScenes === 0 || !duration) return;
    const expected = Math.min(
      numScenes - 1,
      Math.floor((currentTime / duration) * numScenes)
    );
    if (expected !== currentScene) {
      setCurrentSceneRaw(expected);
    }
  }, [currentTime, duration, numScenes, currentScene]);

  /* Audio event handlers */
  const onTimeUpdate = () => {
    if (audioRef.current && !seeking) setCurrentTime(audioRef.current.currentTime);
  };
  const onLoadedMetadata = () => {
    if (audioRef.current) setDuration(audioRef.current.duration);
  };
  const onEnded = () => setIsPlaying(false);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
    else { audioRef.current.play(); setIsPlaying(true); }
  };

  const onScrubberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = Number(e.target.value);
    setCurrentTime(t);
    if (audioRef.current) audioRef.current.currentTime = t;
  };

  const onVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setVolume(v);
    if (audioRef.current) { audioRef.current.volume = v; setMuted(v === 0); }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const next = !muted;
    setMuted(next);
    audioRef.current.muted = next;
  };

  const skip = (secs: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + secs));
  };

  /* Current scene data */
  const scene = scenes[currentScene];
  const sceneImageUrl = imageUrls?.[currentScene]?.url ?? null;
  const sceneProgress = numScenes > 1 ? currentScene / (numScenes - 1) : 0;

  /* ── Loading / error states ── */
  if (story === undefined) return <LoadingScreen />;
  if (story === null) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "#131020" }}>
      <BookOpen size={48} style={{ color: "var(--lf-teal)", opacity: 0.4 }} />
      <p style={{ fontFamily: "'Nunito', sans-serif", color: "rgba(255,255,255,0.5)" }}>Story not found.</p>
      <Link href="/library" className="btn-primary">Back to library</Link>
    </div>
  );

  const isGenerating = story.status === "generating";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0e0c1a" }}>

      {/* ── Top bar ── */}
      <header
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ background: "rgba(14,12,26,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.07)", height: 60 }}
      >
        <Link
          href="/library"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-all hover:bg-white/10"
          style={{ color: "rgba(255,255,255,0.65)", fontFamily: "'Nunito', sans-serif" }}
        >
          <ArrowLeft size={15} />
          <span className="hidden sm:inline">Library</span>
        </Link>

        {/* Title + tags */}
        <div className="flex flex-col items-center gap-1 min-w-0 px-4">
          <p
            className="truncate max-w-xs text-center"
            style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "0.95rem", color: "#fff", lineHeight: 1.2 }}
          >
            {story.title ?? "Untitled Story"}
          </p>
          <div className="flex items-center gap-2">
            {story.params?.theme && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: "rgba(0,201,167,0.2)", color: "#00c9a7" }}>
                {story.params.theme}
              </span>
            )}
            {story.params?.language && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.55)" }}>
                {story.params.language === "Hindi" ? "🇮🇳" : "🇬🇧"} {story.params.language}
              </span>
            )}
          </div>
        </div>

        {/* Scene counter */}
        {numScenes > 0 && (
          <div className="flex-shrink-0 px-3 py-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.8rem", color: "rgba(255,255,255,0.55)" }}>
              {currentScene + 1} <span style={{ opacity: 0.45 }}>/</span> {numScenes}
            </span>
          </div>
        )}
      </header>

      {/* ── Floating decorations ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        {/* Glow orbs */}
        <div style={{ position: "absolute", top: "15%", left: "5%", width: 220, height: 220, background: "radial-gradient(circle,rgba(0,201,167,0.12) 0%,transparent 70%)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", bottom: "20%", right: "4%", width: 280, height: 280, background: "radial-gradient(circle,rgba(249,199,0,0.1) 0%,transparent 70%)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", top: "50%", right: "10%", width: 180, height: 180, background: "radial-gradient(circle,rgba(168,85,247,0.09) 0%,transparent 70%)", borderRadius: "50%" }} />

        {/* Floating emoji stars */}
        {[
          { e: "⭐", top: "12%", left: "3%",  delay: "0s",    dur: "3.8s", size: "1.2rem" },
          { e: "✨", top: "22%", right: "5%", delay: "0.7s",  dur: "4.2s", size: "1rem"  },
          { e: "🌟", top: "65%", left: "2%",  delay: "1.4s",  dur: "3.5s", size: "1.1rem" },
          { e: "💫", top: "40%", right: "3%", delay: "2s",    dur: "4.8s", size: "0.95rem" },
          { e: "⭐", top: "78%", left: "6%",  delay: "0.4s",  dur: "3.2s", size: "0.85rem" },
          { e: "✨", top: "10%", right: "12%", delay: "1.8s", dur: "4s",   size: "0.8rem"  },
          { e: "🌙", top: "55%", right: "2%", delay: "2.5s",  dur: "5s",   size: "1rem"    },
          { e: "💛", top: "30%", left: "1%",  delay: "1s",    dur: "4.4s", size: "0.8rem"  },
        ].map((s, i) => (
          <span
            key={i}
            className="float-star"
            style={{
              position: "absolute",
              top: s.top,
              left: (s as { left?: string }).left,
              right: (s as { right?: string }).right,
              fontSize: s.size,
              animationDuration: s.dur,
              animationDelay: s.delay,
              userSelect: "none",
            }}
          >
            {s.e}
          </span>
        ))}

        {/* Tiny twinkling dots */}
        {[
          { top: "8%",  left: "18%", delay: "0s",   dur: "1.8s" },
          { top: "35%", left: "92%", delay: "0.6s",  dur: "2.2s" },
          { top: "72%", left: "88%", delay: "1.2s",  dur: "1.6s" },
          { top: "88%", left: "25%", delay: "0.3s",  dur: "2s"   },
          { top: "18%", left: "78%", delay: "1.5s",  dur: "2.4s" },
          { top: "60%", left: "96%", delay: "0.9s",  dur: "1.9s" },
        ].map((d, i) => (
          <div
            key={i}
            className="twinkle"
            style={{
              position: "absolute",
              top: d.top,
              left: d.left,
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: "#fff",
              animationDuration: d.dur,
              animationDelay: d.delay,
            }}
          />
        ))}
      </div>

      {/* ── Main content area ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-4 gap-4 relative" style={{ maxWidth: 900, margin: "0 auto", width: "100%", zIndex: 1 }}>

        {/* Generating banner */}
        {isGenerating && (
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl w-full" style={{ background: "rgba(249,199,0,0.1)", border: "1px solid rgba(249,199,0,0.25)" }}>
            <Loader2 size={18} className="animate-spin" style={{ color: "#f9c700", flexShrink: 0 }} />
            <p style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 600, color: "#f9c700", fontSize: "0.88rem" }}>
              Your story is being generated… it'll be ready in a moment ✨
            </p>
          </div>
        )}

        {/* ── Slideshow panel ── */}
        {numScenes > 0 ? (
          <>
            {/* Image + nav buttons */}
            <div className="relative w-full rounded-3xl overflow-hidden flex-shrink-0" style={{ aspectRatio: "16/9", background: "#1a1730" }}>

              {/* Scene image */}
              {sceneImageUrl ? (
                <Image
                  key={currentScene} // re-mount triggers animation
                  src={sceneImageUrl}
                  alt={`Scene ${currentScene + 1}`}
                  fill
                  className="object-cover scene-img"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3 opacity-30">
                    <Loader2 size={32} className="animate-spin" style={{ color: "var(--lf-teal)" }} />
                    <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.85rem", color: "#fff" }}>Loading illustration…</p>
                  </div>
                </div>
              )}

              {/* Scene number badge */}
              <div
                className="absolute top-4 left-4 px-2.5 py-1 rounded-full text-xs font-bold"
                style={{ background: "rgba(0,0,0,0.5)", color: "rgba(255,255,255,0.8)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.15)" }}
              >
                Scene {currentScene + 1}
              </div>

              {/* Lalli Fafa logo watermark */}
              <div className="absolute top-4 right-4" style={{ width: 32, height: 32, opacity: 0.7 }}>
                <Image src="/lf-logo.png" alt="" fill className="object-contain" />
              </div>

              {/* Prev button */}
              {currentScene > 0 && (
                <button
                  onClick={() => setCurrentScene(currentScene - 1)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full transition-all hover:scale-110 active:scale-95"
                  style={{ width: 44, height: 44, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)", border: "1.5px solid rgba(255,255,255,0.2)", color: "#fff" }}
                  aria-label="Previous scene"
                >
                  <ChevronLeft size={22} />
                </button>
              )}

              {/* Next button */}
              {currentScene < numScenes - 1 && (
                <button
                  onClick={() => setCurrentScene(currentScene + 1)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full transition-all hover:scale-110 active:scale-95"
                  style={{ width: 44, height: 44, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)", border: "1.5px solid rgba(255,255,255,0.2)", color: "#fff" }}
                  aria-label="Next scene"
                >
                  <ChevronRight size={22} />
                </button>
              )}

              {/* Progress bar at bottom of image */}
              <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "rgba(255,255,255,0.1)" }}>
                <div
                  className="h-full transition-all duration-500"
                  style={{ width: `${((currentScene + 1) / numScenes) * 100}%`, background: "linear-gradient(90deg,var(--lf-teal),#00a38d)" }}
                />
              </div>
            </div>

            {/* Scene text */}
            {scene && (
              <div
                key={currentScene}
                className="scene-text-card w-full px-6 py-5 rounded-2xl relative overflow-hidden"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(12px)" }}
              >
                {/* Subtle teal glow top-left */}
                <div className="absolute pointer-events-none" style={{ top: -30, left: -30, width: 120, height: 120, background: "radial-gradient(circle,rgba(0,201,167,0.15) 0%,transparent 70%)" }} />
                {/* Subtle gold glow bottom-right */}
                <div className="absolute pointer-events-none" style={{ bottom: -30, right: -30, width: 100, height: 100, background: "radial-gradient(circle,rgba(249,199,0,0.12) 0%,transparent 70%)" }} />

                <div className="relative flex items-start gap-3">
                  <span className="text-lg flex-shrink-0 mt-0.5" style={{ opacity: 0.7 }}>📖</span>
                  <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "1rem", lineHeight: 1.85, color: "rgba(255,255,255,0.88)" }}>
                    {scene.text}
                  </p>
                </div>
              </div>
            )}

            {/* Scene dots */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {scenes.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentScene(i)}
                  className="transition-all hover:scale-125"
                  aria-label={`Go to scene ${i + 1}`}
                  style={{
                    width: i === currentScene ? 24 : 8,
                    height: 8,
                    borderRadius: 99,
                    background: i === currentScene
                      ? "var(--lf-teal)"
                      : i < currentScene
                      ? "rgba(0,201,167,0.4)"
                      : "rgba(255,255,255,0.2)",
                    transition: "all 0.3s ease",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                  }}
                />
              ))}
            </div>
          </>
        ) : story.content ? (
          /* Fallback plain text */
          <div className="w-full max-w-2xl px-6 py-8 rounded-3xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            {story.content.split("\n").filter(Boolean).map((para, i) => (
              <p key={i} style={{ fontFamily: "'Nunito', sans-serif", fontSize: "1rem", lineHeight: 1.85, color: "rgba(255,255,255,0.8)", marginBottom: "1rem" }}>
                {para}
              </p>
            ))}
          </div>
        ) : isGenerating ? null : (
          <div className="flex flex-col items-center gap-4 py-12 opacity-50">
            <BookOpen size={40} style={{ color: "#fff" }} />
            <p style={{ fontFamily: "'Nunito', sans-serif", color: "#fff" }}>Story content not available yet.</p>
          </div>
        )}
      </div>

      {/* ── Audio player bar ── */}
      {narrationUrl && (
        <div
          className="flex-shrink-0 px-5 py-4"
          style={{ background: "rgba(14,12,26,0.97)", borderTop: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(16px)" }}
        >
          <audio
            ref={audioRef}
            src={narrationUrl}
            onTimeUpdate={onTimeUpdate}
            onLoadedMetadata={onLoadedMetadata}
            onEnded={onEnded}
            preload="metadata"
          />

          <div className="max-w-3xl mx-auto flex flex-col gap-3">
            {/* Scrubber */}
            <div className="flex items-center gap-3">
              <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.75rem", fontWeight: 600, color: "rgba(255,255,255,0.45)", minWidth: 36, textAlign: "right" }}>
                {formatTime(currentTime)}
              </span>
              <div className="flex-1 relative h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.12)" }}>
                {/* Buffered / played track */}
                <div
                  className="absolute left-0 top-0 h-full rounded-full transition-all"
                  style={{ width: duration ? `${(currentTime / duration) * 100}%` : "0%", background: "linear-gradient(90deg,var(--lf-teal),#00a38d)" }}
                />
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  step={0.1}
                  value={currentTime}
                  onChange={onScrubberChange}
                  onMouseDown={() => setSeeking(true)}
                  onMouseUp={() => setSeeking(false)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  style={{ margin: 0 }}
                />
              </div>
              <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.75rem", fontWeight: 600, color: "rgba(255,255,255,0.45)", minWidth: 36 }}>
                {formatTime(duration)}
              </span>
            </div>

            {/* Controls row */}
            <div className="flex items-center justify-between gap-4">
              {/* Left: volume */}
              <div className="flex items-center gap-2 flex-1">
                <button onClick={toggleMute} className="flex-shrink-0 transition-all hover:scale-110" style={{ color: "rgba(255,255,255,0.55)" }}>
                  {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <div className="relative w-20 h-1.5 rounded-full overflow-hidden hidden sm:block" style={{ background: "rgba(255,255,255,0.12)" }}>
                  <div className="absolute left-0 top-0 h-full rounded-full" style={{ width: `${muted ? 0 : volume * 100}%`, background: "rgba(255,255,255,0.5)" }} />
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={muted ? 0 : volume}
                    onChange={onVolumeChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>

              {/* Centre: playback controls */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => skip(-10)}
                  className="flex items-center justify-center transition-all hover:scale-110"
                  style={{ color: "rgba(255,255,255,0.55)", width: 36, height: 36 }}
                  title="Back 10s"
                >
                  <SkipBack size={18} />
                </button>

                {/* Prev scene */}
                <button
                  onClick={() => setCurrentScene(currentScene - 1)}
                  disabled={currentScene === 0}
                  className="flex items-center justify-center rounded-full transition-all hover:scale-110 disabled:opacity-25"
                  style={{ color: "rgba(255,255,255,0.7)", width: 36, height: 36 }}
                  title="Previous scene"
                >
                  <ChevronLeft size={20} />
                </button>

                {/* Play / Pause */}
                <button
                  onClick={togglePlay}
                  className="flex items-center justify-center rounded-full transition-all hover:scale-110 active:scale-95"
                  style={{ width: 52, height: 52, background: "linear-gradient(135deg,var(--lf-teal),#00a38d)", color: "#fff", boxShadow: "0 4px 20px rgba(0,201,167,0.45)", flexShrink: 0 }}
                >
                  {isPlaying ? <Pause size={22} fill="#fff" /> : <Play size={22} fill="#fff" style={{ marginLeft: 2 }} />}
                </button>

                {/* Next scene */}
                <button
                  onClick={() => setCurrentScene(currentScene + 1)}
                  disabled={currentScene === numScenes - 1}
                  className="flex items-center justify-center rounded-full transition-all hover:scale-110 disabled:opacity-25"
                  style={{ color: "rgba(255,255,255,0.7)", width: 36, height: 36 }}
                  title="Next scene"
                >
                  <ChevronRight size={20} />
                </button>

                <button
                  onClick={() => skip(10)}
                  className="flex items-center justify-center transition-all hover:scale-110"
                  style={{ color: "rgba(255,255,255,0.55)", width: 36, height: 36 }}
                  title="Forward 10s"
                >
                  <SkipForward size={18} />
                </button>
              </div>

              {/* Right: library link */}
              <div className="flex items-center gap-3 justify-end flex-1">
                <Link
                  href="/library"
                  className="hidden sm:flex items-center gap-1.5 text-xs font-bold transition-all hover:opacity-80"
                  style={{ color: "rgba(255,255,255,0.35)", fontFamily: "'Nunito', sans-serif" }}
                >
                  <Library size={13} /> Library
                </Link>
                <Link
                  href="/dashboard"
                  className="hidden sm:flex items-center gap-1.5 text-xs font-bold transition-all hover:opacity-80"
                  style={{ color: "rgba(0,201,167,0.7)", fontFamily: "'Nunito', sans-serif" }}
                >
                  <Sparkles size={13} /> New story
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* If no narration: just a nav footer */}
      {!narrationUrl && (
        <div
          className="flex-shrink-0 flex items-center justify-between px-6 py-4"
          style={{ background: "rgba(14,12,26,0.97)", borderTop: "1px solid rgba(255,255,255,0.07)" }}
        >
          <Link href="/library" className="flex items-center gap-2 text-sm font-semibold" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'Nunito', sans-serif" }}>
            <ArrowLeft size={14} /> Back to library
          </Link>
          <Link href="/dashboard" className="flex items-center gap-2 text-sm font-bold" style={{ color: "var(--lf-teal)", fontFamily: "'Nunito', sans-serif" }}>
            <Sparkles size={14} /> Create new story
          </Link>
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   Loading screen
──────────────────────────────────────────────────────────────── */
function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5" style={{ background: "#0e0c1a" }}>
      <div className="relative" style={{ width: 64, height: 64 }}>
        <Image src="/lf-logo.png" alt="Lalli Fafa" fill className="object-contain animate-bounce" />
      </div>
      <div className="w-10 h-10 rounded-full border-3 border-t-transparent animate-spin" style={{ borderColor: "var(--lf-teal)", borderTopColor: "transparent", borderWidth: 3 }} />
      <p style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, color: "rgba(255,255,255,0.4)", fontSize: "0.9rem" }}>
        Opening your story…
      </p>
    </div>
  );
}
