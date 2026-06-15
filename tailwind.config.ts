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
          500: "#5a5446",
          400: "#7a7363",
          300: "#a39a86",
          200: "#d8d0bf",
          100: "#f4efe6"
        },
        /* Terracotta — the brand's overlap accent. Reserved for "the moment of agreement". */
        accent: {
          DEFAULT: "#d9876d",   // dark-theme terracotta, used for buttons/highlights
          strong: "#c4634a",    // primary terracotta (full saturation)
          soft: "#e3a995"       // soft tint for hover states / availability washes
        }
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
