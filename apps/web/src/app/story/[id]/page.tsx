"use client";

import { use, useRef, useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import Lottie from "lottie-react";
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
  FlaskConical,
  X,
  Copy,
  Check,
  Share2,
} from "lucide-react";

/* ────────────────────────────────────────────────────────────────
   Helpers
──────────────────────────────────────────────────────────────── */

/**
 * Mulberry32 — tiny seeded PRNG.
 * Returns a function that produces deterministic floats in [0,1).
 * Using a seed derived from the scene index means the same story always
 * gets the same animation / particle layout — no jitter on re-render.
 */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Six CSS animation classes — one is assigned deterministically per scene */
const SCENE_ANIM_POOL = [
  "scene-anim-kenburns",
  "scene-anim-bob",
  "scene-anim-wiggle",
  "scene-anim-pulse",
  "scene-anim-stomp",
  "scene-anim-zoom-breathe",
] as const;

const PARTICLE_EMOJIS = ["✨", "⭐", "💫", "🌟", "✦", "·", "❋"];

/**
 * Lottie overlay files in /public/lottie/ — cycled per scene.
 * Fetched dynamically so they don't bloat the JS bundle.
 * sparkle  → magical/general   (~201 KB)
 * fireflies → outdoor/nature   (~104 KB)
 * stars     → calm/night scenes (~3 KB)
 */
const LOTTIE_OVERLAYS = [
  "/lottie/sparkle.json",
  "/lottie/fireflies.json",
  "/lottie/stars.json",
];

interface SceneParticle {
  id: number;
  emoji: string;
  left: string;
  bottom: string;
  size: string;
  delay: string;
  duration: string;
}

/** Generate a stable set of floating particles for a given scene */
function buildParticles(sceneIndex: number, count = 12): SceneParticle[] {
  const rng = mulberry32(sceneIndex * 997 + 11);
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    emoji: PARTICLE_EMOJIS[Math.floor(rng() * PARTICLE_EMOJIS.length)],
    left: `${6 + rng() * 88}%`,
    bottom: `${12 + rng() * 55}%`,
    size: `${0.6 + rng() * 0.55}rem`,
    delay: `${(rng() * 6).toFixed(2)}s`,
    duration: `${(2.8 + rng() * 3.2).toFixed(2)}s`,
  }));
}

