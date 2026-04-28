import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export — lets Vercel serve the site without needing the Next.js
  // runtime (Vercel project is currently configured with framework: vite).
  // When the Vercel project is updated to framework: nextjs this can be
  // removed to re-enable SSR and API routes.
  output: "export",
  images: {
    // next/image optimisation requires a server; disable for static export.
    unoptimized: true,
  },
};

export default nextConfig;
