"use client";

import { use, useRef, useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Lottie from "lottie-react";
import {
  useQuery,
  useAction,
  useMutation,
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
  X,
  Copy,
  Check,
  Moon,
  Sun,
  Clock,
  RefreshCw,
  Maximize,
  Minimize,
  Trophy,
} from "lucide-react";
import { UpgradeModal } from "@/components/ui/UpgradeModal";

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

/**
 * Split story.content into numScenes chunks of roughly equal character length,
 * breaking only at paragraph (line) boundaries.
 *
 * Why character-weighted instead of equal line counts? TTS speaking time is
 * proportional to character count, not line count — a scene written as many
 * short dialogue lines would otherwise grab a disproportionate share of the
 * narration timeline under naive equal-line-count division, causing the
 * subtitle and scene image to drift out of sync with the audio.
 */
function splitContentIntoScenes(content: string, numScenes: number): string[] {
  if (!content || numScenes === 0) return [];
  const paras = content.split("\n").map(l => l.trim()).filter(Boolean);
  if (paras.length === 0) return Array.from({ length: numScenes }, () => "");
  if (paras.length <= numScenes) {
    return Array.from({ length: numScenes }, (_, i) => paras[i] ?? "");
  }

  const totalChars = paras.reduce((sum, p) => sum + p.length, 0);
  const chunks: string[] = [];
  let paraIdx = 0;
  let charsUsed = 0;

  for (let scene = 0; scene < numScenes; scene++) {
    if (scene === numScenes - 1) {
      chunks.push(paras.slice(paraIdx).join("\n"));
      break;
    }
    const remainingScenes = numScenes - scene;
    const remainingParas = paras.length - paraIdx;
    const target = (totalChars * (scene + 1)) / numScenes;
    const chunkParas: string[] = [];
    let chunkChars = 0;
    // Always take at least one paragraph, and leave at least one per remaining scene
    while (
      paraIdx < paras.length &&
      remainingParas - chunkParas.length > remainingScenes - 1 &&
      (chunkParas.length === 0 || charsUsed + chunkChars + paras[paraIdx].length <= target)
    ) {
      chunkChars += paras[paraIdx].length;
      chunkParas.push(paras[paraIdx]);
      paraIdx++;
    }
    charsUsed += chunkChars;
    chunks.push(chunkParas.join("\n"));
  }
  return chunks;
}

/* Get a single scene's narrative text chunk */
function getSceneTextChunk(content: string, sceneIndex: number, numScenes: number): string {
  if (!content || numScenes === 0) return "";
  return splitContentIntoScenes(content, numScenes)[sceneIndex]?.trim() ?? "";
}

/* ── Comic narration helpers ── */
type NarrationLine = { speaker: "Narrator" | "Lalli" | "Fafa" | "Child"; text: string };

const SPEAKER_STYLES: Record<string, { color: string; bg: string; border: string; emoji: string }> = {
  Lalli:    { color: "#FFD700", bg: "rgba(255,215,0,0.1)",    border: "rgba(255,215,0,0.45)",    emoji: "✨" },
  Fafa:     { color: "#00C9A7", bg: "rgba(0,201,167,0.1)",    border: "rgba(0,201,167,0.45)",    emoji: "🐰" },
  Child:    { color: "#FF6B35", bg: "rgba(255,107,53,0.1)",   border: "rgba(255,107,53,0.45)",   emoji: "⭐" },
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
  { name: "Child", color: "#FF6B35" }, // mango orange — brand's 4th core color
];

function detectSpeaker(
  sentence: string,
  childName?: string
): { name: string; displayName: string; color: string } | null {
  const lower = sentence.trim().toLowerCase();
  const childLabel = (childName ?? "").trim().toLowerCase();

  // Speaker-label detection (colon prefix) — most reliable signal, checked first
  if (lower.startsWith("lalli:")) return { name: "Lalli", displayName: "Lalli", color: "#f9c700" };
  if (lower.startsWith("fafa:"))  return { name: "Fafa",  displayName: "Fafa",  color: "#00c9a7" };
  if (/^(child|girl child|boy child)\s*:/i.test(sentence))
    return { name: "Child", displayName: childName || "Child", color: "#FF6B35" };
  if (childLabel && lower.startsWith(childLabel + ":"))
    return { name: "Child", displayName: childName!, color: "#FF6B35" };

  // Fallback: name-mention detection for Lalli/Fafa (existing behavior)
  for (const char of [CHARACTERS[0], CHARACTERS[1]]) {
    if (new RegExp(`\\b${char.name}\\b`, "i").test(sentence))
      return { name: char.name, displayName: char.name, color: char.color };
  }

  return null; // Narrator — no badge, grey text
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
  const chunks = splitContentIntoScenes(content, numScenes);
  const charCounts = chunks.map(c => Math.max(1, c.length));
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

/* ── Vocabulary extraction with child-friendly definitions ── */
const CHILD_DICT: Record<string, string> = {
  adventure:"An exciting journey full of surprises",curious:"Wanting to learn or know more",
  courage:"Being brave even when you feel scared",discover:"To find something new for the first time",
  magical:"Having special powers, like in a fairy tale",whispered:"Said something very quietly",
  enormous:"Very, very big",sparkled:"Shone with tiny flashes of light",
  treasure:"Something very valuable and special",wonderful:"Something that fills you with joy",
  mysterious:"Strange and hard to explain",excited:"Feeling very happy and full of energy",
  journey:"A long trip from one place to another",decided:"Made up your mind about something",
  carefully:"Doing something slowly with great attention",beautiful:"Very lovely to look at",
  important:"Something that matters a lot",surprised:"Shocked because something unexpected happened",
  promise:"Telling someone you will definitely do something",imagine:"Making pictures in your mind",
  special:"Different from everything else in a good way",protect:"Keeping someone safe from danger",
  remember:"Thinking about something from the past",explore:"Going to new places to see what's there",
  kindness:"Being nice and caring to others",friendly:"Warm and welcoming to other people",
  enchanted:"Made magical by a spell or charm",determined:"Not giving up no matter what",
  brilliant:"Very bright or very clever",magnificent:"Extremely beautiful or impressive",
  creature:"Any living animal or being",dangerous:"Something that could hurt you",
  grateful:"Feeling thankful for something",terrified:"Very, very scared",
  confident:"Believing in yourself and your abilities",celebrate:"Having fun because something good happened",
  precious:"Very valuable and deeply loved",peaceful:"Calm and quiet, without trouble",
  gathered:"Came together in one place",believed:"Thought something was true",
  disappeared:"Went away so you couldn't see it anymore",giggled:"Laughed in a light, happy way",
  responsibility:"A job or duty you need to take care of",thundered:"Made a very loud, deep sound",
  shimmered:"Glowed with a soft, moving light",trembled:"Shook slightly because of fear or cold",
  astonished:"Very, very surprised",delighted:"Extremely happy and pleased",
  hesitated:"Paused because you weren't sure",
  mischievous:"Playfully naughty",scattered:"Spread out in many directions",
  courageous:"Very brave",exclaimed:"Said something loudly with strong feeling",
  murmured:"Spoke very softly and quietly",
  dazzling:"So bright or impressive it amazes you",
};

function extractVocabulary(content: string, count = 5): { word: string; meaning: string; context: string }[] {
  if (!content) return [];
  const sentences = content.match(/[^.!?]+[.!?]+/g) ?? [];
  const results: { word: string; meaning: string; context: string }[] = [];
  const seen = new Set<string>();
  for (const sentence of sentences) {
    const words = sentence.match(/\b[a-zA-Z]{5,}\b/g) ?? [];
    for (const w of words) {
      const lower = w.toLowerCase();
      if (!seen.has(lower) && CHILD_DICT[lower]) {
        seen.add(lower);
        results.push({
          word: w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
          meaning: CHILD_DICT[lower],
          context: sentence.trim(),
        });
        if (results.length >= count) return results;
      }
    }
  }
  return results;
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
interface StingPlacement {
  stingId:         string;
  stingName:       string;
  emotion:         string;
  intensity:       "subtle" | "medium";
  durationSeconds: number;
  targetScene:     number;
  placementHint:   string;
  volumeDb:        number;
}

interface StoryShape {
  _id?: Id<"stories">;
  title?: string;
  status?: string;
  content?: string;            // full narrative text (all scenes combined)
  sceneMetadata?: SceneMeta[];
  params?: { theme?: string; language?: string; lesson?: string; childName?: string };
  audioDurationSeconds?: number; // stored at generation time; used when audio can't report duration
  // Phase 5: audio enrichment
  stingPlacements?: StingPlacement[];
  // Phase 6: real scene start timestamps from narration (scene number string → seconds)
  sceneStartSeconds?: Record<string, number>;
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
          narrationUrl={(narrationUrl as { url?: string | null } | null)?.url ? `/api/audio/${id}` : null}
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
  const { isAuthenticated } = useConvexAuth();
  const subscription = useQuery(api.subscription.getSubscription, isAuthenticated ? {} : "skip");
  const isPremium = subscription?.status === "active";
  // Story Challenge is available to every authenticated account (the earlier
  // staged-rollout allowlist was removed once verified). Unauthenticated
  // visitors get the original End screen instead.
  const challengeEnabled = useQuery(
    api["testserver/_shared"].isChallengeRolloutEnabled,
    isAuthenticated ? {} : "skip"
  );
  const searchParams = useSearchParams();
  // Set by the Challenge screen's own "Do it later" opt-out (Task 4) — lands
  // back here instead of being redirected straight back into Challenge.
  const skipChallenge = searchParams.get("skipChallenge") === "1";
  const markReaderCompleted = useMutation(api.stories._markReaderCompleted);

  /* Scene state */
  const scenes: SceneMeta[] = story?.sceneMetadata ?? [];
  const numScenes = scenes.length;
  const [currentScene, setCurrentSceneRaw] = useState(0);

  /* Audio state */
  const audioRef = useRef<HTMLAudioElement>(null);
  // Pre-buffer the narration MP3 as a local blob so the browser can range-request it.
  // Convex storage does not support Accept-Ranges; without this, every pause/resume
  // triggers a full re-download from byte 0 and currentTime snaps back toward 0.
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const audioBlobRef = useRef<string | null>(null);
  // Ref tracks whether the user is actively hearing audio (not just muted autoplay).
  // Used in the blob pre-buffer to avoid swapping src mid-playback on slow connections.
  const isPlayingRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  // `duration` = what we show on the progress bar (may use stored estimate as fallback)
  const [duration, setDuration] = useState(0);
  // `reliableDuration` = only set when the audio element itself reports a finite value.
  // Scene auto-advance ONLY uses this — never the stored estimate — to prevent iOS/Safari
  // from racing through all scenes when the stored audioDurationSeconds is stale/wrong.
  const [reliableDuration, setReliableDuration] = useState(0);

  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  // Fetch narration as a blob so the browser can range-request it locally.
  // Guarded: if the user is already playing on the direct Convex URL (slow connection),
  // we skip the src swap to avoid restarting playback from the beginning.
  useEffect(() => {
    if (!narrationUrl) return;
    let cancelled = false;
    fetch(narrationUrl)
      .then(r => r.blob())
      .then(blob => {
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        if (audioBlobRef.current) URL.revokeObjectURL(audioBlobRef.current);
        audioBlobRef.current = url;
        // Only apply if the user hasn't started playing yet — no mid-playback restarts.
        if (!isPlayingRef.current) {
          console.log("[narration:blob] applying blob URL immediately (not playing)", url.slice(0, 60));
          setAudioBlobUrl(url);
        } else {
          // Deferred: store the blob URL so togglePlay can apply it before next play().
          // effectiveSrc will pick it up on the next render after the user pauses.
          // We do NOT call setAudioBlobUrl here — no src change while audio is playing.
          console.log("[narration:blob] blob ready but audio is playing — deferred to next pause");
        }
      })
      .catch(err => console.warn("[narration] blob pre-buffer failed, using direct URL:", err));
    return () => {
      cancelled = true;
      if (audioBlobRef.current) {
        URL.revokeObjectURL(audioBlobRef.current);
        audioBlobRef.current = null;
        setAudioBlobUrl(null);
      }
    };
  }, [narrationUrl]);

  // Seed display duration from stored value when audio element can't report it (Safari/Convex streaming).
  useEffect(() => {
    const stored = story?.audioDurationSeconds;
    if (stored && stored > 0) {
      setDuration(prev => (prev > 0 && isFinite(prev) ? prev : stored));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story?.audioDurationSeconds]);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [seeking, setSeeking] = useState(false);
  const [subtitleOffset, setSubtitleOffset] = useState(0); // seconds; + = show subtitles sooner
  const [showSubtitles, setShowSubtitles] = useState(true); // CC toggle
  const [showTextPanel, setShowTextPanel] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  /* Bedtime mode */
  const [bedtimeMode, setBedtimeMode] = useState(false);
  const [bedtimeMenuOpen, setBedtimeMenuOpen] = useState(false);
  const [sleepRemaining, setSleepRemaining] = useState(0);
  const [showVocab, setShowVocab] = useState(true);
  const [lightMode, setLightMode] = useState(true);
  const [storyEnded, setStoryEnded] = useState(false);
  const [sequelLoading, setSequelLoading] = useState(false);
  const [endUpgradeModalOpen, setEndUpgradeModalOpen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fullscreenRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      fullscreenRef.current?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const storyRouter = useRouter();
  const generateStoryAction = useAction(api.generateStoryV2.enqueueStoryV2);

  // Task 4 — direct transition: playback ending goes straight into Story
  // Challenge instead of an intermediate "The End" card, since Challenge
  // generation is now kicked off eagerly during story generation and is
  // normally already waiting by the time this fires. Skipped when the user
  // came back here via the Challenge screen's own "Do it later" opt-out.
  useEffect(() => {
    if (!storyEnded || skipChallenge) return;
    if (challengeEnabled === undefined) return; // still resolving — wait rather than flash the old screen
    if (!challengeEnabled) return;
    // StoryViewer isn't passed the story id as a prop (see the Share section
    // below, which derives it the same way) — pull it from the URL instead.
    const sid = typeof window !== "undefined" ? window.location.pathname.split("/").pop() ?? "" : "";
    if (sid) storyRouter.push(`/testserver/challenge/${sid}`);
  }, [storyEnded, skipChallenge, challengeEnabled, storyRouter]);

  const handleSequel = async () => {
    if (sequelLoading || !story) return;
    setSequelLoading(true);
    try {
      const storyIdRaw = typeof window !== "undefined" ? window.location.pathname.split("/").pop() ?? "" : "";
      const result = await generateStoryAction({
        params: {
          theme: story.params?.theme ?? "Magical Forest",
          lesson: story.params?.lesson,
          language: story.params?.language,
          sequelOfId: storyIdRaw as any,
        },
      });
      storyRouter.push(`/story/${result.storyId}`);
    } catch (err: unknown) {
      setSequelLoading(false);
      const msg = err instanceof Error ? err.message : "";
      if (msg.toLowerCase().includes("credit")) {
        toast.error("Not enough credits for a sequel. Top up to continue!", {
          action: { label: "Get credits", onClick: () => storyRouter.push("/pricing") },
        });
      } else {
        toast.error("Couldn't start the next adventure — please try again.");
      }
    }
  };

  const t = lightMode ? {
    bg: "#FFF8E7", headerBg: "rgba(255,248,231,0.95)", panelBg: "#fff",
    panelBorder: "rgba(0,0,0,0.1)", text: "#1a1a2e", textSoft: "rgba(45,45,45,0.55)",
    textFaint: "rgba(45,45,45,0.25)", controlColor: "rgba(45,45,45,0.5)",
    footerBg: "rgba(255,248,231,0.97)", footerBorder: "rgba(0,0,0,0.07)",
    subtitleBg: "linear-gradient(135deg, rgba(255,255,255,0.97) 0%, rgba(255,248,220,0.93) 100%)", hoverBg: "rgba(0,0,0,0.06)",
  } : {
    bg: "#0e0c1a", headerBg: "rgba(14,12,26,0.95)", panelBg: "rgba(255,255,255,0.04)",
    panelBorder: "rgba(255,255,255,0.08)", text: "#fff", textSoft: "rgba(255,255,255,0.55)",
    textFaint: "rgba(255,255,255,0.25)", controlColor: "rgba(255,255,255,0.5)",
    footerBg: "rgba(14,12,26,0.97)", footerBorder: "rgba(255,255,255,0.06)",
    subtitleBg: "linear-gradient(135deg, rgba(14,12,26,0.92) 0%, rgba(22,18,42,0.88) 100%)", hoverBg: "rgba(255,255,255,0.1)",
  };
  const manualNavRef = useRef(false); // suppress auto-advance briefly after manual nav
  const manualSceneRef = useRef(-1);  // user-selected scene index; -1 = no override active
  const seekMutedRef = useRef(false); // true while audio is muted because a seek is buffering
  const userMutedRef = useRef(false); // mirrors `muted` state so event handlers can read it without stale closure
  const seekUnmuteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  /* Refs that always hold the latest titleOffset / sceneTimeline so event handlers stay fresh */
  const titleOffsetRef = useRef(0);
  const sceneTimelineRef = useRef<Array<{ startFrac: number; endFrac: number }>>([]);

  useEffect(() => { userMutedRef.current = muted; }, [muted]);

  /* ── Situational stings (Phase 5/6) ──────────────────────────────────── */
  const stingIds = useMemo(
    () => (story?.stingPlacements ?? []).map((p) => p.stingId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(story?.stingPlacements?.map((p) => p.stingId))]
  );
  const stingUrlData = useQuery(
    api.stings.getFileUrls,
    stingIds.length > 0 ? { stingIds } : "skip"
  );
  const stingUrlMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of stingUrlData ?? []) m.set(s.stingId, s.url);
    return m;
  }, [stingUrlData]);

  // One Audio node per placement, keyed by placement index. Created once, reused.
  const stingNodesRef = useRef<Map<number, HTMLAudioElement>>(new Map());
  // Which placement indices have already fired in this playback session.
  const firedStingsRef = useRef<Set<number>>(new Set());

  // Build/update Audio nodes when URLs become available.
  useEffect(() => {
    const placements = story?.stingPlacements ?? [];
    placements.forEach((p, idx) => {
      const url = stingUrlMap.get(p.stingId);
      if (!url || stingNodesRef.current.has(idx)) return;
      const audio = new Audio(url);
      audio.preload = "auto";
      // volumeDb → linear amplitude: 10^(dB/20). Clamp to [0, 1].
      audio.volume = Math.min(1, Math.pow(10, (p.volumeDb ?? -3) / 20));
      stingNodesRef.current.set(idx, audio);
    });
    return () => {
      // Cleanup on story change
      stingNodesRef.current.forEach((a) => { a.pause(); a.src = ""; });
      stingNodesRef.current.clear();
      firedStingsRef.current.clear();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stingUrlMap]);

  // Fire stings when currentTime crosses the cue point for a scene.
  useEffect(() => {
    if (!isPlaying) return;
    const placements = story?.stingPlacements ?? [];
    const startSecs = story?.sceneStartSeconds ?? {};
    placements.forEach((p, idx) => {
      if (firedStingsRef.current.has(idx)) return;
      const cueTime = startSecs[String(p.targetScene)];
      if (cueTime === undefined) return;
      if (currentTime >= cueTime && currentTime < cueTime + p.durationSeconds + 2) {
        const audio = stingNodesRef.current.get(idx);
        if (audio) {
          audio.currentTime = 0;
          audio.play().catch(() => {});
          firedStingsRef.current.add(idx);
          console.debug(`[sting] fired "${p.stingName}" at scene ${p.targetScene} (${currentTime.toFixed(1)}s)`);
        }
      }
    });
  }, [currentTime, isPlaying, story?.stingPlacements, story?.sceneStartSeconds]);

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

  /* Screen Wake Lock — keep the screen on while the story is playing so it
     doesn't lock mid-narration. Re-acquires on tab refocus since the OS
     releases the lock when the page is hidden. */
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  useEffect(() => {
    if (!isPlaying || !("wakeLock" in navigator)) return;

    let released = false;
    const acquire = async () => {
      try {
        const lock = await navigator.wakeLock.request("screen");
        if (released) { lock.release().catch(() => {}); return; }
        wakeLockRef.current = lock;
      } catch {
        // Permission denied or unsupported — playback continues normally.
      }
    };
    acquire();

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible" && !wakeLockRef.current) acquire();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      released = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      wakeLockRef.current?.release().catch(() => {});
      wakeLockRef.current = null;
    };
  }, [isPlaying]);

  /* Sleep timer countdown — when it hits 0, pause everything */
  useEffect(() => {
    if (sleepRemaining <= 0) return;
    const id = setInterval(() => {
      setSleepRemaining(r => {
        if (r <= 1) {
          audioRef.current?.pause();
          bgAudioRef.current?.pause();
          setIsPlaying(false);
          setBedtimeMode(false);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [sleepRemaining > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const startSleepTimer = (minutes: number) => {
    setSleepRemaining(minutes * 60);
    setBedtimeMode(true);
    setBedtimeMenuOpen(false);
  };

  /* Autoplay narration as soon as the player is ready. Browsers always allow
     *muted* autoplay, so we start muted, then immediately unmute once
     playback has actually begun — unmuting a playing element doesn't require
     a fresh user gesture. If even muted playback is rejected, we leave
     playback paused and the user starts it with the Play button. */
  const autoplayTriedRef = useRef(false);
  // When the blob URL arrives (replaces the Convex direct URL), allow autoplay to re-fire
  // so the first actual play attempt uses the local blob with proper range-request support.
  useEffect(() => {
    if (audioBlobUrl) autoplayTriedRef.current = false;
  }, [audioBlobUrl]);
  const effectiveSrc = audioBlobUrl ?? narrationUrl;
  useEffect(() => {
    if (autoplayTriedRef.current || !effectiveSrc || !audioRef.current) return;
    autoplayTriedRef.current = true;
    const audio = audioRef.current;
    audio.muted = true;
    audio
      .play()
      .then(() => {
        setIsPlaying(true);
        audio.muted = muted;
      })
      .catch(() => {
        audio.muted = muted;
        /* autoplay blocked — user taps Play */
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveSrc]);

  /* Seek audio to scene's start position using character-weighted timeline.
     Uses reliableDuration (audio element's actual value) for accurate seeking;
     falls back to display duration if reliable value not yet available. */
  const seekToScene = useCallback(
    (idx: number, titleOffset: number, sceneTimeline: Array<{ startFrac: number; endFrac: number }>) => {
      const seekDur = reliableDuration || duration;
      const audio = audioRef.current;
      if (!audio || !seekDur || numScenes === 0) return;
      const contentDuration = Math.max(1, seekDur - titleOffset);
      const startFrac = sceneTimeline[idx]?.startFrac ?? (idx / numScenes);
      const targetTime = titleOffset + startFrac * contentDuration;
      // Mute so the user doesn't hear wrong content while Convex re-buffers from
      // byte 0 (no range-request support). `onNarrationSeeked` unmutes once the
      // browser has genuinely buffered to targetTime.
      if (seekUnmuteTimerRef.current) clearTimeout(seekUnmuteTimerRef.current);
      seekMutedRef.current = true;
      audio.muted = true;
      audio.currentTime = targetTime;
      manualSceneRef.current = idx;
      // Safety net: unmute after 12 s if the seeked event never fires.
      seekUnmuteTimerRef.current = setTimeout(() => {
        if (seekMutedRef.current) {
          seekMutedRef.current = false;
          if (audioRef.current) audioRef.current.muted = userMutedRef.current;
        }
      }, 12000);
    },
    [reliableDuration, duration, numScenes]
  );

  const setCurrentScene = useCallback(
    (idx: number, seekAudio = true, titleOffset = 0, sceneTimeline: Array<{ startFrac: number; endFrac: number }> = []) => {
      const clamped = Math.max(0, Math.min(numScenes - 1, idx));
      setCurrentSceneRaw(clamped);
      if (seekAudio) {
        manualNavRef.current = true;
        seekToScene(clamped, titleOffset, sceneTimeline);
        setTimeout(() => { manualNavRef.current = false; }, 1500);
      }
    },
    [numScenes, seekToScene]
  );

  /* Auto-advance scene as audio plays — uses character-weighted scene timeline.
     IMPORTANT: only runs when reliableDuration is set (audio element reported a finite
     value). Never uses the stored audioDurationSeconds estimate, which can be stale/wrong
     and would cause all scenes to flash through instantly on iOS/Safari. */
  useEffect(() => {
    if (manualNavRef.current || numScenes === 0 || !reliableDuration || !story?.content) return;
    const titleChars = (story?.title ?? "").length;
    const contentCharsFlat = (story.content ?? "").replace(/\s*\n\s*/g, "").length;
    const totalChars = titleChars + contentCharsFlat;
    const titleOff = totalChars > 0 ? (titleChars / totalChars) * reliableDuration : 0;
    const contentDur = Math.max(1, reliableDuration - titleOff);
    const contentProgress = Math.max(0, currentTime - titleOff) / contentDur; // 0..1

    const timeline = buildSceneTimeline(story.content, numScenes);
    const expected = timeline.findIndex(slot => contentProgress < slot.endFrac);
    const clamped = expected === -1 ? numScenes - 1 : Math.max(0, expected);

    // Once audio arrives in the manually-selected scene's range, clear the override
    if (manualSceneRef.current !== -1 && manualSceneRef.current === clamped) {
      manualSceneRef.current = -1;
    }
    // Don't snap back to audio position while a manual seek is still in flight
    if (manualSceneRef.current !== -1) return;

    if (clamped !== currentScene) {
      setCurrentSceneRaw(clamped);
    }
  }, [currentTime, reliableDuration, numScenes, currentScene, story?.title, story?.content]);

  /* Keyboard shortcuts: Space = play/pause, ← = prev scene, → = next scene */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Don't intercept when user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
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

  // Guards a resume: Convex storage doesn't support range requests, so after a
  // pause the browser may have to re-fetch the file from byte 0 and silently
  // snap currentTime back toward 0 once that data starts arriving — sometimes
  // several seconds after play() resolves. While a guard is active, onTimeUpdate
  // re-applies the target position until playback catches back up to it.
  const resumeGuardRef = useRef<{ target: number; until: number } | null>(null);

  // Always-fresh record of "where we currently are", updated on every timeupdate.
  // Used as the resume position if the user pauses via something other than the
  // play/pause button (media keys, hardware controls, etc.).
  const lastPositionRef = useRef(0);

  /* Audio event handlers */
  const onTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const guard = resumeGuardRef.current;
    if (guard) {
      if (performance.now() > guard.until) {
        console.log("[narration] resume guard expired", { currentTime: audio.currentTime, target: guard.target });
        resumeGuardRef.current = null;
      } else if (Math.abs(audio.currentTime - guard.target) > 1.5) {
        console.log("[narration] resume guard correcting", { from: audio.currentTime, to: guard.target });
        audio.currentTime = guard.target;
      } else {
        resumeGuardRef.current = null;
      }
    }
    lastPositionRef.current = audio.currentTime;
    if (!seeking) setCurrentTime(audio.currentTime);
  };
  // Keep playbackRate in sync with the audio element whenever it changes
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = playbackRate;
  }, [playbackRate]);

  // Accept a finite duration from the audio element; ignore Infinity (no Accept-Ranges on Convex).
  //
  // Settle once, then stop: real incident — for an MP3 with no Xing/VBRI
  // duration header served via Range requests, Chrome's live duration
  // estimate kept climbing well past the file's real length as more of it
  // buffered during playback (a real narration file measured at 163s via
  // stored audioDurationSeconds AND file-size÷bitrate reported 163.1s on
  // first load, then 196s+ later in the same playback, with nothing new
  // actually in the file). Take the larger of the stored value and the
  // FIRST live reading once, then ignore every later durationchange —
  // those are the re-estimate, not new information.
  const settleDuration = (liveSeconds: number) => {
    if (reliableDuration > 0) return; // already settled — later events are the bug, not new data
    const stored = story?.audioDurationSeconds;
    const settled = stored && stored > 0 ? Math.max(stored, liveSeconds) : liveSeconds;
    setDuration(settled);
    setReliableDuration(settled);
  };
  const onLoadedMetadata = () => {
    if (!audioRef.current) return;
    const d = audioRef.current.duration;
    if (isFinite(d) && d > 0) settleDuration(d);
    audioRef.current.playbackRate = playbackRate;
  };
  // durationchange fires later as the browser buffers more — catch it too
  // (still gated by settleDuration's own "already settled" check).
  const onDurationChange = () => {
    if (!audioRef.current) return;
    const d = audioRef.current.duration;
    if (isFinite(d) && d > 0) settleDuration(d);
  };
  const onEnded = () => {
    setIsPlaying(false);
    setStoryEnded(true);
    // Real "reached the end" signal — previously nothing recorded this, so
    // an untaken Story Challenge was indistinguishable from a story the
    // child never finished watching.
    if (story?._id) markReaderCompleted({ storyId: story._id }).catch(() => {});
  };

  // Fires when the browser has buffered enough to play from the sought position.
  const onNarrationSeeked = () => {
    if (seekMutedRef.current) {
      seekMutedRef.current = false;
      if (seekUnmuteTimerRef.current) { clearTimeout(seekUnmuteTimerRef.current); seekUnmuteTimerRef.current = null; }
      if (audioRef.current) audioRef.current.muted = userMutedRef.current;
    }
    // Apply deferred blob URL if it arrived while audio was playing and hasn't been applied yet.
    // seekToScene briefly mutes the audio, making this the first safe moment to swap src for
    // users who navigate scenes before ever pausing (the only other swap point is togglePlay pause).
    if (audioBlobRef.current && !audioBlobUrl) {
      console.log("[narration:blob] applying deferred blob URL on seeked event");
      setAudioBlobUrl(audioBlobRef.current);
    }
    const postSeekTime = audioRef.current?.currentTime ?? 0;
    console.log("[narration:seek] seeked event — currentTime after seek:", postSeekTime, "src type:", audioBlobRef.current ? "blob" : "convex");
    // Re-arm any stings whose cue point is now in the future after a seek.
    const seekTarget = audioRef.current?.currentTime ?? 0;
    const placements = story?.stingPlacements ?? [];
    const startSecs = story?.sceneStartSeconds ?? {};
    placements.forEach((p, idx) => {
      const cueTime = startSecs[String(p.targetScene)];
      if (cueTime !== undefined && seekTarget < cueTime) {
        firedStingsRef.current.delete(idx);
      }
    });
  };

  // Remembers exactly where playback was paused, in case the browser drops
  // its buffered position on resume (Convex storage doesn't support range
  // requests, so re-buffering after a pause can otherwise snap back to 0).
  const pausePositionRef = useRef(0);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      pausePositionRef.current = audio.currentTime || lastPositionRef.current;
      console.log("[narration] pause at", pausePositionRef.current, "src:", audio.src.startsWith("blob:") ? "blob" : "convex");
      audio.pause();
      setIsPlaying(false);
      // If the blob URL arrived while we were playing on the direct Convex URL (deferred
      // because we didn't want to restart mid-playback), apply it now while paused so the
      // next play() uses the local blob with proper range-request support.
      if (audioBlobRef.current && !audioBlobUrl) {
        setAudioBlobUrl(audioBlobRef.current);
      }
      return;
    }

    const resumeAt = pausePositionRef.current;
    console.log("[narration] resume requested", { resumeAt, currentTime: audio.currentTime, readyState: audio.readyState, src: audio.src.startsWith("blob:") ? "blob" : "convex" });
    setIsPlaying(true);

    if (resumeAt <= 0.25 || Math.abs(audio.currentTime - resumeAt) <= 0.25) {
      audio.play().catch(() => {});
      return;
    }

    let settled = false;
    const finishResume = (source: string) => {
      if (settled) return;
      settled = true;
      audio.removeEventListener("seeked", onSeeked);
      console.log("[narration] resuming playback", { source, currentTime: audio.currentTime, resumeAt, delta: Math.abs(audio.currentTime - resumeAt) });
      // Keep correcting for a few seconds in case Convex's lack of range-request
      // support causes the buffer to silently snap currentTime back toward 0
      // after playback has already started.
      resumeGuardRef.current = { target: resumeAt, until: performance.now() + 8000 };
      audio.play().catch(() => {});
    };
    const onSeeked = () => finishResume("seeked");

    const performSeek = () => {
      audio.currentTime = resumeAt;
      audio.addEventListener("seeked", onSeeked);
      // Safety net: some browsers/files never emit `seeked` for short seeks.
      setTimeout(() => finishResume("timeout"), 1500);
    };

    if (audio.readyState >= 1) {
      // HAVE_METADATA or better — safe to seek immediately.
      performSeek();
    } else {
      // Not loaded yet — wait for metadata before seeking, otherwise the
      // currentTime assignment is silently ignored.
      audio.addEventListener("loadedmetadata", performSeek, { once: true });
      // Absolute fallback in case loadedmetadata never fires.
      setTimeout(() => finishResume("metadata-timeout"), 3000);
    }
  };

  const onScrubberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = Number(e.target.value);
    setCurrentTime(t);
    if (audioRef.current) {
      if (seekUnmuteTimerRef.current) clearTimeout(seekUnmuteTimerRef.current);
      seekMutedRef.current = true;
      audioRef.current.muted = true;
      audioRef.current.currentTime = t;
      seekUnmuteTimerRef.current = setTimeout(() => {
        if (seekMutedRef.current) {
          seekMutedRef.current = false;
          if (audioRef.current) audioRef.current.muted = userMutedRef.current;
        }
      }, 12000);
    }
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
    userMutedRef.current = next;
    seekMutedRef.current = false; // user explicitly chose mute state
    audioRef.current.muted = next;
  };

  /* Share — use the public /share/[id] page so recipients don't need a login */
  const storyId = typeof window !== "undefined"
    ? window.location.pathname.split("/").pop() ?? ""
    : "";
  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/share/${storyId}`
    : "";
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: story?.title ?? "A Lalli & Fafa story",
          text: `✨ Check out this personalised Lalli & Fafa story: "${story?.title}"`,
          url: shareUrl,
        });
      } catch { /* user cancelled */ }
    } else {
      copyLink();
    }
  };
  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    });
  };
  const waShareUrl = `https://wa.me/?text=${encodeURIComponent(`✨ "${story?.title}" — a personalised Lalli & Fafa story! ${shareUrl}`)}`;
  const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;

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
  const childNameForSubtitle = (story as any)?.params?.childName as string ?? "";
  const speaker = subtitleText ? detectSpeaker(subtitleText, childNameForSubtitle) : null;
  /* Index of the currently highlighted sentence (for the text panel) */
  const activeSubtitleIdx = sceneSentences.indexOf(subtitleText);

  /* Strip speaker-label prefix (e.g. "Lalli:", "Narrator:") then "said/replied" framing */
  const cleanSubtitle = (() => {
    let s = (subtitleText || "")
      .replace(/^(Narrator|Lalli|Fafa|Child|Girl Child|Boy Child)\s*:\s*/i, "")
      .replace(/^(Lalli|Fafa)\s+(said|replied|whispered|shouted|asked|cried|laughed|smiled and said)[,:]?\s*/i, "")
      .replace(/,?\s*(said|replied|whispered|shouted|asked|cried|laughed)\s+(Lalli|Fafa)\s*\.?$/i, "")
      .trim();
    if (childNameForSubtitle) {
      s = s.replace(
        new RegExp(`^${childNameForSubtitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*:\\s*`, "i"),
        ""
      );
    }
    return s;
  })();

  /* ── Loading / error states ── */
  if (story === undefined) return <LoadingScreen />;
  if (story === null) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "#131020" }}>
      <BookOpen size={48} style={{ color: "var(--lf-teal)", opacity: 0.4 }} />
      <p style={{ fontFamily: "'Nunito', sans-serif", color: "rgba(255,255,255,0.5)" }}>Story not found.</p>
      <Link href="/library" className="btn-primary">Back to library</Link>
    </div>
  );

  // Story failed — show a friendly error screen
  if (story.status === "error") return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5 px-6" style={{ background: "#131020" }}>
      <div style={{ fontSize: "3rem" }}>😔</div>
      <div className="text-center" style={{ maxWidth: 360 }}>
        <p style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.4rem", color: "#fff", marginBottom: "0.5rem" }}>
          Story generation failed
        </p>
        <p style={{ fontFamily: "'Nunito', sans-serif", color: "rgba(255,255,255,0.5)", fontSize: "0.9rem", lineHeight: 1.6 }}>
          Something went wrong while creating this story. Your credits were not charged.
        </p>
      </div>
      <div className="flex gap-3 flex-wrap justify-center">
        <Link href="/generate" className="btn-primary" style={{ fontSize: "0.9rem", padding: "0.6rem 1.4rem" }}>
          <Sparkles size={15} /> Try again
        </Link>
        <Link href="/library" style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.88rem", color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", gap: 6, padding: "0.6rem 1rem" }}>
          <Library size={15} /> Back to library
        </Link>
      </div>
    </div>
  );

  // Story is still being generated if it's in any in-progress status
  const IN_PROGRESS_STATUSES = new Set(["queued", "generating", "text_ready", "images_ready", "voice_ready"]);
  const isGenerating = story.status === "generating"; // kept for narrow "writing" stage checks

  // Early-unlock: start the story viewer as soon as 3+ scene images AND narration are available,
  // even if the backend hasn't promoted to "ready" yet. Scenes 4 & 5 images will stream in
  // progressively — by the time the reader reaches them they'll be ready.
  const readyImagesCount = imageUrls?.filter(u => u?.url).length ?? 0;
  const canEarlyUnlock = readyImagesCount >= 3 && !!narrationUrl;
  const isStillGenerating = !canEarlyUnlock && IN_PROGRESS_STATUSES.has(story.status ?? "");

  // Show the animated StoryForge loading screen while the story is in any generation stage
  if (isStillGenerating) {
    return (
      <StoryForgeLoadingScreen
        story={story}
        imageUrls={imageUrls}
        narrationUrl={narrationUrl}
      />
    );
  }

  return (
    <div
      ref={fullscreenRef}
      className="min-h-dvh flex flex-col"
      style={{
        background: t.bg,
        filter: bedtimeMode ? "brightness(0.65) saturate(0.7)" : "none",
        transition: "filter 0.8s ease, background 0.4s ease",
      }}
    >
      {/* ── "The End" overlay ── shown only as a fallback now: when the user opted
          out of the direct Challenge transition ("Do it later"), or when Challenge
          isn't available for this account (e.g. unauthenticated). Otherwise
          storyEnded routes straight into Story Challenge — see the useEffect above. */}
      {storyEnded && (skipChallenge || challengeEnabled === false) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-5"
          style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(10px)" }}
        >
          <div
            className="w-full max-w-sm flex flex-col items-center gap-5 p-7 rounded-3xl relative"
            style={{
              background: lightMode
                ? "linear-gradient(135deg,#FFF8E7 0%,#E6FAF6 50%,#F3EEFF 100%)"
                : "linear-gradient(135deg,#1a1740 0%,#0d2d26 50%,#1a1040 100%)",
              border: `2px solid ${lightMode ? "rgba(0,201,167,0.3)" : "rgba(0,201,167,0.4)"}`,
              boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
            }}
          >
            {/* Dismiss */}
            <button
              onClick={() => setStoryEnded(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center transition-all hover:bg-black/10"
              style={{ color: t.controlColor }}
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>

            {/* End graphic */}
            <div className="flex flex-col items-center gap-1.5">
              <span style={{ fontSize: "3rem", lineHeight: 1 }}>✨</span>
              <h2 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.9rem", color: "var(--lf-teal)", lineHeight: 1 }}>
                The End
              </h2>
              <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.85rem", color: t.textSoft, textAlign: "center", maxWidth: 260 }}>
                {story.title}
              </p>
            </div>

            {/* CTAs — Story Challenge is the most prominent option (gold, primary
                action rule), when this account is in the staged rollout.
                Continue/New Story stay available, secondary treatment, below. */}
            <div className="w-full flex flex-col gap-3">
              {challengeEnabled && (
                <Link
                  href={`/testserver/challenge/${storyId}`}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base transition-all hover:scale-[1.02] active:scale-95"
                  style={{ background: "linear-gradient(135deg,var(--lf-sunshine),#e6ac00)", color: "#1a1a2e", fontFamily: "'Baloo 2', sans-serif", boxShadow: "0 4px 20px rgba(249,199,0,0.4)" }}
                >
                  <Trophy size={18} /> Story Challenge
                </Link>
              )}
              <div className="w-full grid grid-cols-2 gap-3">
                <button
                  onClick={handleSequel}
                  disabled={sequelLoading}
                  className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-95"
                  style={{ background: "#fff", color: "var(--lf-dark)", border: "2px solid var(--lf-teal)", fontFamily: "'Baloo 2', sans-serif", opacity: sequelLoading ? 0.7 : 1 }}
                >
                  {sequelLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} color="var(--lf-teal)" />}
                  {sequelLoading ? "Creating…" : "Continue Adventure"}
                </button>
                <Link
                  href="/generate"
                  className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-95"
                  style={{ background: "#fff", color: "var(--lf-dark)", border: "2px solid #c9b99a", fontFamily: "'Baloo 2', sans-serif" }}
                >
                  <Sparkles size={16} color="var(--lf-teal)" /> Start New
                </Link>
              </div>
            </div>

            {/* Share row */}
            <div className="flex items-center gap-2">
              <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.68rem", fontWeight: 700, color: t.textSoft, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Share
              </span>
              <a href={waShareUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-9 h-9 rounded-full transition-all hover:scale-110 active:scale-95" style={{ background: "#25D366" }} title="WhatsApp">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12.05 2.095C6.495 2.095 1.984 6.616 1.984 12.178c0 1.768.47 3.431 1.296 4.875L2.013 22l5.087-1.331a9.924 9.924 0 004.95 1.31c5.555 0 10.066-4.52 10.066-10.083 0-2.697-1.05-5.23-2.958-7.14A9.98 9.98 0 0012.05 2.095z"/></svg>
              </a>
              <a href={fbShareUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-9 h-9 rounded-full transition-all hover:scale-110 active:scale-95" style={{ background: "#1877F2" }} title="Facebook">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <button onClick={copyLink} className="flex items-center justify-center w-9 h-9 rounded-full transition-all hover:scale-110 active:scale-95" style={{ background: t.panelBg, border: `1px solid ${t.panelBorder}`, color: shareCopied ? "var(--lf-teal)" : t.controlColor }} title="Copy link">
                {shareCopied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>

            {/* Upgrade nudge for free users */}
            {!isPremium && (
              <button
                onClick={() => setEndUpgradeModalOpen(true)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all hover:scale-[1.01] active:scale-[0.99]"
                style={{
                  background: "linear-gradient(135deg,rgba(0,201,167,0.15) 0%,rgba(128,0,255,0.12) 100%)",
                  border: "1.5px solid rgba(0,201,167,0.4)",
                }}
              >
                <div className="flex items-center gap-2.5">
                  <span style={{ fontSize: "1.2rem" }}>🌙</span>
                  <div className="text-left">
                    <p style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "0.82rem", color: t.text, lineHeight: 1 }}>
                      Tonight&apos;s story is just the beginning.
                    </p>
                    <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.72rem", color: t.textSoft, lineHeight: 1.3 }}>
                      Get more stories every month — Magic Pass from ₹199
                    </p>
                  </div>
                </div>
                <Sparkles size={15} style={{ color: "var(--lf-teal)", flexShrink: 0 }} />
              </button>
            )}
          </div>
        </div>
      )}

      <UpgradeModal
        open={endUpgradeModalOpen}
        onClose={() => setEndUpgradeModalOpen(false)}
        trigger="end_of_story"
        childName={(story as any)?.params?.childName ?? undefined}
      />

      {/* ── Sleep timer bottom sheet ── */}
      {bedtimeMenuOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setBedtimeMenuOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-t-3xl flex flex-col gap-2 p-5 pb-8"
            style={{ background: lightMode ? "#fff" : "#1a1730", border: `1px solid ${t.panelBorder}` }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-1">
              <p style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1rem", color: t.text }}>
                🌙 Sleep Timer
              </p>
              <button onClick={() => setBedtimeMenuOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ color: t.controlColor }}>
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 15, 30].map(m => (
                <button
                  key={m}
                  onClick={() => startSleepTimer(m)}
                  className="flex flex-col items-center gap-1 py-3 rounded-2xl transition-all active:scale-95"
                  style={{ background: t.panelBg, border: `1.5px solid ${t.panelBorder}`, cursor: "pointer" }}
                >
                  <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.1rem", color: t.text }}>{m}</span>
                  <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.68rem", color: t.textSoft }}>min</span>
                </button>
              ))}
            </div>
            {sleepRemaining > 0 && (
              <button
                onClick={() => { setSleepRemaining(0); setBedtimeMode(false); setBedtimeMenuOpen(false); }}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl mt-1 transition-all active:scale-95"
                style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.85rem", border: "1px solid rgba(239,68,68,0.2)" }}
              >
                <X size={14} /> Cancel timer ({Math.ceil(sleepRemaining / 60)}m left)
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Top bar ── */}
      <header
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ background: t.headerBg, backdropFilter: "blur(12px)", borderBottom: `1px solid ${t.panelBorder}`, height: 56, transition: "background 0.4s" }}
      >
        <Link
          href="/library"
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-full text-sm font-semibold transition-all"
          style={{ color: t.textSoft, fontFamily: "'Nunito', sans-serif" }}
        >
          <ArrowLeft size={15} />
        </Link>

        {/* Title + scene counter */}
        <div className="flex flex-col items-center gap-0.5 min-w-0 px-2">
          <p
            className="truncate max-w-[200px] sm:max-w-xs text-center"
            style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "0.88rem", color: t.text, lineHeight: 1.2 }}
          >
            {story.title ?? "Untitled Story"}
          </p>
          {numScenes > 0 && (
            <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 600, fontSize: "0.68rem", color: t.textFaint }}>
              Scene {currentScene + 1} of {numScenes}
            </span>
          )}
        </div>

        {/* Right side: light mode + bedtime */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Light/dark toggle */}
          <button
            onClick={() => setLightMode(m => !m)}
            className="flex items-center gap-1 px-2 py-1.5 rounded-full transition-all"
            title={lightMode ? "Dark mode" : "Light mode"}
            style={{ color: t.controlColor, background: t.panelBg, border: `1px solid ${t.panelBorder}` }}
          >
            {lightMode ? <Moon size={13} /> : <Sun size={13} />}
            <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.65rem", fontWeight: 700 }}>
              {lightMode ? "Dark" : "Light"}
            </span>
          </button>

          {/* Sleep timer button */}
          <div className="relative">
            <button
              onClick={() => setBedtimeMenuOpen(o => !o)}
              className="flex items-center justify-center w-8 h-8 rounded-full transition-all"
              title="Sleep timer"
              style={{ color: bedtimeMode ? "var(--lf-sunshine)" : t.controlColor }}
            >
              <Clock size={15} />
            </button>
            {sleepRemaining > 0 && (
              <span className="absolute -bottom-1 -right-1 px-1 rounded text-xs font-bold" style={{ background: "var(--lf-sunshine)", color: "#131020", fontSize: "0.55rem", lineHeight: "1.2" }}>
                {Math.ceil(sleepRemaining / 60)}m
              </span>
            )}
          </div>
        </div>
      </header>

      {/* ── Floating decorations (hidden in light mode) ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0, opacity: lightMode ? 0 : 1, transition: "opacity 0.5s" }}>
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
              style={{ background: "#1a1730" }}
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
                    className="object-contain"
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

              {/* Preload the next couple of scene images so switching scenes is
                  instant instead of showing a "Loading illustration…" spinner. */}
              {[1, 2].map(offset => {
                const idx = currentScene + offset;
                const preloadUrl = idx < numScenes ? imageUrls?.[idx]?.url : null;
                if (!preloadUrl) return null;
                return (
                  <div
                    key={`preload-${idx}`}
                    aria-hidden
                    style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", opacity: 0, pointerEvents: "none" }}
                  >
                    <Image src={preloadUrl} alt="" fill loading="eager" />
                  </div>
                );
              })}

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
              {effectiveSrc && (
                <audio ref={audioRef} src={effectiveSrc} onTimeUpdate={onTimeUpdate} onLoadedMetadata={onLoadedMetadata} onDurationChange={onDurationChange} onEnded={onEnded} onSeeked={onNarrationSeeked} preload="auto" />
              )}
              <audio ref={bgAudioRef} src={bgPlaylist[bgTrackIdx]} preload="auto" onEnded={() => setBgTrackIdx(i => (i + 1) % bgPlaylist.length)} />

              {/* Scene dots — bottom edge */}
              <div className="absolute bottom-1.5 left-0 right-0 flex items-center justify-center gap-1.5">
                {scenes.map((_, i) => (
                  <button key={i} onClick={() => setCurrentScene(i, true, titleOffset, sceneTimeline)} aria-label={`Scene ${i + 1}`}
                    style={{ width: i === currentScene ? 18 : 5, height: 5, borderRadius: 99, background: i === currentScene ? "var(--lf-teal)" : "rgba(255,255,255,0.3)", border: "none", padding: 0, cursor: "pointer", transition: "all 0.3s", flexShrink: 0 }}
                  />
                ))}
              </div>
            </div>

            {/* ── Subtitle strip ── */}
            <div
              className="w-full flex flex-col items-center justify-center px-4 py-2 rounded-2xl transition-all"
              style={{ minHeight: 48, background: t.subtitleBg, border: `1px solid ${t.panelBorder}`, transition: "background 0.4s" }}
            >
              {showSubtitles && cleanSubtitle ? (
                <div key={subtitleText} className="flex flex-col items-center gap-1 w-full">
                  {speaker && (
                    <span
                      className="px-2.5 py-0.5 rounded-full text-xs font-black tracking-widest"
                      style={{
                        background: speaker.color,
                        // Lalli (yellow) and Child (mango orange) are light → dark text; Fafa (teal) is dark → white text
                        color: (speaker.name === "Lalli" || speaker.name === "Child") ? "#131020" : "#fff",
                        fontFamily: "'Baloo 2', sans-serif",
                        textTransform: "uppercase",
                        fontSize: "0.65rem",
                        letterSpacing: "0.08em",
                      }}
                    >
                      {speaker.displayName}
                    </span>
                  )}
                  <p
                    className="subtitle-text text-center"
                    style={{
                      fontFamily: speaker ? "'Baloo 2', sans-serif" : "'Nunito', sans-serif",
                      fontWeight: speaker ? 700 : 500,
                      fontStyle: speaker ? "normal" : "italic",
                      lineHeight: 1.5,
                      color: speaker ? speaker.color : t.textSoft,
                      margin: 0,
                    }}
                  >
                    {cleanSubtitle}
                  </p>
                </div>
              ) : (
                <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.75rem", color: t.textFaint, margin: 0 }}>
                  {showSubtitles ? "♪" : "Subtitles off"}
                </p>
              )}
            </div>

            {/* ── Audio controls bar ── */}
            <div
              className="w-full flex flex-col gap-2 px-4 py-3 rounded-2xl"
              style={{ background: t.panelBg, border: `1px solid ${t.panelBorder}`, transition: "background 0.4s" }}
            >
              {/* Seek bar */}
              <div className="flex items-center gap-3">
                <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.72rem", fontWeight: 700, color: t.textFaint, minWidth: 34, textAlign: "right" }}>
                  {formatTime(currentTime)}
                </span>
                <div className="flex-1 relative h-1.5 rounded-full" style={{ background: lightMode ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.12)" }}>
                  <div className="absolute left-0 top-0 h-full rounded-full" style={{ width: duration ? `${Math.min(100, (currentTime / duration) * 100)}%` : "0%", background: "linear-gradient(90deg,var(--lf-teal),#00a38d)" }} />
                  <input type="range" min={0} max={duration || 0} step={0.1} value={currentTime} onChange={onScrubberChange} onMouseDown={() => setSeeking(true)} onMouseUp={() => setSeeking(false)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" style={{ margin: 0 }} />
                </div>
                <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.72rem", fontWeight: 700, color: t.textFaint, minWidth: 34 }}>
                  {formatTime(duration)}
                </span>
              </div>

              {/* Controls row — warm-neutral idle borders, gold for the primary
                  play/pause control, teal accents for secondary controls
                  (same system as the option cards on /generate). */}
              <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
                {/* Volume */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={toggleMute}
                    className="flex items-center justify-center w-7 h-7 rounded-full transition-all hover:scale-110 hover:text-[var(--lf-teal)]"
                    style={{ color: t.controlColor, border: `1px solid ${lightMode ? "rgba(180,148,92,0.4)" : "rgba(224,198,150,0.28)"}` }}
                  >
                    {muted || volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  </button>
                  <div className="relative w-16 h-1 rounded-full hidden sm:block" style={{ background: "rgba(255,255,255,0.12)" }}>
                    <div className="absolute left-0 top-0 h-full rounded-full" style={{ width: `${muted ? 0 : volume * 100}%`, background: "rgba(255,255,255,0.45)" }} />
                    <input type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume} onChange={onVolumeChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  </div>
                </div>

                {/* Playback */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <button
                    onClick={() => skip(-10)}
                    className="flex items-center justify-center w-7 h-7 rounded-full transition-all hover:scale-110 hover:text-[var(--lf-teal)]"
                    style={{ color: t.controlColor, border: `1px solid ${lightMode ? "rgba(180,148,92,0.4)" : "rgba(224,198,150,0.28)"}` }}
                    title="Back 10s"
                  ><SkipBack size={14} /></button>
                  <button onClick={() => setCurrentScene(currentScene - 1, true, titleOffset, sceneTimeline)} disabled={currentScene === 0} className="transition-all hover:scale-110 hover:text-[var(--lf-teal)] disabled:opacity-20" style={{ color: t.textSoft }}><ChevronLeft size={20} /></button>
                  <button
                    onClick={togglePlay}
                    className="flex items-center justify-center rounded-full transition-all hover:scale-110 active:scale-95"
                    style={{ width: 48, height: 48, background: "linear-gradient(135deg,#f9c700,#ffab00)", color: "#1a1a2e", boxShadow: "0 3px 18px rgba(249,199,0,0.45)", flexShrink: 0 }}
                  >
                    {isPlaying ? <Pause size={20} fill="#1a1a2e" /> : <Play size={20} fill="#1a1a2e" style={{ marginLeft: 2 }} />}
                  </button>
                  <button onClick={() => setCurrentScene(currentScene + 1, true, titleOffset, sceneTimeline)} disabled={currentScene === numScenes - 1} className="transition-all hover:scale-110 hover:text-[var(--lf-teal)] disabled:opacity-20" style={{ color: t.textSoft }}><ChevronRight size={20} /></button>
                  <button
                    onClick={() => skip(10)}
                    className="flex items-center justify-center w-7 h-7 rounded-full transition-all hover:scale-110 hover:text-[var(--lf-teal)]"
                    style={{ color: t.controlColor, border: `1px solid ${lightMode ? "rgba(180,148,92,0.4)" : "rgba(224,198,150,0.28)"}` }}
                    title="Forward 10s"
                  ><SkipForward size={14} /></button>
                </div>

                {/* Right: speed + CC + text panel + fullscreen */}
                <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                  {/* Speed control */}
                  <div className="flex items-center rounded overflow-hidden flex-shrink-0" style={{ border: `1px solid ${lightMode ? "rgba(180,148,92,0.4)" : "rgba(224,198,150,0.28)"}` }}>
                    {[1, 1.25, 1.5].map(rate => (
                      <button
                        key={rate}
                        onClick={() => setPlaybackRate(rate)}
                        style={{
                          fontFamily: "'Nunito', sans-serif",
                          fontWeight: 800,
                          fontSize: "0.6rem",
                          color: playbackRate === rate ? "#fff" : t.controlColor,
                          background: playbackRate === rate ? "var(--lf-teal)" : "transparent",
                          border: "none",
                          cursor: "pointer",
                          padding: "0.28rem 0.45rem",
                          lineHeight: 1,
                          transition: "background 0.15s, color 0.15s",
                        }}
                      >
                        {rate}×
                      </button>
                    ))}
                  </div>
                  {/* CC — subtitle on/off */}
                  <button
                    onClick={() => setShowSubtitles(s => !s)}
                    className="px-2 py-1 rounded transition-all hover:bg-white/10"
                    title={showSubtitles ? "Hide subtitles" : "Show subtitles"}
                    style={{
                      fontFamily: "monospace",
                      fontWeight: 800,
                      fontSize: "0.65rem",
                      letterSpacing: "0.04em",
                      color: showSubtitles ? "var(--lf-teal)" : t.textFaint,
                      border: `1px solid ${showSubtitles ? "rgba(0,201,167,0.4)" : lightMode ? "rgba(180,148,92,0.4)" : "rgba(224,198,150,0.28)"}`,
                      borderRadius: 4,
                      lineHeight: 1,
                      padding: "0.25rem 0.4rem",
                    }}
                  >
                    CC
                  </button>

                  {/* Text panel toggle */}
                  <button
                    onClick={() => setShowTextPanel(p => !p)}
                    className="px-2.5 py-1 rounded-full transition-all hover:bg-white/10"
                    style={{
                      fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "0.72rem",
                      color: showTextPanel ? "var(--lf-teal)" : t.textFaint,
                      border: `1px solid ${showTextPanel ? "rgba(0,201,167,0.35)" : lightMode ? "rgba(180,148,92,0.4)" : "rgba(224,198,150,0.28)"}`,
                    }}
                    title="Toggle full story text"
                  >
                    📖
                  </button>

                  {/* Fullscreen toggle — hidden on mobile: little value on a
                      phone browser (already full-width) and the biggest single
                      item crowding this row, pushing CC off-screen on narrow
                      viewports. */}
                  <button
                    onClick={toggleFullscreen}
                    className="hidden sm:flex items-center justify-center w-7 h-7 rounded-full transition-all hover:scale-110 hover:text-[var(--lf-teal)]"
                    title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                    style={{ color: t.controlColor, border: `1px solid ${lightMode ? "rgba(180,148,92,0.4)" : "rgba(224,198,150,0.28)"}` }}
                  >
                    {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
                  </button>
                </div>
              </div>

              {/* Story text panel — collapsible, shows all sentences with active one highlighted */}
              {showTextPanel && sceneSentences.length > 0 && (
                <div
                  className="mt-2 flex flex-col gap-1.5 max-h-44 overflow-y-auto rounded-xl px-4 py-3"
                  style={{ background: lightMode ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.4)", border: `1px solid ${t.panelBorder}` }}
                >
                  {sceneSentences.map((sentence, i) => (
                    <p
                      key={i}
                      style={{
                        fontFamily: "'Nunito', sans-serif",
                        fontSize: "0.82rem",
                        lineHeight: 1.6,
                        color: i === activeSubtitleIdx
                          ? t.text
                          : t.textFaint,
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


            {/* ── Compact share row ── */}
            <div className="w-full flex items-center gap-2 justify-center">
              <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.68rem", fontWeight: 600, color: t.textFaint, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Share
              </span>
              <a href={waShareUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-9 h-9 rounded-full transition-all hover:scale-110 active:scale-95" style={{ background: "#25D366" }} title="WhatsApp">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12.05 2.095C6.495 2.095 1.984 6.616 1.984 12.178c0 1.768.47 3.431 1.296 4.875L2.013 22l5.087-1.331a9.924 9.924 0 004.95 1.31c5.555 0 10.066-4.52 10.066-10.083 0-2.697-1.05-5.23-2.958-7.14A9.98 9.98 0 0012.05 2.095z"/></svg>
              </a>
              <a href={fbShareUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-9 h-9 rounded-full transition-all hover:scale-110 active:scale-95" style={{ background: "#1877F2" }} title="Facebook">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <button onClick={handleShare} className="flex items-center justify-center w-9 h-9 rounded-full transition-all hover:scale-110 active:scale-95" style={{ background: "linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)" }} title="Instagram">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </button>
              <button onClick={copyLink} className="flex items-center justify-center w-9 h-9 rounded-full transition-all hover:scale-110 active:scale-95" style={{ background: t.panelBg, border: `1px solid ${t.panelBorder}`, color: shareCopied ? "var(--lf-teal)" : t.controlColor }} title="Copy link">
                {shareCopied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>

            {/* ── Vocabulary Builder ── */}
            {story.content && extractVocabulary(story.content).length > 0 && (
              <div className="w-full flex flex-col gap-2">
                <button
                  onClick={() => setShowVocab(v => !v)}
                  className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl transition-all"
                  style={{ background: lightMode ? "rgba(0,201,167,0.08)" : "rgba(0,201,167,0.1)", border: `1px solid ${lightMode ? "rgba(0,201,167,0.2)" : "rgba(0,201,167,0.25)"}`, cursor: "pointer" }}
                >
                  <span style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "0.85rem", fontWeight: 800, color: "var(--lf-teal)" }}>
                    📖 Words to Learn
                  </span>
                  <span style={{ fontSize: "0.7rem", color: "var(--lf-teal)", fontWeight: 700 }}>{showVocab ? "▾" : "▸"}</span>
                </button>
                {showVocab && (
                  <div className="flex flex-col gap-2">
                    {extractVocabulary(story.content!).map(({ word, meaning, context }) => (
                      <div
                        key={word}
                        className="flex flex-col gap-1 px-4 py-3 rounded-xl"
                        style={{ background: t.panelBg, border: `1px solid ${t.panelBorder}` }}
                      >
                        <div className="flex items-baseline gap-2">
                          <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "0.95rem", color: "var(--lf-teal)" }}>
                            {word}
                          </span>
                          <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.78rem", color: t.textSoft }}>
                            — {meaning}
                          </span>
                        </div>
                        <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.72rem", color: t.textFaint, lineHeight: 1.5, fontStyle: "italic", margin: 0 }}>
                          &ldquo;{context.length > 100 ? context.slice(0, 100) + "…" : context}&rdquo;
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

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
        style={{ background: t.footerBg, borderTop: `1px solid ${t.footerBorder}`, transition: "background 0.4s" }}
      >
        <Link href="/library" className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: t.textFaint, fontFamily: "'Nunito', sans-serif" }}>
          <Library size={13} /> Library
        </Link>
        <Link href="/dashboard" className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: t.textFaint, fontFamily: "'Nunito', sans-serif" }}>
          <Sparkles size={13} /> Dashboard
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
            <span style={{ fontSize: "1rem" }}>🔬</span>
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
   Loading screen (auth / data not yet loaded)
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

/* ────────────────────────────────────────────────────────────────
   StoryForge loading screen
   Shown while story generation is in progress. Uses real-time
   Convex data to display which stage we're in and how many
   scene images have been painted so far.
──────────────────────────────────────────────────────────────── */
const FORGE_MESSAGES: Array<[string, string]> = [
  ["✍️", "Lalli is sharpening her pencil…"],
  ["🦊", "Fafa just had three ideas at once…"],
  ["🌟", "Mixing the perfect palette of words…"],
  ["🎨", "Fafa accidentally sat in the paint again…"],
  ["🦁", "Lalli is making sure every detail is right…"],
  ["✨", "Sprinkling a little magic on the pages…"],
  ["📖", "The story is coming to life…"],
  ["🎙️", "Warming up the voices for narration…"],
  ["🖌️", "Choosing colours brighter than usual…"],
  ["🦊", "Fafa is rehearsing a dramatic gasp…"],
  ["🦁", "Lalli is double-checking the happy ending…"],
  ["🌙", "Tucking in a few cozy little details…"],
  ["🎬", "Setting the scene, lights, action…"],
  ["🐾", "Following Lalli and Fafa's footprints…"],
  ["🧁", "Adding a sprinkle of bedtime magic…"],
  ["🪄", "Almost time to turn the first page…"],
];

// Appends a couple of messages personalised with the real child's name and
// chosen theme when available, rather than replacing the generic set.
function buildForgeMessages(childName?: string, theme?: string): Array<[string, string]> {
  const messages = [...FORGE_MESSAGES];
  if (childName) messages.push(["💫", `Getting everything just right for ${childName}…`]);
  if (theme) messages.push(["🌟", `Adding extra sparkle to this ${theme} adventure…`]);
  return messages;
}

// Playful reactions when a child taps Lalli & Fafa while waiting — a small
// bit of "something to do" rather than only watching a progress bar.
const POKE_LINES = [
  "Hee hee, that tickles!",
  "Almost done, we promise!",
  "Lalli says hi! 👋",
  "Fafa wants a snack while we wait 🐰",
  "Shh… a big surprise is coming!",
  "Tee-hee! Do that again!",
];

// Small badge emoji shown on the hero visual at each stage.
const STAGE_BADGE: Record<1 | 2 | 3, string> = { 1: "✍️", 2: "🎨", 3: "🎙️" };

// Rich illustrated scenes (real story art already used elsewhere on the
// site) cycled as a slider during the "writing" stage — there's no real
// generated artwork yet at that point, so this replaces what used to be one
// static, plain character cutout with the same kind of visual variety the
// child will see once their own story is ready.
const WAITING_SLIDER: Array<{ src: string; caption: string }> = [
  { src: "/frame-2-action (5).png", caption: "Picking oranges in the orchard 🍊" },
  { src: "/frame-2-action (2).png", caption: "Snuggled up with a bedtime story 📖" },
  { src: "/frame-1-setup (4).png", caption: "Game night by the fireplace 🎲" },
  { src: "/ChatGPT_Image_2026-01-16_01.png", caption: "Flying kites on a sunny rooftop 🪁" },
  { src: "/ChatGPT_Image_2026-01-11_01.png", caption: "Learning about the solar system 🪐" },
  { src: "/frame_1 (3).png", caption: "A magical meadow picnic 🦚" },
  { src: "/lalli-fafa-frame-2--action (42).png", caption: "Waving the flag with pride 🇮🇳" },
  { src: "/lf-scene-bilingual-grandma.jpg", caption: "Story time with Dadi 👵" },
  { src: "/lf-scene-cognitive-blocks.jpg", caption: "Building and thinking together 🧩" },
  { src: "/lf-scene-feelings-bench.jpg", caption: "There for each other, always 💛" },
  { src: "/lf-scene-reading-aloud.jpg", caption: "Reading a favourite tale 📚" },
  { src: "/land2.png", caption: "Cleaning up the beach together 🌊" },
  { src: "/land3.png", caption: "Giggles on a pillow pile 😄" },
  { src: "/lf-scene-puppy.png", caption: "Making a new furry friend 🐶" },
];

function StoryForgeLoadingScreen({
  story,
  imageUrls,
  narrationUrl,
}: {
  story: StoryShape;
  imageUrls: Array<{ url?: string | null }> | null | undefined;
  narrationUrl: string | null;
}) {
  const [msgIdx, setMsgIdx] = useState(0);
  const [dots, setDots] = useState(".");
  const [writingElapsed, setWritingElapsed] = useState(0);
  const [poke, setPoke] = useState<string | null>(null);
  const pokeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const childName = story.params?.childName?.trim() || undefined;
  const theme = story.params?.theme;
  const forgeMessages = useMemo(() => buildForgeMessages(childName, theme), [childName, theme]);

  function handlePoke() {
    setPoke(POKE_LINES[Math.floor(Math.random() * POKE_LINES.length)]);
    if (pokeTimeoutRef.current) clearTimeout(pokeTimeoutRef.current);
    pokeTimeoutRef.current = setTimeout(() => setPoke(null), 2200);
  }

  useEffect(() => () => { if (pokeTimeoutRef.current) clearTimeout(pokeTimeoutRef.current); }, []);

  // Rotates the "writing stage" illustration slider every 4.5s. Tapping the
  // card also advances it manually (plus triggers a poke reaction), so
  // there's something to actively do, not just watch.
  const [sliderIdx, setSliderIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSliderIdx(i => (i + 1) % WAITING_SLIDER.length), 4500);
    return () => clearInterval(id);
  }, []);

  // Screen Wake Lock — keep screen on while story generates
  useEffect(() => {
    if (!("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let released = false;
    const acquire = async () => {
      try {
        lock = await navigator.wakeLock.request("screen");
        if (released) { lock.release().catch(() => {}); lock = null; }
      } catch { /* unsupported or denied */ }
    };
    acquire();
    const onVisible = () => { if (document.visibilityState === "visible" && !lock) acquire(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      released = true;
      document.removeEventListener("visibilitychange", onVisible);
      lock?.release().catch(() => {});
    };
  }, []);

  // Soft ambient music while waiting — picks one track at random and loops it quietly.
  const loadingMusicRef = useRef<HTMLAudioElement>(null);
  // Picked client-side only, after mount (starts null so server and first
  // client render both omit `src`) — picking randomly in the useState
  // initializer ran once during SSR and again on hydration, landing on two
  // different tracks and triggering a real hydration mismatch every load.
  const [musicTrack, setMusicTrack] = useState<string | null>(null);
  useEffect(() => {
    setMusicTrack(BG_TRACKS[Math.floor(Math.random() * BG_TRACKS.length)]);
  }, []);
  const [musicMuted, setMusicMuted] = useState(false);

  // Waits for `musicTrack` (and therefore the <audio> element's `src`) to
  // actually commit before attempting playback, instead of racing it.
  useEffect(() => {
    const audio = loadingMusicRef.current;
    if (!audio || !musicTrack) return;
    audio.volume = BG_VOLUME;
    audio.muted = true;
    audio.play().then(() => { audio.muted = false; }).catch(() => { audio.muted = false; });
  }, [musicTrack]);

  const toggleMusic = () => {
    const audio = loadingMusicRef.current;
    if (!audio) return;
    const next = !musicMuted;
    setMusicMuted(next);
    audio.muted = next;
    if (!next) audio.play().catch(() => {});
  };

  // Cycle fun messages every 3.5 seconds
  useEffect(() => {
    const id = setInterval(() => setMsgIdx(i => (i + 1) % forgeMessages.length), 3500);
    return () => clearInterval(id);
  }, [forgeMessages.length]);

  // Animate ellipsis
  useEffect(() => {
    const id = setInterval(() => setDots(d => d.length >= 3 ? "." : d + "."), 500);
    return () => clearInterval(id);
  }, []);

  // Tick up a counter while the story text is being written, so the
  // progress bar creeps forward instead of sitting frozen on one number.
  useEffect(() => {
    const id = setInterval(() => setWritingElapsed(s => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const status = story.status ?? "generating";
  const imagesReady = imageUrls?.filter(u => u?.url).length ?? 0;
  const TOTAL_SCENES = 5;

  // Stage logic
  let stage: 1 | 2 | 3;
  let stageTitle: string;
  let stageDesc: string;
  let progress: number;

  if (status === "generating") {
    stage = 1;
    stageTitle = "Writing the story" + dots;
    stageDesc = childName ? `Lalli & Fafa are crafting ${childName}'s personalised adventure` : "Lalli & Fafa are crafting your personalised adventure";
    // Creep from 12% to 28% over the first ~40s, then hold — never reach stage 2's 30%.
    progress = Math.min(28, 12 + writingElapsed * 0.4);
  } else if (imagesReady < TOTAL_SCENES) {
    stage = 2;
    stageTitle = `Painting scene ${imagesReady + 1} of ${TOTAL_SCENES}` + dots;
    stageDesc = theme ? `Bringing your ${theme} world to life, one scene at a time` : "Creating unique illustrations for each moment";
    progress = 30 + (imagesReady / TOTAL_SCENES) * 48;
  } else if (!narrationUrl) {
    stage = 3;
    stageTitle = "Recording the voices" + dots;
    stageDesc = "Lalli, Fafa & friends are warming up their voices";
    progress = 88;
  } else {
    stage = 3;
    stageTitle = "Almost ready!";
    stageDesc = childName ? `${childName}'s story is about to begin…` : "Just a moment more…";
    progress = 96;
  }

  const [emoji, funMsg] = forgeMessages[msgIdx % forgeMessages.length];
  const badge = STAGE_BADGE[stage];
  const slide = WAITING_SLIDER[sliderIdx % WAITING_SLIDER.length];
  const lastSceneUrl = imageUrls?.[imagesReady - 1]?.url;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, #FFF8E7 0%, #E6FAF6 40%, #F3EEFF 70%, #FFE8EC 100%)" }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn { from { transform: scale(0.4); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes bounceOnce { 0%,100% { transform: scale(1); } 30% { transform: scale(1.12) rotate(-3deg); } 60% { transform: scale(0.96) rotate(2deg); } }
      `}</style>
      {/* Soft colorful glow orbs */}
      <div style={{ position: "absolute", top: "5%", left: "5%", width: 300, height: 300, background: "radial-gradient(circle, rgba(0,201,167,0.2) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "8%", right: "3%", width: 350, height: 350, background: "radial-gradient(circle, rgba(249,199,0,0.18) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "40%", right: "10%", width: 220, height: 220, background: "radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "30%", left: "8%", width: 200, height: 200, background: "radial-gradient(circle, rgba(255,140,105,0.15) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />

      {musicTrack && <audio ref={loadingMusicRef} src={musicTrack} loop />}

      <Link
        href="/library"
        className="absolute top-5 left-5 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:bg-black/5"
        style={{ color: "rgba(45,45,45,0.45)", fontFamily: "'Nunito', sans-serif" }}
      >
        <ArrowLeft size={13} /> Library
      </Link>

      <button
        onClick={toggleMusic}
        aria-label={musicMuted ? "Unmute music" : "Mute music"}
        className="absolute top-5 right-5 flex items-center justify-center w-9 h-9 rounded-full transition-all hover:bg-black/5"
        style={{ color: "rgba(45,45,45,0.4)", border: "1px solid rgba(0,0,0,0.08)" }}
      >
        {musicMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
      </button>

      {/* Brand wordmark */}
      <div className="flex items-center gap-2">
        <Sparkles size={14} style={{ color: "var(--lf-teal)" }} />
        <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 900, fontSize: "1rem", letterSpacing: "0.1em", color: "var(--lf-teal)", textTransform: "uppercase" }}>
          StoryForge
        </span>
        <Sparkles size={14} style={{ color: "var(--lf-teal)" }} />
      </div>

      {/* Hero visual — while writing (nothing real to show yet), a rotating
          slider of Lalli & Fafa's illustrated world stands in for what used
          to be one static, plain character cutout. Once real scenes start
          arriving (stage 2+), the actual generated artwork takes over below
          instead — more exciting than stock art once the real thing exists. */}
      {stage === 1 && (
        <div className="relative flex flex-col items-center gap-2">
          {/* Preload every slider illustration at the exact same box size used
              below (220x150, object-cover) so each 4.5s rotation swaps to an
              already-cached image instead of triggering a fresh network
              fetch — that fetch was showing as a white flash on every swap,
              worst on mobile data. */}
          <div aria-hidden style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", opacity: 0, pointerEvents: "none" }}>
            {WAITING_SLIDER.map((s) => (
              <div key={s.src} className="relative" style={{ width: 220, height: 150 }}>
                <Image src={s.src} alt="" fill className="object-cover" sizes="220px" />
              </div>
            ))}
          </div>
          {poke && (
            <div
              className="absolute px-3 py-1.5 rounded-2xl text-xs font-bold text-center"
              style={{ top: -16, background: "#fff", border: "1.5px solid var(--lf-teal)", color: "var(--lf-dark)", fontFamily: "'Nunito', sans-serif", animation: "fadeIn 0.3s ease", whiteSpace: "nowrap", boxShadow: "0 4px 12px rgba(0,0,0,0.12)", zIndex: 2 }}
            >
              {poke}
            </div>
          )}
          <button
            onClick={() => { handlePoke(); setSliderIdx(i => (i + 1) % WAITING_SLIDER.length); }}
            aria-label="See another Lalli and Fafa moment"
            className="relative rounded-2xl"
            style={{ width: 220, height: 150, background: "#fff", padding: 6, boxShadow: "0 12px 30px rgba(0,0,0,0.18)", transform: "rotate(-1.5deg)", border: "none", cursor: "pointer" }}
          >
            <div key={sliderIdx} className="relative w-full h-full rounded-xl overflow-hidden">
              <Image src={slide.src} alt="" fill className="object-cover" sizes="220px" style={{ animation: poke ? "bounceOnce 0.5s ease" : "fadeIn 0.6s ease" }} />
            </div>
            <span
              className="absolute flex items-center justify-center rounded-full"
              style={{ top: -8, right: -8, width: 30, height: 30, background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.2)", fontSize: "1.05rem" }}
            >
              {badge}
            </span>
          </button>
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.78rem", fontWeight: 600, color: "rgba(45,45,45,0.5)", textAlign: "center" }}>
            {slide.caption}
          </p>
        </div>
      )}

      {/* Stage title */}
      <div className="flex flex-col items-center gap-1.5 text-center max-w-sm">
        <h2 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.35rem", color: "var(--lf-dark)", lineHeight: 1.3 }}>
          {stageTitle}
        </h2>
        <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.88rem", color: "rgba(45,45,45,0.5)", lineHeight: 1.5 }}>
          {stageDesc}
        </p>
      </div>

      {/* Stage pills */}
      <div className="flex items-center gap-2">
        {[
          { n: 1, icon: "✍️", label: "Writing" },
          { n: 2, icon: "🎨", label: "Illustrating" },
          { n: 3, icon: "🎙️", label: "Recording" },
        ].map(({ n, icon, label }) => (
          <div
            key={n}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
            style={{
              background: stage === n
                ? "rgba(0,201,167,0.15)"
                : stage > n
                  ? "rgba(0,201,167,0.08)"
                  : "rgba(0,0,0,0.04)",
              border: `1px solid ${stage >= n ? "rgba(0,201,167,0.4)" : "rgba(0,0,0,0.08)"}`,
              color: stage === n
                ? "var(--lf-teal)"
                : stage > n
                  ? "rgba(0,201,167,0.6)"
                  : "rgba(45,45,45,0.3)",
              fontFamily: "'Nunito', sans-serif",
              transform: stage === n ? "scale(1.05)" : "scale(1)",
            }}
          >
            <span>{stage > n ? "✓" : icon}</span>
            <span className="hidden sm:inline">{label}</span>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-sm flex flex-col gap-2">
        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.08)" }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, var(--lf-teal), #00a38d)",
              boxShadow: "0 0 12px rgba(0,201,167,0.5)",
              transition: "width 1.5s ease-out",
            }}
          />
        </div>
        <div className="flex items-center justify-between">
          <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.68rem", color: "rgba(45,45,45,0.35)" }}>
            {Math.round(progress)}%
          </span>
          <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.68rem", color: "rgba(45,45,45,0.35)" }}>
            This takes 1–2 min
          </span>
        </div>
      </div>

      {/* Storybook page preview — the latest painted scene, shown large as a
          tilted polaroid rather than a row of tiny thumbnails, so watching
          the illustrations arrive actually feels like something happening. */}
      {lastSceneUrl && (
        <div className="flex flex-col items-center gap-3">
          <div
            key={imagesReady}
            className="relative rounded-2xl"
            style={{ width: 220, height: 150, background: "#fff", padding: 6, boxShadow: "0 12px 30px rgba(0,0,0,0.18)", transform: "rotate(-1.5deg)", animation: "popIn 0.5s ease" }}
          >
            <div className="relative w-full h-full rounded-xl overflow-hidden">
              <Image src={lastSceneUrl} alt={`Scene ${imagesReady}`} fill className="object-cover" style={{ animation: "fadeIn 0.6s ease" }} />
            </div>
            <div
              className="absolute flex items-center justify-center rounded-full font-bold"
              style={{ top: -8, right: -8, width: 30, height: 30, background: "var(--lf-teal)", color: "#fff", fontSize: "0.72rem", fontFamily: "'Nunito', sans-serif", boxShadow: "0 2px 8px rgba(0,0,0,0.25)" }}
            >
              {imagesReady}/{TOTAL_SCENES}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: TOTAL_SCENES }, (_, i) => (
              <span
                key={i}
                style={{
                  width: i < imagesReady ? 18 : 7,
                  height: 7,
                  borderRadius: 99,
                  background: i < imagesReady ? "var(--lf-teal)" : "rgba(0,0,0,0.12)",
                  transition: "all 0.4s ease",
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Fun rotating message */}
      <div
        key={msgIdx}
        className="flex items-center gap-2 px-5 py-3 rounded-2xl"
        style={{
          background: "#fff",
          border: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
          animation: "fadeIn 0.5s ease",
          maxWidth: 340,
        }}
      >
        <span style={{ fontSize: "1.2rem" }}>{emoji}</span>
        <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.82rem", color: "rgba(45,45,45,0.6)", lineHeight: 1.4, margin: 0 }}>
          {funMsg}
        </p>
      </div>

      {/* Story title preview */}
      {story.title && (
        <div className="flex flex-col items-center gap-1 text-center">
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.7rem", color: "rgba(45,45,45,0.3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Your story
          </p>
          <p style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: "1.05rem", color: "rgba(45,45,45,0.7)", textAlign: "center", maxWidth: 300 }}>
            &ldquo;{story.title}&rdquo;
          </p>
        </div>
      )}
    </div>
  );
}
