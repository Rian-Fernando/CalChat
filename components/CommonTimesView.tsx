"use client";

import { useMemo, useState } from "react";
import { computeOverlapRegions, type OverlapRegion } from "@/lib/overlap";
import { localFromSlot, SLOT_MS } from "@/lib/timezone";
import TimezonePicker from "./TimezonePicker";
import type { Participant } from "@/lib/types";

interface Props {
  participants: Participant[];
  viewerTimezone: string;
  onViewerTimezoneChange: (zone: string) => void;
}

interface RegionEnriched extends OverlapRegion {
  participants: Participant[];
  durationMinutes: number;
}

function formatDuration(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h} hr${h === 1 ? "" : "s"}` : `${h}h ${m}m`;
}

export default function CommonTimesView({
  participants,
  viewerTimezone,
  onViewerTimezoneChange
}: Props) {
  const [showSolo, setShowSolo] = useState(false);
  const [minMinutes, setMinMinutes] = useState(0);

  const enriched: RegionEnriched[] = useMemo(() => {
    const idToP = new Map(participants.map(p => [p.id, p]));
    const regions = computeOverlapRegions(participants);
    return regions
      .map(r => ({
        ...r,
        participants: r.participantIds
          .map(id => idToP.get(id))
          .filter((p): p is Participant => Boolean(p)),
        durationMinutes: (r.endSlotExclusive - r.startSlot) * 15
      }))
      .filter(r => r.durationMinutes >= minMinutes);
  }, [participants, minMinutes]);

  const total = participants.length;

  // Group by participant count, sort each group by duration desc, then start asc
  const groups = useMemo(() => {
    const byCount = new Map<number, RegionEnriched[]>();
    for (const r of enriched) {
      const arr = byCount.get(r.participants.length);
      if (arr) arr.push(r);
      else byCount.set(r.participants.length, [r]);
    }
    return Array.from(byCount.entries())
      .map(([count, regions]) => ({
        count,
        regions: regions.sort((a, b) =>
          b.durationMinutes - a.durationMinutes || a.startSlot - b.startSlot
        )
      }))
      .sort((a, b) => b.count - a.count);
  }, [enriched]);

  if (participants.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-ink-700 p-6 text-center text-sm text-ink-400">
        No one has added availability yet. Share the link with your friends.
      </div>
    );
  }

  if (enriched.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-ink-700 p-6 text-center text-sm text-ink-400">
        Once participants mark their availability, every overlap window will show up here ranked
        by group size and length.
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-ink-400">Show times in</div>
          <div className="text-sm text-ink-200">{viewerTimezone}</div>
        </div>
        <div className="w-full sm:w-64">
          <TimezonePicker value={viewerTimezone} onChange={onViewerTimezoneChange} compact />
        </div>
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-lg border border-ink-700 bg-ink-900/40 px-3 py-2 text-xs">
        <label className="flex items-center gap-2 text-ink-300">
          Min duration:
          <select
            value={minMinutes}
            onChange={e => setMinMinutes(Number(e.target.value))}
            className="rounded-md border border-ink-700 bg-ink-900 px-2 py-1 text-ink-100"
          >
            <option value={0}>any</option>
            <option value={30}>30 min+</option>
            <option value={60}>1 hr+</option>
            <option value={120}>2 hr+</option>
            <option value={240}>4 hr+</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-ink-300">
          <input
            type="checkbox"
            checked={showSolo}
            onChange={e => setShowSolo(e.target.checked)}
            className="accent-accent"
          />
          Show single-person windows
        </label>
      </div>

      {/* Groups */}
      <div className="space-y-6">
        {groups
          .filter(g => g.count >= 2 || showSolo)
          .map(group => {
            const headerLabel =
              group.count === total
                ? `Everyone (all ${total} free)`
                : `${group.count} of ${total} free`;
            const isFullOverlap = group.count === total;
            return (
              <section key={group.count}>
                <div className="mb-2 flex items-center gap-2">
                  <h4
                    className={`text-xs font-medium uppercase tracking-wider ${
                      isFullOverlap ? "text-accent" : "text-ink-300"
                    }`}
                  >
                    {headerLabel}
                  </h4>
                  <span className="text-[11px] text-ink-500">
                    · {group.regions.length} window{group.regions.length === 1 ? "" : "s"}
                  </span>
                </div>
                <ul className="space-y-2">
                  {group.regions.map(r => {
                    const start = localFromSlot(r.startSlot, viewerTimezone);
                    const end = localFromSlot(r.endSlotExclusive, viewerTimezone);
                    const crossesDay = start.toFormat("yyyy-LL-dd") !== end.toFormat("yyyy-LL-dd");
                    return (
                      <li
                        key={`${group.count}-${r.startSlot}`}
                        className={`rounded-lg border px-3 py-2.5 ${
                          isFullOverlap
                            ? "border-accent/40 bg-accent/5"
                            : "border-ink-700 bg-ink-900/40"
                        }`}
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <div className="text-sm text-ink-100">
                            <span className="font-medium">{start.toFormat("EEE LLL d")}</span>
                            <span className="ml-2 tabular-nums">
                              {start.toFormat("h:mm a")}
                            </span>{" "}
                            <span className="text-ink-500">→</span>{" "}
                            <span className="tabular-nums">{end.toFormat("h:mm a")}</span>
                            {crossesDay && (
                              <span className="ml-1 text-[11px] text-ink-500">
                                ({end.toFormat("EEE LLL d")})
                              </span>
                            )}
                          </div>
                          <span className="rounded bg-ink-800 px-2 py-0.5 text-[11px] text-ink-300">
                            {formatDuration(r.durationMinutes)}
                          </span>
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          {r.participants.map(p => (
                            <span
                              key={p.id}
                              className="inline-flex items-center gap-1.5 rounded-full border border-ink-700 bg-ink-900 px-2 py-0.5 text-[11px] text-ink-200"
                              title={`Free at this time (${p.timezone})`}
                            >
                              <span
                                className="inline-block h-2 w-2 rounded-full"
                                style={{ background: p.color }}
                              />
                              {p.name}
                            </span>
                          ))}
                          {group.count < total && (
                            <span className="ml-1 text-[11px] text-ink-500">
                              busy:{" "}
                              {participants
                                .filter(p => !r.participantIds.includes(p.id))
                                .map(p => p.name)
                                .join(", ")}
                            </span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
      </div>
    </div>
  );
}
