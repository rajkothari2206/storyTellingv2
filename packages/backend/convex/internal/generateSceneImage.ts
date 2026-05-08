import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import { generateAllSceneImages } from "../sceneImageGenerator/index";

export const generateImages = internalAction({
  args: {
    storyId: v.id("stories"),
    child: v.object({
      id: v.union(v.literal("1"), v.literal("2")),
      name: v.string(),
      gender: v.union(v.literal("male"), v.literal("female"), v.literal("other")),
      age: v.number(),
      avatarStorageId: v.optional(v.string()),
    }),
  },

  handler: async (ctx, { storyId, child }) => {
    const story = await ctx.runQuery(api.stories.getLightMetadata, { storyId });
    if (!story || !story.sceneMetadata) throw new Error("Scene metadata missing");

    const childInfo = {
      name: child.name,
      gender: child.gender,
      age: child.age,
    };

    await generateAllSceneImages(
      ctx,
      story.sceneMetadata,
      childInfo,
      storyId,
      child.avatarStorageId
    );

    await ctx.runMutation(api.stories._markStatus, {
      storyId,
      status: "images_ready",
    });

    return { ok: true };
  },
});
