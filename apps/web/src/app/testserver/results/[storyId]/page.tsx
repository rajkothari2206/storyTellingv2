"use client";

// TESTSERVER screen 6 — Results (Functional Spec v1.1 §5.6, amended per
// owner request 2026-08-16 — see "Results screen v1.2 addendum" in the
// functional spec doc). Adds: a mood-reactive celebration header with Lalli
// & Fafa speech bubbles, and an expandable full Story Challenge review with
// per-question correct/incorrect colour coding. The aggregate score itself
// is still absolute-only, never a percentile, and Emotional intelligence
// questions are still never graded right/wrong (§5.5) — only the 7 gradable
// questions get green/red treatment in the review.

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { Check, ChevronDown, Loader2, Star, Trophy, X } from "lucide-react";
import Image from "next/image";
import Lottie from "lottie-react";
import { useLottieJson } from "../../_lib/useLottie";
import {
  GROWING_IN_COPY,
  GROWTH_STORY_SUGGESTIONS,
  PILLAR_COLORS,
  PILLAR_EMOJI,
  PILLAR_IMAGES,
  PILLAR_LABELS,
  PILLAR_ORDER,
  SUPERPOWER_COPY,
  type Pillar,
} from "../../_lib/pillars";

type Mood = "high" | "average" | "low";

const MOOD_THEME: Record<Mood, {
  bg: string; border: string; badge: string; moodEmoji: string; headline: (name: string) => string;
  lalliLine: (name: string) => string; fafaLine: (name: string) => string;
}> = {
  high: {
    bg: "linear-gradient(160deg,#FFF9DB 0%,#FFE8A8 100%)",
    border: "rgba(255,193,7,0.4)",
    badge: "#a16a00",
    moodEmoji: "🤩",
    headline: (name) => `Amazing job, ${name}!!`,
    lalliLine: (name) => `You were AMAZING, ${name}! ⭐`,
    fafaLine: () => "Woohoo!! Let's do that again!! 🎉",
  },
  average: {
    bg: "linear-gradient(160deg,#E8F8F5 0%,#D5F3ED 100%)",
    border: "rgba(0,201,167,0.35)",
    badge: "#00695c",
    moodEmoji: "💪",
    headline: (name) => `Great try, ${name}! 💪`,
    lalliLine: (name) => `You did great, ${name}! Let's explore even more 🌈`,
    fafaLine: () => "Next time we'll go even further! 🚀",
  },
  low: {
    bg: "linear-gradient(160deg,#F3EEFF 0%,#FFF3E0 100%)",
    border: "rgba(124,77,255,0.3)",
    badge: "#6a3fd6",
    moodEmoji: "🌱",
    headline: (name) => `You can do it, ${name}!`,
    lalliLine: () => "Try again with us — every story makes you smarter! 🌙",
    fafaLine: (name) => `You can do it, ${name}! I believe in you 🤗`,
  },
};

function moodFor(ratio: number): Mood {
  if (ratio >= 0.8) return "high";
  if (ratio >= 0.5) return "average";
  return "low";
}

