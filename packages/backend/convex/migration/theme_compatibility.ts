import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

export const list = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db.query("theme_flavor_compatibility").collect();
	},
});

export const getByTheme = query({
	args: { themeId: v.id("themes") },
	handler: async (ctx, { themeId }) => {
		return await ctx.db
			.query("theme_flavor_compatibility")
			.withIndex("by_theme_category", (q) => q.eq("themeId", themeId))
			.collect();
	},
});

export const upsert = mutation({
	args: {
		themeId: v.id("themes"),
		category: v.union(v.literal("OP"), v.literal("MT"), v.literal("OB"), v.literal("PY"), v.literal("EN")),
		allowedCodes: v.array(v.string()),
	},
	handler: async (ctx, { themeId, category, allowedCodes }) => {
		const existing = await ctx.db
			.query("theme_flavor_compatibility")
			.withIndex("by_theme_category", (q) => q.eq("themeId", themeId).eq("category", category))
			.first();

		const now = Date.now();

		if (existing) {
			await ctx.db.patch(existing._id, {
				allowedCodes,
			});
			return existing._id;
		} else {
			return await ctx.db.insert("theme_flavor_compatibility", {
				themeId,
				category,
				allowedCodes,
				createdAt: now,
			});
		}
	},
});

export const updateForTheme = mutation({
	args: {
		themeId: v.id("themes"),
		openings: v.array(v.string()),
		triggers: v.array(v.string()),
		obstacles: v.array(v.string()),
	},
	handler: async (ctx, { themeId, openings, triggers, obstacles }) => {
		const now = Date.now();
		
		// Get all payoffs and endings (they remain the same across themes)
		const allPayoffs = await ctx.db.query("flavor_payoffs").collect();
		const allEndings = await ctx.db.query("flavor_endings").collect();
		const payoffsCodes = allPayoffs.map((p) => p.code);
		const endingsCodes = allEndings.map((e) => e.code);

		const categories = [
			{ category: "OP" as const, codes: openings },
			{ category: "MT" as const, codes: triggers },
			{ category: "OB" as const, codes: obstacles },
			{ category: "PY" as const, codes: payoffsCodes },
			{ category: "EN" as const, codes: endingsCodes },
		];

		const results = [];

		for (const { category, codes } of categories) {
			const existing = await ctx.db
				.query("theme_flavor_compatibility")
				.withIndex("by_theme_category", (q) => q.eq("themeId", themeId).eq("category", category))
				.first();

			if (existing) {
				await ctx.db.patch(existing._id, {
					allowedCodes: codes,
				});
				results.push(existing._id);
			} else {
				const id = await ctx.db.insert("theme_flavor_compatibility", {
					themeId,
					category,
					allowedCodes: codes,
					createdAt: now,
				});
				results.push(id);
			}
		}

		return results;
	},
});

