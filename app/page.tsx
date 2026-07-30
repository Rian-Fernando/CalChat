import type { Metadata } from "next";
import CreateEventCard from "@/components/CreateEventCard";
import SceneBackground from "@/components/SceneBackground";

const SITE = "https://calchat.rianfernando.com";
const REPO = "https://github.com/Rian-Fernando/CalChat";
const PORTFOLIO = "https://rianfernando.com";

/* Page-level metadata. The root layout supplies the site-wide defaults; this
   narrows the description to the landing page specifically so the two aren't
   competing for the same snippet.
 *
 * `openGraph` and `twitter` are respecified in full rather than partially:
 * Next merges metadata shallowly, so declaring either key here replaces the
 * parent's object outright. Restating them keeps the social description in step
 * with the meta description instead of silently inheriting the shorter tagline
 * — og:description is one of the fields AI crawlers lean on. og:image is still
 * supplied by the app/opengraph-image.tsx file convention. */
const PAGE_DESCRIPTION =
  "CalChat is a free, shareable availability planner for groups spread across timezones. Send one link, everyone drags the hours they're free in their own timezone, and CalChat shows the overlap. No sign-up, no calendar import.";

const PAGE_TITLE = "CalChat — find a call time across timezones";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "CalChat",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: SITE
  },
  twitter: {
    card: "summary_large_image",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION
  }
};

/* ------------------------------------------------------------------
 * Page copy lives in data, not JSX, for two reasons: the FAQ block and
 * its FAQPage structured data are generated from one array (Google
 * requires the marked-up answers to be the visible ones), and prose in
 * TS constants doesn't need JSX entity escaping.
 * ------------------------------------------------------------------ */

const STEPS = [
  {
    n: "01",
    title: "Create a link",
    body: "Give the call a name — or don't — and CalChat hands you a URL. No account, no email, nothing to install."
  },
  {
    n: "02",
    title: "Everyone marks their hours",
    body: "Each person opens the link, picks their own timezone, and drag-selects the hours they're free on a 7-day by 30-minute grid. Quick-add can apply a whole day-range and time-range at once, repeating up to 52 weeks ahead."
  },
  {
    n: "03",
    title: "Read the overlap",
    body: "CalChat intersects everyone's availability and draws the windows where the group is free — rendered in each viewer's own local time, so nobody has to do the arithmetic."
  }
];

const FEATURES = [
  {
    title: "Three ways to read the week",
    body: "A group-overlap heatmap that splits every cell into one colored stripe per participant; a common-times calendar that positions each overlap block at its real time and sizes it by duration; and a personal edit mode for your own hours."
  },
  {
    title: "Recurring sweet spots",
    body: "A heatmap that aggregates every week in the event to surface the patterns underneath — the view that tells you Tuesday evenings work nearly every week."
  },
  {
    title: "Filter by participant",
    body: "See the overlap for any subset of the group, so you can check what opens up if one person sits this one out."
  },
  {
    title: "One link, any week",
    body: "The same URL covers every week from now through next year. Jump by week, by month, or with the date picker, and plan more than one call from a single link."
  },
  {
    title: "22 unique colors",
    body: "Participants pick from a 22-color palette and the server enforces uniqueness, so no two people are ever the same color and a stripe is always readable at a glance."
  },
  {
    title: "Notes and multi-device",
    body: "Leave an attributed note only you can edit, and claim your entry on a second device with a click — still no password, still no account."
  }
];

const STACK = [
  { name: "Next.js 14", detail: "App Router, TypeScript, file-based metadata" },
  { name: "Tailwind CSS", detail: "warm-dark surface, terracotta reserved for overlap" },
  { name: "React Three Fiber + three.js", detail: "the scroll-reactive background scene" },
  { name: "Luxon", detail: "every IANA timezone Node reports is selectable" },
  { name: "Upstash Redis", detail: "event storage, with an in-memory dev fallback" },
  { name: "Vercel + Cloudflare", detail: "hosting and DNS" }
];

