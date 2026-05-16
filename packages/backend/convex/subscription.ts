import { mutation, query, action, internalMutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { authComponent } from "./auth";
import { api } from "./_generated/api";

export const getPlans = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db.query("razorpay_plans").collect();
	},
});

type Plan = {
	_id: string;
	_creationTime: number;
	createdAt: number;
	name: string;
	price: number;
	interval: "monthly" | "yearly";
	planId: string;
};

type User = {
	_id: string;
	[key: string]: unknown;
};

type SubscriptionActionResult = {
	subscriptionId: string;
	checkoutUrl: string | null;
};

type InitiateSubscriptionResult = {
	subscriptionId: string;
	checkoutUrl: string;
};

export const initiateSubscription = action({
	args: {
		planId: v.string(),
	},
	handler: async (ctx, { planId }): Promise<InitiateSubscriptionResult> => {
		// Get authenticated user
		const user: User | null = await ctx.runQuery(api.auth.getCurrentUser, {});
		if (!user) throw new ConvexError("Not authenticated. Please sign in and try again.");

		// Get plan details
		const plans: Plan[] = await ctx.runQuery(api.subscription.getPlans, {});
		const selectedPlan: Plan | undefined = plans.find((p) => p.planId === planId);

		if (!selectedPlan) {
			throw new ConvexError("Plan not found. Please go back to the pricing page and try again.");
		}

		// Call the Node.js action that handles Razorpay
		// ConvexErrors thrown inside will propagate up automatically
		const result: SubscriptionActionResult = await ctx.runAction(
			api.razorpay.create_subscription.createRazorpaySubscription,
			{
				planId,
				userId: String(user._id),
			}
		);

		if (!result.checkoutUrl) {
			throw new ConvexError("Failed to generate a checkout link. Please try again or contact support.");
		}

		// Store pending subscription (will be activated via webhook)
		await ctx.runMutation(api.subscription.createSubscription, {
			subscription: {
				subscriptionId: result.subscriptionId,
				planId: selectedPlan.planId,
				price: selectedPlan.price,
				interval: selectedPlan.interval,
				status: "inactive", // Will be activated via webhook
			},
		});

		return {
			subscriptionId: result.subscriptionId,
			checkoutUrl: result.checkoutUrl,
		};
	},
});

export const createSubscription = mutation({
	args: {
		subscription: v.object({
            subscriptionId: v.string(),
			planId: v.string(),
			price: v.number(),
			interval: v.union(v.literal("monthly"), v.literal("yearly")),
			status: v.union(v.literal("active"), v.literal("inactive")),
		}),
	},
	handler: async (ctx, { subscription }) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user) throw new Error("Not authenticated");
		const userId = String(user._id);
		const now = Date.now();
		return await ctx.db.insert("user_subscriptions", {
			userId,
			...subscription,
			createdAt: now,
		});
	},
});

export const getSubscription = query({
    args:{},
    handler: async (ctx) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user) return null;
		const userId = String(user._id);
		// Get the most recent active subscription
		const subscriptions = await ctx.db
			.query("user_subscriptions")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.order("desc")
			.collect();
		
		// Return active subscription or most recent one
		return subscriptions.find(s => s.status === "active") || subscriptions[0] || null;
	},
});

export const updateSubscriptionStatus = mutation({
	args: {
		subscriptionId: v.string(),
		status: v.union(v.literal("active"), v.literal("inactive")),
	},
	handler: async (ctx, { subscriptionId, status }) => {
		const subscription = await ctx.db
			.query("user_subscriptions")
			.filter((q) => q.eq(q.field("subscriptionId"), subscriptionId))
			.first();

		if (!subscription) {
			throw new Error("Subscription not found");
		}

		await ctx.db.patch(subscription._id, { status });
		return { success: true };
	},
});

export const getPlanBySubscriptionId = query({
	args: {
		subscriptionId: v.string(),
	},
	handler: async (ctx, { subscriptionId }) => {
		const subscription = await ctx.db
			.query("user_subscriptions")
			.filter((q) => q.eq(q.field("subscriptionId"), subscriptionId))
			.first();

		if (!subscription) {
			return null;
		}

		const plan = await ctx.db
			.query("razorpay_plans")
			.filter((q) => q.eq(q.field("planId"), subscription.planId))
			.first();

		return plan;
	},
});


// Mutation for webhook use (called from httpAction, no auth required)
export const createSubscriptionTransactionInternal = mutation({
	args: {
		userId: v.string(),
		transaction: v.object({
			subscriptionId: v.string(),
			planId: v.string(),
			price: v.number(),
			interval: v.union(v.literal("monthly"), v.literal("yearly")),
			status: v.union(v.literal("active"), v.literal("inactive")),
            expiresAt: v.number(),
            renewedAt: v.optional(v.number()),
		}),
	},
    handler: async (ctx, { userId, transaction }) => {
		// No auth check - this is called from webhook httpAction
		const now = Date.now();
		return await ctx.db.insert("subscription_transactions", {
			userId,
			...transaction,
			createdAt: now,
		});
	},
});
