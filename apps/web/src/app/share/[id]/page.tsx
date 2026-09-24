"use client";

import { use, useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "convex/react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { Sparkles, BookOpen, Loader2, Play, Pause, ChevronLeft, ChevronRight, Trophy, PartyPopper } from "lucide-react";

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

/* ── Main share view (public, no auth needed) ── */
function ShareView({ storyId }: { storyId: string }) {
  const story = useQuery(api.stories.getLightMetadata, { storyId: storyId as Id<"stories"> });
  const imageUrls = useQuery(api.stories.getSceneImageUrls, story ? { storyId: storyId as Id<"stories"> } : "skip");

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const waText = encodeURIComponent(`✨ Look at this personalised Lalli & Fafa story! ${shareUrl}`);
  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
  const waUrl = `https://wa.me/?text=${waText}`;
  const copyLink = () => { navigator.clipboard.writeText(shareUrl).catch(() => {}); };

  if (story === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0e0c1a" }}>
        <Loader2 size={32} className="animate-spin" style={{ color: "var(--lf-teal)" }} />
      </div>
    );
  }

  if (story === null || story.sceneMetadata?.length === 0) {
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
    <div className="min-h-dvh flex flex-col" style={{ background: "linear-gradient(160deg,#0e0c1a 0%,#0d2d26 100%)" }}>
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

      <main className="flex-1 flex flex-col items-center px-4 py-6 gap-5" style={{ maxWidth: 560, margin: "0 auto", width: "100%" }}>
        <PublicPlayer storyId={storyId} story={story} imageUrls={imageUrls} />

        <div className="w-full flex flex-col gap-3">
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.75rem", fontWeight: 700, color: "rgba(255,255,255,0.3)", textAlign: "center", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Share this story
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <a href={waUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all hover:scale-105 hover:brightness-110" style={{ background: "#25D366", color: "#fff", fontFamily: "'Nunito', sans-serif" }}>
              <WhatsAppIcon /> WhatsApp
            </a>
            <a href={fbUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all hover:scale-105 hover:brightness-110" style={{ background: "#1877F2", color: "#fff", fontFamily: "'Nunito', sans-serif" }}>
              <FacebookIcon /> Facebook
            </a>
            <button onClick={copyLink} className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all hover:scale-105" style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.15)", fontFamily: "'Nunito', sans-serif" }}>
              🔗 Copy link
            </button>
          </div>
        </div>
      </main>

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

/* ── Full playback player, purpose-built for the public share page ──
   Not a reuse of the full authenticated reader (StoryViewer): that component
   carries subscription checks, sting sound effects, dark/light mode, and
   auth-gated Challenge routing that don't apply to an anonymous visitor.
   This is a smaller, self-contained player: real scene-image + narration
   playback (via the same, now Range-capable, /api/audio/[id] proxy), scenes
   advancing on the STORY'S REAL measured sceneStartSeconds (not a character-
   count estimate), ending in a sign-up hook and — if the story has a
   Challenge — the same real questions, answerable for fun with client-side-
   only scoring that never touches the real owner's record. */
function PublicPlayer({
  storyId,
  story,
  imageUrls,
}: {
  storyId: string;
  story: { title?: string; sceneMetadata?: Array<{ sceneNumber: number; description?: string }>; sceneStartSeconds?: Record<string, number> };
  imageUrls: Array<{ sceneNumber: number; url?: string | null }> | null | undefined;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [ended, setEnded] = useState(false);

  const scenes = story.sceneMetadata ?? [];
  const numScenes = scenes.length;
  const startSecs = story.sceneStartSeconds ?? {};

  // Derive the current scene straight from playback time against the
  // story's real, measured per-scene start times.
  const currentScene = useMemo(() => {
    let idx = 0;
    for (let i = 0; i < numScenes; i++) {
      const s = startSecs[String(i + 1)];
      if (s !== undefined && currentTime >= s) idx = i;
    }
    return idx;
  }, [currentTime, numScenes, startSecs]);

  const sceneUrl = imageUrls?.find((u) => u.sceneNumber === currentScene + 1)?.url ?? imageUrls?.[currentScene]?.url;

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) { audio.pause(); setIsPlaying(false); }
    else { audio.play().catch(() => {}); setIsPlaying(true); }
  };
  const skipToScene = (idx: number) => {
    const clamped = Math.max(0, Math.min(numScenes - 1, idx));
    const t = startSecs[String(clamped + 1)];
    if (t !== undefined && audioRef.current) audioRef.current.currentTime = t;
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="w-full rounded-3xl overflow-hidden shadow-2xl relative" style={{ aspectRatio: "4/3", background: "#1a1730" }}>
        {sceneUrl ? (
          <Image key={sceneUrl} src={sceneUrl} alt={story.title ?? "Story scene"} fill className="object-cover" priority />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 size={28} className="animate-spin" style={{ color: "var(--lf-teal)" }} />
          </div>
        )}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 40%)" }} />
        <div className="absolute bottom-4 left-4 right-4">
          <p style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "clamp(1rem,3.5vw,1.3rem)", color: "#fff", textShadow: "0 2px 12px rgba(0,0,0,0.8)", lineHeight: 1.2 }}>
            {story.title}
          </p>
        </div>
        <div className="absolute top-4 left-4 px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: "rgba(0,0,0,0.5)", color: "rgba(255,255,255,0.85)" }}>
          Scene {currentScene + 1} of {numScenes}
        </div>
        <div className="absolute top-4 right-4 opacity-70" style={{ width: 26, height: 26 }}>
          <Image src="/lf-logo.png" alt="" fill className="object-contain" />
        </div>
      </div>

      <audio
        ref={audioRef}
        src={`/api/audio/${storyId}`}
        preload="auto"
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => { setIsPlaying(false); setEnded(true); }}
      />

      {/* Controls */}
      <div className="flex items-center gap-3 px-1">
        <button onClick={() => skipToScene(currentScene - 1)} disabled={currentScene === 0} className="disabled:opacity-25" style={{ color: "rgba(255,255,255,0.7)" }} aria-label="Previous scene">
          <ChevronLeft size={22} />
        </button>
        <button
          onClick={togglePlay}
          className="flex items-center justify-center rounded-full transition-all hover:scale-105"
          style={{ width: 48, height: 48, background: "linear-gradient(135deg,#f9c700,#ffab00)", color: "#1a1a2e", flexShrink: 0 }}
        >
          {isPlaying ? <Pause size={20} fill="#1a1a2e" /> : <Play size={20} fill="#1a1a2e" style={{ marginLeft: 2 }} />}
        </button>
        <button onClick={() => skipToScene(currentScene + 1)} disabled={currentScene === numScenes - 1} className="disabled:opacity-25" style={{ color: "rgba(255,255,255,0.7)" }} aria-label="Next scene">
          <ChevronRight size={22} />
        </button>
        <div className="flex-1 h-1 rounded-full relative" style={{ background: "rgba(255,255,255,0.15)" }}>
          <div className="absolute left-0 top-0 h-full rounded-full" style={{ width: duration ? `${Math.min(100, (currentTime / duration) * 100)}%` : "0%", background: "var(--lf-teal)" }} />
        </div>
      </div>

      {ended && <ShareEndScreen storyId={storyId} />}
    </div>
  );
}

