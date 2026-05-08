import { mutation, query } from "../_generated/server";

export const list = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db.query("flavor_magical_triggers").collect();
	},
});

export const seedDefaults = mutation({
	args: {},
	handler: async (ctx) => {
		const now = Date.now();
		const defaults = [
			// Nature
            { code: "MT_01", description: "Nature", keywords: ["feather", "pebble", "leaf", "flower", "shell", "seed"] },
            { code: "MT_02", description: "Play Objects", keywords: ["toy", "ball", "bracelet", "kite", "crayon", "block"] },
            { code: "MT_03", description: "Weather & Light", keywords: ["rainbow bubble", "sunbeam", "star drop", "glowing snowflake", "breeze", "mist"] },
            { code: "MT_04", description: "Animal Helpers", keywords: ["paw print", "firefly", "bird feather", "squirrel trail", "butterfly wing", "ant parade"] },
            { code: "MT_05", description: "Everyday Surprises", keywords: ["button", "key", "whistle", "map", "hat", "ribbon"] },
            { code: "MT_06", description: "Musical Echoes", keywords: ["drumbeat pebble", "humming shell", "flute twig", "jingling bell", "tapping stick", "echo stone"] },
            { code: "MT_07", description: "Food & Treat Magic", keywords: ["cookie crumb", "glowing fruit slice", "bouncing jelly", "cinnamon swirl", "sugar-dust trail", "humming teacup"] },
            { code: "MT_08", description: "Dream & Imagination", keywords: ["glowing doodle", "floating cloud", "whispering book page", "giggling shadow", "bouncing pillow", "dancing sticker"] },		
		];

		let inserted = 0;
		for (const item of defaults) {
			const existing = await ctx.db
				.query("flavor_magical_triggers")
				.withIndex("by_code", (q) => q.eq("code", item.code))
				.first();

			if (!existing) {
				await ctx.db.insert("flavor_magical_triggers", {
					...item,
					createdAt: now,
				});
				inserted++;
			}
		}
		return { inserted };
	},
});


