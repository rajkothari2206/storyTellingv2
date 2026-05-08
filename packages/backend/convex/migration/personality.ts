import { mutation, query } from "../_generated/server";

export const list = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db.query("personality_traits").collect();
	},
});

export const seedDefaults = mutation({
	args: {},
	handler: async (ctx) => {
		const now = Date.now();
		const defaults = [
			{
				code: "CD_01",
				fafaRole: "Animal noises",
				childRole: "Brave Adventurer",
				lalliRole: "Leader",
			},
			{
				code: "CD_02",
				fafaRole: "Silly dances",
				childRole: "Clever Helper",
				lalliRole: "Explorer",
			},
			{
				code: "CD_03",
				fafaRole: "Sound effects",
				childRole: "Kind Heart",
				lalliRole: "Emotional Anchor",
			},
			{
				code: "CD_04",
				fafaRole: "Rhythmic copying",
				childRole: "Dreamer",
				lalliRole: "Pretender",
			},
			{
				code: "CD_05",
				fafaRole: "Pretend-play",
				childRole: "Clever Helper",
				lalliRole: "Problem Solver",
			},
			{
				code: "CD_06",
				fafaRole: "\"Oopsie!\" moments",
				childRole: "Kind Heart",
				lalliRole: "Emotional Anchor",
			},
			{
				code: "CD_07",
				fafaRole: "Funny voices",
				childRole: "Curious Questioner",
				lalliRole: "Teacher",
			},
			{
				code: "CD_08",
				fafaRole: "Bouncing/jumping",
				childRole: "Energy Leader",
				lalliRole: "Safety Guide",
			},
		];

		let inserted = 0;
		for (const trait of defaults) {
			const existing = await ctx.db
				.query("personality_traits")
				.withIndex("by_code", (q) => q.eq("code", trait.code))
				.first();

			if (!existing) {
				await ctx.db.insert("personality_traits", {
					...trait,
					createdAt: now,
					updatedAt: now,
				});
				inserted++;
			}
		}
		return { inserted };
	},
});