/* ── End-of-story: sign-up hook, plus the real Challenge (if this story has
   one) answerable for fun with purely client-side scoring. ── */
function ShareEndScreen({ storyId }: { storyId: string }) {
  const challenge = useQuery(api["testserver/challenge"].getChallengeForShare, { storyId: storyId as Id<"stories"> });
  const [qIdx, setQIdx] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [quizDone, setQuizDone] = useState(false);

  const questions = challenge?.questions ?? [];
  const q = questions[qIdx];

  function answer(optionId: string) {
    if (revealed || !q) return;
    setSelected(optionId);
    setRevealed(true);
    if (q.correctOptionIds?.includes(optionId)) setCorrectCount((c) => c + 1);
  }
  function next() {
    setSelected(null);
    setRevealed(false);
    if (qIdx + 1 >= questions.length) setQuizDone(true);
    else setQIdx((i) => i + 1);
  }

  return (
    <div className="w-full flex flex-col items-center gap-5 py-4 px-1" style={{ animation: "fadeIn 0.4s ease" }}>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>

      <div className="flex flex-col items-center gap-2 text-center">
        <PartyPopper size={32} style={{ color: "var(--lf-sunshine)" }} />
        <p style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.3rem", color: "#fff" }}>
          The End!
        </p>
      </div>

      {/* Mini Challenge — same real questions, just-for-fun scoring only */}
      {challenge && questions.length > 0 && !quizDone && q && (
        <div className="w-full rounded-3xl p-5 flex flex-col gap-4" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
          <div className="flex items-center gap-2">
            <Trophy size={16} style={{ color: "var(--lf-sunshine)" }} />
            <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: "0.72rem", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Story Challenge · {qIdx + 1} of {questions.length}
            </span>
          </div>
          <p style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, fontSize: "1.05rem", color: "#fff" }}>
            {q.promptText ?? q.question}
          </p>
          <div className="flex flex-col gap-2">
            {(q.richOptions ?? []).map((opt: { id: string; text: string }) => {
              const isCorrect = q.correctOptionIds?.includes(opt.id);
              const isSelected = selected === opt.id;
              let bg = "rgba(255,255,255,0.08)";
              let border = "1px solid rgba(255,255,255,0.15)";
              if (revealed && isCorrect) { bg = "rgba(0,201,167,0.18)"; border = "1px solid rgba(0,201,167,0.5)"; }
              else if (revealed && isSelected && !isCorrect) { bg = "rgba(220,38,38,0.15)"; border = "1px solid rgba(220,38,38,0.4)"; }
              return (
                <button
                  key={opt.id}
                  onClick={() => answer(opt.id)}
                  disabled={revealed}
                  className="text-left px-4 py-3 rounded-2xl transition-all"
                  style={{ background: bg, border, color: "#fff", fontFamily: "'Nunito', sans-serif", fontWeight: 600, fontSize: "0.9rem", cursor: revealed ? "default" : "pointer" }}
                >
                  {opt.text}
                </button>
              );
            })}
          </div>
          {revealed && (
            <>
              {q.revealFraming && (
                <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.82rem", color: "rgba(255,255,255,0.55)", fontStyle: "italic", margin: 0 }}>
                  {q.revealFraming}
                </p>
              )}
              <button onClick={next} className="btn-primary" style={{ justifyContent: "center" }}>
                {qIdx + 1 >= questions.length ? "See my score" : "Next question"}
              </button>
            </>
          )}
        </div>
      )}

      {challenge && quizDone && (
        <div className="w-full rounded-3xl p-6 flex flex-col items-center gap-2 text-center" style={{ background: "rgba(249,199,0,0.12)", border: "1px solid rgba(249,199,0,0.3)" }}>
          <span style={{ fontSize: "2rem" }}>⭐</span>
          <p style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.4rem", color: "#fff" }}>
            {correctCount} / {questions.length}
          </p>
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.85rem", color: "rgba(255,255,255,0.6)" }}>
            Nice work! Want a Story Challenge like this made just for your own child?
          </p>
        </div>
      )}

      {/* Sign-up hook */}
      <div className="w-full flex flex-col items-center gap-3 mt-1">
        <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.9rem", color: "rgba(255,255,255,0.6)", textAlign: "center" }}>
          Loved this story? Create one starring your own child in under 2 minutes.
        </p>
        <Link
          href="/sign-up"
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-base transition-all hover:scale-105"
          style={{ background: "linear-gradient(135deg,var(--lf-teal),#00a38d)", color: "#fff", fontFamily: "'Baloo 2', sans-serif", boxShadow: "0 4px 24px rgba(0,201,167,0.4)" }}
        >
          <Sparkles size={18} /> Start free — no card needed
        </Link>
        <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.78rem", color: "rgba(255,255,255,0.3)" }}>
          200 free credits · ~2 stories · no card needed
        </p>
      </div>
    </div>
  );
}
