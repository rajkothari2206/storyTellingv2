"use node";
import { action } from "../_generated/server";
import { razorpay } from "./initiate_razorpay";
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
    // Get plan details to determine interval
    const plans: Plan[] = await ctx.runQuery(api.subscription.getPlans, {});
    const selectedPlan: Plan | undefined = plans.find((p) => p.planId === planId);
    
    if (!selectedPlan) {
      throw new Error("Plan not found");
    }

    // Get site URL for default success redirect
    const siteUrl = process.env.SITE_URL || "http://localhost:3000";
    const redirectUrl = siteUrl;
    console.log(redirectUrl);
    // Create subscription with Razorpay
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

    // The subscription object includes short_url for checkout
    // Note: Razorpay will redirect to the success URL after payment
    // You may need to configure this in Razorpay dashboard settings as well
    return {
      subscriptionId: subscription.id,
      checkoutUrl: subscription.short_url || null,
    };
  },
});
