import type { Metadata } from "next";
import { Inter_Tight, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const interTight = Inter_Tight({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter-tight",
  display: "swap"
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
  display: "swap"
});

/* Feedex feedback widget (feedex.rianfernando.com).
 *
 * The key is publishable — it only lets the holder file feedback against this
 * one project — so it's a NEXT_PUBLIC_ var inlined into the client bundle by
 * design. It's read into a constant rather than referenced inline so the widget
 * can be skipped entirely when it's unset: a local clone or a fork has no key,
 * and loading widget.js with an empty data-feedex-key would just 401 on every
 * page view. */
const FEEDEX_KEY = process.env.NEXT_PUBLIC_FEEDEX_KEY;

const SITE_URL = "https://calchat.rianfernando.com";
const SITE_TITLE = "CalChat — find a call time across timezones";
const SITE_DESCRIPTION =
  "Share a link, pick your timezone, drag the hours you're free. We'll show you what overlaps.";

export const metadata: Metadata = {
  /* metadataBase makes every relative URL (canonical, og:image, twitter:image, etc.)
     resolve to the production domain instead of a *.vercel.app preview host —
     keeps Google from indexing duplicate URLs. */
  metadataBase: new URL(SITE_URL),
  /* `template` gives every nested route a unique, self-describing <title>
     without each one having to repeat the brand. */
  title: {
    default: SITE_TITLE,
    template: "%s — CalChat"
  },
  description: SITE_DESCRIPTION,
  applicationName: "CalChat",
  authors: [{ name: "Rian Fernando", url: "https://rianfernando.com" }],
  creator: "Rian Fernando",
  publisher: "Rian Fernando",
  alternates: {
    canonical: "/"
  },
  /* Icons come from the file conventions — app/icon.svg and app/apple-icon.tsx.
     Declaring `icons` here as well would shadow them, and the apple icon in
     particular has to be the generated PNG: iOS Safari can't decode an SVG
     apple-touch-icon and silently falls back to a screenshot of the page. */
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "CalChat",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL
    /* images is auto-populated from app/opengraph-image.tsx */
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION
    /* images falls back to og:image by convention; the file-based generator
       at app/opengraph-image.tsx serves both. */
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large"
    }
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${interTight.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans">
        {children}

        {/* Feedex widget, mounted site-wide so a report can be filed from the
            planner itself — where a timezone bug would actually be noticed —
            and not just from the landing page.

            theme is pinned to dark rather than left on "auto": CalChat only
            ships the dark palette, so an auto widget would render light for
            anyone whose OS is set that way and sit on the page as a white box.
            accent is the brand terracotta, replacing the default purple.

            lazyOnload keeps it off the critical path — it loads after the page
            is interactive, so it doesn't spend the LCP/CLS headroom the rest of
            the page was tuned for. */}
        {FEEDEX_KEY && (
          <Script
            src="https://feedex.rianfernando.com/widget.js"
            strategy="lazyOnload"
            data-feedex-key={FEEDEX_KEY}
            data-feedex-theme="dark"
            data-feedex-accent="#d9876d"
            data-feedex-title="Send feedback"
            data-feedex-description="Found a bug, a timezone that didn't line up, or an idea? Tell us — no account needed."
          />
        )}
      </body>
    </html>
  );
}
