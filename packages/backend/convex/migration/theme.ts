import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

export const list = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db.query("themes").collect();
	},
});

export const create = mutation({
	args: { name: v.string() },
	handler: async (ctx, { name }) => {
		const existing = await ctx.db
			.query("themes")
			.withIndex("by_name", (q) => q.eq("name", name))
			.first();
		
		if (existing) {
			throw new Error("Theme with this name already exists");
		}

		const now = Date.now();
		return await ctx.db.insert("themes", {
			name,
			createdAt: now,
		});
	},
});

export const update = mutation({
	args: { id: v.id("themes"), name: v.string() },
	handler: async (ctx, { id, name }) => {
		const existing = await ctx.db
			.query("themes")
			.withIndex("by_name", (q) => q.eq("name", name))
			.first();
		
		if (existing && existing._id !== id) {
			throw new Error("Theme with this name already exists");
		}

		// Get the current theme to check if name changed
		const currentTheme = await ctx.db.get(id);
		if (!currentTheme) {
			throw new Error("Theme not found");
		}

		await ctx.db.patch(id, { name });

		// Note: Compatibility records are linked by themeId, not name
		// So we don't need to update them when name changes
		// The compatibility is managed separately via theme_compatibility mutations

		return id;
	},
});

export const remove = mutation({
	args: { id: v.id("themes") },
	handler: async (ctx, { id }) => {
		// Delete all compatibility records for this theme
		// Query all compatibility records and filter by themeId
		const allCompatibility = await ctx.db.query("theme_flavor_compatibility").collect();
		const compatibilityRecords = allCompatibility.filter((record) => record.themeId === id);
		
		for (const record of compatibilityRecords) {
			await ctx.db.delete(record._id);
		}

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
				name: "Magical Forest",
			},
			{
				name: "Ocean Adventure",
			},
			{
				name: "Space Journey",
			},
			{
				name: "Jungle Safari",
			},
			{
				name: "Mountain Quest",
			},
			{
				name: "Dinosaurs Park",
			},
			{
				name: "Birthday Party",
			},
			{
				name: "Circus Fun",
			},
			{
				name: "Desert Trek",
			},
			{
				name: "Treasure Hunt",
			},
		];

		let inserted = 0;
		for (const s of defaults) {
			const existing = await ctx.db
				.query("themes")
				.withIndex("by_name", (q) => q.eq("name", s.name))
				.first();

			if (!existing) {
				await ctx.db.insert("themes", {
					...s,
					createdAt: now,
				});
				inserted++;
			}
		}
		return { inserted };
	},
});
