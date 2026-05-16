import { mutation } from "../_generated/server";

// One-time migration: update themes and lessons to the curated set of 12 each
export const run = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // ── THEMES ────────────────────────────────────────────────────────────
    const themeRenames: Record<string, string> = {
      "Dinosaurs Park": "Dinosaur Park",
      "Birthday Party": "Ancient Kingdom",
      "Circus Fun": "Festival Night",
      "Mountain Quest": "Enchanted Garden",
      "Desert Trek": "Cloud Kingdom",
    };

    const themeAdds = ["Underwater City", "Village Fair"];

    // Rename existing themes
    for (const [oldName, newName] of Object.entries(themeRenames)) {
      const existing = await ctx.db
        .query("themes")
        .withIndex("by_name", (q) => q.eq("name", oldName))
        .first();
      if (existing) {
        await ctx.db.patch(existing._id, { name: newName });
        console.log(`Theme renamed: "${oldName}" → "${newName}"`);
      } else {
        console.log(`Theme not found (skipped): "${oldName}"`);
      }
    }

    // Add new themes (skip if already exists)
    for (const name of themeAdds) {
      const existing = await ctx.db
        .query("themes")
        .withIndex("by_name", (q) => q.eq("name", name))
        .first();
      if (!existing) {
        await ctx.db.insert("themes", { name, createdAt: now });
        console.log(`Theme added: "${name}"`);
      } else {
        console.log(`Theme already exists (skipped): "${name}"`);
      }
    }

    // ── LESSONS ───────────────────────────────────────────────────────────
    const lessonRenames: Record<string, string> = {
      "Caring for Animals": "Caring for Nature",
      // "Helping Others " has trailing space — match both variants
      "Helping Others ": "Perseverance",
      "Helping others ": "Perseverance",
      "Helping Others": "Perseverance",
    };

    const lessonAdds = ["Creativity", "Responsibility"];

    // Rename/replace existing lessons
    const renamedTo = new Set<string>();
    for (const [oldName, newName] of Object.entries(lessonRenames)) {
      if (renamedTo.has(newName)) continue; // already done this rename
      const existing = await ctx.db
        .query("lessons")
        .withIndex("by_name", (q) => q.eq("name", oldName))
        .first();
      if (existing) {
        await ctx.db.patch(existing._id, { name: newName });
        renamedTo.add(newName);
        console.log(`Lesson renamed: "${oldName}" → "${newName}"`);
      } else {
        console.log(`Lesson not found (skipped): "${oldName}"`);
      }
    }

    // Add new lessons
    for (const name of lessonAdds) {
      const existing = await ctx.db
        .query("lessons")
        .withIndex("by_name", (q) => q.eq("name", name))
        .first();
      if (!existing) {
        await ctx.db.insert("lessons", { name, createdAt: now });
        console.log(`Lesson added: "${name}"`);
      } else {
        console.log(`Lesson already exists (skipped): "${name}"`);
      }
    }

    return { done: true };
  },
});
