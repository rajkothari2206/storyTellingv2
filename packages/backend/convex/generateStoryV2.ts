/**
 * Story Engine v2 — parallel action path.
 * The live engine (generateStory.ts) is untouched. This file is the isolated
 * v2 path that grows through Phases 1–6. Single cutover happens at Phase 7.
 *
 * Phase 1: age group, mode, primary pillar, structure shape, SystemPromptv5, story_memory write
 * Phase 2: preference rotation, world variety, resolver rotation, ending types, comedic dial,
 *          structure variants, secondary pillar
 * Phase 3: Hinglish-native generation path — script detection, Devanagari validation,
 *          targeted retry when model falls back to English or formal Hindi, in-payload
 *          Hinglish reminders reinforcing Layer 3, age-adjusted temperature for Hinglish
 * Phase 4: deterministic validator (title, scene count, speaker minimums, prohibited words,
 *          moralising phrases) + LLM validator (primary pillar, resolver, brand voice) +
 *          targeted repair (surgical correction prompt, soft-fail on error)
 * Phase 5: voice/emotion metadata extraction (scene-level + hero-line overrides) +
 *          situational sting placement (sparse, gap-enforced, LLM-driven)
 */

import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { authComponent } from "./auth";
import { GoogleGenAI } from "@google/genai";
import { api, internal } from "./_generated/api";
import {
  extractVoiceEmotionMetadata,
  computeStingPlacements,
} from "./audioMetadata";
import {
  PILLARS as ALL_PILLARS,
  PILLAR_DESCRIPTIONS,
  PILLAR_REPAIR_HINTS,
  type Pillar,
} from "./pillars";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AgeGroup = "A" | "B" | "C";
type Mode = "quest" | "wonder";
type StoryLength = "quick" | "big";
type PreferenceRole = "primary" | "secondary" | "background" | "omitted";
type Resolver = "child" | "lalli" | "fafa";

// ─── Flavor tables ────────────────────────────────────────────────────────────

const ALL_MODES: Mode[] = ["quest", "wonder"];
const RESOLVER_CYCLE: Resolver[] = ["child", "lalli", "fafa"];

const ENDING_TYPES = [
  "warm_resolution",       // everyone feels good; cozy landing
  "funny_twist",           // Fafa's gag or comic beat seals it
  "unexpected_discovery",  // solving one thing reveals something delightful
  "quiet_payoff",          // gentle, internal resolution — best for Wonder
] as const;

const TIME_OPTIONS    = ["morning", "afternoon", "evening", "night"];
const LOCATION_OPTIONS = [
  "home", "park", "school", "forest", "beach",
  "city", "garden", "library", "farm", "hilltop",
];
const ENVIRONMENT_OPTIONS = ["sunny", "cloudy", "breezy", "misty", "golden-hour"];

// Narrative arc variants — appended to the base structureShape in the payload
const NARRATIVE_ARC_VARIANTS: Record<string, [string, string]> = {
  compressed_5beat: [
    "Linear — characters move outward toward a goal and return changed.",
    "Circular — characters start and end in the same place; the journey changes them, not the location.",
  ],
  full_9beat: [
    "Classic arc — stakes escalate through the middle, satisfying resolution at the end.",
    "Discovery-led — curiosity drives the plot; the answer reveals itself gradually rather than arriving at a climax.",
  ],
};

// ─── Hinglish script helpers ──────────────────────────────────────────────────

const DEVANAGARI_RE = /[ऀ-ॿ]/;

/** True when the text contains Devanagari characters as expected for Hinglish. */
function hasDevanagari(text: string): boolean {
  return DEVANAGARI_RE.test(text);
}

/** Share of letters that are Devanagari (dialogue speaker labels and names excluded). Real
 *  Hinglish with Latin loanwords sits well above 0.35; romanized Hindi sits near 0. */
function devanagariRatio(storyBody: string): number {
  const stripped = storyBody.replace(/^(Lalli|Fafa|[A-Za-z]+):/gm, "");
  const dev = (stripped.match(/[ऀ-ॿ]/g) || []).length;
  const lat = (stripped.match(/[A-Za-z]/g) || []).length;
  return dev + lat === 0 ? 0 : dev / (dev + lat);
}

/**
 * True when the story body looks like an English fallback.
 * We strip structural labels and dialogue prefixes (always Latin) before counting,
 * then check if > 75% of remaining words are ASCII-only.
 * In genuine Hinglish the ASCII portion is English loanwords, so it stays well below 75%.
 */
