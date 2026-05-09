import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

const STORY_TYPES = [
  {
    code: "adventure",
    name: "Big Adventure",
    emoji: "🗺️",
    description: "A quest full of discovery, teamwork, and a twist that changes everything.",
    promptHint: "Quest structure: problem → journey → unexpected twist → resolution. Sense of movement and discovery. Lalli leads, Fafa's wild idea helps, child's observation unlocks the final answer.",
    sortOrder: 1,
  },
  {
    code: "silly",
    name: "Silly & Funny",
    emoji: "🌀",
    description: "Chaotic fun where Fafa's impossible ideas somehow save the day.",
    promptHint: "Twist structure: comic misunderstanding escalates → Fafa's absurd solution is attempted → it goes hilariously wrong → accidentally fixes everything. Physical comedy, gentle absurdity, Lalli's deadpan reactions.",
    sortOrder: 2,
  },
  {
    code: "cozy",
    name: "Cozy Bedtime",
    emoji: "🌙",
    description: "A gentle, slow story full of warmth — perfect for winding down.",
    promptHint: "Cozy structure: quiet beginning → soft exploration → gentle resolution. Slower pacing, rich sensory detail (soft light, warm textures, quiet sounds). No dramatic tension. Story slows like a yawn at the end.",
    sortOrder: 3,
  },
];

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    let seeded = 0;
    for (const st of STORY_TYPES) {
      const existing = await ctx.db
        .query("story_types")
        .withIndex("by_code", (q) => q.eq("code", st.code))
        .first();
      if (!existing) {
        await ctx.db.insert("story_types", { ...st, isActive: true, createdAt: now, updatedAt: now });
        seeded++;
      }
    }
    return { seeded };
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("story_types").collect();
    return all.filter((st) => st.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("story_types").collect();
    return all.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

export const update = mutation({
  args: {
    id: v.id("story_types"),
    name: v.optional(v.string()),
    emoji: v.optional(v.string()),
    description: v.optional(v.string()),
    promptHint: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, { id, ...fields }) => {
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    for (const [k, v] of Object.entries(fields)) {
      if (v !== undefined) patch[k] = v;
    }
    await ctx.db.patch(id, patch as any);
    return { ok: true };
  },
});

export const getByCode = query({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    return ctx.db
      .query("story_types")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();
  },
});
