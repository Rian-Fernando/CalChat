"use client";

import { useMemo } from "react";
import { fullOverlap, groupIntoRanges } from "@/lib/overlap";
import { localFromSlot, SLOT_MS } from "@/lib/timezone";
import type { Participant } from "@/lib/types";

interface Props {
  participants: Participant[];
  viewerTimezone: string;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} hour${h !== 1 ? "s" : ""}` : `${h}h ${m}m`;
}

export default function BestTimes({ participants, viewerTimezone }: Props) {
  const ranges = useMemo(() => {
    const slots = Array.from(fullOverlap(participants)).sort((a, b) => a - b);
    return groupIntoRanges(slots);
  }, [participants]);

  if (participants.length < 2) {
    return (
      <p className="text-sm text-ink-400">
        Waiting for at least two people to mark their availability before showing overlap.
      </p>
    );
  }

  if (ranges.length === 0) {
    return (
      <p className="text-sm text-ink-400">
        No times where everyone is free yet. The heatmap on the left shows where you&apos;re
        <em> closest</em>.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {ranges.map(r => {
        const start = localFromSlot(r.start, viewerTimezone);
        const end = localFromSlot(r.endExclusive, viewerTimezone);
        const minutes = (r.endExclusive - r.start) * 15;
        return (
          <li
            key={r.start}
            className="flex items-center justify-between rounded-lg border border-accent/30 bg-accent/5 px-3 py-2"
          >
            <div>
              <div className="text-sm text-ink-100">
                {start.toFormat("EEE LLL d")} ·{" "}
                <span className="tabular-nums">{start.toFormat("h:mm a")}</span> →{" "}
                <span className="tabular-nums">{end.toFormat("h:mm a")}</span>
              </div>
              <div className="text-xs text-ink-400">
                {formatDuration(minutes)} · in {viewerTimezone}
              </div>
            </div>
            <span className="rounded bg-accent/20 px-2 py-1 text-[10px] uppercase tracking-wider text-accent">
              all {participants.length}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
