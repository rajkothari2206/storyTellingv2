// TESTSERVER — Story Challenge v2.1: generation, scoring, and Stars.
// Implements Question Engine spec v2.1 (§§8–10): config-driven generation
// prompt, multi-format questions (mcq/fill_blank/match_column/sequence),
// per-question retry state (UI-side), EQ accepted-answer-set, config-driven
// star tiers, and all §10 validation checks with targeted retry.
// Isolated folder — delete with convex/testserver/* and
// apps/web/src/app/testserver/* if no longer needed.

import { action, internalAction, internalMutation, internalQuery, mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { GoogleGenAI } from "@google/genai";
import { api, internal } from "../_generated/api";
import {
  assertChallengeAccess,
  assertChallengeAccessInAction,
  PILLARS,
  QUICK_CHECK_INDICES,
  type Pillar,
} from "./_shared";

// ─── Age-group helpers ────────────────────────────────────────────────────────

type AgeGroup = "A" | "B" | "C";

function getAgeGroup(age: number): AgeGroup {
  if (age <= 4) return "A";
  if (age <= 7) return "B";
  return "C";
}

const ALLOWED_FORMATS_BY_AGE: Record<AgeGroup, string[]> = {
  A: ["mcq"],
  B: ["mcq", "fill_blank", "match_column"],
  C: ["mcq", "fill_blank", "match_column", "sequence"],
};

// ─── Config defaults ──────────────────────────────────────────────────────────

type PillarDist = { cognitive: number; attention: number; listening: number; emotional: number };

interface ChallengeConfig {
  pillarDistribution: { quick: PillarDist; big: PillarDist };
  rewardTiers: { minPercent: number; maxPercent: number; stars: number }[];
  retryCap: number;
  quickCheckStars: number;
}

const DEFAULT_CHALLENGE_CONFIG: ChallengeConfig = {
  pillarDistribution: {
    quick: { cognitive: 3, attention: 2, listening: 2, emotional: 3 },
    big:   { cognitive: 4, attention: 2, listening: 2, emotional: 4 },
  },
  rewardTiers: [
    { minPercent: 0,  maxPercent: 24,  stars: 5  },
    { minPercent: 25, maxPercent: 49,  stars: 10 },
    { minPercent: 50, maxPercent: 79,  stars: 15 },
    { minPercent: 80, maxPercent: 100, stars: 25 },
  ],
  retryCap: 2,
  quickCheckStars: 2,
};

function parseChallengeConfig(raw: string | undefined): ChallengeConfig {
  if (!raw) return DEFAULT_CHALLENGE_CONFIG;
  try {
    return { ...DEFAULT_CHALLENGE_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CHALLENGE_CONFIG;
  }
}

// ─── Pillar plan helpers ──────────────────────────────────────────────────────

// Builds the ordered pillar array: cognitive × N, attention × N,
// listening × N, emotional × N — matching the fixed pillar order the
// quick-check indices depend on.
function buildPillarPlan(dist: PillarDist): Pillar[] {
  return [
    ...Array(dist.cognitive).fill("cognitive"),
    ...Array(dist.attention).fill("attention"),
    ...Array(dist.listening).fill("listening"),
    ...Array(dist.emotional).fill("emotional"),
  ] as Pillar[];
}

// Quick-check indices: first of each cognitive/attention/listening pillar,
// computed from the distribution so it works for both quick (3-2-2-3)
// and big (4-2-2-4) distributions.
function computeQuickCheckIndices(dist: PillarDist): number[] {
  const cogStart = 0;
  const attStart = dist.cognitive;
  const lisStart = dist.cognitive + dist.attention;
  return [cogStart, attStart, lisStart];
}

// ─── Scoring helpers ──────────────────────────────────────────────────────────

function computeStars(correct: number, total: number, tiers: ChallengeConfig["rewardTiers"]): number {
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  return tiers.find(t => pct >= t.minPercent && pct <= t.maxPercent)?.stars ?? 5;
}

// Checks whether a stored answer is correct for a given question.
// answeredData (JSON) is the primary source for new-format answers;
// answeredIndex (number) is the legacy MCQ fallback.
function isAnswerCorrect(q: any, answeredData: string | undefined, answeredIndex: number | undefined): boolean {
  if (answeredData) {
    try {
      const a = JSON.parse(answeredData);
      const fmt = q.format ?? "mcq";
      if (fmt === "mcq") {
        if (q.correctOptionIds) return q.correctOptionIds.includes(a.selectedId);
        // legacy MCQ fallback within new rows
        return (q.correctIndex ?? q.expectedIndex) === answeredIndex;
      }
      if (fmt === "fill_blank") return a.selectedWord === q.correctWord;
      if (fmt === "match_column") {
        const correct: string[][] = q.correctPairs ?? [];
        const answered: string[][] = a.pairs ?? [];
        if (answered.length !== correct.length) return false;
        return correct.every(([l, r]) => answered.some(([al, ar]: string[]) => al === l && ar === r));
      }
      if (fmt === "sequence") {
        const correct: string[] = q.correctOrder ?? [];
        const answered: string[] = a.order ?? [];
        return correct.length === answered.length && correct.every((id, i) => answered[i] === id);
      }
    } catch {
      return false;
    }
  }
  // Legacy MCQ: correctIndex/expectedIndex
  const target = q.pillar === "emotional" ? q.expectedIndex : q.correctIndex;
  return target !== undefined && answeredIndex === target;
}

// ─── JSON helpers ─────────────────────────────────────────────────────────────

function cleanJson(raw: string): string {
  return raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
}

function storyBody(content: string): string {
  return content.split(/^SCENE METADATA$/m)[0].trim();
}

// ─── §10 Validation ───────────────────────────────────────────────────────────

interface ValidationResult {
  ok: boolean;
  retryHint?: string;
}

function validateQuestions(
  questions: any[],
  dist: PillarDist,
  allowedFormats: string[],
  quickCheckIndices: number[]
): ValidationResult {
  const total = dist.cognitive + dist.attention + dist.listening + dist.emotional;

  // 1. Total count
  if (questions.length !== total) {
    return { ok: false, retryHint: `You generated ${questions.length} questions, exactly ${total} are required.` };
  }

  // 2. Per-pillar count
  const counts: Record<string, number> = { cognitive: 0, attention: 0, listening: 0, emotional: 0 };
  for (const q of questions) counts[q.pillar] = (counts[q.pillar] ?? 0) + 1;
  for (const [pillar, expected] of Object.entries(dist)) {
    if (counts[pillar] !== expected) {
      return { ok: false, retryHint: `You generated ${counts[pillar]} ${pillar} question(s), exactly ${expected} are required.` };
    }
  }

  // 3. Quick-check eligibility: exactly 3, one each from cognitive/attention/listening,
  //    each must be that pillar's FIRST occurrence in the array.
  const qcEligible = questions.map((q, i) => q.isQuickCheckEligible ? i : -1).filter(i => i >= 0);
  if (qcEligible.length !== 3) {
    return { ok: false, retryHint: `Exactly 3 questions must have isQuickCheckEligible: true (one cognitive, one attention, one listening). You marked ${qcEligible.length}.` };
  }
  for (const idx of quickCheckIndices) {
    if (!qcEligible.includes(idx)) {
      const q = questions[idx];
      return { ok: false, retryHint: `The first ${q?.pillar} question (index ${idx}) must have isQuickCheckEligible: true.` };
    }
  }
  // Check quick-check questions are MCQ (approved constraint)
  for (const idx of quickCheckIndices) {
    const fmt = questions[idx]?.format;
    if (fmt && fmt !== "mcq") {
      return { ok: false, retryHint: `Quick-check-eligible questions must use format: "mcq". Question at index ${idx} has format: "${fmt}".` };
    }
  }

  // 4. All formats in allowedFormats
  for (let i = 0; i < questions.length; i++) {
    const fmt = questions[i].format ?? "mcq";
    if (!allowedFormats.includes(fmt)) {
      return { ok: false, retryHint: `Question ${i + 1} uses format "${fmt}" which is not allowed for this age group. Allowed: ${allowedFormats.join(", ")}.` };
    }
  }

  // 5 & 6. Correct-answer validation
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const fmt = q.format ?? "mcq";
    if (fmt === "mcq") {
      const ids = q.content?.correctOptionIds ?? q.correctOptionIds;
      if (!Array.isArray(ids) || ids.length === 0) {
        return { ok: false, retryHint: `Question ${i + 1} (mcq) is missing correctOptionIds.` };
      }
      if (q.pillar !== "emotional" && ids.length !== 1) {
        return { ok: false, retryHint: `Non-EQ question ${i + 1} must have exactly 1 correctOptionId, got ${ids.length}.` };
      }
      if (q.pillar === "emotional" && (ids.length < 2 || ids.length > 3)) {
        return { ok: false, retryHint: `EQ question ${i + 1} must have 2 or 3 correctOptionIds (accepted set), got ${ids.length}.` };
      }
      // 7. Option count 2–4
      const opts = q.content?.options ?? q.richOptions;
      if (!Array.isArray(opts) || opts.length < 2 || opts.length > 4) {
        return { ok: false, retryHint: `Question ${i + 1} (mcq) must have 2–4 options, got ${opts?.length ?? 0}.` };
      }
    }
    if (fmt === "fill_blank") {
      if (!q.content?.correctWord && !q.correctWord) {
        return { ok: false, retryHint: `Question ${i + 1} (fill_blank) is missing correctWord.` };
      }
    }
    if (fmt === "match_column") {
      const pairs: string[][] = q.content?.correctPairs ?? q.correctPairs ?? [];
      const left: any[] = q.content?.leftItems ?? q.leftItems ?? [];
      const right: any[] = q.content?.rightItems ?? q.rightItems ?? [];
      const leftIds = new Set(left.map((x: any) => x.id));
      const rightIds = new Set(right.map((x: any) => x.id));
      for (const [l, r] of pairs) {
        if (!leftIds.has(l) || !rightIds.has(r)) {
          return { ok: false, retryHint: `Question ${i + 1} (match_column) has a correctPair referencing an id not in leftItems/rightItems.` };
        }
      }
      if (pairs.length < 3) {
        return { ok: false, retryHint: `Question ${i + 1} (match_column) must have at least 3 pairs, got ${pairs.length}.` };
      }
      // Every item must appear exactly once
      const pairedLeft = pairs.map(([l]) => l);
      const pairedRight = pairs.map(([, r]) => r);
      if (new Set(pairedLeft).size !== pairedLeft.length || new Set(pairedRight).size !== pairedRight.length) {
        return { ok: false, retryHint: `Question ${i + 1} (match_column) has duplicate ids in correctPairs.` };
      }
    }
    if (fmt === "sequence") {
      const items: any[] = q.content?.items ?? q.sequenceItems ?? [];
      const order: string[] = q.content?.correctOrder ?? q.correctOrder ?? [];
      const itemIds = new Set(items.map((x: any) => x.id));
      if (order.length !== items.length || new Set(order).size !== order.length) {
        return { ok: false, retryHint: `Question ${i + 1} (sequence) correctOrder must contain each item id exactly once.` };
      }
      for (const id of order) {
        if (!itemIds.has(id)) {
          return { ok: false, retryHint: `Question ${i + 1} (sequence) correctOrder references id "${id}" not found in items.` };
        }
      }
    }

    // 8. revealFraming / promptText tone check
    const BANNED = ["wrong", "incorrect", "correct answer is"];
    const textFields = [q.promptText, q.revealFraming].filter(Boolean).map((s: string) => s.toLowerCase());
    for (const field of textFields) {
      for (const banned of BANNED) {
        if (field.includes(banned)) {
          return { ok: false, retryHint: `Question ${i + 1} contains banned phrase "${banned}" in promptText or revealFraming. Rewrite to sound like Lalli or Fafa speaking warmly.` };
        }
      }
    }
  }

  return { ok: true };
}

// Turns a terse validation retryHint into a fuller corrective instruction for
// the specific failure modes we have real evidence of the model repeating
// across a retry. Real incident: an EQ question kept getting exactly 1
// correctOptionId (not the required 2-3) through both the initial attempt
// and the one retry that existed at the time — the terse hint alone wasn't
// enough for the model to reliably self-correct. Falls back to the plain
// hint, unchanged, for every other validation failure.
function buildRetryCorrection(retryHint: string | undefined): string {
  if (!retryHint) return "";
  if (/must have 2 or 3 correctOptionIds/.test(retryHint)) {
    return (
      `CORRECTION REQUIRED: ${retryHint}\n\n` +
      `Reminder: Emotional intelligence questions are deliberately NOT single-answer. ` +
      `Feelings are ambiguous — define 2 or 3 reasonably valid feeling words as the ` +
      `accepted set (e.g. both "nervous" and "worried" for a scene that's mildly ` +
      `unsettling but not terrifying), never a single rigid "correct" feeling. Every ` +
      `EQ question's correctOptionIds array must contain exactly 2 or 3 ids — not 1, not 4.`
    );
  }
  return `CORRECTION REQUIRED: ${retryHint}`;
}

// ─── Parse model output into stored question shape ───────────────────────────

function parseQuestion(raw: any, pillar: Pillar): any {
  const content = raw.content ?? {};
  const fmt: string = raw.format ?? "mcq";

  const base = {
    pillar,
    snippet: String(raw.storyGrounding ?? raw.snippet ?? ""),
    id: String(raw.id ?? ""),
    format: fmt as any,
    isQuickCheckEligible: Boolean(raw.isQuickCheckEligible),
    storyGrounding: String(raw.storyGrounding ?? ""),
    promptText: String(raw.promptText ?? raw.question ?? ""),
    revealFraming: String(raw.revealFraming ?? ""),
  };

  if (fmt === "mcq") {
    const opts: { id: string; text: string }[] = content.options ?? raw.richOptions ?? [];
    const ids: string[] = content.correctOptionIds ?? raw.correctOptionIds ?? [];
    return {
      ...base,
      richOptions: opts.map((o: any) => ({ id: String(o.id), text: String(o.text) })),
      correctOptionIds: ids.map(String),
      // Retain legacy fields for backward-compat UI
      options: opts.map((o: any) => String(o.text)),
      correctIndex: pillar !== "emotional" ? opts.findIndex((o: any) => ids[0] === o.id) : undefined,
      expectedIndex: pillar === "emotional" ? opts.findIndex((o: any) => ids[0] === o.id) : undefined,
    };
  }
  if (fmt === "fill_blank") {
    return {
      ...base,
      sentenceWithBlank: String(content.sentenceWithBlank ?? ""),
      wordBank: (content.wordBank ?? []).map(String),
      correctWord: String(content.correctWord ?? ""),
    };
  }
  if (fmt === "match_column") {
    return {
      ...base,
      leftItems: (content.leftItems ?? []).map((x: any) => ({ id: String(x.id), text: String(x.text) })),
      rightItems: (content.rightItems ?? []).map((x: any) => ({ id: String(x.id), text: String(x.text) })),
      correctPairs: (content.correctPairs ?? []).map((p: any) => [String(p[0]), String(p[1])]),
    };
  }
  if (fmt === "sequence") {
    return {
      ...base,
      sequenceItems: (content.items ?? []).map((x: any) => ({ id: String(x.id), text: String(x.text) })),
      correctOrder: (content.correctOrder ?? []).map(String),
    };
  }
  return base;
}

// ─── Admin: regenerate a Story Challenge for any story ────────────────────────
//
// The admin Stories tab's "⚡ Challenge" button used to call `generateChallenge`
// directly, which resolves `userId` from the ADMIN's own session (via
// assertChallengeAccessInAction) rather than the story's actual owner. Since
// generateChallenge/generateChallengeBypass dedup on (storyId, userId), that
// mismatch meant the dedup check against the customer's real, already-ready
// challenge always missed — so clicking it on any story that already had a
// working challenge silently attempted a brand-new generation under the
// admin's own identity instead of returning the existing one. On failure
// (as happened on story k1720qenwzvtbr8hd6k5267z558e4zz9, 2026-09-12) this
// stamps stories.challengeGenerationError even though the real customer's
// challenge was already fine and untouched — a misleading false alarm with
// no way to self-clear, since a future real success never reaches this
// story+userId's error flag. Routes through generateChallengeBypass with the
// story's own userId instead, so dedup actually works.
export const adminGenerateChallengeForStory = action({
  args: { storyId: v.id("stories") },
  handler: async (ctx, { storyId }): Promise<{ challengeId: string }> => {
    const { isAdmin } = await assertChallengeAccessInAction(ctx);
    if (!isAdmin) throw new Error("Admin access required");

    const story: any = await ctx.runQuery(api.stories.get, { storyId });
    if (!story) throw new Error("Story not found");
    if (!story.userId) throw new Error("Story has no owning userId");

    return await ctx.runAction(internal.testserver.challenge.generateChallengeBypass, {
      storyId,
      userId: story.userId,
    });
  },
});

// ─── Generate the Story Challenge questions ───────────────────────────────────

export const generateChallenge = action({
  args: { storyId: v.id("stories") },
  handler: async (ctx, { storyId }): Promise<{ challengeId: string }> => {
    const { userId } = await assertChallengeAccessInAction(ctx);

    // A story gets at most one Challenge, ever — whether it's already been
    // completed OR is just sitting ready-but-untaken. Checking only
    // "completed" here used to leave a real gap: _store always does a plain
    // insert with no dedup, so a second call while a ready-but-untaken
    // challenge already existed (two tabs, a client retry, calling this
    // action again directly) would silently generate and store a second,
    // different question set for the same story. Checking for ANY existing
    // row closes that, and also makes concurrent calls converge on the same
    // row rather than each inserting their own.
    const existing = await ctx.runQuery(internal.testserver.challenge._getExistingForStory, { userId, storyId });
    if (existing) return { challengeId: existing._id };

    const story = await ctx.runQuery(api.stories.get, { storyId });
    if (!story || !story.content) throw new Error("Story not ready yet");

    const profile: any = await ctx.runQuery(api.userProfiles.getProfile, {});
    const childName = story.params.childName || profile?.childName || "the child";
    const childAge: number = profile?.childAge ?? 5;

    // Read config from system_config
    const promptRow: any = await ctx.runQuery(api.systemConfig.get, { key: "QuestionGenPromptV1" });
    const configRow: any = await ctx.runQuery(api.systemConfig.get, { key: "ChallengeConfigV1" });
    const cfg = parseChallengeConfig(configRow?.value);

    const systemPrompt = promptRow?.value ?? FALLBACK_SYSTEM_PROMPT;

    // Determine story length bucket
    const storyLength = story.params.length ?? "short";
    const bucket: "quick" | "big" = storyLength === "short" ? "quick" : "big";
    const dist = cfg.pillarDistribution[bucket];
    const totalQuestions = dist.cognitive + dist.attention + dist.listening + dist.emotional;

    const ageGroup = getAgeGroup(childAge);
    const allowedFormats = ALLOWED_FORMATS_BY_AGE[ageGroup];

    // Build pillar plan and quick-check indices
    const pillarPlan = buildPillarPlan(dist);
    const qcIndices = computeQuickCheckIndices(dist);

    // Read recent pillar-format history from last 2-3 completed challenges
    const recentHistory: { pillar: string; format: string }[] = await ctx.runQuery(
      internal.testserver.challenge._getRecentPillarFormatHistory,
      { userId, limit: 3 }
    );

    // Build per-story dynamic payload (spec §8.2)
    const body = storyBody(story.content);
    const payload = {
      story: { fullText: body, language: "English" },
      child: { name: childName, age: childAge, ageGroup },
      questionPlan: {
        totalQuestions,
        pillarDistribution: dist,
        // Exact per-index pillar order — output questions in this sequence.
        // The validator checks quick-check eligibility by array index, so order is mandatory.
        questionSequence: pillarPlan,
        quickCheckIndices: qcIndices,
      },
      allowedFormatsByAgeGroup: allowedFormats,
      recentPillarFormatHistory: recentHistory.slice(0, 6), // last ~2 challenges worth
    };

    const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

    // Real Gemini cost for this generation — was previously not tracked
    // anywhere (see Task 5). Accumulated across the first attempt and the
    // one retry-on-validation-failure, then persisted after a successful
    // generation so it's folded into the story's estimatedCostUSD.
    let challengeTextInputTokens = 0;
    let challengeTextOutputTokens = 0;

    async function ask(extraInstruction?: string): Promise<any> {
      const userMessage = extraInstruction
        ? `${extraInstruction}\n\n${JSON.stringify(payload)}`
        : JSON.stringify(payload);
      const resp = await gemini.models.generateContent({
        // gemini-2.5-flash, not -pro: this is a rigid, schema-constrained
        // quiz-writer grounded in a payload that already contains the full
        // story text — not open-ended creative writing. Flash is ~4x
        // cheaper both ways ($0.30/$2.50 vs $1.25/$10.00 per M tokens) and
        // this task doesn't need frontier reasoning to follow the format.
        model: "gemini-2.5-flash",
        config: {
          temperature: 0.7,
          responseMimeType: "application/json",
          systemInstruction: systemPrompt,
        },
        contents: [{ role: "user", parts: [{ text: userMessage }] }],
      });
      const u = resp.usageMetadata;
      challengeTextInputTokens += u?.promptTokenCount ?? 0;
      challengeTextOutputTokens += (u?.candidatesTokenCount ?? 0) + (u?.thoughtsTokenCount ?? 0);
      const text = resp.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
      return JSON.parse(cleanJson(text));
    }

    // First attempt
    let parsed: any;
    try {
      parsed = await ask();
    } catch {
      parsed = null;
    }

    let validation: ValidationResult = { ok: false, retryHint: "Parse failed" };
    if (parsed?.questions && Array.isArray(parsed.questions)) {
      validation = validateQuestions(parsed.questions, dist, allowedFormats, qcIndices);
    }

    // Up to 2 retries (3 attempts total) with a targeted correction, not just
    // 1 — real incident: an EQ question kept getting exactly 1
    // correctOptionId through both the initial attempt and the single retry
    // that used to exist, so the whole generation failed and (being a
    // fire-and-forget scheduled job when eager-triggered) vanished with zero
    // visibility. _flagChallengeGenerationFailed makes that visible now.
    const MAX_CHALLENGE_ATTEMPTS = 3;
    let attempt = 1;
    while (!validation.ok && attempt < MAX_CHALLENGE_ATTEMPTS) {
      attempt++;
      try {
        parsed = await ask(buildRetryCorrection(validation.retryHint));
      } catch {
        parsed = null;
      }
      validation = parsed?.questions && Array.isArray(parsed.questions)
        ? validateQuestions(parsed.questions, dist, allowedFormats, qcIndices)
        : { ok: false, retryHint: "Parse failed" };
    }

    if (!validation.ok) {
      const reason = `failed validation after ${attempt} attempts. Last issue: ${validation.retryHint ?? "unknown"}`;
      await ctx.runMutation(internal.stories._flagChallengeGenerationFailed, { storyId, reason });
      throw new Error(`Story Challenge generation ${reason} Flagged for manual review.`);
    }
    // A different, earlier invocation for this story (e.g. the eager
    // scheduled attempt) may have failed and flagged itself — this one
    // succeeded, so clear any stale flag regardless of which attempt within
    // *this* call it took. Safe no-op if nothing was flagged.
    await ctx.runMutation(internal.stories._clearChallengeGenerationFailed, { storyId });

    // Map raw output to stored question shape
    const questions = parsed.questions.map((q: any, i: number) =>
      parseQuestion(q, pillarPlan[i])
    );

    // Extract pillar-format pairs for history tracking
    const pillarFormatHistory = questions.map((q: any) => ({
      pillar: q.pillar,
      format: q.format ?? "mcq",
    }));

    const challengeId: string = await ctx.runMutation(internal.testserver.challenge._store, {
      userId,
      storyId,
      childName,
      childAge,
      theme: story.params.theme,
      lesson: story.params.lesson,
      length: storyLength as any,
      questions,
      quickCheckIndices: qcIndices,
      pillarFormatHistory,
    });

    await ctx.runMutation(api.stories._setChallengeCost, {
      storyId,
      challengeTextInputTokens,
      challengeTextOutputTokens,
    });
    await ctx.runMutation(internal.costTracking.maybeComputeFinalCost, { storyId });

    return { challengeId };
  },
});

// ─── No-session challenge generator ──────────────────────────────────────────
//
// SECURITY NOTE — NO AUTH CHECK IS INTENTIONAL AND SAFE ONLY UNDER ONE CONDITION:
//
//   This function is declared as `internalAction`. In Convex, internalActions are
//   NEVER reachable from any client — they cannot be called from browser code,
//   mobile apps, or any HTTP request. The only callers are the Convex dashboard
//   (admin-authenticated) and other server-side Convex functions. This is what
//   makes it safe to skip the user-session check.
//
//   ⚠  DO NOT convert this to `action`. An `action` is publicly callable by any
//      client without any auth check, which would allow anyone to generate and
//      store arbitrary challenges against arbitrary story IDs.
//
//   ⚠  DO NOT wire this into any client-facing route, API handler, or HTTP
//      endpoint. If a client path ever needs to trigger challenge generation,
//      use `generateChallenge` (which enforces admin session auth) instead.
//
// PURPOSE:
//   Replicates `generateChallenge` for cases where no active user session is
//   available. Originally built for dashboard-triggered generation on test/QA
//   stories; as of Task 4 (eager Challenge generation) this is now also the
//   primary path — generateStoryV2 schedules it for every real story right
//   after text_ready, in parallel with images/narration, since there is no
//   user session inside a scheduled server action. Accepts an explicit userId
//   so pillar-format history and the stored challenge row are correctly tied
//   to the right account. Derives childAge from the story's linked profile
//   automatically (pass childAge only to override).
//
// Usage: Convex dashboard → Functions → Run internal function
//   internal > testserver > challenge > generateChallengeBypass
//   Args: { "storyId": "<id>", "userId": "<id>" }

export const generateChallengeBypass = internalAction({
  args: {
    storyId: v.id("stories"),
    userId: v.string(),
    // childAge is derived from the story's linked profile; pass only to override.
    childAge: v.optional(v.number()),
  },
  handler: async (ctx, { storyId, userId, childAge: childAgeOverride }): Promise<{ challengeId: string }> => {
    const story = await ctx.runQuery(api.stories.get, { storyId });
    if (!story || !story.content) throw new Error("Story not ready yet");

    // Same dedup as generateChallenge above — Convex's scheduler is
    // at-least-once, not exactly-once, so a re-delivered job (or any future
    // caller invoking this action twice for the same story) must converge on
    // the same row rather than silently inserting a second challenge.
    const existing = await ctx.runQuery(internal.testserver.challenge._getExistingForStory, { userId, storyId });
    if (existing) return { challengeId: existing._id };

    const childName: string = (story as any).params?.childName || "the child";

    // Derive age from the story's profile (same pattern as checkWordShares).
    let childAge: number;
    if (childAgeOverride !== undefined) {
      childAge = childAgeOverride;
    } else {
      const profileId = (story as any).profileId;
      const profile: any = profileId
        ? await ctx.runQuery(internal.userProfiles._getProfileById, { profileId })
        : null;
      if (profile) {
        const isChild2 =
          profile.child2Name &&
          profile.child2Name.toLowerCase() === childName.toLowerCase();
        childAge = isChild2
          ? (profile.child2Age ?? profile.childAge ?? 5)
          : (profile.childAge ?? 5);
      } else {
        childAge = 5;
        console.warn("[generateChallengeBypass] No profile found — defaulting childAge to 5");
      }
    }
    console.log(`[generateChallengeBypass] childName=${childName} childAge=${childAge}`);

    const promptRow: any = await ctx.runQuery(api.systemConfig.get, { key: "QuestionGenPromptV1" });
    const configRow: any = await ctx.runQuery(api.systemConfig.get, { key: "ChallengeConfigV1" });
    const cfg = parseChallengeConfig(configRow?.value);
    const systemPrompt = promptRow?.value ?? FALLBACK_SYSTEM_PROMPT;

    const storyLength = (story as any).params?.length ?? "short";
    const bucket: "quick" | "big" = storyLength === "short" ? "quick" : "big";
    const dist = cfg.pillarDistribution[bucket];
    const totalQuestions = dist.cognitive + dist.attention + dist.listening + dist.emotional;

    const ageGroup = getAgeGroup(childAge);
    const allowedFormats = ALLOWED_FORMATS_BY_AGE[ageGroup];
    const pillarPlan = buildPillarPlan(dist);
    const qcIndices = computeQuickCheckIndices(dist);

    const recentHistory: { pillar: string; format: string }[] = await ctx.runQuery(
      internal.testserver.challenge._getRecentPillarFormatHistory,
      { userId, limit: 3 }
    );

    const body = storyBody((story as any).content);
    const payload = {
      story: { fullText: body, language: "English" },
      child: { name: childName, age: childAge, ageGroup },
      questionPlan: {
        totalQuestions,
        pillarDistribution: dist,
        questionSequence: pillarPlan,
        quickCheckIndices: qcIndices,
      },
      allowedFormatsByAgeGroup: allowedFormats,
      recentPillarFormatHistory: recentHistory.slice(0, 6),
    };

    const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

    let challengeTextInputTokens = 0;
    let challengeTextOutputTokens = 0;

    async function ask(extraInstruction?: string): Promise<any> {
      const userMessage = extraInstruction
        ? `${extraInstruction}\n\n${JSON.stringify(payload)}`
        : JSON.stringify(payload);
      const resp = await gemini.models.generateContent({
        // Same flash downgrade as generateChallenge above — schema-constrained,
        // grounded quiz generation doesn't need pro-tier reasoning.
        model: "gemini-2.5-flash",
        config: { temperature: 0.7, responseMimeType: "application/json", systemInstruction: systemPrompt },
        contents: [{ role: "user", parts: [{ text: userMessage }] }],
      });
      const u = resp.usageMetadata;
      challengeTextInputTokens += u?.promptTokenCount ?? 0;
      challengeTextOutputTokens += (u?.candidatesTokenCount ?? 0) + (u?.thoughtsTokenCount ?? 0);
      const text = resp.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
      return JSON.parse(cleanJson(text));
    }

    let parsed: any;
    try { parsed = await ask(); } catch { parsed = null; }

    let validation: ValidationResult = { ok: false, retryHint: "Parse failed" };
    if (parsed?.questions && Array.isArray(parsed.questions)) {
      validation = validateQuestions(parsed.questions, dist, allowedFormats, qcIndices);
    }

    // Same 3-attempt-total, targeted-correction, real-visibility fix as
    // generateChallenge above — see that copy for the incident this fixes.
    const MAX_CHALLENGE_ATTEMPTS = 3;
    let attempt = 1;
    while (!validation.ok && attempt < MAX_CHALLENGE_ATTEMPTS) {
      attempt++;
      try {
        parsed = await ask(buildRetryCorrection(validation.retryHint));
      } catch {
        parsed = null;
      }
      validation = parsed?.questions && Array.isArray(parsed.questions)
        ? validateQuestions(parsed.questions, dist, allowedFormats, qcIndices)
        : { ok: false, retryHint: "Parse failed" };
    }

    if (!validation.ok) {
      const reason = `failed validation after ${attempt} attempts. Last issue: ${validation.retryHint ?? "unknown"}`;
      await ctx.runMutation(internal.stories._flagChallengeGenerationFailed, { storyId, reason });
      throw new Error(`Story Challenge generation ${reason}`);
    }
    await ctx.runMutation(internal.stories._clearChallengeGenerationFailed, { storyId });

    const questions = parsed.questions.map((q: any, i: number) => parseQuestion(q, pillarPlan[i]));
    const pillarFormatHistory = questions.map((q: any) => ({ pillar: q.pillar, format: q.format ?? "mcq" }));

    const challengeId: string = await ctx.runMutation(internal.testserver.challenge._store, {
      userId,
      storyId,
      childName,
      childAge,
      theme: (story as any).params?.theme ?? "",
      lesson: (story as any).params?.lesson,
      length: storyLength as any,
      questions,
      quickCheckIndices: qcIndices,
      pillarFormatHistory,
    });

    await ctx.runMutation(api.stories._setChallengeCost, {
      storyId,
      challengeTextInputTokens,
      challengeTextOutputTokens,
    });
    await ctx.runMutation(internal.costTracking.maybeComputeFinalCost, { storyId });

    return { challengeId };
  },
});

// ─── Internal query: recent pillar-format history ─────────────────────────────

export const _getRecentPillarFormatHistory = internalQuery({
  args: { userId: v.string(), limit: v.number() },
  handler: async (ctx, { userId, limit }) => {
    const rows = await ctx.db
      .query("testserver_challenges")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const completed = rows
      .filter((r) => r.status === "completed" && Array.isArray(r.pillarFormatHistory))
      .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))
      .slice(0, limit);
    return completed.flatMap((r) => r.pillarFormatHistory ?? []);
  },
});

