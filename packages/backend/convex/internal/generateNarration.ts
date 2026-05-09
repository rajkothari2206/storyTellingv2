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
    }),
  },

  handler: async (ctx, { storyId, child }) => {
    const story = await ctx.runQuery(api.stories.getContentOnly, { storyId });
    if (!story?.content) throw new Error("Story content missing");

    const childName = child.name || "Child";
    const childGender = child.gender;

    await generateMergedNarration(ctx, {
      storyId,
      title: story.title || "",   // was missing — caused runtime crash on first line
      content: story.content,
      childName,
      childGender,
      language: story.params?.language || "english",
    });

    await ctx.runMutation(api.stories._markStatus, {
      storyId,
      status: "voice_ready",
    });

    return { ok: true };
  },
});