function looksLikeEnglishFallback(storyBody: string): boolean {
  const stripped = storyBody
    .replace(/^(Lalli|Fafa|SCENE METADATA|Scene \s*\d+)[:\s].*/gim, "")
    .trim();
  const words = stripped.split(/\s+/).filter((w) => w.length > 1);
  if (words.length < 10) return false;
  const asciiOnly = words.filter((w) => /^[A-Za-z0-9\-'.,:!?]+$/.test(w));
  return asciiOnly.length / words.length > 0.75;
}

// ─── Validation types ─────────────────────────────────────────────────────────

type ValidationSeverity = "critical" | "warning";

export interface ValidationIssue {
  code:        string;
  severity:    ValidationSeverity;
  description: string;
  repairHint:  string;
  // True when the underlying speaker has NO matching lines at all (not just
  // fewer than the minimum) — the repair prompt needs to explicitly mandate
  // the "Name: ..." line format in this case, since there's no existing
  // instance of it in the story to imitate.
  zeroLines?:  boolean;
}

// ─── Deterministic validator ──────────────────────────────────────────────────

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function computeSpeakerWordShares(
  body:      string,
  childName: string
): { narrator: number; lalli: number; fafa: number; child: number; total: number } {
  const lalliRx = /^Lalli:\s*/i;
  const fafaRx  = /^Fafa:\s*/i;
  const childRx = new RegExp(`^${escapeRegex(childName)}:\\s*`, "i");
  const counts  = { narrator: 0, lalli: 0, fafa: 0, child: 0 };

  for (const line of body.split("\n")) {
    const t = line.trim();
    if (!t) continue;
    let speaker: keyof typeof counts = "narrator";
    let text = t;
    if      (lalliRx.test(t)) { speaker = "lalli"; text = t.replace(lalliRx, ""); }
    else if (fafaRx.test(t))  { speaker = "fafa";  text = t.replace(fafaRx,  ""); }
    else if (childRx.test(t)) { speaker = "child"; text = t.replace(childRx, ""); }
    counts[speaker] += text.split(/\s+/).filter(Boolean).length;
  }

  const total = counts.narrator + counts.lalli + counts.fafa + counts.child;
  return { ...counts, total };
}

export function runDeterministicValidation(
  content:  string,
  childName: string,
  ageGroup:  AgeGroup
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const splitAt = content.search(/^SCENE METADATA$/m);
  const body    = (splitAt !== -1 ? content.slice(0, splitAt) : content).trim();
  const meta    = splitAt !== -1 ? content.slice(splitAt) : "";

  // 1. Title contains all three characters
  const titleLine = body.split("\n").map((l) => l.trim()).find(Boolean) ?? "";
  const tl = titleLine.toLowerCase();
  if (!tl.includes("lalli") || !tl.includes("fafa") ||
      !tl.includes(childName.toLowerCase())) {
    issues.push({
      code: "TITLE_MISSING_CHARACTERS",
      severity: "critical",
      description: `Title "${titleLine}" is missing one or more characters (Lalli, Fafa, ${childName}).`,
      repairHint:  `Change the title to include the exact phrase "Lalli, Fafa and ${childName}".`,
    });
  }

  // 2. Scene metadata present
  if (splitAt === -1) {
    issues.push({
      code: "SCENE_METADATA_MISSING",
      severity: "critical",
      description: "The SCENE METADATA section is absent.",
      repairHint:  "Append a SCENE METADATA section after the story body with one line per scene.",
    });
  } else {
    // 3. Scene count in expected range for age group
    const sceneLines = meta.split("\n").filter((l) => /^Scene\s*\d+:/i.test(l.trim()));
    const [minS, maxS] = [5, 5];
    if (sceneLines.length < minS || sceneLines.length > maxS) {
      issues.push({
        code: "SCENE_COUNT_OUT_OF_RANGE",
        severity: "critical",
        description: `Scene metadata has ${sceneLines.length} scene(s); expected exactly 5.`,
        repairHint:  `Adjust to exactly 5 scenes (Scene 1 to Scene 5) in the SCENE METADATA section.`,
      });
    }
    // 4. Each scene metadata line must name the child
    const missChild = sceneLines.filter(
      (l) => !l.toLowerCase().includes(childName.toLowerCase())
    );
    if (missChild.length > 0) {
      issues.push({
        code: "SCENE_METADATA_CHILD_ABSENT",
        severity: "warning",
        description: `${missChild.length} scene metadata line(s) do not name ${childName}.`,
        repairHint:  `Every scene line must name ${childName} with a specific visible action.`,
      });
    }
  }

  // 5. Minimum speaker lines
  const lalliCount = (body.match(/^Lalli:/gim) ?? []).length;
  const fafaCount  = (body.match(/^Fafa:/gim)  ?? []).length;
  const childCount = (body.match(new RegExp(`^${escapeRegex(childName)}:`, "gim")) ?? []).length;

  if (lalliCount < 2) issues.push({
    code: "LALLI_TOO_FEW_LINES",
    severity: "critical",
    description: `Lalli speaks ${lalliCount} line(s); minimum is 2.`,
    repairHint:  "Add at least one more Lalli dialogue line that fits naturally in the story.",
    zeroLines:   lalliCount === 0,
  });
  if (fafaCount < 2) issues.push({
    code: "FAFA_TOO_FEW_LINES",
    severity: "critical",
    description: `Fafa speaks ${fafaCount} line(s); minimum is 2 (gag + one other).`,
    repairHint:  "Add a Fafa dialogue line (not the gag) that fits naturally.",
    zeroLines:   fafaCount === 0,
  });
  if (childCount < 1) issues.push({
    code: "CHILD_NO_LINES",
    severity: "critical",
    description: `${childName} has no dialogue.`,
    zeroLines: true,
    repairHint:  `Add one meaningful dialogue line for ${childName} that actively contributes to the plot.`,
  });

  // 6. Prohibited emotion words
  // §M/§O TRACKED OPEN ITEM — deliberate deferral: only these 4 words are checked here.
  // The spec enumerates ~19 safety categories (violence, discrimination, adult themes, etc.).
  // Post-generation safety relies on Gemini's built-in content filtering + these 4 keyword
  // checks. Closing the full gap requires an additional content-safety LLM call or a curated
  // blocklist. Revisit before any paid marketing push or meaningful user-count scale-up.
  for (const word of ["afraid", "angry", "terrified", "furious"]) {
    if (new RegExp(`\\b${word}\\b`, "i").test(body)) {
      issues.push({
        code: `PROHIBITED_WORD_${word.toUpperCase()}`,
        severity: "critical",
        description: `Story contains prohibited word "${word}".`,
        repairHint:  `Replace "${word}" with a gentler alternative (afraid→unsure, angry→upset).`,
      });
    }
  }

  // 7. Moralising phrases
  for (const phrase of ["learned that", "remembered that", "the lesson", "the moral", "moral of"]) {
    if (new RegExp(phrase, "i").test(body)) {
      issues.push({
        code: "MORALISING_PHRASE",
        severity: "critical",
        description: `Story contains moralising phrase "${phrase}".`,
        repairHint:  `Remove the sentence with "${phrase}". Show the value through what characters do, never what they conclude.`,
      });
    }
  }

  // 8. Fafa gag-line presence (SystemPromptV5 §character spec — exactly 1 line ≤8 words)
  const fafaDialogueLines = body
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => /^Fafa:\s*/i.test(l))
    .map((l) => l.replace(/^Fafa:\s*/i, "").trim());
  if (fafaDialogueLines.length > 0) {
    const gagCandidates = fafaDialogueLines.filter(
      (l) => l.split(/\s+/).filter(Boolean).length <= 8
    );
    if (gagCandidates.length === 0) {
      issues.push({
        code:        "FAFA_GAG_LINE_MISSING",
        severity:    "warning",
        description: `Fafa has ${fafaDialogueLines.length} line(s) but none are ≤8 words. The gag line must be brief and punchy (under 8 words).`,
        repairHint:  "Shorten one of Fafa's lines to 8 words or fewer for the gag beat.",
      });
    }
  }

  // 9. Dialogue word-share against age-group targets (§I — ±15pp tolerance)
  // NOTE: real per-speaker baseline numbers from existing stories have not been verified against
  // these targets. Pull a sample from the Convex dashboard and confirm ±15pp is realistic before
  // tightening this tolerance.
  const targets = resolveDialogueTargets(ageGroup);
  const shares  = computeSpeakerWordShares(body, childName);
  if (shares.total > 0) {
    const TOLERANCE = 0.15;
    const offTarget: string[] = [];
    const speakerMap: Array<[keyof typeof targets, keyof typeof shares]> = [
      ["narrator", "narrator"],
      ["lalli", "lalli"],
      ["fafa", "fafa"],
      ["child", "child"],
    ];
    for (const [tk, sk] of speakerMap) {
      const actual = (shares[sk] as number) / shares.total;
      const diff   = actual - targets[tk];
      if (Math.abs(diff) > TOLERANCE) {
        offTarget.push(
          `${tk}: target ${Math.round(targets[tk] * 100)}%, actual ${Math.round(actual * 100)}% (${diff > 0 ? "+" : ""}${Math.round(diff * 100)}pp)`
        );
      }
    }
    if (offTarget.length > 0) {
      // Downgraded from "critical" to "warning" — real LLM output averages 66-96% narrator
      // vs the 30-45% spec targets. Repair was firing on ~88% of stories and consistently
      // failing to fix the distribution, wasting 20-60s per story. Keeping as warning retains
      // the diagnostic signal; target calibration or prompt tuning is a separate decision.
      issues.push({
        code:        "DIALOGUE_WORD_SHARE_OFF_TARGET",
        severity:    "warning",
        description: `Word-share distribution off-target: ${offTarget.join("; ")}.`,
        repairHint:  `Rebalance dialogue so each speaker stays within 15pp of age-group ${ageGroup} targets — narrator ${Math.round(targets.narrator * 100)}%, Lalli ${Math.round(targets.lalli * 100)}%, Fafa ${Math.round(targets.fafa * 100)}%, ${childName} ${Math.round(targets.child * 100)}%.`,
      });
    }
  }

  return issues;
}

// ─── LLM validator ────────────────────────────────────────────────────────────

// §M/§O TRACKED OPEN ITEM — LLM validation covers 3 semantic rules (pillar, resolver, brand voice).
// The spec enumerates additional safety dimensions not checked here. Post-generation safety relies
// on Gemini's built-in content filtering plus the 4 prohibited-word checks in runDeterministicValidation.
// Revisit before any paid marketing push or meaningful user-count scale-up.
async function runLLMValidation(
  content:     string,
  primaryPillar: Pillar,
  resolvedBy:  Resolver,
  makeValidationRequest: (text: string) => Promise<{ candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }>
): Promise<ValidationIssue[]> {
  const prompt =
    `You are a children's story quality validator. Read the story and evaluate it. Return ONLY valid JSON — no markdown, no extra text.\n\n` +

    `RULE 1 — PRIMARY PILLAR (${primaryPillar}): Does the story clearly contain a "${primaryPillar}" mechanic where ` +
    `${PILLAR_DESCRIPTIONS[primaryPillar]}? The mechanic must be plot-essential, not decorative.\n\n` +

    `RULE 2 — RESOLVER: Does "${resolvedBy}" actually solve the main problem? (Not just participate — ` +
    `they must drive the key action that resolves the central challenge.)\n\n` +

    `RULE 3 — BRAND VOICE: Is the story free from moralising? No character should state, imply, or ` +
    `summarise a lesson — even indirectly (e.g. "she knew now that sharing was important" is moralising).\n\n` +

    `STORY:\n${content}\n\n` +

    `Return exactly:\n` +
    `{"primary_pillar":{"pass":true,"note":"brief"},"resolver":{"pass":true,"note":"brief"},"brand_voice":{"pass":true,"note":"brief"}}`;

  try {
    const resp = await makeValidationRequest(prompt);
    const raw  = resp.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "{}";
    const json = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const result = JSON.parse(json) as {
      primary_pillar: { pass: boolean; note: string };
      resolver:       { pass: boolean; note: string };
      brand_voice:    { pass: boolean; note: string };
    };

    const issues: ValidationIssue[] = [];

    if (!result.primary_pillar?.pass) {
      issues.push({
        code:        "PRIMARY_PILLAR_MISSING",
        severity:    "critical",
        description: `Primary pillar "${primaryPillar}" mechanic is not clearly plot-essential. ${result.primary_pillar?.note ?? ""}`.trim(),
        repairHint:  PILLAR_REPAIR_HINTS[primaryPillar],
      });
    }
    if (!result.resolver?.pass) {
      issues.push({
        code:        "RESOLVER_TARGET_MISSED",
        severity:    "warning",
        description: `"${resolvedBy}" did not clearly drive the resolution. ${result.resolver?.note ?? ""}`.trim(),
        repairHint:  `Revise the resolution beat so ${resolvedBy} is the one who takes the decisive action that solves the main problem.`,
      });
    }
    if (!result.brand_voice?.pass) {
      issues.push({
        code:        "BRAND_VOICE_MORALISING",
        severity:    "critical",
        description: `Moralising detected. ${result.brand_voice?.note ?? ""}`.trim(),
        repairHint:  "Remove any line where a character states or implies a lesson. Values must appear only through what characters do, never through what they conclude.",
      });
    }

    return issues;
  } catch (err) {
    console.warn("[v2] LLM validation parse error (soft fail):", err);
    return [];
  }
}

// ─── Targeted repair ──────────────────────────────────────────────────────────

async function runTargetedRepair(
  content:       string,
  issues:        ValidationIssue[],
  wordCountLabel: string,
  childName:     string,
  makeRequest:   (temp: number, text: string) => Promise<{ candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }>
): Promise<string> {
  const criticals = issues.filter((i) => i.severity === "critical");
  const warnings  = issues.filter((i) => i.severity === "warning");

  const speakerLabelFor = (code: string): string =>
    code === "LALLI_TOO_FEW_LINES" ? "Lalli" :
    code === "FAFA_TOO_FEW_LINES"  ? "Fafa"  :
    code === "CHILD_NO_LINES"      ? childName : "";

  // Root-caused from a real incident: the blanket "keep structural labels
  // unchanged" rule below presumes a speaker's lines already exist somewhere
  // to imitate. When a speaker has ZERO lines in the whole story (the model
  // wrote pure narration with inline quotes instead), that assumption is
  // false — repair kept producing more narration-with-quotes because nothing
  // told it the exact "Name: ..." prefix format had to be introduced, not
  // just preserved. This ran 3 times identically before failing loud.
  const zeroLinesMandate = (i: ValidationIssue): string => {
    if (!i.zeroLines) return "";
    const speaker = speakerLabelFor(i.code);
    return `\n  MANDATORY FORMAT: ${speaker} currently has ZERO lines anywhere in this story — there is no existing "${speaker}:" line to match. You must introduce a brand-new line written EXACTLY as ${speaker}: "..." starting at the beginning of its own line. Do NOT embed it as a quote inside narration prose (e.g. NOT ${speaker} said, "..."). The "${speaker}:" prefix at the start of the line is mandatory — this is what determines whether the fix is accepted.`;
  };

  const issueBlock = [
    ...criticals.map((i, n) => `CRITICAL ${n + 1}: ${i.description}\n  FIX: ${i.repairHint}${zeroLinesMandate(i)}`),
    ...warnings .map((i, n) => `WARNING  ${n + 1}: ${i.description}\n  FIX: ${i.repairHint}`),
  ].join("\n\n");

  const prompt =
    `The children's story below has quality issues that need fixing.\n\n` +
    `ISSUES:\n${issueBlock}\n\n` +
    `REPAIR RULES (follow exactly):\n` +
    `• Fix ONLY the listed issues — do not change plot, setting, or character names.\n` +
    `• Keep the word count close to ${wordCountLabel} words in the story body.\n` +
    `• Do not add or remove scenes.\n` +
    `• Every line of dialogue must use the exact format Name: "line" at the start of its own line (Lalli:, Fafa:, or ${childName}:) — never as a quote embedded inside narration prose. This applies whether that format already exists in the story or needs to be introduced for a speaker who currently has none.\n` +
    `• Return the COMPLETE corrected story: title + body + SCENE METADATA.\n\n` +
    `ORIGINAL STORY:\n${content}\n\nCORRECTED STORY:`;

  try {
    const resp    = await makeRequest(0.3, prompt);
    const repaired = resp.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (repaired && repaired.length > 200) return repaired;
    console.warn("[v2] Repair returned unusable content — trying constrained fallback (§O).");
  } catch (err) {
    console.warn("[v2] Targeted repair failed — trying constrained fallback (§O):", err);
  }

  // §O — second fallback: constrained regeneration with a shorter, directive-only prompt.
  // Focuses only on the top 3 critical issues to reduce prompt complexity.
  const topIssues = criticals.slice(0, 3);
  const fallbackPrompt =
    `Rewrite this children's story to fix these problems:\n` +
    topIssues.map((i, n) => `${n + 1}. ${i.repairHint}${zeroLinesMandate(i)}`).join("\n") +
    `\n\nRules: keep the same characters, setting, and plot. Stay close to ${wordCountLabel} words. ` +
    `Every line of dialogue must use the exact format Name: "line" at the start of its own line (Lalli:, Fafa:, or ${childName}:), introducing it for a speaker who currently has none if needed. Preserve all other structural labels (SCENE METADATA, Scene N:). Return the complete story.\n\n` +
    `STORY:\n${content}\n\nREWRITTEN STORY:`;

  try {
    const fallbackResp = await makeRequest(0.2, fallbackPrompt);
    const fallback = fallbackResp.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (fallback && fallback.length > 200) return fallback;
    console.warn("[v2] Constrained fallback also returned unusable content — keeping original.");
  } catch (err) {
    console.warn("[v2] Constrained fallback failed (soft fail):", err);
  }

  return content;
}

// ─── Resolution helpers ───────────────────────────────────────────────────────

export function resolveAgeGroup(age: number): AgeGroup {
  if (age <= 5) return "A";
  if (age <= 8) return "B";
  return "C";
}

function resolveStoryLength(length: "short" | "medium" | "long" | undefined): StoryLength {
  return length === "short" ? "quick" : "big";
}

// Word-count targets are keyed off the raw "short"/"medium"/"long" label,
// NOT the collapsed StoryLength ("quick"/"big") — medium and long share the
// same "big" structure bucket (beat count) but must NOT share the same word
// target, or they produce audio of near-identical length despite very
// different labeled durations (confirmed: both landed at ~5.5min against
// 6min/10min labels respectively before this fix). Targets below are
// calibrated from measured real narration audio duration, not word-count
// estimates — see Task 4 audit.
function resolveWordCount(
  length: "short" | "medium" | "long" | undefined,
  language: string
): { min: number; target: number; max: number; label: string } {
  const isHindi = language.toLowerCase().includes("hindi") ||
                  language.toLowerCase().includes("hinglish");
  if (length === "short") {
    return isHindi
      ? { min: 300, target: 350, max: 380, label: "320–380" }
      : { min: 330, target: 385, max: 420, label: "350–420" };
  }
  if (length === "long") {
    return isHindi
      ? { min: 950, target: 1030, max: 1100, label: "950–1100" }
      : { min: 1030, target: 1120, max: 1200, label: "1030–1200" };
  }
  // medium (and legacy/unspecified length)
  return isHindi
    ? { min: 570, target: 630, max: 680, label: "570–680" }
    : { min: 620, target: 680, max: 740, label: "620–740" };
}

export function resolveDialogueTargets(ageGroup: AgeGroup) {
  const map: Record<AgeGroup, { narrator: number; lalli: number; fafa: number; child: number }> = {
    A: { narrator: 0.45, lalli: 0.25, fafa: 0.20, child: 0.10 },
    B: { narrator: 0.35, lalli: 0.25, fafa: 0.20, child: 0.20 },
    C: { narrator: 0.30, lalli: 0.23, fafa: 0.22, child: 0.25 },
  };
  return map[ageGroup];
}

function resolveStructureShape(storyLength: StoryLength, ageGroup: AgeGroup): string {
  if (storyLength === "quick" || ageGroup === "A") return "compressed_5beat";
  return "full_9beat";
}

/** Alternates between the two arc descriptions for this structureShape. */
function resolveNarrativeArc(
  structureShape: string,
  recordCount: number
): { variant: "a" | "b"; description: string } {
  const variants = NARRATIVE_ARC_VARIANTS[structureShape] ??
    ["Default linear arc.", "Default circular arc."];
  const idx = recordCount % 2;
  return { variant: idx === 0 ? "a" : "b", description: variants[idx] };
}

function resolveModeFromHistory(recentRecords: Array<{ mode: Mode }>): Mode {
  if (recentRecords.length === 0) return "quest";
  return recentRecords[0].mode === "quest" ? "wonder" : "quest";
}

function resolvePrimaryPillarFromHistory(
  recentRecords: Array<{ primaryPillar: Pillar }>
): Pillar {
  if (recentRecords.length === 0) return "cognitive";
  const recentPillars = recentRecords.map((r) => r.primaryPillar);
  for (const pillar of ALL_PILLARS) {
    if (!recentPillars.includes(pillar)) return pillar;
  }
  return recentPillars[recentPillars.length - 1];
}

/**
 * Secondary pillar: only for Big Story (full_9beat) — Quick stories keep one pillar.
 * Pick the pillar that's not primary and least recently used as either primary or secondary.
 */
function resolveSecondaryPillar(
  primaryPillar: Pillar,
  storyLength: StoryLength,
  recentRecords: Array<{ primaryPillar: Pillar; secondaryPillar?: Pillar }>,
  totalStoriesForChild: number
): Pillar | undefined {
  if (storyLength === "quick") return undefined;
  if (recentRecords.length < 2) return undefined; // need history to pick sensibly

  // §E — true 33% frequency gate (1-in-3 cycle, deterministic).
  // Uses the monotonic total story count (all-time, not capped at 8) so the gate
  // varies correctly for established users. Fetched via storyMemory.countForChild.
  if (totalStoriesForChild % 3 !== 0) return undefined;

  const recentlyUsed = new Set(
    recentRecords.slice(0, 4).flatMap((r) =>
      [r.primaryPillar, r.secondaryPillar].filter(Boolean) as Pillar[]
    )
  );

  for (const pillar of ALL_PILLARS) {
    if (pillar !== primaryPillar && !recentlyUsed.has(pillar)) return pillar;
  }
  // All used recently — pick the non-primary one used least recently
  const others = ALL_PILLARS.filter((p) => p !== primaryPillar);
  return others[recentRecords.length % others.length];
}

/**
 * Preference role cycle: primary → secondary → background → omitted → primary (repeating).
 * §D — "omitted" is now a reachable state (~25% of stories, 1 in every 4-step cycle).
 * The spec targets ~30% omission; 25% is the closest achievable with a clean 4-step cycle.
 */
function resolvePreferenceRole(
  recentRoles: Array<PreferenceRole | undefined>
): PreferenceRole {
  if (recentRoles.length === 0) return "primary";
  const last = recentRoles[0];
  // 4-step cycle: primary → secondary → background → omitted → (restart at primary)
  if (!last || last === "omitted") return "primary";
  if (last === "primary") return "secondary";
  if (last === "secondary") return "background";
  if (last === "background") return "omitted";
  return "primary";
}

/** Pick time/location/environment least recently used for this child. */
function resolveWorldVariety(
  recentRecords: Array<{ worldVariety?: { time: string; location: string; environment: string } }>
): { time: string; location: string; environment: string } {
  const usedTimes    = recentRecords.map((r) => r.worldVariety?.time).filter(Boolean) as string[];
  const usedLocs     = recentRecords.map((r) => r.worldVariety?.location).filter(Boolean) as string[];
  const usedEnvs     = recentRecords.map((r) => r.worldVariety?.environment).filter(Boolean) as string[];

  const pickLRU = (options: string[], used: string[]): string => {
    for (const opt of options) {
      if (!used.includes(opt)) return opt;
    }
    // All used — pick based on position (simple LRU fallback)
    return options[used.length % options.length];
  };

  return {
    time:        pickLRU(TIME_OPTIONS,       usedTimes),
    location:    pickLRU(LOCATION_OPTIONS,   usedLocs),
    environment: pickLRU(ENVIRONMENT_OPTIONS, usedEnvs),
  };
}

/** Resolver cycle: child → lalli → fafa → child */
function resolveResolver(
  recentRecords: Array<{ resolvedBy?: Resolver }>
): Resolver {
  if (recentRecords.length === 0) return "child";
  const last = recentRecords[0].resolvedBy;
  if (!last) return "child";
  const idx = RESOLVER_CYCLE.indexOf(last);
  return RESOLVER_CYCLE[(idx + 1) % RESOLVER_CYCLE.length];
}

/** Ending type cycles through the four types based on story count. */
function resolveEndingType(
  recentRecords: Array<{ endingType?: string }>,
  mode: Mode
): string {
  // Wonder mode prefers quiet_payoff; cycle the rest for Quest
  if (mode === "wonder") {
    const wonderTypes = ["quiet_payoff", "warm_resolution", "unexpected_discovery"];
    return wonderTypes[recentRecords.length % wonderTypes.length];
  }
  const count = recentRecords.length;
  return ENDING_TYPES[count % ENDING_TYPES.length];
}

/**
 * Comedic dial: 0.0 (serious/calm) → 1.0 (maximum comedy).
 * Wonder is always low. Quest varies by age group and alternates.
 */
function resolveComedicDial(
  mode: Mode,
  ageGroup: AgeGroup,
  recordCount: number
): number {
  if (mode === "wonder") {
    return [0.1, 0.15, 0.2][recordCount % 3];
  }
  const options: Record<AgeGroup, number[]> = {
    A: [0.5, 0.4, 0.6],
    B: [0.6, 0.8, 0.7, 0.9],
    C: [0.4, 0.6, 0.5],
  };
  const arr = options[ageGroup];
  return arr[recordCount % arr.length];
}

// ─── Preference payload builder ───────────────────────────────────────────────

const PREFERENCE_GUIDANCE: Record<PreferenceRole, string> = {
  primary:    "Can be a meaningful presence — a companion, a source of comfort, wonder, or fun. It does not need to drive the plot or solve the problem; even a warm cameo that a child would notice and smile at counts.",
  secondary:  "Appears in 2–3 moments as a supporting element — visible and noticed but not the main focus.",
  background: "A single natural mention only — in the setting or passing. No emphasis, no plot role.",
  omitted:    "Do not include this preference anywhere in the story.",
};

function buildPreferenceBlock(
  nickname: string | undefined,
  favoriteAnimal: string | undefined,
  animalRole: PreferenceRole,
  favoriteColor: string | undefined,
  colorRole: PreferenceRole
): Record<string, unknown> | null {
  const block: Record<string, unknown> = {};
  if (nickname) block.nickname = {
    value: nickname,
    guidance: `Lalli and Fafa call the child by this nickname in dialogue 1–2 times — naturally, not every sentence.`,
  };
  if (favoriteAnimal) block.favoriteAnimal = {
    value: favoriteAnimal,
    role: animalRole,
    guidance: PREFERENCE_GUIDANCE[animalRole],
  };
  if (favoriteColor) block.favoriteColor = {
    value: favoriteColor,
    role: colorRole,
    guidance: colorRole === "primary"
      ? `At least one everyday object must be ${favoriteColor} (e.g., a ${favoriteColor} bag, kite, ribbon, door). Natural and noticed — not a magical or glowing object.`
      : colorRole === "secondary"
        ? `${favoriteColor} appears on 1–2 objects in passing. The child may notice it briefly.`
        : colorRole === "background"
          ? `${favoriteColor} may appear on one object in the setting without comment.`
          : `Do not use ${favoriteColor} anywhere in the story.`,
  };
  return Object.keys(block).length > 0 ? block : null;
}

// ─── Payload builder (Layer 4 + 5) ───────────────────────────────────────────

function buildPayload(args: {
  child: { name: string; age: number; ageGroup: AgeGroup; gender: string };
  language: string;
  mode: Mode;
  structureShape: string;
  narrativeArc: { variant: "a" | "b"; description: string };
  primaryPillar: Pillar;
  secondaryPillar?: Pillar;
  storyLength: StoryLength;
  wordCount: { min: number; target: number; max: number; label: string };
  dialogueTargets: { narrator: number; lalli: number; fafa: number; child: number };
  comedicDial: number;
  theme: string;
  lesson?: string;
  resolvedBy: Resolver;
  endingType: string;
  worldVariety: { time: string; location: string; environment: string };
  preferences: Record<string, unknown> | null;
  previousStoryContent?: string;
}): string {
  const {
    child, language, mode, structureShape, narrativeArc,
    primaryPillar, secondaryPillar, storyLength, wordCount,
    dialogueTargets, comedicDial, theme, lesson,
    resolvedBy, endingType, worldVariety, preferences, previousStoryContent,
  } = args;

  const isHinglish  = language.toLowerCase().includes("hindi") ||
                      language.toLowerCase().includes("hinglish");
  const languageLabel = isHinglish ? "Hinglish" : "English";

  const payload: Record<string, unknown> = {
    child: {
      name:     child.name,
      age:      child.age,
      ageGroup: child.ageGroup,
      gender:   child.gender,
    },
    language: languageLabel,
    mode,
    structureShape,
    narrativeArc: {
      variant:     narrativeArc.variant,
      description: narrativeArc.description,
    },
    pillars: {
      primary:   primaryPillar,
      secondary: secondaryPillar ?? null,
    },
    storyLength,
    wordCountTarget: {
      min:    wordCount.min,
      target: wordCount.target,
      max:    wordCount.max,
      label:  wordCount.label,
    },
    dialogueDistributionTarget: dialogueTargets,
    comedicDial,
    story: {
      theme,
      lesson: lesson || null,
    },
    worldSetting: worldVariety,
    resolverTarget: resolvedBy,
    endingType,
  };

  if (preferences) payload.personalisation = preferences;

  if (isHinglish) {
    payload.hinglishGeneration = {
      reminder:
        "Generate DIRECTLY in Hinglish — do NOT write an English draft first and translate. Native generation only.",
      scriptRules: [
        "Devanagari is the base script for all narration and dialogue.",
        "English loanwords (colours, animal names, and common nouns: bag, ball, phone, school, park, birthday) stay in LATIN script inline — e.g. 'उसने red kite देखी', never 'उसने लाल पतंग देखी'.",
        "Every Hindi word (verbs, pronouns, postpositions, Hindi nouns) MUST be written in Devanagari. NEVER romanize Hindi (no 'ne', 'apna', 'lekin', 'nahi', 'hai' in Latin letters).",
        "Character names (Lalli, Fafa, child's name) always in Latin script.",
        "Structural labels (SCENE METADATA, Scene 1:, Lalli:, Fafa:, child's name as speaker) always in Latin script.",
        "Grammar and sentence structure stay Hindi: verb-final, postpositions, gendered verb agreement.",
      ],
      examples: {
        GOOD: "Fafa ने अपना blue ball ढूँढा, लेकिन वह कहीं नहीं मिला।",
        BAD_romanizedHindi: "Fafa ne apna blue ball dhoondha, lekin woh kahin nahi mila. (Hindi words in Latin letters are forbidden: the story is read aloud by a speech engine that needs Devanagari.)",
        BAD_englishFallback: "Fafa searched for his blue ball but could not find it.",
        BAD_formalHindi: "Fafa ने अपनी नीली गेंद खोजी, परंतु वह कहीं नहीं मिली।",
        BAD_randomSwitch: "Fafa searched for his ball जो नीला था।",
      },
    };
  }

  if (previousStoryContent) {
    payload.sequel = {
      previousStory: previousStoryContent,
      guidance:
        "SEQUEL: Continue from where the previous story ended. Reference what happened, " +
        "keep the same characters and world, introduce a NEW challenge or discovery. " +
        "Do not retell the previous story. Brief callback (1–2 sentences), then new adventure.",
    };
  }

  // Per-speaker word count targets derived from dialogue distribution fractions × word count target.
  // Rounded to nearest 10 to give a clean instruction without implying false precision.
  const round10 = (n: number) => Math.round(n / 10) * 10;
  const speakerWordTargets = {
    narrator: round10(wordCount.target * dialogueTargets.narrator),
    lalli:    round10(wordCount.target * dialogueTargets.lalli),
    fafa:     round10(wordCount.target * dialogueTargets.fafa),
    child:    round10(wordCount.target * dialogueTargets.child),
  };

  payload.instructions =
    `BEGIN STORY NOW. ` +
    `MANDATORY: The story body must be ${wordCount.label} words (title excluded, SCENE METADATA excluded). ` +
    `Count your words before finalising. ` +
    `MANDATORY DIALOGUE BALANCE: narrator narration ≈ ${speakerWordTargets.narrator} words, ` +
    `Lalli dialogue ≈ ${speakerWordTargets.lalli} words, ` +
    `Fafa dialogue ≈ ${speakerWordTargets.fafa} words, ` +
    `${args.child.name} dialogue ≈ ${speakerWordTargets.child} words. ` +
    `Count each speaker's words separately before finalising. ` +
    `Narrator narration must not dominate — the story is a dialogue-driven co-adventure, not a narrated tale.`;

  return JSON.stringify(payload, null, 2);
}

// ─── Internal action: background Gemini work ─────────────────────────────────

export const _generateContentV2 = internalAction({
  args: {
    storyId:   v.id("stories"),
    profileId: v.id("user_profiles"),
    childId:   v.union(v.literal("1"), v.literal("2")),
    childInfo: v.object({
      name:            v.string(),
      gender:          v.union(v.literal("male"), v.literal("female"), v.literal("other")),
      age:             v.number(),
      avatarStorageId: v.optional(v.string()),
      nickname:        v.optional(v.string()),
      favoriteAnimal:  v.optional(v.string()),
      favoriteColor:   v.optional(v.string()),
      phoneticName:    v.optional(v.string()),
    }),
    userId:   v.string(),
    theme:    v.string(),
    lesson:   v.optional(v.string()),
    language: v.optional(v.string()),
    length:        v.optional(v.union(v.literal("short"), v.literal("medium"), v.literal("long"))),
    requestedMode: v.optional(v.union(v.literal("quest"), v.literal("wonder"))),
    creditId: v.id("user_credits"),
    previousStoryContent: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const {
      storyId, profileId, childId, childInfo, userId,
      theme, lesson, language, length, requestedMode, creditId, previousStoryContent,
    } = args;

    await ctx.runMutation(api.stories._markStatus, { storyId, status: "generating" });

    // ── 1. Load recent story_memory (up to 8 stories) ────────────────────
    type MemoryRecord = {
      mode: Mode;
      primaryPillar: Pillar;
      secondaryPillar?: Pillar;
      structureShape: string;
      storyLength: StoryLength;
      worldVariety?: { time: string; location: string; environment: string };
      preferenceRoles?: {
        favoriteAnimal?: PreferenceRole;
        favoriteColor?: PreferenceRole;
      };
      resolvedBy?: Resolver;
      endingType?: string;
    };
    const recentMemory = await ctx.runQuery(
      (api as any).storyMemory.getRecentForChild,
      { profileId, childId, limit: 8 }
    ) as MemoryRecord[];

    const recordCount = recentMemory.length;

    // Challenge "growing in" signal — look up the most recent completed Challenge
    // from the child's last 8 stories (joined via story_memory storyIds).
    // Window: completed within 7 days. Returns null when Challenge is not in production.
    const recentStoryIds = recentMemory.map((r: any) => r.storyId).filter(Boolean) as string[];
    const rawChallengeSignal: string | null = recentStoryIds.length > 0
      ? await ctx.runQuery(
          (internal as any).testserver.challenge.getGrowingInForStories,
          { storyIds: recentStoryIds }
        )
      : null;
    const VALID_PILLARS = new Set(["listening", "attention", "emotional", "cognitive"]);
    const challengeSignal: Pillar | null =
      rawChallengeSignal && VALID_PILLARS.has(rawChallengeSignal)
        ? rawChallengeSignal as Pillar
        : null;

    // ── 2. Resolve all engine dimensions ──────────────────────────────────
    const ageGroup        = resolveAgeGroup(childInfo.age);
    const storyLength     = resolveStoryLength(length);
    const lang            = language || "English";
    const wordCount       = resolveWordCount(length, lang);
    const dialogueTargets = resolveDialogueTargets(ageGroup);
    const mode            = requestedMode ?? resolveModeFromHistory(recentMemory);
    const pillarSource    = challengeSignal ? "challenge_signal" : "lru_rotation";
    const primaryPillar   = challengeSignal ?? resolvePrimaryPillarFromHistory(recentMemory);
    const totalStoriesForChild: number = await ctx.runQuery(
      (api as any).storyMemory.countForChild,
      { profileId, childId }
    );
    const secondaryPillar = resolveSecondaryPillar(primaryPillar, storyLength, recentMemory, totalStoriesForChild);
    const structureShape  = resolveStructureShape(storyLength, ageGroup);
    const narrativeArc    = resolveNarrativeArc(structureShape, recordCount);
    const comedicDial     = resolveComedicDial(mode, ageGroup, recordCount);
    const resolvedBy      = resolveResolver(recentMemory);
    const endingType      = resolveEndingType(recentMemory, mode);
    const worldVariety    = resolveWorldVariety(recentMemory);

    // Preference role rotation
    const animalRoles = recentMemory.map((r) => r.preferenceRoles?.favoriteAnimal);
    const colorRoles  = recentMemory.map((r) => r.preferenceRoles?.favoriteColor);
    const animalRole  = childInfo.favoriteAnimal ? resolvePreferenceRole(animalRoles) : "omitted";
    const colorRole   = childInfo.favoriteColor  ? resolvePreferenceRole(colorRoles)  : "omitted";

    const preferences = buildPreferenceBlock(
      childInfo.nickname,
      childInfo.favoriteAnimal,
      animalRole,
      childInfo.favoriteColor,
      colorRole
    );

    const isHinglish = lang.toLowerCase().includes("hindi") ||
                       lang.toLowerCase().includes("hinglish");

    // ── 3. Build Layer 4+5 JSON payload ───────────────────────────────────
    const payload = buildPayload({
      child: { name: childInfo.name, age: childInfo.age, ageGroup, gender: childInfo.gender },
      language: lang,
      mode,
      structureShape,
      narrativeArc,
      primaryPillar,
      secondaryPillar,
      storyLength,
      wordCount,
      dialogueTargets,
      comedicDial,
      theme,
      lesson,
      resolvedBy,
      endingType,
      worldVariety,
      preferences,
      previousStoryContent,
    });

    // ── 4. Load SystemPromptv5 from DB ────────────────────────────────────
    const systemConfig = await ctx.runQuery((api as any).systemConfig.get, {
      key: "system_prompt",
    });
    const system = systemConfig?.value || process.env.SYSTEM_PROMPT;
    if (!system) {
      await ctx.runMutation(api.stories._markStatus, {
        storyId, status: "error", error: "SYSTEM_PROMPT not configured",
      });
      throw new Error("SYSTEM_PROMPT not configured.");
    }

    const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

    // Cost tracking: accumulated across every Gemini text call this story makes
    // (initial generation, all retries, repair, validation, voice-metadata
    // analysis) — every factory below feeds the same running total. Stored on
    // the story once text generation finishes; see costTracking.ts.
    let textInputTokens = 0;
    let textOutputTokens = 0;
    const trackUsage = (resp: { usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; thoughtsTokenCount?: number } }) => {
      const u = resp.usageMetadata;
      if (!u) return;
      textInputTokens += u.promptTokenCount ?? 0;
      textOutputTokens += (u.candidatesTokenCount ?? 0) + (u.thoughtsTokenCount ?? 0);
    };

    const makeRequest = async (temperature: number, text: string) => {
      const resp = await gemini.models.generateContent({
        model: "gemini-2.5-pro",
        config: { temperature, systemInstruction: system },
        contents: [{ role: "user", parts: [{ text }] }],
      });
      trackUsage(resp);
      return resp;
    };

    // ── 5. Initial generation ─────────────────────────────────────────────
    // Hinglish needs slightly higher temperature — the model's English-generation prior
    // is strong; more temperature helps it commit to Devanagari-base output natively.
    const initialTemp = isHinglish ? 0.5 : 0.4;
    let resp = await makeRequest(initialTemp, payload);
    let content = resp.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    // Retry 1: non-story response (RULE_CONFLICT, empty, or very short)
    const isNonStory = !content || content.length < 200 || /^[A-Z_]+$/.test(content);
    if (isNonStory) {
      console.warn("[v2] Non-story response, retrying:", content.slice(0, 80));
      resp = await makeRequest(0.7,
        payload +
        "\n\nReminder: write the story now. Keep all structural labels " +
        "(SCENE METADATA, Scene 1:, Scene 2:, Lalli:, Fafa:) in English. " +
        "Only story prose and dialogue should be in the requested language."
      );
      content = resp.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    }

    // Retry 1b+2, combined (cost fix): Hinglish-fallback and word-count issues
    // used to be two SEPARATE sequential retry calls. A Hinglish story that
    // also landed outside the word-count range paid for 3 full generation
    // passes (initial + Hinglish-fix + word-count-fix), each resending the
    // entire payload — real production evidence: a 424-word Hindi story cost
    // 20,567 output tokens, ~48 tokens/word, consistent with exactly this
    // chain. Both issues are now detected up front on the same content and,
    // if either (or both) apply, corrected in a single combined retry call —
    // same detection logic and correction instructions as before, just not
    // chained into up to 3 sequential API calls for one story.
    let hinglishIssue = false;
    let wordCountActual = 0;
    let wordCountIssue: "short" | "long" | null = null;

    if (isHinglish && content.length > 200) {
      const storyBodyForScript = content.split(/^SCENE METADATA$/m)[0].trim();
      const devanagariMissing  = !hasDevanagari(storyBodyForScript) || devanagariRatio(storyBodyForScript) < 0.35;
      const englishDominant    = looksLikeEnglishFallback(storyBodyForScript);
      hinglishIssue = devanagariMissing || englishDominant;
      if (hinglishIssue) {
        console.warn(`[v2] Hinglish fallback detected (devanagariMissing=${devanagariMissing}, englishDominant=${englishDominant}).`);
      }
    }

    const storyBodyForCount = content.split(/^SCENE METADATA$/m)[0].trim();
    wordCountActual = storyBodyForCount.split(/\s+/).filter(Boolean).length;
    if (wordCountActual < wordCount.min && content.length > 200) wordCountIssue = "short";
    else if (wordCountActual > wordCount.max) wordCountIssue = "long";

    if (hinglishIssue || wordCountIssue) {
      const corrections: string[] = [];
      if (hinglishIssue) {
        corrections.push(
          "CRITICAL — HINGLISH CORRECTION: Your previous response was written in English " +
          "or formal Hindi, not Hinglish. You MUST generate natively in Hinglish:\n" +
          "• Devanagari is the base script for all narration and dialogue.\n" +
          "• English loanwords (colours, animal names, bag, ball, school, park) stay in Latin " +
          "script inline — e.g. 'Fafa ने अपना blue ball ढूँढा, लेकिन वह कहीं नहीं मिला।' " +
          "NEVER write Hindi words in Latin letters (no 'ne', 'apna', 'lekin', 'nahi').\n" +
          "• Do NOT write in English then translate — generate directly in Hinglish.\n" +
          "• Do NOT use formal/textbook Hindi with Sanskrit-origin words."
        );
      }
      if (wordCountIssue) {
        const reason = wordCountIssue === "short"
          ? `too short (${wordCountActual} words, need ${wordCount.label})`
          : `too long (${wordCountActual} words, max ${wordCount.max})`;
        console.warn(`[v2] Story body ${reason}${hinglishIssue ? " (combined with Hinglish retry)" : ""}, retrying...`);
        corrections.push(
          `CRITICAL — WORD COUNT: Your previous attempt produced ~${wordCountActual} words. ` +
          `The story body MUST be ${wordCount.label} words — no more, no less. ` +
          `Count your words before finalising. Stop at ${wordCount.max} words.`
        );
      }

      resp = await makeRequest(0.6,
        payload + "\n\n" + corrections.join("\n\n") + "\n\nGenerate the complete corrected story now."
      );
      content = resp.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || content;
      const retryCount = content.split(/^SCENE METADATA$/m)[0].trim().split(/\s+/).filter(Boolean).length;
      console.log(`[v2] Retry word count: ${retryCount}`);
      if (hinglishIssue) {
        const retryBody = content.split(/^SCENE METADATA$/m)[0].trim();
        console.log(`[v2] Post-retry Devanagari ratio: ${devanagariRatio(retryBody).toFixed(2)}`);
      }
    } else {
      console.log(`[v2] Story word count: ${wordCountActual}`);
    }

    if (!content) {
      await ctx.runMutation(api.stories._markStatus, {
        storyId, status: "error", error: "Empty response from AI",
      });
      throw new Error("Empty response from AI");
    }

    // ── 5b. Validation + targeted repair ─────────────────────────────────
    // Gemini call with no system instruction — purely evaluating the story text.
    // thinkingBudget pinned to 128, the real floor for gemini-2.5-pro (it
    // cannot fully disable thinking, confirmed against Google's docs) —
    // isolated testing showed default/dynamic thinking spent ~89% of billed
    // output tokens reasoning about a fixed pass/fail JSON schema; at the
    // floor that dropped to ~77% billed-output reduction with no observed
    // change in output structure.
    const makeValidationRequest = async (text: string) => {
      const resp = await gemini.models.generateContent({
        model:    "gemini-2.5-pro",
        config:   { temperature: 0.1, thinkingConfig: { thinkingBudget: 128 } },
        contents: [{ role: "user", parts: [{ text }] }],
      });
      trackUsage(resp);
      return resp;
    };

    // Deterministic pass first (zero cost)
    const deterministicIssues = runDeterministicValidation(
      content, childInfo.name, ageGroup
    );
    const criticalDeterministic = deterministicIssues.filter(
      (i) => i.severity === "critical"
    );

    let validationIssues: ValidationIssue[] = deterministicIssues;

    if (criticalDeterministic.length === 0) {
      // Deterministic passed — run the (cheap) LLM pass for semantic checks
      const llmIssues = await runLLMValidation(
        content, primaryPillar, resolvedBy, makeValidationRequest
      );
      validationIssues = [...deterministicIssues, ...llmIssues];
    }

    let issuesToRepair = validationIssues.filter(
      (i) => i.severity === "critical"
    );

    if (issuesToRepair.length > 0) {
      console.warn(
        `[v2] ${issuesToRepair.length} critical issue(s) — running targeted repair:`,
        issuesToRepair.map((i) => i.code).join(", ")
      );

      // Repair is itself an LLM call — its output is not guaranteed to
      // actually satisfy what it was asked to fix. Re-run the same
      // deterministic checks that flagged the issue after each attempt,
      // bounded to 3 total tries, re-targeting whatever is still broken.
      // (Root-caused from a real incident: repair ran, returned >200 chars,
      // was accepted unverified, but never added a single Lalli:/Fafa:/
      // child: line — the story shipped fully narrator-only.)
      const MAX_REPAIR_ATTEMPTS = 3;
      let attempt = 0;

      while (issuesToRepair.length > 0 && attempt < MAX_REPAIR_ATTEMPTS) {
        attempt++;
        content = await runTargetedRepair(
          content, issuesToRepair, wordCount.label, childInfo.name, makeRequest
        );

        const recheck = runDeterministicValidation(content, childInfo.name, ageGroup);
        issuesToRepair = recheck.filter((i) => i.severity === "critical");

        if (issuesToRepair.length === 0) {
          console.log(`[v2] Repair verified on attempt ${attempt} — all critical issues resolved.`);
        } else {
          console.warn(
            `[v2] Repair attempt ${attempt} still has ${issuesToRepair.length} critical issue(s):`,
            issuesToRepair.map((i) => i.code).join(", ")
          );
        }
      }

      if (issuesToRepair.length > 0) {
        // Give up loudly, not silently: persist the failed attempt for
        // debugging, mark the story as errored (the existing, already-
        // wired failure path — see story/[id]/page.tsx's error screen),
        // and stop before credits are deducted or images/narration are
        // scheduled. A family never sees a silently-broken "ready" story.
        console.error(
          `[v2] Repair failed after ${MAX_REPAIR_ATTEMPTS} attempts — blocking, not marking ready:`,
          issuesToRepair.map((i) => i.code).join(", ")
        );
        await ctx.runMutation(api.stories._setContent, { storyId, content });
        // Real Gemini cost was already spent (1 initial generation + up to
        // MAX_REPAIR_ATTEMPTS repair calls) — persist it the same way a
        // successful generation does, rather than discarding it on this
        // early return. maybeComputeFinalCost (scheduled by _setTextUsage)
        // won't produce a dollar figure on its own, since it waits for
        // images/audio that will never arrive for a failed story — this
        // story is terminal (images/narration never get scheduled below),
        // so compute a text-only estimatedCostUSD directly instead of
        // leaving it permanently unset.
        await ctx.runMutation((api as any).stories._setTextUsage, {
          storyId, textInputTokens, textOutputTokens,
        });
        await ctx.runMutation(internal.costTracking.computeTextOnlyCost, { storyId });
        await ctx.runMutation(api.stories._markStatus, {
          storyId,
          status: "error",
          error: `Story failed content validation after ${MAX_REPAIR_ATTEMPTS} repair attempts (${issuesToRepair.map((i) => i.code).join(", ")}). No credits were charged.`,
        });
        return;
      }
    } else if (validationIssues.length > 0) {
      // Warnings only — log but proceed
      console.log(
        `[v2] ${validationIssues.length} warning(s) (no repair needed):`,
        validationIssues.map((i) => i.code).join(", ")
      );
    } else {
      console.log("[v2] Validation passed.");
    }

    // ── 6. Persist story content ──────────────────────────────────────────
    await ctx.runMutation(api.stories._setContent, { storyId, content });
    await ctx.runMutation(api.stories._markStatus, { storyId, status: "text_ready" });

    // ── 7. Deduct credits ─────────────────────────────────────────────────
    const creditCost = ({ short: 80, medium: 100, long: 150 } as const)[length ?? "short"] ?? 80;
    await ctx.runMutation(api.credit._updateCredit, { creditId, usedCredits: creditCost });

    // ── 8. Write story_memory record ──────────────────────────────────────
    await ctx.runMutation((api as any).storyMemory.create, {
      storyId,
      userId,
      profileId,
      childId,
      mode,
      primaryPillar,
      secondaryPillar,
      structureShape: `${structureShape}_${narrativeArc.variant}`,
      storyLength,
      worldVariety,
      preferenceRoles: {
        ...(childInfo.favoriteAnimal ? { favoriteAnimal: animalRole } : {}),
        ...(childInfo.favoriteColor  ? { favoriteColor:  colorRole  } : {}),
      },
      resolvedBy,
      endingType,
      pillarSource,
    });
    console.log(`[v2] primaryPillar="${primaryPillar}" source="${pillarSource}"${challengeSignal ? ` (challenge window hit)` : ""}`);

    // ── 9. Fire image + narration pipelines ──────────────────────────────
    // Scheduled before metadata extraction so the image and narration pipelines run
    // in parallel with 5c/5d below, rather than waiting an extra 20-40s for them.
    await ctx.scheduler.runAfter(0, internal.internal.generateSceneImage.generateImages, {
      storyId,
      profileId,
      child: {
        id:              childId,
        name:            childInfo.name,
        gender:          childInfo.gender,
        age:             childInfo.age,
        avatarStorageId: childInfo.avatarStorageId,
      },
    });

    await ctx.scheduler.runAfter(0, internal.internal.generateNarration.generateNarration, {
      storyId,
      child: { name: childInfo.name, gender: childInfo.gender, phoneticName: childInfo.phoneticName },
    });

    // Story Challenge generation, eager for every story (Task 4): kicked off
    // here, in parallel with images/narration, rather than waiting for a
    // user tap on the "The End" screen. Uses generateChallengeBypass, not
    // the client-facing generateChallenge action, because there is no user
    // session/auth context inside a scheduled server action — see that
    // function's own doc comment for why the no-auth path is safe here
    // (internalAction, never reachable from any client).
    await ctx.scheduler.runAfter(0, internal.testserver.challenge.generateChallengeBypass, {
      storyId,
      userId,
    });

    // ── 5c. Voice/emotion metadata extraction ────────────────────────────
    // Runs after scheduling so it is in parallel with the image/narration pipelines.
    // Soft-fails with empty result — never blocks the story from being viewable.
    // thinkingBudget pinned to 128 (real floor for gemini-2.5-pro, cannot go
    // to 0) — isolated testing showed default thinking spent ~92% of billed
    // output tokens on this fixed-schema extraction task; floor cut that to
    // an 84% billed-output reduction with well-formed JSON still returned.
    const makeAnalysisRequest = async (text: string) => {
      const resp = await gemini.models.generateContent({
        model:    "gemini-2.5-pro",
        config:   { temperature: 0.1, thinkingConfig: { thinkingBudget: 128 } },
        contents: [{ role: "user", parts: [{ text }] }],
      });
      trackUsage(resp);
      return resp;
    };

    const voiceMetadata = await extractVoiceEmotionMetadata(content, makeAnalysisRequest);

    // ── 5d. Situational sting placement ──────────────────────────────────
    const activeStings: { _id: string; name: string; emotion: string; intensity: "subtle" | "medium"; durationSeconds: number }[] =
      await ctx.runQuery((api as any).stings.listActive, {});

    const availableStings: import("./audioMetadata").AvailableSting[] = activeStings.map((s) => ({
      stingId:         s._id,
      stingName:       s.name,
      emotion:         s.emotion,
      intensity:       s.intensity,
      durationSeconds: s.durationSeconds,
    }));

    const stingPlacements = await computeStingPlacements(
      content, voiceMetadata, availableStings, makeAnalysisRequest
    );

    // Persist Phase 5 audio metadata (non-blocking — soft fail already handled above)
    await ctx.runMutation((api as any).stories._setVoiceMetadata, {
      storyId,
      voiceEmotionMetadata: voiceMetadata.scenes.length > 0 ? voiceMetadata : undefined,
      stingPlacements:      stingPlacements.length > 0       ? stingPlacements : undefined,
    });

    // Cost tracking: text phase is done (all Gemini text calls for this story
    // have happened by this point). Store the total and check whether images
    // + narration (separate scheduled actions) have already finished too.
    await ctx.runMutation((api as any).stories._setTextUsage, {
      storyId, textInputTokens, textOutputTokens,
    });
    await ctx.runMutation(internal.costTracking.maybeComputeFinalCost, { storyId });
  },
});

