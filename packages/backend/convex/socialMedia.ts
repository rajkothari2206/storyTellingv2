import { action, query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { GoogleGenAI } from "@google/genai";
import { authComponent } from "./auth";

// ─── Storage upload URL ───────────────────────────────────────────────────────

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");
    return await ctx.storage.generateUploadUrl();
  },
});

// ─── End card storage ─────────────────────────────────────────────────────────

export const getEndCard = query({
  args: {},
  handler: async (ctx) => {
    const config = await ctx.db
      .query("system_config")
      .withIndex("by_key", (q) => q.eq("key", "end_card_storage_id"))
      .first();
    return config?.value ?? null;
  },
});

/** Returns the resolved public URL for the end card image (stored at upload time in setEndCard). */
export const getEndCardUrl = query({
  args: {},
  handler: async (ctx) => {
    const config = await ctx.db
      .query("system_config")
      .withIndex("by_key", (q) => q.eq("key", "end_card_url"))
      .first();
    return config?.value ?? null;
  },
});

export const setEndCard = mutation({
  args: { storageId: v.string() },
  handler: async (ctx, { storageId }) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");

    // Resolve the public URL now, while we're in a mutation (works reliably)
    const resolvedUrl = await ctx.storage.getUrl(storageId as any);

    const now = Date.now();

    // Persist storage ID (for "uploaded" badge check)
    const existingId = await ctx.db
      .query("system_config")
      .withIndex("by_key", (q) => q.eq("key", "end_card_storage_id"))
      .first();
    if (existingId) {
      await ctx.db.patch(existingId._id, { value: storageId, updatedAt: now });
    } else {
      await ctx.db.insert("system_config", { key: "end_card_storage_id", value: storageId, updatedAt: now });
    }

    // Persist resolved URL (queries read this — avoids ctx.storage.getUrl in query context)
    if (resolvedUrl) {
      const existingUrl = await ctx.db
        .query("system_config")
        .withIndex("by_key", (q) => q.eq("key", "end_card_url"))
        .first();
      if (existingUrl) {
        await ctx.db.patch(existingUrl._id, { value: resolvedUrl, updatedAt: now });
      } else {
        await ctx.db.insert("system_config", { key: "end_card_url", value: resolvedUrl, updatedAt: now });
      }
    }

    return { ok: true };
  },
});

// ─── Background music storage ─────────────────────────────────────────────────

/** Returns the resolved public URL for the background music (stored at upload time). */
export const getBgMusicUrl = query({
  args: {},
  handler: async (ctx) => {
    const config = await ctx.db
      .query("system_config")
      .withIndex("by_key", (q) => q.eq("key", "bg_music_url"))
      .first();
    return config?.value ?? null;
  },
});

export const setBgMusic = mutation({
  args: { storageId: v.string() },
  handler: async (ctx, { storageId }) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const resolvedUrl = await ctx.storage.getUrl(storageId as any);

    const now = Date.now();

    const existingId = await ctx.db
      .query("system_config")
      .withIndex("by_key", (q) => q.eq("key", "bg_music_storage_id"))
      .first();
    if (existingId) {
      await ctx.db.patch(existingId._id, { value: storageId, updatedAt: now });
    } else {
      await ctx.db.insert("system_config", { key: "bg_music_storage_id", value: storageId, updatedAt: now });
    }

    if (resolvedUrl) {
      const existingUrl = await ctx.db
        .query("system_config")
        .withIndex("by_key", (q) => q.eq("key", "bg_music_url"))
        .first();
      if (existingUrl) {
        await ctx.db.patch(existingUrl._id, { value: resolvedUrl, updatedAt: now });
      } else {
        await ctx.db.insert("system_config", { key: "bg_music_url", value: resolvedUrl, updatedAt: now });
      }
    }

    return { ok: true };
  },
});

// ─── YouTube metadata generation ──────────────────────────────────────────────

export const generateYouTubeContent = action({
  args: {
    title: v.string(),
    content: v.string(),
    theme: v.string(),
    childName: v.optional(v.string()),
    language: v.optional(v.string()),
  },
  handler: async (ctx, { title, content, theme, childName, language }) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

    const storyExcerpt = content.split(/^SCENE METADATA/m)[0].slice(0, 400).trim();

    const prompt = `You are a YouTube growth expert for "Lalli Fafa" — an Indian children's AI storytelling platform where every story stars the child by name.

Story Title: ${title}
Theme: ${theme}
Child Name: ${childName || "a child"}
Language: ${language || "English"}
Story excerpt: ${storyExcerpt}

Return ONLY valid JSON (no markdown code fences, no extra text):
{
  "title": "Engaging YouTube title under 70 chars. Hook + emotion + 1-2 emojis. E.g. '🦁 Arjun and the Lost Treasure! (He Was SO Brave!) ✨'",
  "description": "Multi-paragraph YouTube description. Include:\\n\\n(1) 2-3 sentence exciting story hook/teaser (no spoilers).\\n\\n(2) 'ABOUT THIS STORY:\\n' — 2-3 lines describing the adventure and its lesson.\\n\\n(3) '✨ ABOUT LALLI FAFA:\\nLalli and Fafa are two magical friends who create personalized bedtime stories for children across India. Every story is crafted for YOUR child — with their name, age, and dreams woven into the adventure. Give your child the gift of being the hero! 👉 Create your child\\'s story at www.lallifafa.com'\\n\\n(4) '🎯 Perfect for: Ages 2–8 · Bedtime routines · Screen-free storytelling · Indian families'\\n\\n(5) 25+ relevant hashtags on separate lines.",
  "tags": "Comma-separated tags totalling under 500 characters. Mix broad (children story, bedtime story, kids story, story time) and specific (Lalli Fafa, personalized story for kids, ${theme} story, Indian children story, Hindi story for kids, animated story) tags.",
  "categoryId": "27",
  "categoryName": "Education",
  "thumbnailHook": "Short punchy text for video thumbnail overlay (max 8 words, all caps, exciting). E.g. 'HE FOUND THE MAGIC DOOR! 🚪'"
}`;

    const resp = await gemini.models.generateContent({
      model: "gemini-2.5-flash",
      config: { temperature: 0.8 },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const text = resp.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in Gemini response");

    let metadata: Record<string, string>;
    try {
      metadata = JSON.parse(jsonMatch[0]);
    } catch {
      throw new Error("Failed to parse metadata JSON");
    }

    return metadata;
  },
});