export const seedDefaults = mutation({
	args: {},
	handler: async (ctx) => {
		const now = Date.now();

		// From your example map (Openings/Triggers/Obstacles)
		const OPENINGS = {
			"Ocean Adventure": ["OP_02", "OP_06", "OP_08", "OP_19"],
			"Space Journey": ["OP_05", "OP_14", "OP_18"],
			"Magical Forest": ["OP_01", "OP_03", "OP_04", "OP_13"],
			"Jungle Safari": ["OP_03","OP_04","OP_05","OP_06","OP_09","OP_14"],
			"Mountain Quest": ["OP_01","OP_02","OP_06","OP_07","OP_08","OP_14"],
			"Dinosaurs Park": ["OP_03","OP_09","OP_10","OP_12","OP_15"],
			"Birthday Party": ["OP_06","OP_09","OP_10","OP_12","OP_14"],
			"Circus Fun": ["OP_02","OP_04","OP_07","OP_08","OP_12","OP_14"],
			"Desert Trek": ["OP_01","OP_03","OP_09","OP_10","OP_15"],
			"Treasure Hunt": ["OP_01","OP_03","OP_06","OP_08","OP_13","OP_14"],
		} as const;

		const TRIGGERS = {
			"Ocean Adventure": ["MT_01", "MT_03", "MT_05"],
			"Space Journey": ["MT_03", "MT_08"],
			"Magical Forest": ["MT_01", "MT_04", "MT_08"],
			"Jungle Safari": ["MT_01","MT_03","MT_04","MT_06","MT_08"],
			"Mountain Quest": ["MT_01","MT_03","MT_05","MT_06"],
			"Dinosaurs Park": ["MT_02","MT_05","MT_06","MT_08"],
			"Birthday Party": ["MT_03","MT_05","MT_08","MT_02"],
			"Circus Fun": ["MT_02","MT_04","MT_06","MT_08"],
			"Desert Trek": ["MT_07","MT_05","MT_08"],
			"Treasure Hunt": ["MT_01","MT_03","MT_04"],
		} as const;

		const OBSTACLES = {
			"Ocean Adventure": ["OB_02", "OB_05", "OB_07"],
			"Space Journey": ["OB_04", "OB_06"],
			"Magical Forest": ["OB_01", "OB_04", "OB_05"],
			"Jungle Safari": ["OB_01","OB_02","OB_04","OB_06","OB_07"],
			"Mountain Quest": ["OB_02","OB_03","OB_06","OB_07"],
			"Dinosaurs Park": ["OB_03","OB_04","OB_06","OB_05"],
			"Birthday Party": ["OB_04","OB_06","OB_07"],
			"Circus Fun": ["OB_01","OB_02","OB_03","OB_05","OB_07"],
			"Desert Trek": ["OB_04","OB_06","OB_05","OB_07"],
			"Treasure Hunt": ["OB_01","OB_02","OB_05","OB_07","OB_03"],
		} as const;

		// Include Payoffs and Endings too (defaulting to allowing all known codes)
		const PAYOFFS_ALL = ["PY_01","PY_02","PY_03","PY_04","PY_05","PY_06","PY_07","PY_08"];
		const ENDINGS_ALL = ["EN_01","EN_02","EN_03","EN_04","EN_05","EN_06","EN_07","EN_08","EN_09","EN_10"];

		// const THEMES = ["Ocean Adventure", "Space Journey", "Magical Forest",];
		const THEMES = await ctx.db.query("themes").collect();
		let inserted = 0;

		for (const theme of THEMES) {

			const themeName = theme.name;
			const themeId = theme._id;
			if (!themeId) {
				// Skip if theme doesn't exist yet (e.g., Space Journey not seeded)
				continue;
			}

			const toSeed: Array<{ category: "OP" | "MT" | "OB" | "PY" | "EN"; allowedCodes: string[] }> = [
				{ category: "OP", allowedCodes: [...(OPENINGS[themeName as keyof typeof OPENINGS] ?? [])] },
				{ category: "MT", allowedCodes: [...(TRIGGERS[themeName as keyof typeof TRIGGERS] ?? [])] },
				{ category: "OB", allowedCodes: [...(OBSTACLES[themeName as keyof typeof OBSTACLES] ?? [])] },
				{ category: "PY", allowedCodes: PAYOFFS_ALL },
				{ category: "EN", allowedCodes: ENDINGS_ALL },
			];

			for (const row of toSeed) {
				// Avoid duplicates for a given themeId + category
				const existing = await ctx.db
					.query("theme_flavor_compatibility")
					.withIndex("by_theme_category", (q) => q.eq("themeId", themeId).eq("category", row.category))
					.first();

				if (!existing) {
					await ctx.db.insert("theme_flavor_compatibility", {
						themeId,
						category: row.category,
						allowedCodes: row.allowedCodes,
						createdAt: now,
					});
					inserted++;
				}
			}
		}

		return { inserted };
	},
});
