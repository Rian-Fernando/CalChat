import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CalChat — find a call time across timezones",
  description:
    "Share a link, pick your timezone, drag the hours you're free. We'll show you what overlaps."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
