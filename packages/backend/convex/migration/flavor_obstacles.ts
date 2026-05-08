import { mutation, query } from "../_generated/server";

export const list = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db.query("flavor_obstacles").collect();
	},
});

export const seedDefaults = mutation({
	args: {},
	handler: async (ctx) => {
		const now = Date.now();
		const defaults = [
			{ code: "OB_01", description: "Height", exampleContext: ["branches", "swings", "shelves"], solutions: ["ladders", "vines", "teamwork lifts"] },
			{ code: "OB_02", description: "Maze/Blocked Path", exampleContext: ["hedges", "tunnels", "wobbly bridges"], solutions: ["silly wiggles", "sound echoes", "chanting together"] },
			{ code: "OB_03", description: "Balance", exampleContext: ["log", "stepping stones"], solutions: ["tiptoe tiger walk", "holding hands"] },
			{ code: "OB_04", description: "Puzzle", exampleContext: ["colors", "shapes", "rhymes"], solutions: ["child’s favorite object helps solve it"] },
			{ code: "OB_05", description: "Scared Creature", exampleContext: ["lost toy", "animal"], solutions: ["kind words", "gentle sounds", "silly gag to cheer"] },
			{ code: "OB_06", description: "Hidden/Hard-to-Reach Object", exampleContext: ["buried", "stuck", "dark"], solutions: ["blowing", "giggling", "light", "whispering"] },
			{ code: "OB_07", description: "Environmental", exampleContext: ["wind", "dark", "water", "wobble"], solutions: ["scarves", "echo whistle", "teamwork tricks"] },
		];

		let inserted = 0;
		for (const item of defaults) {
			const existing = await ctx.db
				.query("flavor_obstacles")
				.withIndex("by_code", (q) => q.eq("code", item.code))
				.first();

			if (!existing) {
				await ctx.db.insert("flavor_obstacles", {
					...item,
					createdAt: now,
				});
				inserted++;
			}
		}
		return { inserted };
	},
});
