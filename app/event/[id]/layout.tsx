import type { Metadata } from "next";

/**
 * Metadata for a shared event link.
 *
 * The page itself is a client component, so its <title> and description have to
 * be declared from a server layout. These links are unlisted and private to the
 * group they were sent to, so they're marked noindex/nofollow here as well as
 * being disallowed in robots.ts — belt and braces, since a robots.txt Disallow
 * only stops the crawl, not the indexing of a URL someone else links to.
 *
 * `canonical: null` suppresses the root layout's canonical, which would
 * otherwise point every event page at the landing page.
 */
export const metadata: Metadata = {
  title: "Shared availability",
  description:
    "A private CalChat link. Pick your timezone, drag the hours you're free, and see when the whole group overlaps.",
  alternates: { canonical: null },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false }
  }
};

export default function EventLayout({ children }: { children: React.ReactNode }) {
  return children;
}
