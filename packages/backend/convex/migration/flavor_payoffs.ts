import { mutation, query } from "../_generated/server";

export const list = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db.query("flavor_payoffs").collect();
	},
});

export const seedDefaults = mutation({
	args: {},
	handler: async (ctx) => {
		const now = Date.now();
		const defaults = [
			{ code: "PY_01", description: "glow brighter" },
			{ code: "PY_02", description: "bounce" },
			{ code: "PY_03", description: "sparkle trails" },
			{ code: "PY_04", description: "reveal hidden paths" },
			{ code: "PY_05", description: "transform briefly, project shapes in air" },
			{ code: "PY_06", description: "multiply into tiny glowing dots" },
			{ code: "PY_07", description: "echo silly sounds" },
		];

		let inserted = 0;
		for (const item of defaults) {
			const existing = await ctx.db
				.query("flavor_payoffs")
				.withIndex("by_code", (q) => q.eq("code", item.code))
				.first();

			if (!existing) {
				await ctx.db.insert("flavor_payoffs", {
					...item,
					createdAt: now,
				});
				inserted++;
			}
		}
		return { inserted };
	},
});