export default function ResultsScreen() {
  const { storyId } = useParams<{ storyId: string }>();
  const router = useRouter();
  const sid = storyId as Id<"stories">;

  const challenge = useQuery(api["testserver/challenge"].getForStory, { storyId: sid });
  const history = useQuery(api["testserver/challenge"].getHistory, {});
  const [showReview, setShowReview] = useState(false);
  const stars = useLottieJson("/lottie/stars.json");
  // Real (allowlisted, non-admin) users land here from the production end-of-
  // story screen and should stay in the production story/dashboard flow, not
  // get routed into testserver's own parallel generating/player pages, which
  // are for admin testing only.
  const role = useQuery(api.auth.getUserRole, {});
  const isAdmin = role === "admin";
  const homeHref = isAdmin ? "/testserver" : "/dashboard";

  if (!challenge || challenge.status !== "completed" || !challenge.score || !history) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 className="animate-spin" size={28} color="var(--lf-teal)" />
      </div>
    );
  }

  const score = challenge.score;
  const currentPos = history.findIndex((h: any) => h._id === challenge._id);
  const previous = currentPos >= 0 ? history[currentPos + 1] : undefined;

  const growingIn = score.growingInPillar as Pillar;
  const superpower = score.superpowerPillar as Pillar;
  const suggestion = GROWTH_STORY_SUGGESTIONS[growingIn];

  const ratio = score.gradableTotal > 0 ? score.gradableCorrect / score.gradableTotal : 0;
  const mood = moodFor(ratio);
  const theme = MOOD_THEME[mood];
  const childName = challenge.childName;

  return (
    <div style={{ flex: 1, position: "relative", display: "flex", flexDirection: "column", maxWidth: 460, margin: "0 auto", width: "100%", overflow: "hidden" }}>
      {/* ── Mood-reactive celebration header ── */}
      <div style={{ position: "relative", background: theme.bg, borderBottom: `1px solid ${theme.border}`, padding: mood === "high" ? "16px 16px 26px" : "16px 16px 20px", overflow: "hidden" }}>
        {stars && mood === "high" && (
          <div style={{ position: "absolute", top: -20, left: "50%", transform: "translateX(-50%)", width: 300, height: 240, pointerEvents: "none", zIndex: 0, opacity: 0.9 }}>
            <Lottie animationData={stars} loop={false} autoplay style={{ width: "100%", height: "100%" }} />
          </div>
        )}

        {/* Lalli — top-left corner speech bubble */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 10, position: "relative", zIndex: 1 }}>
          <CharacterAvatar src="/Lalli-new.png" ringColor="var(--lf-sunshine)" />
          <Bubble align="left" color="var(--lf-sunshine)">{theme.lalliLine(childName)}</Bubble>
        </div>

        {/* Fafa — top-right corner speech bubble */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 14, flexDirection: "row-reverse", position: "relative", zIndex: 1 }}>
          <CharacterAvatar src="/Fafa_1.jpg" ringColor="var(--lf-teal)" />
          <Bubble align="right" color="var(--lf-teal)">{theme.fafaLine(childName)}</Bubble>
        </div>

        {/* Score + stars — the emotional highlight of the screen for a high
            score, so both scale up substantially for that band instead of
            reading as the same small text across every band. */}
        <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
          {mood === "high" && (
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 2 }}>
              <Trophy size={46} color="#c9960a" fill="#ffd54a" strokeWidth={1.5} style={{ filter: "drop-shadow(0 3px 8px rgba(201,150,10,0.4))" }} />
            </div>
          )}
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: mood === "high" ? 13.5 : 12, fontWeight: 800, color: theme.badge, textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 2px" }}>
            {theme.moodEmoji} {theme.headline(childName)}
          </p>
          <h1 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: mood === "high" ? 60 : mood === "average" ? 46 : 40, fontWeight: 800, margin: "2px 0 0", lineHeight: 1.05 }}>
            <span className="text-gradient-teal">{score.gradableCorrect} out of {score.gradableTotal}</span>
          </h1>
          {previous && (
            <p style={{ fontSize: 13, fontWeight: 700, color: "rgba(14,10,31,0.45)", margin: "2px 0 0", fontFamily: "'Nunito', sans-serif" }}>
              up from {previous.score?.gradableCorrect ?? 0} last time
            </p>
          )}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: mood === "high" ? 12 : 8 }}>
            <Star size={mood === "high" ? 28 : 18} color="var(--lf-sunshine)" fill="var(--lf-sunshine)" />
            <span style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: mood === "high" ? 26 : 17, fontWeight: 800, color: "var(--lf-dark)" }}>
              +{score.starsEarned} stars
            </span>
          </div>
        </div>
      </div>

      <div style={{ padding: "16px 20px 20px", flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Each pillar gets its real brand color instead of a flat white pill;
            the two that matter for this result (superpower/growing-in) are
            filled solid so this row reads as a legend for the cards below
            rather than plain repeated white-on-white chips. */}
        <div style={{ display: "flex", justifyContent: "center", gap: 7, marginBottom: 18, flexWrap: "wrap" }}>
          {PILLAR_ORDER.map((p) => {
            const isHighlighted = p === superpower || p === growingIn;
            return (
              <span
                key={p}
                style={{
                  fontFamily: "'Nunito', sans-serif",
                  fontSize: 10.5,
                  fontWeight: 800,
                  color: isHighlighted ? "#fff" : PILLAR_COLORS[p],
                  background: isHighlighted ? PILLAR_COLORS[p] : `${PILLAR_COLORS[p]}1a`,
                  border: `1.5px solid ${PILLAR_COLORS[p]}`,
                  borderRadius: 999,
                  padding: "5px 11px",
                  boxShadow: isHighlighted ? `0 2px 8px ${PILLAR_COLORS[p]}55` : "none",
                }}
              >
                {PILLAR_EMOJI[p]} {PILLAR_LABELS[p]}
              </span>
            );
          })}
        </div>

        <PillarCard
          icon="🌟"
          label="Superpower"
          pillar={superpower}
          badgeColor="#a16a00"
          panelBg="linear-gradient(135deg,#FFF9DB,#FFF3E0)"
          borderColor="rgba(249,199,0,0.3)"
          description={`${childName} ${SUPERPOWER_COPY[superpower]}`}
        />

        <PillarCard
          icon="🌱"
          label="Growing in"
          pillar={growingIn}
          badgeColor="#6a3fd6"
          panelBg="linear-gradient(135deg,#F3EEFF,#F5FFFE)"
          borderColor="rgba(124,77,255,0.2)"
          description={GROWING_IN_COPY[growingIn]}
        />

        {/* ── Full assessment review toggle ── */}
        <button
          onClick={() => setShowReview((v) => !v)}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "none", border: "1.5px dashed rgba(14,10,31,0.18)", borderRadius: 14, padding: "10px", marginBottom: showReview ? 12 : 0, fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: 13, color: "var(--lf-dark)", cursor: "pointer" }}
        >
          <ChevronDown size={15} style={{ transform: showReview ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
          {showReview ? "Hide" : "See"} the full Story Challenge review
        </button>

        {showReview && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
            {challenge.questions.map((q: any, qi: number) => {
              const entry = challenge.answeredIndices?.find((a: any) => a.index === qi);
              return (
                <QuestionReviewCard
                  key={qi}
                  index={qi}
                  question={q}
                  selectedIndex={entry?.answeredIndex}
                  answeredData={entry?.answeredData}
                  firstAttemptCorrect={entry?.firstAttemptCorrect}
                />
              );
            })}
          </div>
        )}

        <div style={{ flex: 1 }} />

        <button onClick={() => router.push("/generate")} className="btn-primary" style={{ justifyContent: "center", width: "100%", marginTop: 16, fontSize: 15.5, padding: "0.85rem" }}>
          Create New Story
        </button>
        <p style={{ textAlign: "center", margin: "6px 0 8px", fontFamily: "'Nunito', sans-serif", fontSize: 12, fontWeight: 700, color: "rgba(14,10,31,0.5)" }}>
          {suggestion.emoji} Tip: try a {suggestion.lesson} story to help build {PILLAR_LABELS[growingIn]}
        </p>
        <button
          onClick={() => router.push(homeHref)}
          className="btn-ghost"
          style={{ justifyContent: "center", fontSize: 13.5, padding: "0.6rem", border: "none" }}
        >
          Back to home
        </button>
      </div>
    </div>
  );
}

