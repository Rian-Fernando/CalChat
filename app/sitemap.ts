import type { MetadataRoute } from "next";

/**
 * Sitemap for calchat.rianfernando.com.
 *
 * Only the public marketing surface (the landing page) is listed. Event pages
 * live at /event/[id] and are private to the friend-group that shares the
 * link — they shouldn't be crawled or indexed (also blocked in robots.ts).
 */
const SITE = "https://calchat.rianfernando.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE}/`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1
    }
  ];
}