function formatTime(s: number) {
  if (!isFinite(s) || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

/* Split a scene's text into individual sentences */
function splitSentences(text: string | null | undefined): string[] {
  if (!text || typeof text !== "string") return [];
  const raw = text.match(/[^.!?…]+[.!?…]+(?:\s|$)|[^.!?…]+$/g) ?? [text];
  return raw.map((s) => s.trim()).filter(Boolean);
}

/* Divide story.content into per-scene chunks by splitting paragraphs equally */
function getSceneTextChunk(content: string, sceneIndex: number, numScenes: number): string {
  if (!content || numScenes === 0) return "";
  const paras = content.split("\n").map(l => l.trim()).filter(Boolean);
  if (paras.length === 0) return "";
  const chunkSize = Math.ceil(paras.length / numScenes);
  const start = sceneIndex * chunkSize;
  return paras.slice(start, start + chunkSize).join("\n").trim();
}

/* ── Comic narration helpers ── */
type NarrationLine = { speaker: "Narrator" | "Lalli" | "Fafa" | "Child"; text: string };

const SPEAKER_STYLES: Record<string, { color: string; bg: string; border: string; emoji: string }> = {
  Lalli:    { color: "#FFD700", bg: "rgba(255,215,0,0.1)",    border: "rgba(255,215,0,0.45)",    emoji: "✨" },
  Fafa:     { color: "#00C9A7", bg: "rgba(0,201,167,0.1)",    border: "rgba(0,201,167,0.45)",    emoji: "🐰" },
  Child:    { color: "#FF9F43", bg: "rgba(255,159,67,0.1)",   border: "rgba(255,159,67,0.45)",   emoji: "⭐" },
  Narrator: { color: "rgba(255,255,255,0.82)", bg: "transparent", border: "transparent",         emoji: ""  },
};

function parseNarrationLines(text: string, childName: string): NarrationLine[] {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const childLabel = childName.trim().toLowerCase();
  return lines.map(line => {
    const lower = line.toLowerCase();
    if (lower.startsWith("lalli:")) return { speaker: "Lalli" as const, text: line.slice(6).trim() };
    if (lower.startsWith("fafa:"))  return { speaker: "Fafa"  as const, text: line.slice(5).trim() };
    if (lower.startsWith("child:") || lower.startsWith("girl child:") || lower.startsWith("boy child:"))
      return { speaker: "Child" as const, text: line.replace(/^(child|girl child|boy child):\s*/i, "") };
    if (childLabel && lower.startsWith(childLabel + ":"))
      return { speaker: "Child" as const, text: line.slice(childLabel.length + 1).trim() };
    return { speaker: "Narrator" as const, text: line };
  });
}

function ComicNarration({ text, childName }: { text: string; childName: string }) {
  const lines = parseNarrationLines(text, childName);
  return (
    <div className="flex flex-col gap-3">
      {lines.map((line, i) => {
        const style = SPEAKER_STYLES[line.speaker];
        const isDialogue = line.speaker !== "Narrator";
        return (
          <div key={i} className="flex flex-col gap-1">
            {/* Speaker badge for dialogue lines */}
            {isDialogue && (
              <span
                className="self-start px-2.5 py-0.5 rounded-full text-xs font-black tracking-wide"
                style={{
                  background: style.bg,
                  color: style.color,
                  border: `1px solid ${style.border}`,
                  fontFamily: "'Baloo 2', sans-serif",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  fontSize: "0.7rem",
                }}
              >
                {style.emoji} {line.speaker === "Child" ? childName : line.speaker}
              </span>
            )}
            {/* Line text */}
            <div
              style={{
                borderLeft: isDialogue ? `3.5px solid ${style.color}` : "none",
                paddingLeft: isDialogue ? "0.85rem" : "0",
                background: isDialogue ? style.bg : "transparent",
                borderRadius: isDialogue ? "0 10px 10px 0" : 0,
                padding: isDialogue ? "0.5rem 0.85rem" : "0",
              }}
            >
              <p
                style={{
                  fontFamily: isDialogue ? "'Baloo 2', sans-serif" : "'Nunito', sans-serif",
                  fontSize: isDialogue ? "1.08rem" : "1rem",
                  fontWeight: isDialogue ? 700 : 500,
                  fontStyle: line.speaker === "Narrator" ? "italic" : "normal",
                  lineHeight: 1.7,
                  color: style.color,
                  letterSpacing: isDialogue ? "0.01em" : "normal",
                  margin: 0,
                }}
              >
                {isDialogue ? `"${line.text.replace(/^[""]|[""]$/g, '')}"` : line.text}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* Detect a character name to show as the subtitle speaker */
const CHARACTERS: { name: string; color: string }[] = [
  { name: "Lalli", color: "#f9c700" },
  { name: "Fafa",  color: "#00c9a7" },
];

function detectSpeaker(sentence: string): { name: string; color: string } | null {
  // Match patterns like: Lalli said, "…" / "…" said Lalli / Lalli: / Lalli smiled and said
  for (const char of CHARACTERS) {
    const pattern = new RegExp(`\\b${char.name}\\b`, "i");
    if (pattern.test(sentence)) return char;
  }
  return null;
}

/**
 * Build per-scene character weights from story content.
 * Returns an array of { startFrac, endFrac } for each scene (0..1 fractions
 * of the content audio, weighted by character count).
 *
 * Why chars? TTS speaking time is roughly proportional to character count, so
 * a scene with twice as many characters takes twice as long to narrate.
 */
function buildSceneTimeline(
  content: string,
  numScenes: number
): Array<{ startFrac: number; endFrac: number }> {
  if (!content || numScenes === 0) return [];
  const paras = content.split("\n").map(l => l.trim()).filter(Boolean);
  const chunkSize = Math.ceil(paras.length / numScenes);
  const charCounts = Array.from({ length: numScenes }, (_, i) => {
    const chunk = paras.slice(i * chunkSize, (i + 1) * chunkSize);
    return Math.max(1, chunk.join("").length);
  });
  const total = charCounts.reduce((a, b) => a + b, 0);
  const timeline: Array<{ startFrac: number; endFrac: number }> = [];
  let cumulative = 0;
  for (let i = 0; i < numScenes; i++) {
    const startFrac = cumulative / total;
    cumulative += charCounts[i];
    timeline.push({ startFrac, endFrac: cumulative / total });
  }
  return timeline;
}

/**
 * Given currentTime, return which subtitle sentence to show.
 *
 * Audio structure: [title] [scene-0 content] [scene-1 content] … [scene-N content]
 *
 * Both scene boundaries and sentence boundaries are weighted by character count
 * so that longer text gets proportionally more screen time — matching TTS pacing.
 */
function getCurrentSubtitle(
  currentTime: number,
  duration: number,
  sceneIndex: number,
  sentences: string[],
  titleOffset: number,
  sceneTimeline: Array<{ startFrac: number; endFrac: number }>
): string {
  if (!duration || sentences.length === 0) return "";
  if (currentTime < titleOffset) return "";

  const contentDuration = Math.max(1, duration - titleOffset);
  const contentProgress = (currentTime - titleOffset) / contentDuration; // 0..1

  const slot = sceneTimeline[sceneIndex];
  if (!slot) return "";

  // Are we actually in this scene's time window?
  if (contentProgress < slot.startFrac || contentProgress >= slot.endFrac) return "";

  const sceneDuration = slot.endFrac - slot.startFrac;
  if (sceneDuration <= 0) return sentences[0] ?? "";

  // Progress within this scene (0..1)
  const progressInScene = (contentProgress - slot.startFrac) / sceneDuration;

  // Weight sentences by character count — long sentences get more screen time
  const charCounts = sentences.map(s => Math.max(1, s.length));
  const totalChars = charCounts.reduce((a, b) => a + b, 0);
  let cumulative = 0;
  for (let i = 0; i < sentences.length; i++) {
    cumulative += charCounts[i];
    if (progressInScene < cumulative / totalChars) return sentences[i] ?? "";
  }
  return sentences[sentences.length - 1] ?? "";
}

/* ────────────────────────────────────────────────────────────────
   Types
──────────────────────────────────────────────────────────────── */
interface SceneMeta {
  sceneNumber: number;
  description?: string | null; // image generation description (from DB)
  text?: string | null;        // legacy — not stored in DB, kept for type safety
  imagePrompt?: string;
}
interface StoryShape {
  title?: string;
  status?: string;
  content?: string;            // full narrative text (all scenes combined)
  sceneMetadata?: SceneMeta[];
  params?: { theme?: string; language?: string; lesson?: string; childName?: string };
}

/* ────────────────────────────────────────────────────────────────
   Lottie overlay hook
   Fetches the JSON for the current scene's overlay asynchronously.
   Falls back to null so the image still renders if fetch fails.
──────────────────────────────────────────────────────────────── */
function useLottieOverlay(sceneIndex: number) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<Record<string, any> | null>(null);
  const path = LOTTIE_OVERLAYS[sceneIndex % LOTTIE_OVERLAYS.length];

  useEffect(() => {
    let cancelled = false;
    setData(null); // clear previous scene overlay immediately
    fetch(path)
      .then(r => r.json())
      .then(json => { if (!cancelled) setData(json); })
      .catch(() => { /* silently skip if file missing */ });
    return () => { cancelled = true; };
  }, [path]);

  return data;
}

/* ────────────────────────────────────────────────────────────────
   Background music
──────────────────────────────────────────────────────────────── */

// Place these MP3 files in /public/music/ (royalty-free ambient tracks)
// Suggested source: https://pixabay.com/music/ — search "children ambient soft"
const BG_TRACKS = [
  "/music/bg-1.mp3",
  "/music/bg-2.mp3",
  "/music/bg-3.mp3",
  "/music/bg-4.mp3",
  "/music/bg-5.mp3",
];
const BG_VOLUME = 0.18; // subtle — narration stays the hero

/** Smoothly ramp an audio element's volume to `target` over `ms` milliseconds */
function fadeVolume(audio: HTMLAudioElement, target: number, ms: number) {
  const start = audio.volume;
  const diff = target - start;
  const steps = 30;
  const dt = ms / steps;
  let i = 0;
  const id = setInterval(() => {
    i++;
    audio.volume = Math.max(0, Math.min(1, start + diff * (i / steps)));
    if (i >= steps) clearInterval(id);
  }, dt);
  return () => clearInterval(id);
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
  const [debugOpen, setDebugOpen] = useState(false);

  /* Audio state */
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [seeking, setSeeking] = useState(false);
  const [subtitleOffset, setSubtitleOffset] = useState(0); // seconds; + = show subtitles sooner
  const [showTextPanel, setShowTextPanel] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const manualNavRef = useRef(false); // suppress auto-advance briefly after manual nav
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  /* Refs that always hold the latest titleOffset / sceneTimeline so event handlers stay fresh */
  const titleOffsetRef = useRef(0);
  const sceneTimelineRef = useRef<Array<{ startFrac: number; endFrac: number }>>([]);

  /* Background music — always on, fades with narration */
  const bgAudioRef = useRef<HTMLAudioElement>(null);
  const [bgTrackIdx, setBgTrackIdx] = useState(0);
  const [bgPlaylist] = useState<string[]>(() =>
    [...BG_TRACKS].sort(() => Math.random() - 0.5)
  );

  useEffect(() => {
    const bg = bgAudioRef.current;
    if (!bg) return;
    if (isPlaying) {
      bg.volume = 0;
      bg.play().catch(() => {});
      fadeVolume(bg, BG_VOLUME, 1400);
    } else {
      const cancel = fadeVolume(bg, 0, 900);
      const t = setTimeout(() => bg.pause(), 950);
      return () => { cancel(); clearTimeout(t); };
    }
  }, [isPlaying]);

  /* Seek audio to scene's start position using character-weighted timeline */
  const seekToScene = useCallback(
    (idx: number, titleOffset: number, sceneTimeline: Array<{ startFrac: number; endFrac: number }>) => {
      if (!audioRef.current || !duration || numScenes === 0) return;
      const contentDuration = Math.max(1, duration - titleOffset);
      const startFrac = sceneTimeline[idx]?.startFrac ?? (idx / numScenes);
      audioRef.current.currentTime = titleOffset + startFrac * contentDuration;
    },
    [duration, numScenes]
  );

  const setCurrentScene = useCallback(
    (idx: number, seekAudio = true, titleOffset = 0, sceneTimeline: Array<{ startFrac: number; endFrac: number }> = []) => {
      const clamped = Math.max(0, Math.min(numScenes - 1, idx));
      setCurrentSceneRaw(clamped);
      if (seekAudio) {
        manualNavRef.current = true;
        seekToScene(clamped, titleOffset, sceneTimeline);
        setTimeout(() => { manualNavRef.current = false; }, 600);
      }
    },
    [numScenes, seekToScene]
  );

  /* Auto-advance scene as audio plays — uses character-weighted scene timeline */
  useEffect(() => {
    if (manualNavRef.current || numScenes === 0 || !duration || !story?.content) return;
    const titleChars = (story?.title ?? "").length;
    const contentCharsFlat = (story.content ?? "").replace(/\s*\n\s*/g, "").length;
    const totalChars = titleChars + contentCharsFlat;
    const titleOff = totalChars > 0 ? (titleChars / totalChars) * duration : 0;
    const contentDur = Math.max(1, duration - titleOff);
    const contentProgress = Math.max(0, currentTime - titleOff) / contentDur; // 0..1

    const timeline = buildSceneTimeline(story.content, numScenes);
    const expected = timeline.findIndex(slot => contentProgress < slot.endFrac);
    const clamped = expected === -1 ? numScenes - 1 : Math.max(0, expected);

    if (clamped !== currentScene) {
      setCurrentSceneRaw(clamped);
    }
  }, [currentTime, duration, numScenes, currentScene, story?.title, story?.content]);

  /* Keyboard shortcuts: Space = play/pause, ← = prev scene, → = next scene */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Don't intercept when user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space") {
        e.preventDefault();
        if (!audioRef.current) return;
        if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
        else { audioRef.current.play(); setIsPlaying(true); }
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        setCurrentScene(currentScene + 1, true, titleOffsetRef.current, sceneTimelineRef.current);
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        setCurrentScene(currentScene - 1, true, titleOffsetRef.current, sceneTimelineRef.current);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isPlaying, currentScene, setCurrentScene]);

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

  /* Touch / swipe navigation */
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    // Only treat as horizontal swipe if horizontal movement dominates
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) setCurrentScene(currentScene + 1, true, titleOffset, sceneTimeline); // swipe left → next
      else         setCurrentScene(currentScene - 1, true, titleOffset, sceneTimeline); // swipe right → prev
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const next = !muted;
    setMuted(next);
    audioRef.current.muted = next;
  };

  /* Share */
  const storyUrl = typeof window !== "undefined" ? window.location.href : "";
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: story?.title ?? "A Lalli & Fafa story",
          text: `Check out this personalised story: "${story?.title}"`,
          url: storyUrl,
        });
      } catch { /* user cancelled */ }
    } else {
      setShareOpen(true);
    }
  };
  const copyLink = () => {
    navigator.clipboard.writeText(storyUrl).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    });
  };

  const skip = (secs: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + secs));
  };

  /* Current scene data */
  const scene = scenes[currentScene];
  const sceneImageUrl = imageUrls?.[currentScene]?.url ?? null;
  const sceneProgress = numScenes > 1 ? currentScene / (numScenes - 1) : 0;

  /* ── Scene motion, particles & Lottie overlay ── */
  // Deterministic so same story → same animation per scene (no layout jitter)
  const sceneAnimClass = SCENE_ANIM_POOL[currentScene % SCENE_ANIM_POOL.length];
  const sceneParticles = useMemo(() => buildParticles(currentScene), [currentScene]);
  const lottieData = useLottieOverlay(currentScene);

  /**
   * Estimate how many seconds of the narration audio are spent reading the title.
   * The audio is structured as: [title] [content lines…]
   * We use character-count proportion as a proxy for speaking time.
   */
  const titleCharsForOffset = (story?.title ?? "").length;
  const contentCharsForOffset = (story?.content ?? "").replace(/\s*\n\s*/g, "").length;
  const totalCharsForOffset = titleCharsForOffset + contentCharsForOffset;
  const titleOffset = duration > 0 && totalCharsForOffset > 0
    ? (titleCharsForOffset / totalCharsForOffset) * duration
    : 0;
  // Keep refs in sync so keyboard/click handlers always use the latest values
  titleOffsetRef.current = titleOffset;

  /* Character-weighted scene timeline — shared by subtitle sync, auto-advance, and seek */
  const sceneTimeline = story?.content
    ? buildSceneTimeline(story.content, numScenes)
    : [];
  sceneTimelineRef.current = sceneTimeline;

  /* Derive scene narrative text from story.content (divided equally across scenes) */
  const sceneNarrativeText = story?.content
    ? getSceneTextChunk(story.content, currentScene, numScenes)
    : (scene?.text ?? "");

  /* Subtitle: split scene text into sentences, pick current one by audio time */
  const sceneSentences = sceneNarrativeText ? splitSentences(sceneNarrativeText) : [];
  const adjustedTime = Math.max(0, currentTime + subtitleOffset);
  const subtitleText = getCurrentSubtitle(adjustedTime, duration, currentScene, sceneSentences, titleOffset, sceneTimeline);
  const speaker = subtitleText ? detectSpeaker(subtitleText) : null;
  /* Index of the currently highlighted sentence (for the text panel) */
  const activeSubtitleIdx = sceneSentences.indexOf(subtitleText);

  /* Strip "Lalli said" / "Fafa replied" framing so subtitle shows clean dialogue */
  const cleanSubtitle = (subtitleText || "")
    .replace(/^(Lalli|Fafa)\s+(said|replied|whispered|shouted|asked|cried|laughed|smiled and said)[,:]?\s*/i, "")
    .replace(/,?\s*(said|replied|whispered|shouted|asked|cried|laughed)\s+(Lalli|Fafa)\s*\.?$/i, "")
    .trim();

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

      {/* ── Share modal (desktop fallback) ── */}
      {shareOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
          onClick={() => setShareOpen(false)}
        >
          <div
            className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl flex flex-col gap-5 p-6"
            style={{ background: "#0e0c1a", border: "1px solid rgba(255,255,255,0.1)" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.1rem", color: "#fff" }}>
                ✨ Share this story
              </h2>
              <button onClick={() => setShareOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10" style={{ color: "rgba(255,255,255,0.5)" }}>
                <X size={16} />
              </button>
            </div>

            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.88rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
              Share <strong style={{ color: "rgba(255,255,255,0.85)" }}>"{story?.title}"</strong> with family and friends.
            </p>

            {/* Copy link row */}
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <p className="flex-1 truncate text-xs" style={{ fontFamily: "monospace", color: "rgba(255,255,255,0.45)" }}>
                {storyUrl}
              </p>
              <button
                onClick={copyLink}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs flex-shrink-0 transition-all hover:scale-105"
                style={{ background: shareCopied ? "rgba(0,201,167,0.25)" : "var(--lf-teal)", color: shareCopied ? "var(--lf-teal)" : "#fff", fontFamily: "'Nunito', sans-serif" }}
              >
                {shareCopied ? <Check size={13} /> : <Copy size={13} />}
                {shareCopied ? "Copied!" : "Copy"}
              </button>
            </div>

            {/* WhatsApp share */}
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Check out this personalised Lalli & Fafa story: "${story?.title}" ${storyUrl}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all hover:scale-105"
              style={{ background: "#25D366", color: "#fff", fontFamily: "'Nunito', sans-serif" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12.05 2.095C6.495 2.095 1.984 6.616 1.984 12.178c0 1.768.47 3.431 1.296 4.875L2.013 22l5.087-1.331a9.924 9.924 0 004.95 1.31c5.555 0 10.066-4.52 10.066-10.083 0-2.697-1.05-5.23-2.958-7.14A9.98 9.98 0 0012.05 2.095zm.003 18.365a8.244 8.244 0 01-4.22-1.156l-.302-.18-3.13.82.834-3.053-.196-.315A8.24 8.24 0 013.67 12.18c0-4.566 3.718-8.28 8.283-8.28 2.213 0 4.29.863 5.854 2.43a8.23 8.23 0 012.422 5.85c0 4.565-3.718 8.28-8.176 8.28z"/></svg>
              Share on WhatsApp
            </a>
          </div>
        </div>
      )}

      {/* ── Prompt inspector modal ── */}
      {debugOpen && (
        <PromptInspector
          scenes={scenes}
          currentScene={currentScene}
          onClose={() => setDebugOpen(false)}
        />
      )}

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

        {/* Right side: share + scene counter + debug toggle */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Share button */}
          <button
            onClick={handleShare}
            className="flex items-center justify-center w-8 h-8 rounded-full transition-all hover:bg-white/10"
            title="Share this story"
            style={{ color: "rgba(255,255,255,0.55)" }}
          >
            <Share2 size={15} />
          </button>

          {numScenes > 0 && (
            <div className="px-3 py-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.8rem", color: "rgba(255,255,255,0.55)" }}>
                {currentScene + 1} <span style={{ opacity: 0.45 }}>/</span> {numScenes}
              </span>
            </div>
          )}
          {/* Prompt inspector toggle */}
          {scenes.length > 0 && (
            <button
              onClick={() => setDebugOpen(true)}
              className="flex items-center justify-center w-8 h-8 rounded-full transition-all hover:bg-white/10"
              title="Inspect image prompts"
              style={{ color: "rgba(168,85,247,0.7)" }}
            >
              <FlaskConical size={15} />
            </button>
          )}
        </div>
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
            {/* Image + nav buttons — swipeable on touch */}
            <div
              className="story-image-panel relative w-full rounded-3xl overflow-hidden flex-shrink-0"
              style={{ aspectRatio: "4/3", background: "#1a1730" }}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >

              {/* Scene image
                  Two nested divs keep CSS animations isolated:
                  • Outer: scene-img fade-in only (opacity keyframe)
                  • Inner: motion animation only (transform keyframe)
                  Separating them prevents the `animation:` shorthand from
                  overriding each other, and lets each class own its
                  transform-origin without an inline style stomping on it. */}
              {sceneImageUrl ? (
                <div key={currentScene} className="absolute inset-0 scene-img">
                  <div className={`absolute inset-0 ${sceneAnimClass}`}>
                  <Image
                    src={sceneImageUrl}
                    alt={`Scene ${currentScene + 1}`}
                    fill
                    className="object-cover"
                    priority
                  />
                  {/* Shimmer sweep — diagonal glint that crosses the image periodically */}
                  <div className="scene-shimmer" />

                  {/* Lottie overlay — golden sparkles / fireflies / stars cycling per scene */}
                  {lottieData && (
                    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 2, opacity: 0.45 }}>
                      <Lottie animationData={lottieData} loop autoplay
                        style={{ width: "100%", height: "100%" }}
                        rendererSettings={{ preserveAspectRatio: "xMidYMid slice" }} />
                    </div>
                  )}

                  {/* Floating emoji particles — rise up from within the scene */}
                  {sceneParticles.map((p: SceneParticle) => (
                    <span
                      key={p.id}
                      className="scene-particle"
                      style={{
                        left: p.left,
                        bottom: p.bottom,
                        fontSize: p.size,
                        animationDelay: p.delay,
                        animationDuration: p.duration,
                      }}
                    >
                      {p.emoji}
                    </span>
                  ))}
                  </div>
                </div>
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
                  onClick={() => setCurrentScene(currentScene - 1, true, titleOffset, sceneTimeline)}
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
                  onClick={() => setCurrentScene(currentScene + 1, true, titleOffset, sceneTimeline)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full transition-all hover:scale-110 active:scale-95"
                  style={{ width: 44, height: 44, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)", border: "1.5px solid rgba(255,255,255,0.2)", color: "#fff" }}
                  aria-label="Next scene"
                >
                  <ChevronRight size={22} />
                </button>
              )}

              {/* Hidden audio elements */}
              {narrationUrl && (
                <audio ref={audioRef} src={narrationUrl} onTimeUpdate={onTimeUpdate} onLoadedMetadata={onLoadedMetadata} onEnded={onEnded} preload="auto" />
              )}
              <audio ref={bgAudioRef} src={bgPlaylist[bgTrackIdx]} preload="auto" onEnded={() => setBgTrackIdx(i => (i + 1) % bgPlaylist.length)} />

              {/* ── Comic subtitle overlay ── */}
              {cleanSubtitle && (
                <div
                  className="absolute left-0 right-0 bottom-0 flex flex-col items-center gap-1 px-3 pb-2"
                  style={{ background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 100%)", paddingTop: "2.5rem" }}
                >
                  {/* Speaker badge */}
                  {speaker && (
                    <span
                      className="subtitle-line px-2.5 py-0.5 rounded-full text-xs font-black tracking-widest"
                      style={{
                        background: speaker.color,
                        color: speaker.name === "Lalli" ? "#131020" : "#fff",
                        fontFamily: "'Baloo 2', sans-serif",
                        textTransform: "uppercase",
                        fontSize: "0.65rem",
                        letterSpacing: "0.08em",
                      }}
                    >
                      {speaker.name}
                    </span>
                  )}
                  {/* Subtitle text */}
                  <div
                    key={subtitleText}
                    className="subtitle-line px-4 py-1.5 rounded-xl text-center"
                    style={{
                      background: "rgba(0,0,0,0.58)",
                      backdropFilter: "blur(8px)",
                      border: speaker ? `1.5px solid ${speaker.color}60` : "1.5px solid rgba(255,255,255,0.12)",
                      maxWidth: "90%",
                    }}
                  >
                    <p className="subtitle-text" style={{
                      fontFamily: speaker ? "'Baloo 2', sans-serif" : "'Nunito', sans-serif",
                      fontWeight: speaker ? 700 : 500,
                      fontStyle: speaker ? "normal" : "italic",
                      lineHeight: 1.45,
                      color: speaker ? speaker.color : "rgba(255,255,255,0.88)",
                      textShadow: "0 1px 6px rgba(0,0,0,0.9)",
                      margin: 0,
                    }}>
                      {cleanSubtitle}
                    </p>
                  </div>
                </div>
              )}

              {/* Scene dots — bottom edge */}
              <div className="absolute bottom-1.5 left-0 right-0 flex items-center justify-center gap-1.5" style={{ pointerEvents: cleanSubtitle ? "none" : "auto", opacity: cleanSubtitle ? 0 : 1, transition: "opacity 0.3s" }}>
                {scenes.map((_, i) => (
                  <button key={i} onClick={() => setCurrentScene(i, true, titleOffset, sceneTimeline)} aria-label={`Scene ${i + 1}`}
                    style={{ width: i === currentScene ? 18 : 5, height: 5, borderRadius: 99, background: i === currentScene ? "var(--lf-teal)" : "rgba(255,255,255,0.3)", border: "none", padding: 0, cursor: "pointer", transition: "all 0.3s", flexShrink: 0 }}
                  />
                ))}
              </div>
            </div>

            {/* ── Audio controls bar (below image) ── */}
            <div
              className="w-full flex flex-col gap-2 px-4 py-3 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              {/* Seek bar */}
              <div className="flex items-center gap-3">
                <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.72rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", minWidth: 34, textAlign: "right" }}>
                  {formatTime(currentTime)}
                </span>
                <div className="flex-1 relative h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.12)" }}>
                  <div className="absolute left-0 top-0 h-full rounded-full" style={{ width: duration ? `${(currentTime / duration) * 100}%` : "0%", background: "linear-gradient(90deg,var(--lf-teal),#00a38d)" }} />
                  <input type="range" min={0} max={duration || 0} step={0.1} value={currentTime} onChange={onScrubberChange} onMouseDown={() => setSeeking(true)} onMouseUp={() => setSeeking(false)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" style={{ margin: 0 }} />
                </div>
                <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.72rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", minWidth: 34 }}>
                  {formatTime(duration)}
                </span>
              </div>

              {/* Controls row */}
              <div className="flex items-center justify-between">
                {/* Volume */}
                <div className="flex items-center gap-2">
                  <button onClick={toggleMute} className="transition-all hover:scale-110" style={{ color: "rgba(255,255,255,0.5)" }}>
                    {muted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>
                  <div className="relative w-16 h-1 rounded-full hidden sm:block" style={{ background: "rgba(255,255,255,0.12)" }}>
                    <div className="absolute left-0 top-0 h-full rounded-full" style={{ width: `${muted ? 0 : volume * 100}%`, background: "rgba(255,255,255,0.45)" }} />
                    <input type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume} onChange={onVolumeChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  </div>
                </div>

                {/* Playback */}
                <div className="flex items-center gap-3">
                  <button onClick={() => skip(-10)} className="transition-all hover:scale-110" style={{ color: "rgba(255,255,255,0.45)" }} title="Back 10s"><SkipBack size={16} /></button>
                  <button onClick={() => setCurrentScene(currentScene - 1, true, titleOffset, sceneTimeline)} disabled={currentScene === 0} className="transition-all hover:scale-110 disabled:opacity-20" style={{ color: "rgba(255,255,255,0.65)" }}><ChevronLeft size={20} /></button>
                  <button
                    onClick={togglePlay}
                    className="flex items-center justify-center rounded-full transition-all hover:scale-110 active:scale-95"
                    style={{ width: 48, height: 48, background: "linear-gradient(135deg,var(--lf-teal),#00a38d)", color: "#fff", boxShadow: "0 3px 18px rgba(0,201,167,0.45)", flexShrink: 0 }}
                  >
                    {isPlaying ? <Pause size={20} fill="#fff" /> : <Play size={20} fill="#fff" style={{ marginLeft: 2 }} />}
                  </button>
                  <button onClick={() => setCurrentScene(currentScene + 1, true, titleOffset, sceneTimeline)} disabled={currentScene === numScenes - 1} className="transition-all hover:scale-110 disabled:opacity-20" style={{ color: "rgba(255,255,255,0.65)" }}><ChevronRight size={20} /></button>
                  <button onClick={() => skip(10)} className="transition-all hover:scale-110" style={{ color: "rgba(255,255,255,0.45)" }} title="Forward 10s"><SkipForward size={16} /></button>
                </div>

                {/* Right: subtitle sync nudge + text panel toggle */}
                <div className="flex items-center gap-2">
                  {/* Sync nudge — hidden on very small screens */}
                  <div className="hidden sm:flex items-center gap-1" title="Nudge subtitle timing">
                    <button
                      onClick={() => setSubtitleOffset(o => Math.max(-10, o - 0.5))}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all hover:bg-white/10"
                      style={{ color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}
                    >−</button>
                    <span style={{ fontFamily: "monospace", fontSize: "0.65rem", color: subtitleOffset === 0 ? "rgba(255,255,255,0.2)" : "var(--lf-teal)", minWidth: 28, textAlign: "center" }}>
                      {subtitleOffset === 0 ? "sync" : `${subtitleOffset > 0 ? "+" : ""}${subtitleOffset.toFixed(1)}s`}
                    </span>
                    <button
                      onClick={() => setSubtitleOffset(o => Math.min(10, o + 0.5))}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all hover:bg-white/10"
                      style={{ color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}
                    >+</button>
                  </div>

                  {/* Text panel toggle */}
                  <button
                    onClick={() => setShowTextPanel(p => !p)}
                    className="px-2.5 py-1 rounded-full transition-all hover:bg-white/10"
                    style={{
                      fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.72rem",
                      color: showTextPanel ? "var(--lf-teal)" : "rgba(255,255,255,0.35)",
                      border: `1px solid ${showTextPanel ? "rgba(0,201,167,0.35)" : "rgba(255,255,255,0.1)"}`,
                    }}
                    title="Toggle story text"
                  >
                    📖
                  </button>
                </div>
              </div>

              {/* Story text panel — collapsible, shows all sentences with active one highlighted */}
              {showTextPanel && sceneSentences.length > 0 && (
                <div
                  className="mt-2 flex flex-col gap-1.5 max-h-44 overflow-y-auto rounded-xl px-4 py-3"
                  style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  {sceneSentences.map((sentence, i) => (
                    <p
                      key={i}
                      style={{
                        fontFamily: "'Nunito', sans-serif",
                        fontSize: "0.82rem",
                        lineHeight: 1.6,
                        color: i === activeSubtitleIdx
                          ? "#fff"
                          : "rgba(255,255,255,0.3)",
                        fontWeight: i === activeSubtitleIdx ? 700 : 400,
                        background: i === activeSubtitleIdx ? "rgba(0,201,167,0.1)" : "transparent",
                        borderLeft: i === activeSubtitleIdx ? "2.5px solid var(--lf-teal)" : "2.5px solid transparent",
                        paddingLeft: "0.6rem",
                        borderRadius: "0 6px 6px 0",
                        transition: "all 0.25s",
                      }}
                    >
                      {sentence}
                    </p>
                  ))}
                </div>
              )}
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

      {/* ── Minimal footer ── */}
      <div
        className="story-footer flex-shrink-0 flex items-center justify-between px-6 py-3"
        style={{ background: "rgba(14,12,26,0.97)", borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <Link href="/library" className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "'Nunito', sans-serif" }}>
          <Library size={13} /> Library
        </Link>
        <Link href="/dashboard" className="flex items-center gap-1.5 text-xs font-bold" style={{ color: "var(--lf-teal)", fontFamily: "'Nunito', sans-serif" }}>
          <Sparkles size={13} /> New story
        </Link>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   Prompt Inspector (debug panel)
──────────────────────────────────────────────────────────────── */
function PromptInspector({
  scenes,
  currentScene,
  onClose,
}: {
  scenes: SceneMeta[];
  currentScene: number;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState<number | null>(null);

  function copyPrompt(idx: number, text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(idx);
      setTimeout(() => setCopied(null), 1800);
    });
  }

  // Analyse prompts for consistency issues
  function analysePrompts(prompts: string[]): { issue: string; severity: "warn" | "error" }[] {
    const issues: { issue: string; severity: "warn" | "error" }[] = [];
    const nonEmpty = prompts.filter(Boolean);
    if (nonEmpty.length === 0) return issues;

    // Check style consistency: look for style keywords
    const styleKeywords = ["watercolour", "watercolor", "illustration", "cartoon", "3d", "realistic", "painted", "digital art"];
    const stylesFound = new Set<string>();
    nonEmpty.forEach(p => {
      styleKeywords.forEach(k => { if (p.toLowerCase().includes(k)) stylesFound.add(k); });
    });
    if (stylesFound.size > 1) issues.push({ issue: `Multiple art styles detected across prompts: ${[...stylesFound].join(", ")}`, severity: "error" });
    if (stylesFound.size === 0) issues.push({ issue: "No explicit art style specified — Gemini will choose randomly per scene", severity: "warn" });

    // Check for character description consistency
    const hasCharDesc = nonEmpty.filter(p =>
      /hair|eyes|wearing|dressed|skin|complexion|outfit|appearance/i.test(p)
    ).length;
    if (hasCharDesc === 0) issues.push({ issue: "No character appearance anchors found — character looks will vary scene to scene", severity: "error" });
    else if (hasCharDesc < nonEmpty.length) issues.push({ issue: `Only ${hasCharDesc}/${nonEmpty.length} scenes include character appearance details`, severity: "warn" });

    // Check for a shared character name or description block
    const charNames = nonEmpty.map(p => {
      const m = p.match(/\b([A-Z][a-z]{2,12})\b/g);
      return m ? m[0] : "";
    });
    const uniqueNames = new Set(charNames.filter(Boolean));
    if (uniqueNames.size > 2) issues.push({ issue: `Multiple different character names across prompts: ${[...uniqueNames].slice(0,5).join(", ")}`, severity: "warn" });

    // Prompt length variance
    const lengths = nonEmpty.map(p => p.length);
    const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const maxVar = Math.max(...lengths.map(l => Math.abs(l - avg)));
    if (maxVar > avg * 0.5) issues.push({ issue: `High prompt length variance (${Math.min(...lengths)}–${Math.max(...lengths)} chars) — inconsistent detail level`, severity: "warn" });

    return issues;
  }

  const prompts = scenes.map(s => s.imagePrompt ?? "");
  const issues = analysePrompts(prompts);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-2xl max-h-[88vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl flex flex-col"
        style={{ background: "#0e0c1a", border: "1px solid rgba(255,255,255,0.1)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="sticky top-0 flex items-center justify-between px-6 py-4"
          style={{ background: "#0e0c1a", borderBottom: "1px solid rgba(255,255,255,0.08)", zIndex: 10 }}
        >
          <div className="flex items-center gap-2.5">
            <FlaskConical size={18} style={{ color: "#a855f7" }} />
            <h2 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1rem", color: "#fff" }}>
              Image Prompt Inspector
            </h2>
            <span
              className="px-2 py-0.5 rounded-full text-xs font-bold"
              style={{ background: "rgba(168,85,247,0.2)", color: "#a855f7" }}
            >
              {scenes.length} scenes
            </span>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-all" style={{ color: "rgba(255,255,255,0.5)" }}>
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-5 p-6">
          {/* Issues banner */}
          {issues.length > 0 && (
            <div className="flex flex-col gap-2 p-4 rounded-2xl" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <p style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: "0.8rem", color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                ⚠ Consistency issues detected
              </p>
              {issues.map((iss, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span style={{ fontSize: "0.7rem", marginTop: 2, flexShrink: 0, color: iss.severity === "error" ? "#ef4444" : "#f9c700" }}>
                    {iss.severity === "error" ? "●" : "◐"}
                  </span>
                  <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.78rem", color: iss.severity === "error" ? "rgba(239,68,68,0.9)" : "rgba(249,199,0,0.85)", lineHeight: 1.4 }}>
                    {iss.issue}
                  </p>
                </div>
              ))}
            </div>
          )}

          {issues.length === 0 && prompts.some(Boolean) && (
            <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: "rgba(0,184,166,0.1)", border: "1px solid rgba(0,184,166,0.2)" }}>
              <span style={{ color: "var(--lf-teal)", fontSize: "0.85rem" }}>✓</span>
              <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.8rem", color: "var(--lf-teal)", fontWeight: 700 }}>
                No major consistency issues detected in prompts
              </p>
            </div>
          )}

          {/* Scene prompts */}
          {scenes.map((scene, idx) => (
            <div
              key={idx}
              className="flex flex-col gap-3 p-4 rounded-2xl"
              style={{
                background: idx === currentScene ? "rgba(0,184,166,0.06)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${idx === currentScene ? "rgba(0,184,166,0.25)" : "rgba(255,255,255,0.07)"}`,
              }}
            >
              {/* Scene header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                    style={{
                      background: idx === currentScene ? "rgba(0,184,166,0.2)" : "rgba(255,255,255,0.08)",
                      color: idx === currentScene ? "var(--lf-teal)" : "rgba(255,255,255,0.5)",
                    }}
                  >
                    Scene {scene.sceneNumber ?? idx + 1}
                  </span>
                  {idx === currentScene && (
                    <span style={{ fontSize: "0.7rem", color: "var(--lf-teal)", fontFamily: "'Nunito', sans-serif", fontWeight: 700 }}>
                      ← current
                    </span>
                  )}
                </div>
                {scene.imagePrompt && (
                  <button
                    onClick={() => copyPrompt(idx, scene.imagePrompt!)}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all hover:bg-white/10"
                    style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'Nunito', sans-serif" }}
                  >
                    {copied === idx ? <Check size={11} style={{ color: "var(--lf-teal)" }} /> : <Copy size={11} />}
                    {copied === idx ? "Copied" : "Copy"}
                  </button>
                )}
              </div>

              {/* Prompt text */}
              {scene.imagePrompt ? (
                <p
                  className="font-mono leading-relaxed select-text"
                  style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.65)", background: "rgba(0,0,0,0.3)", padding: "0.75rem", borderRadius: "0.6rem", whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                >
                  {scene.imagePrompt}
                </p>
              ) : (
                <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.78rem", color: "rgba(255,255,255,0.2)", fontStyle: "italic" }}>
                  No image prompt stored for this scene.
                </p>
              )}

              {/* Character / style quick check */}
              {scene.imagePrompt && (
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: "Has style",     ok: /watercolou?r|illustration|cartoon|painted|digital/i.test(scene.imagePrompt) },
                    { label: "Has character", ok: /hair|eyes|wearing|skin|outfit|complexion|dressed/i.test(scene.imagePrompt) },
                    { label: "Has setting",   ok: /background|setting|scene|forest|room|outside|indoor|outdoor|sky|field/i.test(scene.imagePrompt) },
                    { label: "Has mood",      ok: /warm|bright|cozy|magical|cheerful|soft|gentle|vibrant/i.test(scene.imagePrompt) },
                  ].map(tag => (
                    <span
                      key={tag.label}
                      className="px-2 py-0.5 rounded-full text-xs font-bold"
                      style={{
                        background: tag.ok ? "rgba(0,184,166,0.12)" : "rgba(239,68,68,0.12)",
                        color: tag.ok ? "var(--lf-teal)" : "#f87171",
                      }}
                    >
                      {tag.ok ? "✓" : "✗"} {tag.label}
                    </span>
                  ))}
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)" }}
                  >
                    {scene.imagePrompt.length} chars
                  </span>
                </div>
              )}
            </div>
          ))}

          {/* Fix guide */}
          <div className="flex flex-col gap-3 p-4 rounded-2xl" style={{ background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.15)" }}>
            <p style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: "0.78rem", color: "#a855f7", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              📋 What to add to every prompt (in Convex promptBuilder.ts)
            </p>
            <p
              className="font-mono select-text"
              style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.55)", background: "rgba(0,0,0,0.35)", padding: "0.75rem", borderRadius: "0.6rem", whiteSpace: "pre-wrap", lineHeight: 1.6 }}
            >
{`// 1. STYLE LOCK — same on every scene
const STYLE_PREFIX =
  "Children's book illustration, soft watercolour style, " +
  "warm pastel palette, gentle lighting, flat textures, " +
  "storybook aesthetic. ";

// 2. CHARACTER ANCHOR — built once from profile, reused every scene
const characterBlock = (profile) =>
  \`Main character: \${profile.childName}, \` +
  \`\${profile.childAge}-year-old \${profile.childGender}, \` +
  \`[physical description consistent throughout]. \`;

// 3. FINAL PROMPT STRUCTURE
const prompt = STYLE_PREFIX + characterBlock(profile) +
  "SCENE: " + sceneText +
  " Background: [scene setting]. Mood: warm, joyful.";`}
            </p>
          </div>
        </div>
      </div>
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