// Superpower / Growing In card — leads with the pillar's real illustration
// (the same 4 images used on the homepage's PillarsSection) instead of just
// an emoji, so the card reads as a specific, illustrated moment rather than
// a plain colored box.
function PillarCard({
  icon,
  label,
  pillar,
  badgeColor,
  panelBg,
  borderColor,
  description,
}: {
  icon: string;
  label: string;
  pillar: Pillar;
  badgeColor: string;
  panelBg: string;
  borderColor: string;
  description: string;
}) {
  return (
    <div style={{ borderRadius: 18, overflow: "hidden", marginBottom: 12, border: `1px solid ${borderColor}` }}>
      <div style={{ position: "relative", width: "100%", height: 175, background: "#eee" }}>
        <Image
          src={PILLAR_IMAGES[pillar]}
          alt={PILLAR_LABELS[pillar]}
          fill
          style={{ objectFit: "cover", objectPosition: "center 50%" }}
        />
      </div>
      <div style={{ background: panelBg, padding: "10px 14px 13px" }}>
        <p style={{ margin: 0, fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 800, color: badgeColor, textTransform: "uppercase", letterSpacing: "0.04em" }}>
          {icon} {label}
        </p>
        <p style={{ margin: "4px 0 0", fontFamily: "'Baloo 2', sans-serif", fontSize: 15, fontWeight: 700, color: "var(--lf-dark)" }}>
          {PILLAR_EMOJI[pillar]} {PILLAR_LABELS[pillar]}: {description}
        </p>
      </div>
    </div>
  );
}

