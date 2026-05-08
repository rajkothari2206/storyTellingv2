import { httpRouter } from "convex/server";
import { authComponent, createAuth } from "./auth";
import { razorpayWebhook } from "./razorpay/webhook";

const http = httpRouter();

authComponent.registerRoutes(http, createAuth, { cors: {
    allowedOrigins: [
      process.env.SITE_URL!,
      "http://localhost:5173",
      "https://story-tellingv2-web.vercel.app",
    ],
  }, });

// Razorpay webhook endpoint
http.route({
  path: "/razorpay-webhook",
  method: "POST",
  handler: razorpayWebhook,
});

export default http;
