import type { MetadataRoute } from "next";
import { BLOG_POSTS } from "@/lib/blog-data";

const BASE = "https://www.lallifafa.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE,                     lastModified: now, changeFrequency: "weekly",  priority: 1   },
    { url: `${BASE}/stories`,        lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/pricing`,        lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/blog`,           lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${BASE}/shop`,           lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/learn`,          lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/sign-up`,        lastModified: now, changeFrequency: "yearly",  priority: 0.8 },
    { url: `${BASE}/sign-in`,        lastModified: now, changeFrequency: "yearly",  priority: 0.5 },
    { url: `${BASE}/legal/terms`,    lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${BASE}/legal/privacy`,  lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
  ];

  const blogRoutes: MetadataRoute.Sitemap = BLOG_POSTS.map((post) => ({
    url: `${BASE}/blog/${post.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...blogRoutes];
}