const FAQ = [
  {
    q: "What is CalChat?",
    a: "CalChat is a free, shareable, timezone-aware availability planner. One person creates a link and sends it to the group, everyone marks the hours they're free in their own timezone, and CalChat shows the windows where those hours overlap. It's built for casual scheduling — friend groups, study groups, and small distributed teams."
  },
  {
    q: "Is CalChat free, and do I need an account?",
    a: "It's free and there is no account. You don't sign up, enter an email, or install anything. Anyone holding the link can add their availability, and the link itself is the only thing you need to keep."
  },
  {
    q: "How does CalChat handle timezones and daylight saving?",
    a: "Every free block is stored as an integer 15-minute UTC slot rather than a wall-clock time, so nothing depends on the timezone it was entered in. Daylight saving transitions, half-hour and quarter-hour offsets, and blocks that cross midnight into the next day all resolve correctly because finding overlap is just set intersection on those integers."
  },
  {
    q: "How many people can join one CalChat event?",
    a: "Up to 22 — that's the size of the participant color palette, and the server keeps every participant's color unique so the overlap views stay readable."
  },
  {
    q: "Can CalChat handle recurring or multi-week scheduling?",
    a: "Yes. One link covers any week from the current week through the following year. Quick-add can repeat a time block across up to 52 consecutive weeks, and the recurring sweet-spots heatmap aggregates across every week to show which slots are reliably open."
  },
  {
    q: "Does CalChat connect to Google Calendar or Outlook?",
    a: "No, and that's deliberate. There's no calendar import, no OAuth, and no permissions to grant — you mark the hours you're willing to be called, which is usually a much shorter list than the hours your calendar says are technically free."
  }
];

/* ---------- structured data ---------- */

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "@id": `${SITE}/#app`,
      name: "CalChat",
      url: SITE,
      description:
        "A free, shareable, timezone-aware availability planner. Send one link, everyone drags the hours they're free in their own timezone, and CalChat shows the overlap.",
      applicationCategory: "ProductivityApplication",
      operatingSystem: "Web",
      browserRequirements: "Requires JavaScript and a modern browser",
      inLanguage: "en",
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      featureList: FEATURES.map(f => f.title),
      screenshot: `${SITE}/opengraph-image`,
      sameAs: [REPO, `${PORTFOLIO}/projects/calchat`],
      author: {
        "@type": "Person",
        name: "Rian Fernando",
        url: PORTFOLIO
      }
    },
    {
      "@type": "FAQPage",
      "@id": `${SITE}/#faq`,
      mainEntity: FAQ.map(item => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a }
      }))
    }
  ]
};

