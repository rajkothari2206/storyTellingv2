import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

export const list = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db.query("voice_models").collect();
	},
});

export const getByName = query({
	args: { name: v.string() },
	handler: async (ctx, { name }) => {
		return await ctx.db
			.query("voice_models")
			.withIndex("by_name", (q) => q.eq("name", name))
			.first();
	},
});

export const update = mutation({
	args: { 
		id: v.id("voice_models"), 
		name: v.optional(v.string()),
		voiceId: v.optional(v.string()),
	},
	handler: async (ctx, { id, name, voiceId }) => {
		const current = await ctx.db.get(id);
		if (!current) {
			throw new Error("Voice model not found");
		}

		// Check if name is being changed and if it conflicts with existing
		if (name && name !== current.name) {
			const existing = await ctx.db
				.query("voice_models")
				.withIndex("by_name", (q) => q.eq("name", name))
				.first();
			
			if (existing) {
				throw new Error("Voice model with this name already exists");
			}
		}

		const updates: { name?: string; voiceId?: string; updatedAt: number } = {
			updatedAt: Date.now(),
		};

		if (name !== undefined) {
			updates.name = name;
		}
		if (voiceId !== undefined) {
			updates.voiceId = voiceId;
		}

		await ctx.db.patch(id, updates);
		return id;
	},
});

export const resetToDefaults = mutation({
	args: {},
	handler: async (ctx) => {
		const now = Date.now();
		const defaults = [
			{ name: "Narrator",       voiceId: "iWNf11sz1GrUE4ppxTOL" },
			{ name: "Lalli",          voiceId: "S2uC1CO2xXot4UtzYX68" },
			{ name: "Fafa",           voiceId: "d7G4zsIoYxHBAwkKbqs5" },
			{ name: "GirlChild",      voiceId: "A2VREc2wjqtSZloENLHe" },
			{ name: "BoyChild",       voiceId: "S7IsvAvEoDfui6GSZK3A" },
			{ name: "HindiNarrator",  voiceId: "KSsyodh37PbfWy29kPtx" },
			{ name: "HindiLalli",     voiceId: "S2uC1CO2xXot4UtzYX68" },
			{ name: "HindiFafa",      voiceId: "d7G4zsIoYxHBAwkKbqs5" },
			{ name: "HindiGirlChild", voiceId: "P5wAx6EHfP4HolovAVoY" },
			{ name: "HindiBoyChild",  voiceId: "uvq2obtsgd81iEJ31urT" },
		];

		let updated = 0;
		let inserted = 0;
		for (const voice of defaults) {
			const existing = await ctx.db
				.query("voice_models")
				.withIndex("by_name", (q) => q.eq("name", voice.name))
				.first();

			if (existing) {
				await ctx.db.patch(existing._id, { voiceId: voice.voiceId, updatedAt: now });
				updated++;
			} else {
				await ctx.db.insert("voice_models", { ...voice, createdAt: now, updatedAt: now });
				inserted++;
			}
		}
		return { updated, inserted };
	},
});

export const seedDefaults = mutation({
	args: {},
	handler: async (ctx) => {
		const now = Date.now();
		const defaults = [
			{
				name: "Narrator",
				voiceId: "iWNf11sz1GrUE4ppxTOL",
			},
			{
				name: "Lalli",
				voiceId: "S2uC1CO2xXot4UtzYX68",
			},
			{
				name: "Fafa",
				voiceId: "d7G4zsIoYxHBAwkKbqs5",
			},
			{
				name: "GirlChild",
				voiceId: "A2VREc2wjqtSZloENLHe",
			},
			{
				name: "BoyChild",
				voiceId: "S7IsvAvEoDfui6GSZK3A",
			},
			{
				name: "HindiNarrator",
				voiceId: "KSsyodh37PbfWy29kPtx",
			},
			{
				name: "HindiLalli",
				voiceId: "S2uC1CO2xXot4UtzYX68",
			},
			{
				name: "HindiFafa",
				voiceId: "d7G4zsIoYxHBAwkKbqs5",
			},
			{
				name: "HindiGirlChild",
				voiceId: "P5wAx6EHfP4HolovAVoY",
			},
			{
				name: "HindiBoyChild",
				voiceId: "uvq2obtsgd81iEJ31urT",
			},
		];

		let inserted = 0;
		for (const voice of defaults) {
			const existing = await ctx.db
				.query("voice_models")
				.withIndex("by_name", (q) => q.eq("name", voice.name))
				.first();

			if (!existing) {
				await ctx.db.insert("voice_models", {
					...voice,
					createdAt: now,
					updatedAt: now,
				});
				inserted++;
			}
		}
		return { inserted };
	},
});

