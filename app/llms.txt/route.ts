/**
 * /llms.txt — https://llmstxt.org/
 *
 * A plain-text, high-signal summary of CalChat for AI answer engines
 * (ChatGPT, Perplexity, Claude, Google AI Overviews). Kept factual and
 * quotable: short declarative sentences, no marketing language, numbers
 * that match the actual implementation.
 *
 * force-static bakes this into the build output so it's served from the
 * edge as a static asset rather than invoking a serverless function.
 */
export const dynamic = "force-static";

const SITE = "https://calchat.rianfernando.com";
const REPO = "https://github.com/Rian-Fernando/CalChat";

const BODY = `# CalChat

> CalChat is a free, shareable, timezone-aware availability planner for finding a
> time that works across timezones. One person creates a link and sends it to the
> group; everyone drags the hours they're free in their own timezone; CalChat shows
> the overlap. There is no sign-up, no calendar import, and no integration with
> Google Calendar or Outlook. It is built for casual scheduling among friends,
> study groups, and small distributed teams.

## What it does

- [Create a shared link](${SITE}) — name the call, get a URL, send it to the group. No account is created.
- Each participant picks their own IANA timezone and drag-selects the hours they are free on a 7-day by 30-minute grid.
- CalChat intersects everyone's availability and renders the overlapping windows in each viewer's own local time.
- One link covers any week from the current week through the following year, so a group can plan more than one call from the same URL.

## Key features

- **Three view modes** — a group-overlap heatmap where each cell is split into one colored stripe per participant; a common-times week calendar that positions overlap blocks at their real times and sizes them by duration; and a personal edit mode for your own availability.
- **Recurring sweet-spots heatmap** — aggregates every week in the event to surface patterns such as "Tuesday evenings work nearly every week".
- **Quick-add with repeats** — apply a day-range and time-range in one action, optionally repeating across up to 52 consecutive weeks.
- **Participant filtering** — view the overlap for a chosen subset of people, so a group can see what times work if one person sits out.
- **22 unique participant colors** — the server enforces uniqueness, so no two participants share a color; an event holds up to 22 participants.
- **Per-participant notes** — each person can leave an attributed note that everyone sees but only the author can edit.
- **Multi-device claiming** — click "this is me" on a participant chip to take over that entry on another device. No password, no account.
- **Live refresh** — the shared views re-fetch every 5 minutes while the tab is visible.

## How the timezone math works

- Availability is stored as integer UTC 15-minute slot indices: \`floor(epochMilliseconds / 900000)\`. Nothing is stored as wall-clock time.
- 15 minutes is the finest granularity any real-world IANA timezone uses (Nepal is UTC+5:45), so every zone maps onto the slot grid exactly.
- Each 30-minute cell in the interface maps to exactly two consecutive slots, and finding overlap is set intersection on those integers.
- Because slots are absolute UTC, daylight saving transitions, half-hour and quarter-hour offsets, and dates that cross midnight into the next day all resolve correctly without special cases.
- Worked example: one participant selects Monday 8:30 PM in America/New_York, a second selects Tuesday 6:00 AM in Asia/Kolkata, and a third selects Tuesday 8:30 AM in Asia/Shanghai. CalChat reports a 60-minute three-way overlap, and each viewer sees that same UTC window rendered in their own local time.

## Tech stack

- **Next.js 14** (App Router) and **TypeScript**
- **Tailwind CSS** for styling
- **React Three Fiber** and **three.js** for the animated, scroll-reactive background scene
- **Luxon** for IANA timezone handling — every zone reported by \`Intl.supportedValuesOf('timeZone')\` is selectable
- **Upstash Redis** for event storage, with an in-memory fallback for local development
- **Vercel** for hosting, **Cloudflare** for DNS

## Links

- [CalChat live](${SITE}) — the running application
- [Source on GitHub](${REPO}) — full source code
- [Project write-up](https://rianfernando.com/projects/calchat) — background and design notes
- Built by Rian Fernando — https://rianfernando.com
`;

export function GET() {
  return new Response(BODY, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800"
    }
  });
}
