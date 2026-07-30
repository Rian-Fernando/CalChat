import type { Metadata } from "next";
import { Inter_Tight, JetBrains_Mono } from "next/font/google";
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
      <body className="font-sans">{children}</body>
    </html>
  );
}
