import type { NextConfig } from "next";

// Auth requests are proxied through src/app/api/auth/[...path]/route.ts
// so Better Auth's trustedOrigins check receives a known-good Origin header.
const nextConfig: NextConfig = {};

export default nextConfig;
