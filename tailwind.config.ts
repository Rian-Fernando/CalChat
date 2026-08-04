import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter-tight)", "ui-sans-serif", "system-ui"],
        display: ["var(--font-inter-tight)", "ui-sans-serif", "system-ui"],
        mono: ["var(--font-jetbrains-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"]
      },
      colors: {
        /* Warm-tinted dark surfaces, derived from the brand's dark-mode tokens.
           "ink" is the surface family; lower numbers = darker. */
        ink: {
          950: "#0d0b08",
          900: "#15130e",
          800: "#1f1c15",
          700: "#2e2a22",
          600: "#3b362d",
          /* 500/400/300 are the muted *text* tiers — never used as fills, only
             as type and hover borders. They're measured against both surfaces
             they actually appear on, ink-900 and the lighter ink-800 (the date
             picker puts ink-500 day numbers on an ink-800 hover):

               500  4.9:1 on ink-900,  4.5:1 on ink-800   (was 2.5 / 2.3)
               400  5.6:1 on ink-900,  5.1:1 on ink-800   (was 3.9 / 3.6)
               300  6.7:1 on ink-900,  6.1:1 on ink-800

             so all three now clear WCAG AA for body text, which matters because
             these tiers carry the small labels, timestamps and hints. The ramp
             is tighter than it was — on a surface this dark there isn't much
             room between "muted" and "legible" — but the hue is unchanged and
             the tiers stay ordered. */
          500: "#8a8371",
          400: "#948c7a",
          300: "#a39a86",
          200: "#d8d0bf",
          100: "#f4efe6"
        },
        /* Boundary color for interactive controls — the inputs, selects, and
           buttons whose edge is what identifies them as a control at all.
           3.6:1 on ink-900 and 3.3:1 on ink-800, so it clears the 3:1 WCAG
           1.4.11 asks for on both surfaces these sit on; the ink-600/700 they
           replaced were 1.6:1 and 1.3:1.

           Decorative rules, card outlines, dividers and empty-state dashes stay
           on the ink scale — the requirement is about identifying controls, not
           about drawing every box on the page. */
        control: "#736c5d",
        /* Terracotta — the brand's overlap accent. Reserved for "the moment of agreement". */
        accent: {
          DEFAULT: "#d9876d",   // dark-theme terracotta, used for buttons/highlights
          strong: "#c4634a",    // primary terracotta (full saturation)
          soft: "#e3a995"       // soft tint for hover states / availability washes
        }
      },
      zIndex: {
        /* One above the Feedex widget's .fx-root (2147483000). The widget mounts
           in a shadow root, so its stacking can't be reached from here — the only
           lever is to out-rank it. Reserved for UI that must never be sat on: the
           phone save bar shares the bottom-right corner with the widget launcher,
           and a floating Feedback button covering Save is not a trade worth
           making. */
        "above-widget": "2147483001"
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out both",
        "pulse-soft": "pulse-soft 2.4s ease-in-out infinite"
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" }
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" }
        }
      }
    }
  },
  plugins: []
};

export default config;