// ─── Store challenge ──────────────────────────────────────────────────────────

export const _store = internalMutation({
  args: {
    userId: v.string(),
    storyId: v.id("stories"),
    childName: v.string(),
    childAge: v.number(),
    theme: v.string(),
    lesson: v.optional(v.string()),
    length: v.union(v.literal("short"), v.literal("medium"), v.literal("long")),
    questions: v.array(v.any()),
    quickCheckIndices: v.array(v.number()),
    pillarFormatHistory: v.optional(v.array(v.object({ pillar: v.string(), format: v.string() }))),
  },
  handler: async (ctx, args) => {
    // Authoritative dedup point — generateChallenge's own pre-check has a
    // TOCTOU gap (two concurrent calls can both pass it before either has
    // stored), but this re-check-then-insert happens inside a single Convex
    // mutation, which Convex serializes against the by_story index: if two
    // concurrent _store calls for the same story+user race here, one of
    // them sees the other's row on this read (or gets an OCC retry that
    // then sees it), so a story never ends up with two rows even under
    // real concurrency.
    const existing = await ctx.db
      .query("testserver_challenges")
      .withIndex("by_story", (q) => q.eq("storyId", args.storyId))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();
    if (existing) return existing._id;

    return await ctx.db.insert("testserver_challenges", {
      userId: args.userId,
      storyId: args.storyId,
      childName: args.childName,
      childAge: args.childAge,
      theme: args.theme,
      lesson: args.lesson,
      length: args.length,
      questions: args.questions,
      quickCheckIndices: args.quickCheckIndices,
      pillarFormatHistory: args.pillarFormatHistory,
      answeredIndices: [],
      status: "ready",
      createdAt: Date.now(),
    });
  },
});

