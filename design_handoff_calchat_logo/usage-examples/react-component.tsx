/**
 * CalChat <Logo /> — drop-in React component for the brand lockup.
 *
 * This is a REFERENCE implementation. Adapt it to your component library
 * (whether you're on Next.js + Tailwind, Remix + vanilla-extract, Astro, etc.).
 * It assumes the SVGs from /assets are served at /brand/<filename>.svg —
 * change the `base` constant or accept it as a prop.
 *
 * If you'd rather inline the SVGs (no network fetch for the logo), open the
 * SVG files in /assets and paste their inner contents in place of <img>.
 */

import * as React from "react";

type Variant =
  | "lockup-horizontal"
  | "lockup-stacked"
  | "mark"
  | "wordmark"
  | "favicon";

type Tone = "default" | "mono" | "light" | "light-mono";

interface LogoProps {
  variant?: Variant;
  tone?: Tone;
  /** Rendered height in px. Width auto-scales via SVG viewBox. */
  height?: number;
  /** Accessible label. Defaults to "CalChat" — set to "" for purely decorative use (will set aria-hidden). */
  label?: string;
  className?: string;
  /** Optional href — when set, wraps the logo in an <a> with proper aria-label. */
  href?: string;
}

const base = "/brand"; // change to wherever you host the SVGs

function fileFor(variant: Variant, tone: Tone): string {
  if (variant === "favicon") return `${base}/favicon.svg`;

  // Compose the filename: <variant>-<tone>.svg, with "default" tone omitted.
  const toneSuffix = tone === "default" ? "" : `-${tone}`;
  return `${base}/logo-${variant}${toneSuffix}.svg`;
}

export function Logo({
  variant = "lockup-horizontal",
  tone = "default",
  height = 32,
  label = "CalChat",
  className,
  href,
}: LogoProps) {
  const src = fileFor(variant, tone);
  const decorative = label === "";

  const img = (
    <img
      src={src}
      alt={decorative ? "" : label}
      aria-hidden={decorative || undefined}
      style={{ height, width: "auto", display: "block" }}
      className={className}
      draggable={false}
    />
  );

  if (href) {
    return (
      <a href={href} aria-label={decorative ? "CalChat home" : `${label} home`}>
        {img}
      </a>
    );
  }
  return img;
}

/* ---------------------------------------------------------------- *
 * Site header example
 * ---------------------------------------------------------------- */

export function SiteHeader() {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "20px 32px",
        background: "var(--cc-paper)",
        borderBottom: "1px solid var(--cc-rule)",
      }}
    >
      <Logo variant="lockup-horizontal" height={28} href="/" />
      <nav style={{ display: "flex", gap: 28, fontFamily: "var(--cc-font-display)", fontSize: 15 }}>
        <a href="/groups">Groups</a>
        <a href="/timezones">Time zones</a>
        <a href="/settings">Settings</a>
      </nav>
    </header>
  );
}

/* ---------------------------------------------------------------- *
 * Loading splash example — mark only, single ink
 * ---------------------------------------------------------------- */

export function LoadingSplash() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "grid",
        placeItems: "center",
        background: "var(--cc-paper)",
      }}
    >
      <Logo variant="mark" height={48} label="" />
    </div>
  );
}

/* ---------------------------------------------------------------- *
 * Dark-surface example
 * ---------------------------------------------------------------- */

export function DarkFooter() {
  return (
    <footer
      data-theme="dark"
      style={{
        padding: 40,
        background: "var(--cc-paper)" /* dark when [data-theme=dark] */,
        color: "var(--cc-ink)",
      }}
    >
      <Logo variant="lockup-horizontal" tone="light" height={24} />
    </footer>
  );
}
