import { httpAction } from "../_generated/server";
import { api } from "../_generated/api";
import dayjs from "dayjs";

const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET!;

// Verify Razorpay webhook signature using Web Crypto API
async function verifyWebhookSignature(
	payload: string,
	signature: string,
	secret: string
): Promise<boolean> {
	// Convert secret to ArrayBuffer
	const encoder = new TextEncoder();
	const secretKey = await crypto.subtle.importKey(
		"raw",
		encoder.encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"]
	);

	// Sign the payload
	const signatureBuffer = await crypto.subtle.sign(
		"HMAC",
		secretKey,
		encoder.encode(payload)
	);

	// Convert signature to hex string
	const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");

	// Compare signatures using constant-time comparison
	if (signature.length !== expectedSignature.length) {
		return false;
	}

	let result = 0;
	for (let i = 0; i < signature.length; i++) {
		result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
	}
	return result === 0;
}

export const razorpayWebhook = httpAction(async (ctx, request) => {
	// Only accept POST requests
	if (request.method !== "POST") {
		return new Response("Method not allowed", { status: 405 });
	}

	try {
		const body = await request.text();
		const signature = request.headers.get("x-razorpay-signature") || "";

		// Verify webhook signature
		if (!(await verifyWebhookSignature(body, signature, RAZORPAY_WEBHOOK_SECRET))) {
			return new Response("Invalid signature", { status: 401 });
		}

		const payload = JSON.parse(body);
		console.log(payload);
		const event = payload.event;
		const subscriptionData = payload.payload?.subscription?.entity;

		if (!subscriptionData) {
			return new Response("Missing subscription data", { status: 400 });
		}

		const subscriptionId = subscriptionData.id;

		// Handle different subscription events
		switch (event) {
			case "subscription.charged":
				// Activate subscription
				await ctx.runMutation(api.subscription.updateSubscriptionStatus, {
					subscriptionId,
					status: "active",
				});
				
				// Add credits to user account
				const userId = subscriptionData.notes?.userId;
				if (userId) {
					const plan = await ctx.runQuery(api.subscription.getPlanBySubscriptionId, {
						subscriptionId,
					});
					
					if (plan) {
						console.log(plan);
						// Add credits based on plan
						// Monthly: 1,000 credits (~12 stories at 80/story)
						// Yearly: 13,200 credits upfront (1,100/mo × 12 — slightly better than monthly)
						const creditsToAdd = plan.interval === "monthly" ? 1000 : 13200;
						await ctx.runMutation(api.credit._addCredits, {
							userId,
							credits: creditsToAdd,
						});
						await ctx.runMutation(api.subscription.createSubscriptionTransactionInternal, {
							userId,
							transaction: {
								subscriptionId,
								planId: plan.planId,
								price: plan.price,
								interval: plan.interval,
								status: "active",
								expiresAt: dayjs((subscriptionData as { current_end?: number | string }).current_end).valueOf(),
							},
						});
					}
				}
				break;

			case "subscription.cancelled":
				// Deactivate subscription
				await ctx.runMutation(api.subscription.updateSubscriptionStatus, {
					subscriptionId,
					status: "inactive",
				});
				break;

			case "subscription.pending":
				// Subscription is pending
				await ctx.runMutation(api.subscription.updateSubscriptionStatus, {
					subscriptionId,
					status: "inactive",
				});
				break;

			default:
				console.log(`Unhandled webhook event: ${event}`);
		}

		return new Response(JSON.stringify({ received: true }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		console.error("Webhook error:", error);
		return new Response(
			JSON.stringify({ error: "Internal server error" }),
			{ status: 500, headers: { "Content-Type": "application/json" } }
		);
	}
});
