import type { MetadataRoute } from "next";

const SITE = "https://calchat.rianfernando.com";

/**
 * /robots.txt
 *
 * Allow all crawlers on the public marketing surface; explicitly disallow the
 * API routes and the /event/[id] surface (those are private friend-group links
 * and shouldn't show up in search results even if a URL leaks).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/event/"]
      }
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE
  };
}
