"use node";
import { action } from "../_generated/server";
import { getRazorpay } from "./initiate_razorpay";
import { ConvexError } from "convex/values";
import { v } from "convex/values";
import { api } from "../_generated/api";

type Plan = {
  _id: string;
  _creationTime: number;
  createdAt: number;
  name: string;
  price: number;
  interval: "monthly" | "yearly";
  planId: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RazorpaySubscription = any;

type SubscriptionResult = {
  subscriptionId: string;
  checkoutUrl: string | null;
};

export const createRazorpaySubscription = action({
  args: {
    planId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, { planId, userId }): Promise<SubscriptionResult> => {
    // Validate environment variables are configured
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new ConvexError(
        "Razorpay is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your Convex environment variables."
      );
    }

    // Get plan details to determine interval
    const plans: Plan[] = await ctx.runQuery(api.subscription.getPlans, {});
    const selectedPlan: Plan | undefined = plans.find((p) => p.planId === planId);

    if (!selectedPlan) {
      throw new ConvexError("Plan not found. Please go back to the pricing page and try again.");
    }

    // Get site URL for default success redirect
    const siteUrl = process.env.SITE_URL || "https://www.lallifafa.com";
    console.log("Creating Razorpay subscription for plan:", planId, "user:", userId);

    try {
      // Create subscription with Razorpay
      const razorpay = getRazorpay();
      const subscription = await razorpay.subscriptions.create({
        plan_id: planId,
        customer_notify: 1,
        quantity: 1,
        total_count: selectedPlan.interval === "monthly" ? 12 : 1,
        callback_url: `${siteUrl}/dashboard`,
        callback_method: "get",
        notes: {
          userId: userId,
        },
      }) as RazorpaySubscription;

      console.log("Razorpay subscription created:", subscription.id);

      return {
        subscriptionId: subscription.id,
        checkoutUrl: subscription.short_url || null,
      };
    } catch (err: unknown) {
      // Surface the actual Razorpay error to help with debugging
      const message = err instanceof Error ? err.message : String(err);
      console.error("Razorpay subscription creation failed:", message);
      throw new ConvexError(`Payment setup failed: ${message}`);
    }
  },
});
