import { ImageResponse } from "next/og";

// Edge runtime keeps cold-start cost down. ImageResponse outputs PNG natively
// (Satori under the hood) — social platforms reject SVG previews.
export const runtime = "edge";
export const alt = "CalChat — find a call time across timezones";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Open Graph card for calchat.rianfernando.com.
 *
 * Reproduces the brand mark — two outlined squares with the **intersection
 * filled in brand terracotta (#c4634a)** — alongside the wordmark and tagline,
 * on the brand's warm-dark surface (#15130e). Uses system-ui so we don't pay
 * the cost of loading Inter Tight in the edge runtime; the wordmark renders
 * close enough at this scale that the visual identity carries.
 */
export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#15130e",
          color: "#f4efe6",
          fontFamily:
            'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          display: "flex",
          alignItems: "center",
          padding: "0 96px",
          position: "relative"
        }}
      >
        {/* (Satori's CSS parser doesn't support the radial-gradient `<size> at <position>`
            syntax, so we keep the surface intentionally clean — the mark + wordmark
            carry the composition.) */}

        {/* Logo + wordmark group */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 64,
            position: "relative"
          }}
        >
          {/* Overlap-squares mark. Brand rule: terracotta fills the intersection only. */}
          <div
            style={{
              position: "relative",
              width: 280,
              height: 280,
              flexShrink: 0,
              display: "flex"
            }}
          >
            {/* Terracotta intersection (drawn first so the square outlines pass over it) */}
            <div
              style={{
                position: "absolute",
                left: 100,
                top: 100,
                width: 80,
                height: 80,
                background: "#c4634a",
                display: "flex"
              }}
            />
            {/* Square 1 — outline only */}
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: 180,
                height: 180,
                border: "10px solid #f4efe6",
                boxSizing: "border-box",
                display: "flex"
              }}
            />
            {/* Square 2 — outline only, offset to create the overlap */}
            <div
              style={{
                position: "absolute",
                left: 100,
                top: 100,
                width: 180,
                height: 180,
                border: "10px solid #f4efe6",
                boxSizing: "border-box",
                display: "flex"
              }}
            />
          </div>

          {/* Text column */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: 144,
                fontWeight: 700,
                letterSpacing: "-0.05em",
                color: "#f4efe6",
                lineHeight: 1,
                display: "flex"
              }}
            >
              calchat
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                marginTop: 32,
                fontSize: 42,
                color: "#d8d0bf",
                lineHeight: 1.25
              }}
            >
              <div style={{ display: "flex" }}>Find a call time that works,</div>
              <div style={{ display: "flex", color: "#d9876d" }}>
                across every timezone.
              </div>
            </div>
          </div>
        </div>

        {/* URL pinned bottom-right */}
        <div
          style={{
            position: "absolute",
            right: 96,
            bottom: 56,
            fontSize: 24,
            letterSpacing: "0.04em",
            color: "#8a8273",
            display: "flex"
          }}
        >
          calchat.rianfernando.com
        </div>
      </div>
    ),
    { ...size }
  );
}
