# CalChat — Brand asset handoff

This bundle contains the **CalChat logo system** ready to drop into a website (or any product surface). It's the design chosen from the exploration in `CalChat Logos.html` — direction **12 · Mark + Wordmark Lockup**, built around the **Overlap Squares** mark.

> **About these files**
> The `assets/` SVGs are production-ready — use them directly. The `brand-guide.html` and `usage-examples/` files are references showing how each asset should be applied, **not** code to ship verbatim. Recreate the visuals using your codebase's framework, component library, and styling conventions.

---

## The system, in one paragraph

CalChat is about **two people's schedules meeting**. The mark is two outlined squares that overlap, and the **terracotta accent fills the intersection** — the moment of overlap is the brand. The wordmark is a tight lowercase grotesque (`calchat`) in Inter Tight 700. Everything else — typography, color, spacing — supports that single idea.

---

## Files

```
design_handoff_calchat_logo/
├── README.md                  ← you are here
├── brand-guide.html           ← visual reference: every variant, clearspace, do/don't
├── tokens.css                 ← :root CSS variables (drop into globals)
├── tokens.json                ← machine-readable tokens
├── assets/
│   ├── logo-mark.svg              · primary mark (ink + terracotta)
│   ├── logo-mark-mono.svg         · mark, single ink (no accent)
│   ├── logo-mark-light.svg        · mark for dark backgrounds (paper + terracotta)
│   ├── logo-mark-light-mono.svg   · mark for dark backgrounds, single paper
│   ├── logo-wordmark.svg          · wordmark only, ink
│   ├── logo-wordmark-light.svg    · wordmark only, paper (for dark BGs)
│   ├── logo-lockup-horizontal.svg          · ★ primary — use this by default
│   ├── logo-lockup-horizontal-mono.svg     · single-ink lockup
│   ├── logo-lockup-horizontal-light.svg    · lockup for dark backgrounds
│   ├── logo-lockup-horizontal-light-mono.svg
│   ├── logo-lockup-stacked.svg             · vertical lockup for narrow spaces
│   ├── logo-lockup-stacked-mono.svg
│   ├── logo-lockup-stacked-light.svg
│   ├── favicon.svg                · 32×32 squared mark on paper, thick strokes
│   └── apple-touch-icon.svg       · 180×180 squared mark on paper
└── usage-examples/
    ├── react-component.tsx    · drop-in React component with all variants
    └── html-snippet.html      · plain-HTML header example
```

---

## Quick start

1. **Copy the `assets/` folder** into your website project (e.g. `public/brand/` or `src/assets/logo/`).
2. **Copy `tokens.css`** into your global stylesheet, or convert to your design-tokens format.
3. **Add the Inter Tight font** via Google Fonts:
   ```html
   <link rel="preconnect" href="https://fonts.googleapis.com">
   <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
   <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700;800&display=swap">
   ```
   The wordmark SVGs use live `<text>` elements bound to Inter Tight. If the font isn't loaded, browsers will fall back to the system sans — usable but visibly off-brand.
4. **Render the lockup** in your nav/header:
   ```html
   <a href="/" aria-label="CalChat home">
     <img src="/brand/logo-lockup-horizontal.svg" alt="CalChat" height="32" />
   </a>
   ```
5. **Wire up the favicon**:
   ```html
   <link rel="icon" type="image/svg+xml" href="/brand/favicon.svg">
   <link rel="apple-touch-icon" href="/brand/apple-touch-icon.svg">
   ```

See `usage-examples/react-component.tsx` for a tidier component-based approach and `brand-guide.html` for the full visual reference.

---

## Color tokens (also in `tokens.css`)

| Token              | Hex       | Use                                                  |
|--------------------|-----------|------------------------------------------------------|
| `--cc-paper`       | `#f4efe6` | Primary background (warm cream).                     |
| `--cc-paper-2`     | `#ebe4d4` | Panel / card background.                             |
| `--cc-ink`         | `#16140f` | Primary text, mark outlines.                         |
| `--cc-ink-2`       | `#2a2620` | Secondary text.                                      |
| `--cc-rule`        | `#d6cdb9` | Hairlines, dividers.                                 |
| `--cc-muted`       | `#8a8273` | Captions, metadata, timestamps.                      |
| `--cc-accent`      | `#c4634a` | **Terracotta — only where two things overlap.**       |
| `--cc-accent-soft` | `#e3a995` | Soft accent for hover states / availability washes.  |

