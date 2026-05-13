import type { MetadataRoute } from "next";
import { BLOG_POSTS } from "@/lib/blog-data";

const BASE = "https://www.lallifafa.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    // Core public pages — high-value for SEO
    { url: BASE,                     lastModified: now, changeFrequency: "weekly",  priority: 1   },
    { url: `${BASE}/stories`,        lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/pricing`,        lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/blog`,           lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${BASE}/learn`,          lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    // Legal — kept for completeness, low priority
    { url: `${BASE}/legal/terms`,    lastModified: now, changeFrequency: "yearly",  priority: 0.2 },
    { url: `${BASE}/legal/privacy`,  lastModified: now, changeFrequency: "yearly",  priority: 0.2 },
    // Removed: /shop (page doesn't exist — caused "duplicate canonical" error in GSC)
    // Removed: /sign-in, /sign-up (auth pages have no SEO value and waste crawl budget)
  ];

  const blogRoutes: MetadataRoute.Sitemap = BLOG_POSTS.map((post) => ({
    url: `${BASE}/blog/${post.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...blogRoutes];
}
