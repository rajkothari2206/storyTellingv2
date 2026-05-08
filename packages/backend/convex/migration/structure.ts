import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

export const list = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db.query("structures").collect();
	},
});

export const getByCode = query({
	args: { code: v.string() },
	handler: async (ctx, { code }) => {
		return await ctx.db
			.query("structures")
			.filter((q) => q.eq(q.field("code"), code))
			.first();
	},
});

export const seedDefaults = mutation({
	args: {},
	handler: async (ctx) => {
		const now = Date.now();
		const defaults = [
			{
				code: "SQ_01",
				name: "Adventure Quest",
				pattern: ["Problem", "Journey", "Challenges", "Resolution"],
				useFor: "Action stories",
			},
			{
				code: "SQ_02",
				name: "Rule of Three",
				pattern: ["Try #1 (fail)", "Try #2 (fail)", "Try #3 (success!)"],
				useFor: "Funny stories",
			},
			{
				code: "SQ_03",
				name: "Everyday Wonder",
				pattern: ["Familiar place", "Gentle discovery", "Cozy close"],
				useFor: "Bedtime stories",
			},
		];

		let inserted = 0;
		for (const s of defaults) {
			const existing = await ctx.db
				.query("structures")
				.withIndex("by_name", (q) => q.eq("name", s.name))
				.first();

			if (!existing) {
				await ctx.db.insert("structures", {
					...s,
					createdAt: now,
					updatedAt: now,
				});
				inserted++;
			}
		}
		return { inserted };
	},
});
