"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TIMEZONE_OPTIONS, currentWeekMondayISO } from "@/lib/timezone";

function browserZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Etc/UTC";
  } catch {
    return "Etc/UTC";
  }
}

/**
 * The only interactive part of the landing page: name the call, POST it, and
 * route to the shared link. Split out of app/page.tsx so the page itself can be
 * a server component — the prose around it is what search and AI crawlers read,
 * and it should arrive in the HTML without waiting on hydration.
 */
export default function CreateEventCard() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Resolved after mount: the server has no idea what timezone the visitor is in,
     so rendering it during SSR would guarantee a hydration mismatch. */
  const [zoneLabel, setZoneLabel] = useState<string | null>(null);
  useEffect(() => {
    const zone = browserZone();
    setZoneLabel(TIMEZONE_OPTIONS.find(t => t.zone === zone)?.label ?? zone);
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    const zone = browserZone();
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || "Call with friends",
          creatorZone: zone,
          weekStartDate: currentWeekMondayISO(zone)
        })
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const event = await res.json();
      router.push(`/event/${event.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setCreating(false);
    }
  };

  return (
    <div className="card animate-fade-in w-full max-w-md rounded-2xl p-6 shadow-2xl shadow-black/30">
      <label
        htmlFor="event-title"
        className="mb-2 block text-xs uppercase tracking-wider text-ink-300"
      >
        What&apos;s this call about? <span className="text-ink-400">(optional)</span>
      </label>
      <input
        id="event-title"
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Enter" && !creating) handleCreate();
        }}
        placeholder="e.g. Catch-up with the group"
        /* border-control, not the ink scale: WCAG 1.4.11 wants 3:1 for the edge
           of a form control, and ink-600 on this surface is 1.6:1. */
        className="w-full rounded-lg border border-control bg-ink-900/70 px-4 py-3 text-ink-100 placeholder:text-ink-400 transition focus:border-accent"
        maxLength={120}
      />

      <button
        onClick={handleCreate}
        disabled={creating}
        className="mt-4 w-full rounded-lg bg-accent px-4 py-3 font-medium text-ink-950 transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
      >
        {creating ? "Creating..." : "Create shareable link"}
      </button>

      {error && (
        <p role="alert" className="mt-3 text-sm text-rose-300">
          {error}
        </p>
      )}

      {/* min-h reserves the line so resolving the timezone after mount doesn't
          shift the card — this block sits above the fold and would otherwise
          register as layout shift. */}
      <p className="mt-4 min-h-[1rem] text-center text-xs text-ink-300">
        {zoneLabel && (
          <>
            Your timezone is detected as <span className="text-ink-100">{zoneLabel}</span>
          </>
        )}
      </p>
    </div>
  );
}
