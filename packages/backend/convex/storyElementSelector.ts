import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { authComponent } from "./auth";

const STRUCTURE_CODES = ["SQ_01", "SQ_02", "SQ_03"];

function shuffle<T>(arr: T[]) {
  return [...arr].sort(() => Math.random() - 0.5);
}
function pickRandom<T>(arr: T[], count = 1): T[] {
  return shuffle(arr).slice(0, Math.min(count, arr.length));
}

export const selectStoryElements = mutation({
  args: { themeName: v.string() },
  handler: async (ctx, { themeName }) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");
    const userId = String(user._id);

    // --- 1️⃣ Get or create usage record ---
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
        usedCodes: {
          OP: [],
          MT: [],
          OB: [],
          PY: [],
          EN: [],
          PT: [],
        },
        createdAt: now,
        updatedAt: now,
      });
      usage = await ctx.db.get(usageId);
    }

    // --- 2️⃣ Reset if 10 stories done ---
    if (usage && usage.storyCount >= 10) {
      await ctx.db.patch(usage._id, {
        storyCount: 0,
        usedCodes: {
          OP: [],
          MT: [],
          OB: [],
          PY: [],
          EN: [],
          PT: [],
        },
        lastStructureCode: "SQ_03",
        updatedAt: now,
      });
      usage.storyCount = 0;
    }

    // --- 3️⃣ Rotate structure ---
    const nextIdx =
      (STRUCTURE_CODES.indexOf(usage?.lastStructureCode ?? "SQ_03") + 1) %
      STRUCTURE_CODES.length;
    const structureCode = STRUCTURE_CODES[nextIdx];

    // --- 4️⃣ Get theme compatibility ---
    const theme = await ctx.db
      .query("themes")
      .withIndex("by_name", (q) => q.eq("name", themeName))
      .first();
    if (!theme) throw new Error(`Theme "${themeName}" not found`);

    const compatibility = await ctx.db
      .query("theme_flavor_compatibility")
      .filter((q) => q.eq(q.field("themeId"), theme._id))
      .collect();

    const allowed = Object.fromEntries(
      compatibility.map((c) => [c.category, c.allowedCodes])
    );

    // --- 5️⃣ Helper to get allowed & unused from a table ---
    async function getAvailable(
      table: string,
      allowedCodes: string[],
      usedCodes: string[]
    ) {
      let all = await ctx.db.query(table as any).collect();
      if (allowedCodes?.length) {
        all = all.filter((x: any) => allowedCodes.includes(x.code));
      }
      const available = all.filter((x: any) => !usedCodes.includes(x.code));
      return available.length > 0 ? available : all; // fallback if exhausted
    }

    // --- 6️⃣ Fetch & select ---
    const [openings, triggers, obstacles, payoffs, endings, traits] =
      await Promise.all([
        getAvailable(
          "flavor_openings",
          allowed.OP ?? [],
          usage?.usedCodes.OP ?? []
        ),
        getAvailable(
          "flavor_magical_triggers", // Changed from "flavor_triggers"
          allowed.MT ?? [],
          usage?.usedCodes.MT ?? []
        ),
        getAvailable(
          "flavor_obstacles",
          allowed.OB ?? [],
          usage?.usedCodes.OB ?? []
        ),
        getAvailable(
          "flavor_payoffs",
          allowed.PY ?? [],
          usage?.usedCodes.PY ?? []
        ),
        getAvailable(
          "flavor_endings",
          allowed.EN ?? [],
          usage?.usedCodes.EN ?? []
        ),
        getAvailable(
          "personality_traits",
          [],
          usage?.usedCodes.PT ?? []
        ),
      ]);

    const selected = {
      structureCode,
      openings: pickRandom(openings),
      triggers: pickRandom(triggers),
      obstacles: pickRandom(obstacles),
      payoffs: pickRandom(payoffs),
      endings: pickRandom(endings),
      personalityTraits: pickRandom(traits),
    };
    if (!usage) throw new Error("Usage record not found");

    // --- 7️⃣ Update usage record ---
    await ctx.db.patch(usage?._id, {
      lastStructureCode: structureCode,
      storyCount: usage.storyCount + 1,
      usedCodes: {
        OP: [...(usage.usedCodes.OP ?? []), ...selected.openings.map((o) => o.code)],
        MT: [...(usage.usedCodes.MT ?? []), ...selected.triggers.map((t) => t.code)],
        OB: [...(usage.usedCodes.OB ?? []), ...selected.obstacles.map((o) => o.code)],
        PY: [...(usage.usedCodes.PY ?? []), ...selected.payoffs.map((p) => p.code)],
        EN: [...(usage.usedCodes.EN ?? []), ...selected.endings.map((e) => e.code)],
        PT: [...(usage.usedCodes.PT ?? []), ...selected.personalityTraits.map((p) => p.code)],
      },
      updatedAt: now,
    });

    // --- 8️⃣ Return result ---
    return selected;
  },
});
