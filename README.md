# CalChat

A minimalist, shareable, timezone-aware availability picker. Create a link, send it to your
friends across the world, and find the hours when you're all free at the same time.

- Click + drag to paint your availability in 30-min slots across a 7-day grid
- Everyone picks in their own local timezone (Mumbai, Shanghai, Lima, Colombo — anywhere)
- The "Group overlap" view shows where everyone's free, rendered in any timezone
- Animated three.js scene: globe, arc-network, torus knot, Lissajous swarm
- No sign-up. Just a name.

---

## Stack

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS** for styling
- **React Three Fiber** + **three.js** for the rotating-globe background
- **Luxon** for IANA timezone handling
- **Upstash Redis** for storing events (free tier; works with Vercel KV the same way)
- **Vercel** for deployment

All times are stored as integer "UTC epoch hours" — that's the single source of truth, so
overlap math is just set intersection regardless of who's in what timezone.

---

## Quick start (local)

```bash
npm install
cp .env.local.example .env.local   # optional — without it, data is in-memory
npm run dev
```

Open `http://localhost:3000`.

> Without env vars set, an **in-memory store** is used so you can try the flow locally —
> data is lost on restart and is not shared between server instances.

---

## Setting up the database (1 time, ~2 minutes)

You need an Upstash Redis database. Two equivalent ways to get one:

### Option A — Upstash directly (works anywhere)

1. Sign up free at [upstash.com](https://upstash.com).
2. Create a new Redis database (any region near your users).
3. Copy the **REST URL** and **REST Token** from the database page.
4. Put them in `.env.local` (and later in Vercel's env vars):

   ```
   UPSTASH_REDIS_REST_URL=https://...upstash.io
   UPSTASH_REDIS_REST_TOKEN=...
   ```

### Option B — via Vercel marketplace (1-click after deploy)

1. Deploy first (see below).
2. On your Vercel project page, go to **Storage → Add → Upstash for Redis (KV)**.
3. Vercel auto-injects `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. Redeploy.

Free tier is more than enough for a friend group.

---

## Deploy to Vercel (shareable link)

The fastest path:

```bash
npm install -g vercel
vercel login
vercel --prod
```

That gives you a URL like `https://calchat-abc123.vercel.app`. Share it with friends.
Each event lives at `/event/<id>` — a single link that everyone visits.

If you set up the database **after** deploying, redeploy once so the new env vars take effect:

```bash
vercel --prod
```

### Alternative: deploy through the Vercel dashboard

1. Push this repo to GitHub.
2. [vercel.com/new](https://vercel.com/new) → import the repo.
3. Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` env vars (or use the marketplace
   integration above).
4. Deploy.

---

## How it works (for the curious)

- An **event** = `{ id, title, weekStartDate, participants }`
- A **participant** = `{ id, name, timezone, availability: number[], color }`
- Each hour cell in the grid corresponds to a UTC **epoch hour** =
  `floor(epochMilliseconds / 3_600_000)`. Storing selections as integer epoch hours means
  the overlap is literally `Array.from(p1).filter(h => p2.includes(h) && p3.includes(h))`.
- The grid renders 7 days × 24 hours **in the viewer's local timezone**, but the
  underlying epoch hours stay timezone-agnostic.

---

## Project layout

```
app/
  layout.tsx, globals.css, page.tsx       — landing + create-event
  event/[id]/page.tsx                     — main event UI
  api/events/route.ts                     — POST create event
  api/events/[id]/route.ts                — GET event
  api/events/[id]/participants/route.ts   — PUT upsert participant availability
components/
  AvailabilityGrid.tsx                    — 7x24 grid (edit + view modes)
  OnboardingDialog.tsx                    — name + timezone on first visit
  TimezonePicker.tsx                      — searchable IANA zone picker
  BestTimes.tsx                           — ranked overlap ranges
  HoverDetails.tsx                        — per-cell details panel
  ParticipantList.tsx                     — colored chip list
  ShareBar.tsx                            — copyable URL bar
  ThreeBackground.tsx                     — react-three-fiber globe + motes
lib/
  redis.ts                                — Upstash client (with in-memory dev fallback)
  timezone.ts                             — Luxon helpers + curated zone list
  overlap.ts                              — set intersection + range grouping
  types.ts, colors.ts
```
