import { ImageResponse } from "next/og";

/**
 * apple-touch-icon, generated as a real PNG.
 *
 * iOS Safari does not accept an SVG apple-touch-icon — when it can't decode one
 * it silently falls back to a screenshot of the page, which is why this is
 * rendered through next/og instead of pointing at public/brand/apple-touch-icon.svg.
 * The artwork is the same brand mark: two outlined squares with the intersection
 * filled terracotta, on the light paper surface.
 */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#f4efe6",
          display: "flex",
          position: "relative"
        }}
      >
        {/* Terracotta intersection — drawn first so the outlines pass over it */}
        <div
          style={{
            position: "absolute",
            left: 80,
            top: 80,
            width: 20,
            height: 20,
            background: "#c4634a",
            display: "flex"
          }}
        />
        {/* Square 1 */}
        <div
          style={{
            position: "absolute",
            left: 58,
            top: 58,
            width: 42,
            height: 42,
            border: "4px solid #16140f",
            boxSizing: "border-box",
            display: "flex"
          }}
        />
        {/* Square 2 — offset to create the overlap */}
        <div
          style={{
            position: "absolute",
            left: 80,
            top: 80,
            width: 42,
            height: 42,
            border: "4px solid #16140f",
            boxSizing: "border-box",
            display: "flex"
          }}
        />
      </div>
    ),
    { ...size }
  );
}
