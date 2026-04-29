import type { NextConfig } from "next";

const convexSiteUrl = process.env.NEXT_PUBLIC_CONVEX_SITE_URL!;

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        // Proxy all Better Auth requests through Next.js to avoid CORS.
        // The browser hits /api/auth/* on the same Vercel domain; Next.js
        // forwards server-side to the Convex HTTP endpoint.
        source: "/api/auth/:path*",
        destination: `${convexSiteUrl}/api/auth/:path*`,
      },
    ];
  },
};

export default nextConfig;
