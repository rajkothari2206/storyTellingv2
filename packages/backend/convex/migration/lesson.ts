import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

export const list = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db.query("lessons").collect();
	},
});

export const create = mutation({
	args: { name: v.string() },
	handler: async (ctx, { name }) => {
		const existing = await ctx.db
			.query("lessons")
			.withIndex("by_name", (q) => q.eq("name", name))
			.first();
		
		if (existing) {
			throw new Error("Lesson with this name already exists");
		}

		const now = Date.now();
		return await ctx.db.insert("lessons", {
			name,
			createdAt: now,
		});
	},
});

export const update = mutation({
	args: { id: v.id("lessons"), name: v.string() },
	handler: async (ctx, { id, name }) => {
		const existing = await ctx.db
			.query("lessons")
			.withIndex("by_name", (q) => q.eq("name", name))
			.first();
		
		if (existing && existing._id !== id) {
			throw new Error("Lesson with this name already exists");
		}

		await ctx.db.patch(id, { name });
		return id;
	},
});

export const remove = mutation({
	args: { id: v.id("lessons") },
	handler: async (ctx, { id }) => {
		await ctx.db.delete(id);
		return id;
	},
});

export const seedDefaults = mutation({
	args: {},
	handler: async (ctx) => {
		const now = Date.now();
		const defaults = [
			{
				name: "Kindness",
			},
			{
				name: "Sharing",
			},
			{
				name: "Honesty",
			},
            {
                name: "Courage",
            },
            {
                name: "Teamwork",
            },
            {
                name: "Caring for Animals",
            },
            {
                name: "Respect",
            },
            {
                name: "Gratitude",
            },
            {
                name: "Friendship",
            },
            {
                name: "Helping others ",
            },
		];

		let inserted = 0;
		for (const s of defaults) {
			const existing = await ctx.db
				.query("lessons")
				.withIndex("by_name", (q) => q.eq("name", s.name))
				.first();

			if (!existing) {
				await ctx.db.insert("lessons", {
					...s,
					createdAt: now,
				});
				inserted++;
			}
		}
		return { inserted };
	},
});