/* ---------- small presentational helpers ---------- */

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="mb-4 text-2xl font-medium tracking-tight text-ink-100 sm:text-3xl">
      {children}
    </h2>
  );
}

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <SceneBackground scrollScene />

      <a
        href="#main"
        className="above-bg sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:rounded-lg focus:bg-ink-800 focus:px-4 focus:py-2 focus:text-ink-100"
      >
        Skip to content
      </a>

      <header className="above-bg mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
        {/* Explicit width + height: the lockup is 401x100, and reserving the box
            keeps the header from reflowing when the SVG lands. */}
        {/* eslint-disable-next-line @next/next/no-img-element --
            next/image doesn't optimize SVG; it would ship a wrapper and extra
            runtime for a file it passes through untouched. */}
        <img
          src="/brand/logo-lockup-horizontal-light.svg"
          alt="CalChat"
          width={140}
          height={35}
          className="h-8 w-auto"
          decoding="async"
        />
        <nav aria-label="Primary" className="flex items-center gap-5 text-sm text-ink-300">
          <a className="transition hover:text-ink-100" href="#how-it-works">
            How it works
          </a>
          <a className="hidden transition hover:text-ink-100 sm:inline" href="#features">
            Features
          </a>
          <a className="hidden transition hover:text-ink-100 sm:inline" href="#timezone-math">
            Timezone math
          </a>
          <a className="transition hover:text-ink-100" href="#faq">
            FAQ
          </a>
          <a
            className="transition hover:text-ink-100"
            href={REPO}
            rel="noopener noreferrer"
            target="_blank"
          >
            GitHub
          </a>
        </nav>
      </header>

      <main id="main" className="above-bg mx-auto w-full max-w-5xl px-6 pb-24">
        {/* ---------- hero ---------- */}
        <section className="flex min-h-[78vh] flex-col items-center justify-center py-12 text-center">
          <div className="animate-fade-in">
            <h1 className="mb-5 text-4xl font-medium tracking-tight text-ink-100 sm:text-6xl">
              Find a time that works,
              <br />
              <span className="text-accent">across every timezone.</span>
            </h1>
            {/* The plain-language definition, stated once, early, and quotably —
                this is the sentence an answer engine will lift. */}
            <p className="mx-auto mb-10 max-w-xl text-base leading-relaxed text-ink-200">
              CalChat is a free, shareable availability planner for groups spread across
              timezones. Send one link, everyone drags the hours they&apos;re free in their own
              timezone, and CalChat shows you the overlap. No sign-up, no calendar import.
            </p>
          </div>

          <CreateEventCard />

          <p className="mt-6 text-xs text-ink-300">
            Free · No account · Up to 22 people · Any week through next year
          </p>
        </section>

        {/* ---------- how it works ---------- */}
        <section id="how-it-works" className="scroll-mt-20 py-16" aria-labelledby="how-it-works-h">
          <SectionHeading id="how-it-works-h">How CalChat works</SectionHeading>
          <p className="mb-8 max-w-2xl text-ink-200">
            Three steps, and nobody has to convert a single time in their head.
          </p>
          <ol className="grid gap-4 sm:grid-cols-3">
            {STEPS.map(step => (
              <li key={step.n} className="card rounded-2xl p-5">
                <span className="mb-3 block font-mono text-xs tracking-widest text-accent">
                  {step.n}
                </span>
                <h3 className="mb-2 text-lg font-medium text-ink-100">{step.title}</h3>
                <p className="text-sm leading-relaxed text-ink-200">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ---------- features ---------- */}
        <section id="features" className="scroll-mt-20 py-16" aria-labelledby="features-h">
          <SectionHeading id="features-h">What you get</SectionHeading>
          <p className="mb-8 max-w-2xl text-ink-200">
            CalChat is deliberately narrow: it does group availability, and it does the awkward
            parts of it properly.
          </p>
          <ul className="grid gap-4 sm:grid-cols-2">
            {FEATURES.map(feature => (
              <li key={feature.title} className="card rounded-2xl p-5">
                <h3 className="mb-2 text-lg font-medium text-ink-100">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-ink-200">{feature.body}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* ---------- timezone math ---------- */}
        <section id="timezone-math" className="scroll-mt-20 py-16" aria-labelledby="timezone-math-h">
          <SectionHeading id="timezone-math-h">How the timezone math works</SectionHeading>
          <div className="card rounded-2xl p-6 sm:p-8">
            <p className="mb-4 max-w-2xl leading-relaxed text-ink-200">
              Availability is never stored as a wall-clock time. Every free block is an integer
              UTC 15-minute slot index —{" "}
              <code className="rounded bg-ink-800 px-1.5 py-0.5 font-mono text-sm text-ink-100">
                floor(epochMilliseconds / 900000)
              </code>{" "}
              — because 15 minutes is the finest granularity any real-world IANA timezone uses.
              Nepal sits at UTC+5:45, so a coarser grid would simply fail to represent it.
            </p>
            <p className="mb-6 max-w-2xl leading-relaxed text-ink-200">
              Each 30-minute cell in the grid maps to exactly two consecutive slots, and finding
              the group&apos;s overlap is set intersection on those integers. Daylight saving
              transitions, half-hour offsets, and blocks that cross midnight into the next day
              stop being special cases and become ordinary arithmetic.
            </p>

            <h3 className="mb-3 text-sm uppercase tracking-wider text-ink-300">A worked example</h3>
            <ul className="mb-4 space-y-1.5 font-mono text-sm text-ink-200">
              <li>Monday 8:30 PM in America/New_York</li>
              <li>Tuesday 6:00 AM in Asia/Kolkata</li>
              <li>Tuesday 8:30 AM in Asia/Shanghai</li>
            </ul>
            <p className="max-w-2xl leading-relaxed text-ink-200">
              Three people, three different days-of-week on their own calendars. CalChat reports a{" "}
              <strong className="font-medium text-accent">60-minute three-way overlap</strong>, and
              each of them sees that same UTC window rendered in their own local time.
            </p>
          </div>
        </section>

        {/* ---------- the scene ---------- */}
        <section id="the-scene" className="scroll-mt-20 py-16" aria-labelledby="the-scene-h">
          <SectionHeading id="the-scene-h">About the background</SectionHeading>
          <p className="max-w-2xl leading-relaxed text-ink-200">
            The scene behind this page is built with React Three Fiber. Translucent calendar shards
            drift through three concentric timezone-dial rings, each marked with 24 hour ticks and
            turning against the others. As you scroll, the shards resolve into a week grid and one
            column condenses into a terracotta block while the dials lock onto a shared phase — the
            product&apos;s whole idea, with no words in it. Move your cursor and nearby shards drift
            toward it; click anywhere off the interface for a ripple. If your system asks for
            reduced motion, it renders as a single still frame instead.
          </p>
        </section>

        {/* ---------- stack ---------- */}
        <section id="stack" className="scroll-mt-20 py-16" aria-labelledby="stack-h">
          <SectionHeading id="stack-h">Built with</SectionHeading>
          <ul className="grid gap-3 sm:grid-cols-2">
            {STACK.map(item => (
              <li key={item.name} className="flex gap-3 text-sm leading-relaxed">
                <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" />
                <span>
                  <strong className="font-medium text-ink-100">{item.name}</strong>
                  <span className="text-ink-300"> — {item.detail}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-ink-200">
            The source is on{" "}
            <a
              className="text-accent underline-offset-4 hover:underline"
              href={REPO}
              rel="noopener noreferrer"
              target="_blank"
            >
              GitHub
            </a>
            , and there&apos;s a longer write-up on{" "}
            <a
              className="text-accent underline-offset-4 hover:underline"
              href={`${PORTFOLIO}/projects/calchat`}
              rel="noopener noreferrer"
              target="_blank"
            >
              the project page
            </a>
            .
          </p>
        </section>

        {/* ---------- faq ---------- */}
        <section id="faq" className="scroll-mt-20 py-16" aria-labelledby="faq-h">
          <SectionHeading id="faq-h">Frequently asked questions</SectionHeading>
          <dl className="space-y-6">
            {FAQ.map(item => (
              <div key={item.q} className="border-l-2 border-ink-700 pl-5">
                <dt className="mb-2 text-lg font-medium text-ink-100">{item.q}</dt>
                <dd className="max-w-2xl leading-relaxed text-ink-200">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ---------- closing cta ---------- */}
        <section className="card rounded-2xl p-8 text-center" aria-labelledby="cta-h">
          <h2 id="cta-h" className="mb-3 text-2xl font-medium tracking-tight text-ink-100">
            Make a link and send it to the group
          </h2>
          <p className="mx-auto mb-6 max-w-lg text-ink-200">
            Nothing to sign up for. Scroll back to the top, or head straight in.
          </p>
          <a
            href="#main"
            className="inline-block rounded-lg bg-accent px-6 py-3 font-medium text-ink-950 transition hover:bg-accent-strong"
          >
            Create a shareable link
          </a>
        </section>
      </main>

      <footer className="above-bg mx-auto w-full max-w-5xl px-6 pb-12">
        <div className="flex flex-col gap-4 border-t border-ink-700 pt-8 text-sm text-ink-300 sm:flex-row sm:items-center sm:justify-between">
          <p>
            CalChat — a shareable, timezone-aware availability planner. Free, no sign-up, built with
            Next.js and Upstash.
          </p>
          <nav aria-label="Footer" className="flex shrink-0 items-center gap-5">
            <a
              className="transition hover:text-ink-100"
              href={REPO}
              rel="noopener noreferrer"
              target="_blank"
            >
              GitHub
            </a>
            <a
              href={PORTFOLIO}
              rel="author"
              className="transition hover:text-ink-100 hover:underline"
            >
              Built by Rian Fernando
            </a>
          </nav>
        </div>
      </footer>
    </>
  );
}
