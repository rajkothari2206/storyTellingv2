import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { authComponent } from "./auth";

// Map story type → structure code
const STORY_TYPE_TO_STRUCTURE: Record<string, string> = {
  adventure: "SQ_01",
  silly: "SQ_02",
  cozy: "SQ_03",
};

// Fallback rotation order if storyType not provided (legacy support)
const STRUCTURE_CODES = ["SQ_01", "SQ_02", "SQ_03"];

export const selectStoryElements = mutation({
  args: {
    themeName: v.string(),
    storyType: v.optional(v.string()), // "adventure" | "silly" | "cozy"
  },
  handler: async (ctx, { themeName, storyType }) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");
    const userId = String(user._id);

    // --- Get or create usage record ---
    let usage = await ctx.db
      .query("user_story_element_usage")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const now = Date.now();
    if (!usage) {
      const usageId = await ctx.db.insert("user_story_element_usage", {
        userId,
        storyCount: 0,
        lastStructureCode: "SQ_03",
        createdAt: now,
        updatedAt: now,
      });
      usage = await ctx.db.get(usageId);
    }

    // --- Determine structure code ---
    let structureCode: string;
    if (storyType && STORY_TYPE_TO_STRUCTURE[storyType]) {
      // New flow: user selected story type → direct mapping
      structureCode = STORY_TYPE_TO_STRUCTURE[storyType];
    } else {
      // Legacy fallback: rotate through structures
      const nextIdx =
        (STRUCTURE_CODES.indexOf(usage?.lastStructureCode ?? "SQ_03") + 1) %
        STRUCTURE_CODES.length;
      structureCode = STRUCTURE_CODES[nextIdx];
    }

    if (!usage) throw new Error("Usage record not found");

    // --- Update usage record ---
    await ctx.db.patch(usage._id, {
      lastStructureCode: structureCode,
      storyCount: (usage.storyCount ?? 0) + 1,
      updatedAt: now,
    });

    return { structureCode, storyType: storyType ?? null };
  },
});