A dark theme is included under `[data-theme="dark"]`.

### The single rule about color
The terracotta accent is **reserved for moments of overlap, availability matches, or "this is the answer" states**. Do not use it for hover, branding flourishes, or arbitrary decoration. If you find yourself reaching for it, ask: *is this where two people's time agrees?* If not, use ink.

---

## Typography

- **Display & body:** Inter Tight (400, 500, 600, 700)
- **Mono / metadata:** JetBrains Mono (400, 500) — for time labels, codes, "GMT+5:30" strings, etc.
- **Wordmark:** Inter Tight 700, lowercase, letter-spacing `-0.04em`. The wordmark is set as live `<text>` inside the SVG, so it inherits its font from a global stylesheet — load Inter Tight before rendering.

Type scale suggestion (adjust to project):

| Role        | Size  | Weight | Tracking  |
|-------------|-------|--------|-----------|
| Hero        | 72 px | 700    | -0.04em   |
| H1          | 48 px | 700    | -0.03em   |
| H2          | 32 px | 600    | -0.02em   |
| H3          | 22 px | 600    | -0.015em  |
| Body        | 16 px | 400    | normal    |
| Caption     | 12 px | 500    | 0.04em UPPER (mono) |

---

## Clear space & sizing

- **Clearspace** around any lockup = **20% of the mark's height**. Don't put text, buttons, or other graphics inside that perimeter.
- **Minimum mark size:** 20 px tall (favicon territory — use `favicon.svg` below this).
- **Minimum lockup height:** 24 px. Below this, use the mark alone.

---

## Variations matrix (when to use what)

| Surface                         | File                                       |
|---------------------------------|--------------------------------------------|
| Site header, paper background   | `logo-lockup-horizontal.svg`               |
| Site header, dark background    | `logo-lockup-horizontal-light.svg`         |
| Footer, single-ink stamp        | `logo-lockup-horizontal-mono.svg`          |
| Narrow column / mobile drawer   | `logo-lockup-stacked.svg`                  |
| Avatar slot, app icon           | `logo-mark.svg` or `apple-touch-icon.svg`  |
| Browser tab favicon             | `favicon.svg`                              |
| Loading spinner, watermark      | `logo-mark-mono.svg`                       |
| Email signature on dark theme   | `logo-lockup-horizontal-light.svg`         |

---

## Don'ts

- ✗ Don't recolor the lockup ad-hoc — use the provided variants.
- ✗ Don't outline or "wireframe" the mark — the filled terracotta intersection is essential.
- ✗ Don't rotate the lockup. Don't stretch. Don't add shadows.
- ✗ Don't pair the wordmark with a different mark, or vice versa.
- ✗ Don't replace terracotta with a brand color from another product. The accent reservation rule is the whole system.

---

## Questions for the developer

These weren't decided in the design pass — please confirm with the designer or product owner:

1. **Dark mode:** should the site support a `[data-theme="dark"]` toggle out of the gate? Tokens are provided either way.
2. **Logo as link:** should `/` always be the home destination, or do you want a logo→dashboard behavior for signed-in users?
3. **Hover/active state on the lockup:** none by default — opacity 0.7 on hover is the safe default if you need feedback.
4. **PNG fallbacks:** SVG covers all modern browsers (IE11 is dropped). If you need raster PNGs for email or legacy surfaces, generate them from the SVGs at 1x/2x/3x.

---

## How this design came to be

Twelve directions were explored on a single canvas (see `CalChat Logos.html` in the parent project). The winning direction is the **Mark + Wordmark lockup** — the **Overlap Squares** mark beside `calchat` set in Inter Tight 700. The mark visualizes the core jobs-to-be-done of CalChat (two people's schedules overlapping, the intersection being the answer), and the wordmark stays maximally restrained so the mark carries the brand idea.
