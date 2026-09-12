import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import { generateMergedNarration } from "../narrationGenerator";

export const generateNarration = internalAction({
  args: {
    storyId: v.id("stories"),
    child: v.object({
      name: v.string(),
      gender: v.union(v.literal("male"), v.literal("female"), v.literal("other")),
      phoneticName: v.optional(v.string()),
    }),
  },

  handler: async (ctx, { storyId, child }) => {
    const story = await ctx.runQuery(api.stories.getContentOnly, { storyId });
    if (!story?.content) throw new Error("Story content missing");

    const childName = child.name || "Child";
    const childGender = child.gender;

    try {
      await generateMergedNarration(ctx, {
        storyId,
        title: story.title || "",
        content: story.content,
        childName,
        childGender,
        language: story.params?.language || "english",
        childPhoneticName: child.phoneticName,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[generateNarration] failed:", message);
      await ctx.runMutation(api.stories._markStatus, {
        storyId,
        status: "error",
        error: `Narration failed: ${message}`,
      });
      throw err;
    }

    await ctx.runMutation(api.stories._markStatus, {
      storyId,
      status: "voice_ready",
    });

    // ── Phase 6: real scene start seconds ────────────────────────────────────
    // Uses the real audio duration (already stored by generateMergedNarration)
    // and the scene count from sceneMetadata to produce equal-distribution
    // timestamps. Equal distribution is a heuristic, but anchored to real total
    // duration — far more accurate than the 100 wpm fallback used at generation
    // time. The frontend uses these values to trigger stings at the right moment.
    const freshStory = await ctx.runQuery(api.stories.get, { storyId });
    const sceneCount = freshStory?.sceneMetadata?.length ?? 0;
    const totalDuration = freshStory?.audioDurationSeconds ?? 0;
    if (sceneCount > 0 && totalDuration > 0) {
      const sceneStartSeconds: Record<string, number> = {};
      for (let i = 0; i < sceneCount; i++) {
        sceneStartSeconds[String(i + 1)] = Math.round((i / sceneCount) * totalDuration);
      }
      await ctx.runMutation((api as any).stories._setSceneStartSeconds, {
        storyId,
        sceneStartSeconds,
      });
      console.log(
        `[v2] Scene start seconds stored: ${sceneCount} scenes over ${totalDuration}s.`
      );
    }

    // If images are already done, both pipelines are complete → mark ready.
    // (If images finish after us, generateSceneImage will check narrationFilePath and mark ready.)
    if (freshStory?.status === "images_ready") {
      await ctx.runMutation(api.stories._markStatus, { storyId, status: "ready" });
    }

    return { ok: true };
  },
});
