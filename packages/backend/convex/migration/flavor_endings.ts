import { mutation, query } from "../_generated/server";

export const list = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db.query("flavor_endings").collect();
	},
});

export const seedDefaults = mutation({
	args: {},
	handler: async (ctx) => {
		const now = Date.now();
		const defaults = [
			{ code: "EN_01", description: "Cozy reflective closure" },
			{ code: "EN_02", description: "Cliffhanger hint" },
			{ code: "EN_03", description: "Bedtime quiet tone" },
			{ code: "EN_04", description: "Celebratory giggles or snack" },
			{ code: "EN_05", description: "Token keepsake they hold onto" },
			{ code: "EN_06", description: "Shared snack ritual turned magical" },
			{ code: "EN_07", description: "Celebration dance/song" },
			{ code: "EN_08", description: "Magic flows into nature (stars, clouds, night sky)" },
			{ code: "EN_09", description: "Friendship ritual (hug, high-five, chant)" },
			{ code: "EN_10", description: "Promise of another cozy playƟme tomorrow" },
		];

		let inserted = 0;
		for (const item of defaults) {
			const existing = await ctx.db
				.query("flavor_endings")
				.withIndex("by_code", (q) => q.eq("code", item.code))
				.first();

			if (!existing) {
				await ctx.db.insert("flavor_endings", {
					...item,
					createdAt: now,
				});
				inserted++;
			}
		}
		return { inserted };
	},
});