function CharacterAvatar({ src, ringColor }: { src: string; ringColor: string }) {
  return (
    <div style={{ width: 40, height: 40, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: `2.5px solid ${ringColor}`, background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
      {/* Source art is full-body on a white ground with the face in the top
          ~15-35% band — cover-fit alone centers on the torso, not the face.
          objectPosition pins the crop to the face band; the extra scale
          zooms in so the face actually fills the circle instead of reading
          as a small head floating in a sea of white. */}
      <div style={{ position: "relative", width: "100%", height: "100%", transform: "scale(1.9)", transformOrigin: "50% 22%" }}>
        <Image src={src} alt="" fill style={{ objectFit: "cover", objectPosition: "50% 22%" }} />
      </div>
    </div>
  );
}

function Bubble({ children, align, color }: { children: React.ReactNode; align: "left" | "right"; color: string }) {
  return (
    <div
      style={{
        position: "relative",
        background: "#fff",
        borderRadius: 14,
        padding: "8px 12px",
        maxWidth: 175,
        border: `1.5px solid ${color}`,
        boxShadow: "0 3px 10px rgba(0,0,0,0.08)",
      }}
    >
      <p style={{ margin: 0, fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: 11.5, color: "var(--lf-dark)", lineHeight: 1.35 }}>
        {children}
      </p>
      <div
        style={{
          position: "absolute", top: 10, width: 0, height: 0,
          borderTop: "5px solid transparent", borderBottom: "5px solid transparent",
          ...(align === "left"
            ? { left: -6, borderRight: `6px solid ${color}` }
            : { right: -6, borderLeft: `6px solid ${color}` }),
        }}
      />
    </div>
  );
}

function QuestionReviewCard({
  index,
  question,
  selectedIndex,
  answeredData,
  firstAttemptCorrect,
}: {
  index: number;
  question: any;
  selectedIndex?: number;
  answeredData?: string;
  firstAttemptCorrect?: boolean;
}) {
  const pillar = question.pillar as Pillar;
  const fmt: string = question.format ?? "mcq";

  // Use stored first-attempt flag when available (accurate for scoring);
  // fall back to computing from final answer (older rows / quick-check entries).
  let isCorrect = false;
  if (firstAttemptCorrect !== undefined) {
    isCorrect = firstAttemptCorrect;
  } else try {
    if (fmt === "mcq") {
      if (answeredData) {
        const a = JSON.parse(answeredData);
        if (question.correctOptionIds?.length) {
          isCorrect = question.correctOptionIds.includes(a.selectedId);
        } else {
          const target = question.correctIndex ?? question.expectedIndex;
          isCorrect = target !== undefined && Number(a.selectedId) === target;
        }
      } else {
        const target = question.correctIndex ?? question.expectedIndex;
        isCorrect = target !== undefined && selectedIndex === target;
      }
    } else if (fmt === "fill_blank" && answeredData) {
      isCorrect = JSON.parse(answeredData).selectedWord === question.correctWord;
    } else if (fmt === "match_column" && answeredData) {
      const { pairs: answered } = JSON.parse(answeredData);
      const correct: [string, string][] = question.correctPairs ?? [];
      isCorrect =
        correct.length === answered.length &&
        correct.every(([l, r]: [string, string]) =>
          answered.some(([al, ar]: [string, string]) => al === l && ar === r)
        );
    } else if (fmt === "sequence" && answeredData) {
      const { order: answered } = JSON.parse(answeredData);
      const correct: string[] = question.correctOrder ?? [];
      isCorrect =
        correct.length === answered.length && correct.every((id: string, i: number) => answered[i] === id);
    }
  } catch { /**/ }

  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: 12, border: `1.5px solid ${isCorrect ? "rgba(0,201,167,0.35)" : "rgba(255,87,34,0.3)"}` }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 10, fontWeight: 800, color: "#fff", background: PILLAR_COLORS[pillar], borderRadius: 999, padding: "2px 8px" }}>
          {PILLAR_EMOJI[pillar]} {PILLAR_LABELS[pillar]}
        </span>
        {isCorrect ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10.5, fontWeight: 800, color: "#00806c" }}>
            <Check size={12} /> Correct
          </span>
        ) : (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10.5, fontWeight: 800, color: "#c62828" }}>
            <X size={12} /> Not quite
          </span>
        )}
      </div>

      <p style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: 13, color: "var(--lf-dark)", margin: "0 0 8px" }}>
        {index + 1}. {question.promptText ?? question.question}
      </p>

      {/* MCQ review */}
      {fmt === "mcq" && (() => {
        const opts: { id: string; text: string }[] = question.richOptions?.length
          ? question.richOptions
          : (question.options ?? []).map((t: string, i: number) => ({ id: String(i), text: t }));
        const selectedId = answeredData
          ? JSON.parse(answeredData).selectedId
          : selectedIndex !== undefined ? String(selectedIndex) : null;
        // All valid answers for this question — may be >1 for EQ multi-accept sets
        const correctIds: Set<string> = question.correctOptionIds?.length
          ? new Set<string>(question.correctOptionIds)
          : new Set<string>([String(question.correctIndex ?? question.expectedIndex)]);
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {opts.map((opt) => {
              const isAccepted = correctIds.has(opt.id);
              const isWrongSel = opt.id === selectedId && !isAccepted;
              const style: React.CSSProperties = isAccepted
                ? { border: "1.5px solid #00c9a7", background: "rgba(0,201,167,0.1)", color: "#00695c" }
                : isWrongSel
                ? { border: "1.5px solid #e57373", background: "rgba(229,115,115,0.1)", color: "#c62828" }
                : { border: "1px solid rgba(14,10,31,0.08)", background: "rgba(14,10,31,0.02)", color: "rgba(14,10,31,0.55)" };
              return (
                <div key={opt.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 10, fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: 12.5, ...style }}>
                  {isAccepted && <Check size={13} color="#00c9a7" />}
                  {isWrongSel && <X size={13} color="#e57373" />}
                  {opt.text}
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Fill-blank review */}
      {fmt === "fill_blank" && (() => {
        const answered = answeredData ? JSON.parse(answeredData).selectedWord : undefined;
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, fontWeight: 700, color: "rgba(14,10,31,0.5)" }}>Your answer:</span>
              <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12.5, fontWeight: 700, color: isCorrect ? "#00695c" : "#c62828", background: isCorrect ? "rgba(0,201,167,0.1)" : "rgba(255,87,34,0.08)", padding: "2px 10px", borderRadius: 8 }}>
                {answered ?? "No answer"}
              </span>
            </div>
            {!isCorrect && (
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, fontWeight: 700, color: "rgba(14,10,31,0.5)" }}>Correct:</span>
                <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12.5, fontWeight: 700, color: "#00695c", background: "rgba(0,201,167,0.1)", padding: "2px 10px", borderRadius: 8 }}>
                  {question.correctWord}
                </span>
              </div>
            )}
          </div>
        );
      })()}

      {/* Match-column review */}
      {fmt === "match_column" && (() => {
        const answered: [string, string][] = answeredData ? JSON.parse(answeredData).pairs : [];
        const correct: [string, string][] = question.correctPairs ?? [];
        const left: { id: string; text: string }[] = question.leftItems ?? [];
        const right: { id: string; text: string }[] = question.rightItems ?? [];
        const lt = (id: string) => left.find((x) => x.id === id)?.text ?? id;
        const rt = (id: string) => right.find((x) => x.id === id)?.text ?? id;
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {correct.map(([l, r], i) => {
              const userR = answered.find(([al]) => al === l)?.[1];
              const ok = userR === r;
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 10, border: `1px solid ${ok ? "#00c9a7" : "#ff5722"}`, background: ok ? "rgba(0,201,167,0.06)" : "rgba(255,87,34,0.06)", flexWrap: "wrap" }}>
                  {ok ? <Check size={12} color="#00c9a7" /> : <X size={12} color="#ff5722" />}
                  <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, fontWeight: 700, color: "var(--lf-dark)" }}>{lt(l)}</span>
                  <span style={{ color: "rgba(14,10,31,0.35)" }}>→</span>
                  <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, fontWeight: 700, color: "var(--lf-dark)" }}>{rt(userR ?? r)}</span>
                  {!ok && <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, color: "#00695c" }}>(should be: {rt(r)})</span>}
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Sequence review */}
      {fmt === "sequence" && (() => {
        const userOrder: string[] = answeredData ? JSON.parse(answeredData).order : [];
        const correct: string[] = question.correctOrder ?? [];
        const items: { id: string; text: string }[] = question.sequenceItems ?? [];
        const gt = (id: string) => items.find((x) => x.id === id)?.text ?? id;
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {correct.map((id, i) => {
              const userIdx = userOrder.indexOf(id);
              const ok = userIdx === i;
              return (
                <div key={id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 10, border: `1px solid ${ok ? "#00c9a7" : "#ff5722"}`, background: ok ? "rgba(0,201,167,0.06)" : "rgba(255,87,34,0.06)" }}>
                  {ok ? <Check size={12} color="#00c9a7" /> : <X size={12} color="#ff5722" />}
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, borderRadius: "50%", background: ok ? "#00c9a7" : "#ff5722", color: "#fff", fontWeight: 800, fontSize: 11, flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, fontWeight: 700, color: "var(--lf-dark)" }}>{gt(id)}</span>
                  {!ok && userIdx >= 0 && <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, color: "#c62828" }}>(you put #{userIdx + 1})</span>}
                </div>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
}