// ─── In-story quick check ─────────────────────────────────────────────────────

export const submitQuickCheck = mutation({
  args: {
    challengeId: v.id("testserver_challenges"),
    questionIndex: v.number(),
    answeredData: v.optional(v.string()),  // new-format JSON
    answeredIndex: v.optional(v.number()), // legacy MCQ fallback
  },
  handler: async (ctx, { challengeId, questionIndex, answeredData, answeredIndex }) => {
    const { userId } = await assertChallengeAccess(ctx);
    const row = await ctx.db.get(challengeId);
    if (!row || row.userId !== userId) throw new Error("Not found");

    const cfg = parseChallengeConfig(undefined); // defaults; could read from DB but quick-check stars rarely change
    const quickCheckIndices = row.quickCheckIndices ?? QUICK_CHECK_INDICES;
    if (!quickCheckIndices.includes(questionIndex)) throw new Error("Not a quick-check question");

    const existing = row.answeredIndices ?? [];
    if (existing.some((a) => a.index === questionIndex)) return; // idempotent

    await ctx.db.patch(challengeId, {
      answeredIndices: [...existing, { index: questionIndex, answeredIndex, answeredData }],
    });
    await ctx.db.insert("testserver_stars", {
      userId,
      amount: cfg.quickCheckStars,
      reason: "quick_check",
      refId: challengeId,
      createdAt: Date.now(),
    });
  },
});

