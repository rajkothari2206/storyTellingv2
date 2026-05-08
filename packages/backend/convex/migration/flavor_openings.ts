import { mutation, query } from "../_generated/server";

export const list = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db.query("flavor_openings").collect();
	},
});

export const seedDefaults = mutation({
	args: {},
	handler: async (ctx) => {
		const now = Date.now();
		const defaults = [
			{ code: "OP_01", description: "Sunny morning" },
			{ code: "OP_02", description: "Breezy afternoon" },
			{ code: "OP_03", description: "Cozy rainy day" },
			{ code: "OP_04", description: "Twilight fireflies" },
			{ code: "OP_05", description: "Starry night" },
			{ code: "OP_06", description: "Misty morning" },
			{ code: "OP_07", description: "Windy kite day" },
			{ code: "OP_08", description: "Golden sunset" },
			{ code: "OP_09", description: "Indoors blanket fort" },
			{ code: "OP_10", description: "Library/book corner" },
			{ code: "OP_11", description: "Snowy playtime" },
			{ code: "OP_12", description: "After-school playground" },
			{ code: "OP_13", description: "Garden buzzing with bees" },
			{ code: "OP_14", description: "Dreamy cloud-watching" },
			{ code: "OP_15", description: "Sleepover giggles" },
		];

		let inserted = 0;
		for (const item of defaults) {
			const existing = await ctx.db
				.query("flavor_openings")
				.withIndex("by_code", (q) => q.eq("code", item.code))
				.first();

			if (!existing) {
				await ctx.db.insert("flavor_openings", {
					...item,
					createdAt: now,
				});
				inserted++;
			}
		}
		return { inserted };
	},
});
