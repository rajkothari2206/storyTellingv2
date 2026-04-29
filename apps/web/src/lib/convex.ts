import { ConvexReactClient } from "convex/react";

// Module-level singleton — NEXT_PUBLIC_ vars are baked in at build time
// so this is safe as long as the env var is set before the build runs.
export const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL ?? ""
);