export const getNextQuickCheck = query({
  args: { challengeId: v.id("testserver_challenges") },
  handler: async (ctx, { challengeId }) => {
    const { userId } = await assertChallengeAccess(ctx);
    const row = await ctx.db.get(challengeId);
    if (!row || row.userId !== userId) return null;
    const quickCheckIndices = row.quickCheckIndices ?? QUICK_CHECK_INDICES;
    const answered = new Set((row.answeredIndices ?? []).map((a) => a.index));
    const pending = quickCheckIndices.filter((i) => !answered.has(i));
    return pending.map((i) => ({ index: i, ...row.questions[i] }));
  },
});

// ─── Story Challenge submission ───────────────────────────────────────────────

function resolveChallengeIndices(row: {
  quickCheckIndices?: number[];
  questions: any[];
  answeredIndices?: { index: number }[];
}) {
  const quickCheckIndices = new Set(row.quickCheckIndices ?? QUICK_CHECK_INDICES);
  const answeredSoFar = new Set((row.answeredIndices ?? []).map((a) => a.index));
  const indices: number[] = [];
  row.questions.forEach((_, i) => {
    if (!quickCheckIndices.has(i)) indices.push(i); // always in challenge
    else if (!answeredSoFar.has(i)) indices.push(i); // unanswered quick-check rolls in
  });
  return indices;
}

