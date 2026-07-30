import type { MetadataRoute } from "next";

const SITE = "https://calchat.rianfernando.com";

/**
 * Crawlers we explicitly welcome so CalChat can be read and cited by AI answer
 * engines. These are listed by name rather than relying on the `*` group because
 * robots.txt matching is "most specific group wins, and a bot obeys only that
 * group" — an agent that finds its own name never reads the wildcard rules, so
 * silence here would leave their behaviour up to each vendor's default.
 *
 * Google-Extended and Applebot-Extended are not crawlers; they're the opt-in/out
 * tokens Google and Apple use to decide whether already-crawled pages may feed
 * their generative products. Naming them with Allow is the opt-in.
 */
const AI_AGENTS = [
  "GPTBot",          // OpenAI — training + retrieval crawler
  "OAI-SearchBot",   // OpenAI — ChatGPT Search index
  "ChatGPT-User",    // OpenAI — live fetch when a user asks about a URL
  "ClaudeBot",       // Anthropic — crawler
  "Claude-Web",      // Anthropic — legacy user-triggered fetch
  "anthropic-ai",    // Anthropic — legacy token
  "PerplexityBot",   // Perplexity — index crawler
  "Perplexity-User", // Perplexity — live fetch on a user's behalf
  "Google-Extended", // Google — Gemini / AI Overviews grounding token
  "Applebot-Extended", // Apple — Apple Intelligence grounding token
  "CCBot",           // Common Crawl — feeds many open datasets
  "Amazonbot",       // Amazon — Alexa / Rufus
  "Bytespider",      // ByteDance
  "cohere-ai"        // Cohere
];

/**
 * /robots.txt
 *
 * Everything on the public marketing surface is open. The only closed paths are
 * the JSON API and /event/[id] — those URLs are private, unlisted links shared
 * inside a friend group, so they shouldn't be indexed or ingested even if one
 * leaks into a crawlable page.
 */
const DISALLOW = ["/api/", "/event/"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: DISALLOW
      },
      ...AI_AGENTS.map(userAgent => ({
        userAgent,
        allow: "/",
        disallow: DISALLOW
      }))
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE
  };
}
