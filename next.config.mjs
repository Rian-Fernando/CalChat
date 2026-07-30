/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["three"],

  async headers() {
    return [
      {
        /* Duplicate-index guard.
         *
         * Vercel keeps every project reachable at its *.vercel.app alias, which is
         * a byte-identical copy of calchat.rianfernando.com and can end up indexed
         * alongside it. The canonical tag already points at the subdomain (see
         * `metadataBase` in app/layout.tsx); this adds a hard X-Robots-Tag on top
         * so the alias stays out of the index even for a crawler that doesn't
         * parse <head>.
         *
         * Deliberately a header rather than a redirect: a permanent redirect off
         * *.vercel.app would also break preview deployments, which are the only
         * way to check a branch before it ships. */
        source: "/:path*",
        has: [{ type: "host", value: "(?<vercelAlias>.*\\.vercel\\.app)" }],
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }]
      }
    ];
  }
};

export default nextConfig;