export const getChallengeQuestions = query({
  args: { challengeId: v.id("testserver_challenges") },
  handler: async (ctx, { challengeId }) => {
    const { userId } = await assertChallengeAccess(ctx);
    const row = await ctx.db.get(challengeId);
    if (!row || row.userId !== userId) return null;
    const indices = resolveChallengeIndices(row);
    return indices.map((i) => ({ index: i, ...row.questions[i] }));
  },
});

export const submitChallenge = mutation({
  args: {
    challengeId: v.id("testserver_challenges"),
    answers: v.array(v.object({
      index: v.number(),
      answeredData: v.optional(v.string()),      // new-format JSON answer
      answeredIndex: v.optional(v.number()),     // legacy MCQ fallback
      firstAttemptCorrect: v.optional(v.boolean()), // captured at first tap, used for scoring
    })),
  },
  handler: async (ctx, { challengeId, answers }) => {
    const { userId } = await assertChallengeAccess(ctx);
    const row = await ctx.db.get(challengeId);
    if (!row || row.userId !== userId) throw new Error("Not found");
    if (row.status === "completed") return row.score;

    // Read config for star tiers
    const configRow: any = await ctx.db
      .query("system_config")
      .withIndex("by_key", (q) => q.eq("key", "ChallengeConfigV1"))
      .first();
    const cfg = parseChallengeConfig(configRow?.value);

    const challengeIndices = resolveChallengeIndices(row);
    const answerMap = new Map(answers.map((a) => [a.index, a]));
    if (challengeIndices.some((i) => !answerMap.has(i))) throw new Error("Missing an answer");

    // Build first-attempt map from challenge answers (quick-check answers don't carry this)
    const firstAttemptMap = new Map<number, boolean>();
    for (const [i, a] of answerMap) {
      if (a.firstAttemptCorrect !== undefined) firstAttemptMap.set(i, a.firstAttemptCorrect);
    }

    // Merge quick-check answers + challenge answers
    const fullAnswerMap = new Map<number, { answeredData?: string; answeredIndex?: number }>();
    for (const a of row.answeredIndices ?? []) fullAnswerMap.set(a.index, a);
    for (const [i, a] of answerMap) fullAnswerMap.set(i, a);

    const perPillar = new Map<Pillar, { correct: number; total: number }>();
    for (const p of PILLARS) perPillar.set(p, { correct: 0, total: 0 });

    let gradableCorrect = 0;

    row.questions.forEach((q, i) => {
      const ans = fullAnswerMap.get(i);
      if (!ans) return;
      const bucket = perPillar.get(q.pillar as Pillar)!;
      bucket.total += 1;
      // Use first-attempt correctness for scoring if available (challenge questions);
      // fall back to final-answer correctness for quick-check questions.
      const firstAttempt = firstAttemptMap.get(i);
      const correct = firstAttempt !== undefined
        ? firstAttempt
        : isAnswerCorrect(q, ans.answeredData, ans.answeredIndex);
      if (correct) { bucket.correct += 1; gradableCorrect += 1; }
    });

    const gradableTotal = row.questions.length;
    const ratios = PILLARS.map((p) => {
      const b = perPillar.get(p)!;
      return { pillar: p, ratio: b.total > 0 ? b.correct / b.total : 0, correct: b.correct, total: b.total };
    });
    const superpower = ratios.reduce((best, r) => (r.ratio > best.ratio ? r : best));
    const growingIn   = ratios.reduce((worst, r) => (r.ratio < worst.ratio ? r : worst));

    const starsEarned = computeStars(gradableCorrect, gradableTotal, cfg.rewardTiers);

    const score = {
      gradableCorrect,
      gradableTotal,
      perPillar: ratios.map(({ pillar, correct, total }) => ({ pillar, correct, total })),
      growingInPillar: growingIn.pillar,
      superpowerPillar: superpower.pillar,
      starsEarned,
      challengeIndices,
    };

    // Merge all answered records (persist firstAttemptCorrect for auditability)
    const mergedAnswered = [...(row.answeredIndices ?? [])];
    for (const i of challengeIndices) {
      if (!mergedAnswered.some((a) => a.index === i)) {
        const ans = answerMap.get(i)!;
        mergedAnswered.push({
          index: i,
          answeredData: ans.answeredData,
          answeredIndex: ans.answeredIndex,
          ...(ans.firstAttemptCorrect !== undefined ? { firstAttemptCorrect: ans.firstAttemptCorrect } : {}),
        });
      }
    }

    await ctx.db.patch(challengeId, {
      answeredIndices: mergedAnswered,
      status: "completed",
      score,
      completedAt: Date.now(),
    });

    await ctx.db.insert("testserver_stars", {
      userId,
      amount: starsEarned,
      reason: "challenge_complete",
      refId: challengeId,
      createdAt: Date.now(),
    });

    return score;
  },
});

