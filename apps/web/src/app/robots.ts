import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/generate", "/library", "/admin", "/api/", "/onboarding", "/profile", "/story/"],
      },
    ],
    sitemap: "https://www.lallifafa.com/sitemap.xml",
  };
}