// ─── Public action: returns storyId immediately, runs v2 engine in background ─

export const enqueueStoryV2: ReturnType<typeof action> = action({
  args: {
    params: v.object({
      theme:        v.string(),
      lesson:       v.optional(v.string()),
      language:     v.optional(v.string()),
      childId:      v.optional(v.union(v.literal("1"), v.literal("2"))),
      sequelOfId:   v.optional(v.id("stories")),
      length:       v.optional(v.union(v.literal("short"), v.literal("medium"), v.literal("long"))),
      // Legacy fields accepted but ignored
      storyType:    v.optional(v.string()),
      textOnly:     v.optional(v.boolean()),
      useFavorites: v.optional(v.boolean()),
    }),
  },

  handler: async (ctx, { params }) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const profile = await ctx.runQuery(api.userProfiles.getProfile, {});
    if (!profile) throw new Error("Profile not found");

    const childId = params.childId || "1";
    const rawName = childId === "1" ? profile.childName : profile.child2Name;
    // Always use first name only; legacy nickname is preserved separately below.
    const name = rawName?.trim().split(" ")[0] || rawName?.trim() || "Child";
    const age =
      childId === "1" ? (profile.childAge  ?? 0) : (profile.child2Age  ?? 0);
    const gender =
      childId === "1" ? (profile.childGender  || "male") : (profile.child2Gender || "male");
    const avatarStorageId =
      childId === "1" ? profile.childAvatarStorageId : profile.child2AvatarStorageId;
    const nickname =
      childId === "1"
        ? profile.childNickName?.trim()        || undefined
        : profile.child2NickName?.trim()       || undefined;
    const favoriteAnimal =
      childId === "1"
        ? profile.favoriteAnimal?.trim()       || undefined
        : profile.child2FavoriteAnimal?.trim() || undefined;
    const favoriteColor =
      childId === "1"
        ? profile.favoriteColor?.trim()        || undefined
        : profile.child2FavoriteColor?.trim()  || undefined;
    const phoneticName =
      childId === "1"
        ? (profile as any).childPhoneticName?.trim()  || undefined
        : (profile as any).child2PhoneticName?.trim() || undefined;

    // Credit gate
    const storyLength     = resolveStoryLength(params.length);
    const requiredCredits = ({ short: 80, medium: 100, long: 150 } as const)[params.length ?? "short"] ?? 80;
    const userCredit      = await ctx.runQuery(api.credit.list, {});
    if (!userCredit || userCredit.length === 0) throw new Error("No credit record found");
    if (userCredit[0].availableCredits < requiredCredits) throw new Error("Not enough credits");
    const creditId = userCredit[0]._id;

    // Sequel content
    let previousStoryContent: string | undefined;
    if (params.sequelOfId) {
      const prevStory = await ctx.runQuery(api.stories.get, { storyId: params.sequelOfId });
      if (prevStory?.content) {
        const metaIdx = prevStory.content.search(/^SCENE METADATA/mi);
        previousStoryContent =
          metaIdx !== -1 ? prevStory.content.slice(0, metaIdx).trim() : prevStory.content;
      }
    }

    // Create story record
    const storyId = await ctx.runMutation(api.stories._create, {
      title:  "",
      params: {
        theme:     params.theme,
        lesson:    params.lesson,
        language:  params.language,
        childName: name || undefined,
      },
    });

    await ctx.runMutation(api.userProfiles.updateStreak, {});

    const userId = String((user as any)._id);

    await ctx.scheduler.runAfter(0, internal.generateStoryV2._generateContentV2, {
      storyId,
      profileId: profile._id,
      childId,
      userId,
      childInfo: {
        name:            name || "",
        gender:          gender as "male" | "female" | "other",
        age,
        avatarStorageId,
        nickname,
        favoriteAnimal,
        favoriteColor,
        phoneticName,
      },
      theme:                params.theme,
      lesson:               params.lesson,
      language:             params.language,
      length:               params.length ?? "medium",
      requestedMode:        (params.storyType === "quest" || params.storyType === "wonder") ? params.storyType as "quest" | "wonder" : undefined,
      creditId,
      previousStoryContent,
    });

    return { storyId };
  },
});