// Internal helper: returns an existing completed challenge for this story+user, if any.
// Any existing challenge row for this story+user, regardless of status
// ("ready" or "completed") — a story gets at most one, ever. See the
// comment at generateChallenge's call site for why this checks both states.
export const _getExistingForStory = internalQuery({
  args: { userId: v.string(), storyId: v.id("stories") },
  handler: async (ctx, { userId, storyId }) => {
    return await ctx.db
      .query("testserver_challenges")
      .withIndex("by_story", (q) => q.eq("storyId", storyId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();
  },
});

// ─── Read queries (unchanged surface area) ────────────────────────────────────

export const getChallenge = query({
  args: { challengeId: v.id("testserver_challenges") },
  handler: async (ctx, { challengeId }) => {
    const { userId } = await assertChallengeAccess(ctx);
    const row = await ctx.db.get(challengeId);
    if (!row || row.userId !== userId) return null;
    return row;
  },
});

export const getForStory = query({
  args: { storyId: v.id("stories") },
  handler: async (ctx, { storyId }) => {
    const { userId } = await assertChallengeAccess(ctx);
    return await ctx.db
      .query("testserver_challenges")
      .withIndex("by_story", (q) => q.eq("storyId", storyId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();
  },
});

export const getHistory = query({
  args: {},
  handler: async (ctx) => {
    const { userId } = await assertChallengeAccess(ctx);
    const rows = await ctx.db
      .query("testserver_challenges")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return rows
      .filter((r) => r.status === "completed")
      .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));
  },
});

export const getStarsBalance = query({
  args: {},
  handler: async (ctx) => {
    const { userId } = await assertChallengeAccess(ctx);
    const rows = await ctx.db
      .query("testserver_stars")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return rows.reduce((sum, r) => sum + r.amount, 0);
  },
});

// ─── Dashboard summary (Phase 4) ───────────────────────────────────────────
// Used by both the compact dashboard teaser card and the Growth tab. Always
// compares against the LAST COMPLETED Challenge (never a calendar week) —
// same rule as the Results screen's already-correct "up from X" comparison,
// so a family with an irregular cadence never sees a false reading.
export const getDashboardSummary = query({
  args: {},
  handler: async (ctx) => {
    const { userId } = await assertChallengeAccess(ctx);

    const completed = (
      await ctx.db
        .query("testserver_challenges")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect()
    )
      .filter((r) => r.status === "completed" && r.score)
      .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));

    const latestRow = completed[0];
    const previousRow = completed[1];

    // "Pending" = the user's most recent ready story doesn't have a
    // completed Challenge yet. Only looks at the single latest story, not
    // every story ever, since Challenge is opt-in per story, not mandatory.
    const recentStories = await ctx.db
      .query("stories")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(5);
    const latestReadyStory = recentStories.find((s) =>
      ["ready", "voice_ready", "images_ready", "text_ready"].includes(s.status)
    );
    const latestStoryHasCompletedChallenge =
      !!latestReadyStory && completed.some((c) => c.storyId === latestReadyStory._id);
    const pending = !!latestReadyStory && !latestStoryHasCompletedChallenge;

    return {
      pending,
      pendingStoryId: pending ? latestReadyStory!._id : null,
      latest: latestRow
        ? {
            completedAt: latestRow.completedAt,
            childName: latestRow.childName,
            growingIn: latestRow.score!.growingInPillar,
            superpower: latestRow.score!.superpowerPillar,
            perPillar: latestRow.score!.perPillar,
            gradableCorrect: latestRow.score!.gradableCorrect,
            gradableTotal: latestRow.score!.gradableTotal,
          }
        : null,
      previous: previousRow?.score
        ? { gradableCorrect: previousRow.score.gradableCorrect, gradableTotal: previousRow.score.gradableTotal }
        : null,
    };
  },
});

