"use client";

import { useMemo, useState } from "react";
import { DateTime } from "luxon";
import { computeOverlapRegions } from "@/lib/overlap";
import { SLOT_MS } from "@/lib/timezone";
import TimezonePicker from "./TimezonePicker";
import ParticipantFilter from "./ParticipantFilter";
import WeeklyPatternHeatmap from "./WeeklyPatternHeatmap";
import type { Participant } from "@/lib/types";

interface Props {
  participants: Participant[];
  weekStartDate: string;
  viewerTimezone: string;
  onViewerTimezoneChange: (zone: string) => void;
  /** Current viewer's participant ID, used to label them in the filter dropdown. */
  currentParticipantId?: string | null;
  /** Optional: lets a viewer jump to a different week from the "other weeks" list. */
  onJumpToWeek?: (mondayISO: string) => void;
}

interface CalendarBlock {
  key: string;
  startMin: number;        // minutes from midnight of this column's day, in viewer's TZ
  endMin: number;          // exclusive
  durationMin: number;
  participants: Participant[];
  participantIds: string[];
  isFullOverlap: boolean;
  startsHere: boolean;     // false if this block began on a prior day
}

const HOUR_PX = 36;        // pixels per hour in the calendar; 24h * 36 = 864px
const DAY_HEIGHT = HOUR_PX * 24;

