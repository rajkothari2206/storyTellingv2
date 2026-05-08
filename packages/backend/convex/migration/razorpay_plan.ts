import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

export const list = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db.query("razorpay_plans").collect();
	},
});


export const seedDefaults = mutation({
	args: {},
	handler: async (ctx) => {
		const now = Date.now();
		const defaults = [
			{
                name: "Magic Pass - Monthly",
                price: 199,
                interval: "monthly" as const,
                planId: "plan_RpZZiFsx7YI1rA",
            },
            {
                name: "Magic Pass - Yearly",
                price: 1999,
                interval: "yearly" as const,
                planId: "plan_RpZabHcv8xiaoZ",
            }

		];

		let inserted = 0;
		for (const s of defaults) {
			const existing = await ctx.db
				.query("razorpay_plans")
				.withIndex("by_name", (q) => q.eq("name", s.name))
				.first();

			if (!existing) {
				await ctx.db.insert("razorpay_plans", {
					...s,
					createdAt: now,
				});
				inserted++;
			}
		}
		return { inserted };
	},
});
