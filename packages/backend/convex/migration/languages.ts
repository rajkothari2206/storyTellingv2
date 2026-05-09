import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

const LANGUAGES = [
  {
    code: "en",
    name: "English",
    nativeName: "English",
    flag: "🇬🇧",
    voiceGroup: "english",
    sortOrder: 1,
  },
  {
    code: "hi",
    name: "Hindi",
    nativeName: "हिंदी",
    flag: "🇮🇳",
    voiceGroup: "hindi",
    sortOrder: 2,
  },
  {
    code: "bn",
    name: "Bengali",
    nativeName: "বাংলা",
    flag: "🇧🇩",
    voiceGroup: "hindi",
    sortOrder: 3,
  },
  {
    code: "gu",
    name: "Gujarati",
    nativeName: "ગુજરાતી",
    flag: "🇮🇳",
    voiceGroup: "hindi",
    sortOrder: 4,
  },
  {
    code: "ta",
    name: "Tamil",
    nativeName: "தமிழ்",
    flag: "🇮🇳",
    voiceGroup: "hindi",
    sortOrder: 5,
  },
  {
    code: "mr",
    name: "Marathi",
    nativeName: "मराठी",
    flag: "🇮🇳",
    voiceGroup: "hindi",
    sortOrder: 6,
  },
  {
    code: "te",
    name: "Telugu",
    nativeName: "తెలుగు",
    flag: "🇮🇳",
    voiceGroup: "hindi",
    sortOrder: 7,
  },
];

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    let seeded = 0;
    for (const lang of LANGUAGES) {
      const existing = await ctx.db
        .query("languages")
        .withIndex("by_code", (q) => q.eq("code", lang.code))
        .first();
      if (!existing) {
        await ctx.db.insert("languages", { ...lang, isActive: true, createdAt: now, updatedAt: now });
        seeded++;
      }
    }
    return { seeded };
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("languages").collect();
    return all.filter((l) => l.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("languages").collect();
    return all.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

export const update = mutation({
  args: {
    id: v.id("languages"),
    name: v.optional(v.string()),
    nativeName: v.optional(v.string()),
    flag: v.optional(v.string()),
    voiceGroup: v.optional(v.string()),
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