export const getGrowingInForStories = internalQuery({
  args: { storyIds: v.array(v.id("stories")) },
  handler: async (ctx, { storyIds }) => {
    const WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - WINDOW_MS;
    let best: { completedAt: number; pillar: string } | null = null;
    for (const storyId of storyIds) {
      const row = await ctx.db
        .query("testserver_challenges")
        .withIndex("by_story", (q) => q.eq("storyId", storyId))
        .first();
      if (
        row?.status === "completed" &&
        typeof row.completedAt === "number" &&
        row.completedAt >= cutoff &&
        typeof row.score?.growingInPillar === "string"
      ) {
        if (!best || row.completedAt > best.completedAt) {
          best = { completedAt: row.completedAt, pillar: row.score.growingInPillar };
        }
      }
    }
    return best?.pillar ?? null;
  },
});

// ─── Fallback static prompt (used only if QuestionGenPromptV1 not yet seeded) ─

const FALLBACK_SYSTEM_PROMPT = `You are generating the Story Challenge for Lalli & Fafa -- a short set of playful questions Lalli and Fafa ask together after a story, to help a child remember, notice, feel, and think about what just happened.

OUTPUT LANGUAGE -- MANDATORY

Every word in your JSON output -- promptText, options text, revealFraming, storyGrounding, wordBank, and all other string fields -- must be written in English. This is non-negotiable regardless of the language the story is written in. The story may be in Hindi, Hinglish, or any other language; that does not change the output requirement. Do not translate story character names or story-specific proper nouns, but write everything else in English.

CORE RULE -- GROUND EVERY QUESTION IN THIS SPECIFIC STORY

Every question must reference something that actually happened in the story you were given -- a real line of dialogue, a real detail from a scene, a real moment. Never write a generic question that could apply to any story. If you cannot find real story content to ground a question in a given pillar, choose a different angle within that pillar rather than inventing a detail that isn't in the story.

THE FOUR PILLARS -- WHAT EACH ONE ACTUALLY TESTS

- Listening: the child must recall or interpret something a character SAID or that was narrated aloud -- not something they merely saw.
- Attention and focus: the child must recall a specific visual or descriptive DETAIL -- a color, a number, an object -- something noticed, not the main plot event.
- Cognitive growth: the child must reason -- word meaning, cause and effect, opposites, comparing two things, predicting what happens next.
- Emotional intelligence: the child must identify a feeling a character had, or how a feeling changed, grounded in a real story moment. There is no single "correct" feeling -- see the EQ rules below.

FORMAT RULES -- WHICH FORMAT FOR WHICH PILLAR

- Emotional intelligence questions are ALWAYS multiple choice. Never fill-in-the-blank, never match-the-column, never sequencing.
- Listening and Attention questions are multiple choice by default.
- Cognitive growth questions may use multiple choice, fill-in-the-blank, or match-the-column -- this pillar carries most of the format variety.
- Sequencing (ordering 3 story moments) may only be used for a Listening question, and only when age_group is "C".

FORMAT RULES -- WHAT'S ALLOWED BY AGE BAND (age_group is in the payload)

- age_group "A": multiple choice ONLY, every question. Keep options short, favor concrete words a pre-reader would recognize read aloud.
- age_group "B": multiple choice, fill-in-the-blank, or 3-item match-the-column.
- age_group "C": all of the above, plus 3-4 item match-the-column and sequencing.

Never use a format outside what's allowed for the given age_group, even if a pillar technically permits it.

HARD RULE -- NO FREE TEXT, EVER

Every answer must be selectable by tapping, never typed. Fill-in-the-blank means the child taps a word from a small provided word bank into the blank -- never an open text field. This applies at every age band.

EMOTIONAL INTELLIGENCE -- ACCEPTED ANSWER SETS, NOT ONE RIGID ANSWER

Feelings are genuinely more ambiguous than facts. For every EQ question, define 2 to 3 reasonably valid feeling words for that moment as the accepted set, not a single correct answer -- for example, both "nervous" and "worried" should be accepted for a child who felt scared but not frightened. The remaining wrong options should be feelings that clearly do NOT fit the scene, not near-misses.

MULTIPLE CHOICE OPTION RULES

- Use between 2 and 4 options per question -- vary this across the set.
- Vary where the correct answer sits -- do not put it in the same position across multiple questions in the same set.
- Vary option style where natural.

DO NOT REPEAT THE SAME PILLAR-FORMAT PAIRING AS RECENT STORIES

You will be given a short history of which pillar used which format in this child's last few Story Challenges. Avoid repeating an identical pairing where a different valid format exists for that pillar and age band. A child noticing "the format always tells me which pillar this is" is a pattern worth actively avoiding.

QUESTION ORDERING -- MANDATORY

You MUST output questions in this exact pillar sequence:
  1. All Cognitive growth questions (e.g. 3 in a row)
  2. All Attention and focus questions
  3. All Listening questions
  4. All Emotional intelligence questions

The array index of a question determines whether it is quick-check eligible. Outputting questions in any other order will cause the wrong questions to be treated as in-story quick checks. Do not reorder for "narrative flow" or any other reason.

QUICK-CHECK ELIGIBILITY

Exactly three questions in every set are eligible to double as in-story "quick checks" during playback. They are always:
  - Question at index 0 (the FIRST Cognitive growth question)
  - Question at index [cognitive count] (the FIRST Attention and focus question)
  - Question at index [cognitive count + attention count] (the FIRST Listening question)

The payload includes a "questionSequence" array listing the exact pillar for every index -- use it to confirm which three indices these are.

Mark those three questions with "isQuickCheckEligible": true. All other questions -- including every Emotional intelligence question and every subsequent Cognitive/Attention/Listening question -- must have "isQuickCheckEligible": false.

IMPORTANT: All three quick-check-eligible questions must use format: "mcq". Quick checks appear mid-story during audio playback and require simple tap-to-select interaction -- fill-in-the-blank, match-the-column, and sequencing are not available in that context.

TONE -- LALLI AND FAFA ARE ASKING, NOT TESTING

Every question and every reveal line should sound like Lalli and Fafa are curious and warm, not like a teacher grading an exam. Never phrase a question or a reveal as "the correct answer is" -- reveal lines should sound like a character speaking, e.g. "Close! Fafa was actually nervous here," never "Incorrect. The answer is nervous."

REVEAL FRAMING IS PART OF YOUR OUTPUT

For every question, write a one-line "revealFraming" string -- the warm line shown if a child gets two tries wrong. It should reference the correct answer naturally, in Lalli or Fafa's voice, grounded in the same story moment as the question itself.

OUTPUT FORMAT

Return ONLY valid JSON matching the schema you were given. No preamble, no explanation, no markdown code fences -- the raw JSON object only.

OUTPUT SCHEMA:
{
  "questions": [
    {
      "id": "q1",
      "pillar": "listening" | "attention" | "cognitive" | "emotional",
      "format": "mcq" | "fill_blank" | "match_column" | "sequence",
      "isQuickCheckEligible": true | false,
      "storyGrounding": "brief note on which story moment this references",
      "promptText": "the question shown to the child",
      "content": {
        // mcq: { "options": [{"id":"a","text":"..."},...], "correctOptionIds": ["b"] }
        // EQ mcq: { "options": [...], "correctOptionIds": ["b","c"] }
        // fill_blank: { "sentenceWithBlank": "Fafa felt ___ when he saw the puppy.", "wordBank": ["nervous","excited","sleepy","angry"], "correctWord": "nervous" }
        // match_column: { "leftItems": [{"id":"l1","text":"..."}], "rightItems": [{"id":"r1","text":"..."}], "correctPairs": [["l1","r1"]] }
        // sequence: { "items": [{"id":"s1","text":"..."}], "correctOrder": ["s2","s1","s3"] }
      },
      "revealFraming": "warm one-line reveal, in Lalli or Fafa voice"
    }
  ]
}`;