export default function CommonTimesCalendar({
  participants,
  weekStartDate,
  viewerTimezone,
  onViewerTimezoneChange,
  currentParticipantId,
  onJumpToWeek
}: Props) {
  const [minDuration, setMinDuration] = useState(15);
  const [showSolo, setShowSolo] = useState(false);

  // Per-viewer filter: tracked as the set of EXCLUDED ids so any new participant who
  // joins later is automatically included in the calendar without us needing to re-sync.
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());

  const includedIds = useMemo(() => {
    return new Set(participants.filter(p => !excludedIds.has(p.id)).map(p => p.id));
  }, [participants, excludedIds]);

  const filteredParticipants = useMemo(
    () => participants.filter(p => includedIds.has(p.id)),
    [participants, includedIds]
  );

  const total = filteredParticipants.length;

  const regions = useMemo(
    () => computeOverlapRegions(filteredParticipants),
    [filteredParticipants]
  );

  // Each day, expressed in the viewer's local timezone, gives us a [startMs, endMs) window
  const days = useMemo(() => {
    const arr: { dayIndex: number; date: DateTime; startMs: number; endMs: number }[] = [];
    for (let d = 0; d < 7; d++) {
      const start = DateTime.fromISO(weekStartDate, { zone: viewerTimezone }).plus({ days: d });
      arr.push({
        dayIndex: d,
        date: start,
        startMs: start.toMillis(),
        endMs: start.plus({ days: 1 }).toMillis()
      });
    }
    return arr;
  }, [weekStartDate, viewerTimezone]);

  // For each day, find the slice of each region that falls within it and build a block
  const blocksPerDay: CalendarBlock[][] = useMemo(() => {
    const idToP = new Map(filteredParticipants.map(p => [p.id, p]));
    const out: CalendarBlock[][] = Array.from({ length: 7 }, () => []);

    for (const r of regions) {
      const regionStartMs = r.startSlot * SLOT_MS;
      const regionEndMs = r.endSlotExclusive * SLOT_MS;
      const ids = r.participantIds;
      const ps = ids
        .map(id => idToP.get(id))
        .filter((p): p is Participant => Boolean(p));

      if (ps.length < (showSolo ? 1 : 2)) continue;
      const wholeDurationMin = (regionEndMs - regionStartMs) / 60_000;
      if (wholeDurationMin < minDuration) continue;

      for (const day of days) {
        const sliceStart = Math.max(regionStartMs, day.startMs);
        const sliceEnd = Math.min(regionEndMs, day.endMs);
        if (sliceStart >= sliceEnd) continue;
        const startMin = (sliceStart - day.startMs) / 60_000;
        const endMin = (sliceEnd - day.startMs) / 60_000;
        out[day.dayIndex].push({
          key: `${r.startSlot}-${day.dayIndex}`,
          startMin,
          endMin,
          durationMin: endMin - startMin,
          participants: ps,
          participantIds: ids,
          isFullOverlap: ps.length === total,
          startsHere: sliceStart === regionStartMs
        });
      }
    }
    return out;
  }, [regions, days, filteredParticipants, total, showSolo, minDuration]);

  const anyBlocks = blocksPerDay.some(d => d.length > 0);

  // "Overlaps in other weeks" — scan EVERY region we computed, group by the Monday-week
  // (in viewer's TZ) that its start lands on, and surface the ones that aren't the
  // currently viewed week. Lets users discover viable times further out without having
  // to click through weeks blindly.
  const otherWeeks = useMemo(() => {
    if (!onJumpToWeek) return [] as { monday: string; count: number; longestMin: number }[];
    const byWeek = new Map<string, { count: number; longestMin: number }>();
    for (const r of regions) {
      const ps = r.participantIds.filter(id => includedIds.has(id));
      if (ps.length < 2) continue;
      const durationMin = (r.endSlotExclusive - r.startSlot) * 15;
      if (durationMin < minDuration) continue;
      const startDt = DateTime.fromMillis(r.startSlot * SLOT_MS, { zone: viewerTimezone });
      const monday = startDt.minus({ days: startDt.weekday - 1 }).toFormat("yyyy-LL-dd");
      if (monday === weekStartDate) continue;
      const cur = byWeek.get(monday) ?? { count: 0, longestMin: 0 };
      byWeek.set(monday, {
        count: cur.count + 1,
        longestMin: Math.max(cur.longestMin, durationMin)
      });
    }
    return Array.from(byWeek.entries())
      .map(([monday, info]) => ({ monday, ...info }))
      .sort((a, b) => a.monday.localeCompare(b.monday));
  }, [regions, includedIds, minDuration, viewerTimezone, weekStartDate, onJumpToWeek]);

  if (participants.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-ink-700 p-6 text-center text-sm text-ink-400">
        No one has added availability yet. Share the link with your friends.
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

      {/* Participant filter */}
      <div className="mb-4">
        <ParticipantFilter
          participants={participants}
          selectedIds={includedIds}
          onChange={nextIncluded => {
            // Convert "included" set back to "excluded" set internally so newcomers default in.
            const nextExcluded = new Set<string>();
            for (const p of participants) {
              if (!nextIncluded.has(p.id)) nextExcluded.add(p.id);
            }
            setExcludedIds(nextExcluded);
          }}
          currentId={currentParticipantId}
        />
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-4 rounded-lg border border-ink-700 bg-ink-900/40 px-3 py-2 text-xs">
        <label className="flex items-center gap-2 text-ink-300">
          Min duration:
          <select
            value={minDuration}
            onChange={e => setMinDuration(Number(e.target.value))}
            className="rounded-md border border-control bg-ink-900 px-2 py-1 text-ink-100"
          >
            <option value={15}>any (15+)</option>
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
        <span className="ml-auto text-[11px] text-ink-500">
          Glowing green = everyone is free. Block height ≈ duration.
        </span>
      </div>

      {/* Calendar grid */}
      <div
        className="overflow-x-auto rounded-lg border border-ink-700 bg-ink-900/40"
        style={{ maxHeight: 640 }}
      >
        <div
          className="grid"
          style={{ gridTemplateColumns: "52px repeat(7, minmax(120px, 1fr))" }}
        >
          {/* Day headers row */}
          <div className="sticky top-0 z-10 bg-ink-900/95 border-b border-ink-700" />
          {days.map(day => (
            <div
              key={`hdr-${day.dayIndex}`}
              className="sticky top-0 z-10 border-b border-l border-ink-700 bg-ink-900/95 px-2 py-2 text-center"
            >
              <div className="text-xs font-medium uppercase tracking-wider text-ink-200">
                {day.date.toFormat("EEE")}
              </div>
              <div className="text-[11px] text-ink-400">{day.date.toFormat("LLL d")}</div>
            </div>
          ))}

          {/* Time column */}
          <div className="relative" style={{ height: DAY_HEIGHT }}>
            {Array.from({ length: 24 }).map((_, h) => (
              <div
                key={h}
                className="absolute right-1 -translate-y-1/2 text-[10px] tabular-nums text-ink-500"
                style={{ top: h * HOUR_PX }}
              >
                {h === 0
                  ? "12 AM"
                  : h === 12
                  ? "12 PM"
                  : h < 12
                  ? `${h} AM`
                  : `${h - 12} PM`}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map(day => (
            <div
              key={`col-${day.dayIndex}`}
              className="relative border-l border-ink-700"
              style={{ height: DAY_HEIGHT }}
            >
              {/* Hour grid lines */}
              {Array.from({ length: 24 }).map((_, h) => (
                <div
                  key={h}
                  className="absolute left-0 right-0 border-t border-ink-700/50"
                  style={{ top: h * HOUR_PX }}
                />
              ))}
              {/* Overlap blocks */}
              {blocksPerDay[day.dayIndex].map(block => (
                <Block key={block.key} block={block} totalParticipants={total} />
              ))}
            </div>
          ))}
        </div>
      </div>

      {!anyBlocks && (
        <p className="mt-3 text-center text-xs text-ink-400">
          No overlapping windows match the current filters in this week. Try lowering the min
          duration, enabling single-person windows, or jumping to another week below.
        </p>
      )}

      {/* Other weeks with overlaps */}
      {otherWeeks.length > 0 && onJumpToWeek && (
        <div className="mt-5 rounded-lg border border-ink-700 bg-ink-900/40 p-3">
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <h4 className="text-xs uppercase tracking-wider text-ink-300">
              Overlaps in other weeks
            </h4>
            <span className="text-[11px] text-ink-500">
              {otherWeeks.length} other week{otherWeeks.length === 1 ? "" : "s"} with matches
            </span>
          </div>
          <ul className="space-y-1.5">
            {otherWeeks.slice(0, 12).map(w => {
              const sun = DateTime.fromISO(w.monday).plus({ days: 6 });
              return (
                <li key={w.monday}>
                  <button
                    type="button"
                    onClick={() => onJumpToWeek(w.monday)}
                    className="flex w-full items-center justify-between gap-3 rounded-md border border-control bg-ink-900/60 px-3 py-2 text-left text-xs transition hover:border-accent/40 hover:bg-ink-800"
                  >
                    <span className="text-ink-100">
                      Week of{" "}
                      <span className="font-medium">
                        {DateTime.fromISO(w.monday).toFormat("LLL d")}
                      </span>
                      <span className="text-ink-400"> – {sun.toFormat("LLL d, yyyy")}</span>
                    </span>
                    <span className="flex items-center gap-3 text-[11px] text-ink-400">
                      <span>{w.count} window{w.count === 1 ? "" : "s"}</span>
                      <span className="rounded bg-accent/15 px-1.5 py-0.5 text-accent">
                        longest{" "}
                        {w.longestMin >= 60
                          ? `${Math.floor(w.longestMin / 60)}h${
                              w.longestMin % 60 ? ` ${w.longestMin % 60}m` : ""
                            }`
                          : `${w.longestMin}m`}
                      </span>
                      <span className="text-ink-500">→</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {otherWeeks.length > 12 && (
            <p className="mt-2 text-[11px] text-ink-500">
              + {otherWeeks.length - 12} more weeks with overlaps (showing 12)
            </p>
          )}
        </div>
      )}

      {/* Recurring sweet-spots heatmap — aggregated across every week with data */}
      <WeeklyPatternHeatmap
        participants={filteredParticipants}
        viewerTimezone={viewerTimezone}
        onJumpToWeek={onJumpToWeek}
      />
    </div>
  );
}

function Block({
  block,
  totalParticipants
}: {
  block: CalendarBlock;
  totalParticipants: number;
}) {
  const top = (block.startMin / 60) * HOUR_PX;
  const height = Math.max((block.durationMin / 60) * HOUR_PX, 12);
  const startTime = DateTime.fromMillis(0)
    .plus({ minutes: block.startMin })
    .toFormat("h:mm a");
  const endTime = DateTime.fromMillis(0)
    .plus({ minutes: block.endMin })
    .toFormat("h:mm a");

  const isShort = height < 30;
  const labelText = block.isFullOverlap
    ? `All ${block.participants.length}`
    : `${block.participants.length} of ${totalParticipants}`;

  return (
    <div
      className={`absolute left-1 right-1 overflow-hidden rounded-md border ${
        block.isFullOverlap
          ? "border-accent shadow-[0_0_0_1px_rgba(154,230,180,0.6)]"
          : "border-ink-600"
      }`}
      style={{ top, height }}
      title={`${startTime} – ${endTime} (${block.participants
        .map(p => p.name)
        .join(", ")})`}
    >
      {/* Participant stripe background — vertical stripes, one per participant */}
      <div className="absolute inset-0 flex">
        {block.participants.map(p => (
          <span
            key={p.id}
            className="block"
            style={{
              flex: 1,
              background: p.color,
              opacity: block.isFullOverlap ? 0.65 : 0.5
            }}
          />
        ))}
      </div>
      {/* Foreground label */}
      <div className="relative flex h-full flex-col justify-between p-1 text-ink-950">
        <div className="flex items-center justify-between gap-1 text-[10px] font-semibold leading-tight">
          <span className="truncate">{labelText}</span>
          {!isShort && (
            <span className="rounded bg-ink-950/40 px-1 text-[9px] tabular-nums text-ink-100">
              {block.durationMin >= 60
                ? `${Math.floor(block.durationMin / 60)}h${
                    block.durationMin % 60 ? ` ${block.durationMin % 60}m` : ""
                  }`
                : `${block.durationMin}m`}
            </span>
          )}
        </div>
        {!isShort && (
          <div className="truncate text-[9px] leading-tight text-ink-950/80">
            {startTime}–{endTime}
          </div>
        )}
      </div>
    </div>
  );
}
