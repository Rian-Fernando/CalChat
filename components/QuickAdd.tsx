"use client";

import { useMemo, useState } from "react";
import { DateTime } from "luxon";
import { buildWeekGrid } from "@/lib/timezone";

interface Props {
  weekStartDate: string;
  timezone: string;
  selected: Set<number>;
  onChange: (next: Set<number>) => void;
}

function cellLabel(cellIdx: number): string {
  // cellIdx 0..48 inclusive (48 = midnight of next day, for end time)
  const hour24 = Math.floor(cellIdx / 2);
  const minute = (cellIdx % 2) * 30;
  if (cellIdx === 48) return "12:00 AM (next day)";
  const period = hour24 >= 12 ? "PM" : "AM";
  const h12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const mm = minute.toString().padStart(2, "0");
  return `${h12}:${mm} ${period}`;
}

const REPEAT_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: "Just this week" },
  { value: 2, label: "Next 2 weeks" },
  { value: 4, label: "Next 4 weeks" },
  { value: 8, label: "Next 8 weeks" },
  { value: 12, label: "Next 12 weeks" },
  { value: 26, label: "Next ~6 months (26 weeks)" },
  { value: 52, label: "Next year (52 weeks)" }
];

export default function QuickAdd({ weekStartDate, timezone, selected, onChange }: Props) {
  const [days, setDays] = useState<Set<number>>(new Set());
  const [startCell, setStartCell] = useState(18); // 9:00 AM
  const [endCell, setEndCell] = useState(34);     // 5:00 PM
  const [repeatWeeks, setRepeatWeeks] = useState(1);
  const [expanded, setExpanded] = useState(false);

  const grid = useMemo(() => buildWeekGrid(weekStartDate, timezone), [weekStartDate, timezone]);

  const startOptions = useMemo(() => {
    const opts: { value: number; label: string }[] = [];
    for (let c = 0; c < 48; c++) opts.push({ value: c, label: cellLabel(c) });
    return opts;
  }, []);

  const endOptions = useMemo(() => {
    const opts: { value: number; label: string }[] = [];
    for (let c = 1; c <= 48; c++) opts.push({ value: c, label: cellLabel(c) });
    return opts;
  }, []);

  const toggleDay = (idx: number) => {
    const next = new Set(days);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setDays(next);
  };

  const apply = (op: "add" | "remove") => {
    if (days.size === 0 || endCell <= startCell) return;
    const next = new Set(selected);
    // Apply the same day-range + time-range across `repeatWeeks` consecutive weeks
    // starting with the displayed week. Each iteration rebuilds the grid for that week
    // so the slot indices are correctly anchored to absolute UTC time.
    for (let w = 0; w < repeatWeeks; w++) {
      const thisWeekStart = DateTime.fromISO(weekStartDate)
        .plus({ weeks: w })
        .toFormat("yyyy-LL-dd");
      const weekGrid = w === 0 ? grid : buildWeekGrid(thisWeekStart, timezone);
      for (const dayIdx of days) {
        const day = weekGrid[dayIdx];
        if (!day) continue;
        for (let c = startCell; c < endCell; c++) {
          const cell = day.cells[c];
          if (!cell) continue;
          for (const s of cell.slots) {
            if (op === "add") next.add(s);
            else next.delete(s);
          }
        }
      }
    }
    onChange(next);
  };

  const canApply = days.size > 0 && endCell > startCell;

  return (
    <div className="rounded-lg border border-ink-700 bg-ink-900/40">
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs uppercase tracking-wider text-ink-300 hover:text-ink-100"
      >
        <span>Quick add — pick days + a time range</span>
        <span className="text-ink-500">{expanded ? "Hide" : "Show"}</span>
      </button>

      {expanded && (
        <div className="space-y-3 border-t border-ink-700 px-3 pb-3 pt-3">
          {/* Day chips */}
          <div>
            <div className="mb-1.5 text-[11px] uppercase tracking-wider text-ink-400">Days</div>
            <div className="flex flex-wrap gap-1.5">
              {grid.map(day => {
                const active = days.has(day.dayIndex);
                return (
                  <button
                    key={day.dayIndex}
                    type="button"
                    onClick={() => toggleDay(day.dayIndex)}
                    className={`rounded-md border px-2.5 py-1 text-xs transition ${
                      active
                        ? "border-accent bg-accent/20 text-ink-100"
                        : "border-ink-700 bg-ink-800/60 text-ink-300 hover:border-ink-500"
                    }`}
                  >
                    <span className="font-medium">{day.date.toFormat("EEE")}</span>
                    <span className="ml-1.5 text-[10px] text-ink-400">
                      {day.date.toFormat("LLL d")}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time range */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="mb-1.5 text-[11px] uppercase tracking-wider text-ink-400">From</div>
              <select
                value={startCell}
                onChange={e => {
                  const v = Number(e.target.value);
                  setStartCell(v);
                  if (endCell <= v) setEndCell(Math.min(48, v + 2));
                }}
                className="w-full rounded-md border border-ink-700 bg-ink-900 px-2 py-1.5 text-sm text-ink-100"
              >
                {startOptions.map(o => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="mb-1.5 text-[11px] uppercase tracking-wider text-ink-400">To</div>
              <select
                value={endCell}
                onChange={e => setEndCell(Number(e.target.value))}
                className="w-full rounded-md border border-ink-700 bg-ink-900 px-2 py-1.5 text-sm text-ink-100"
              >
                {endOptions
                  .filter(o => o.value > startCell)
                  .map(o => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Repeat */}
          <div>
            <div className="mb-1.5 text-[11px] uppercase tracking-wider text-ink-400">
              Repeat
            </div>
            <select
              value={repeatWeeks}
              onChange={e => setRepeatWeeks(Number(e.target.value))}
              className="w-full rounded-md border border-ink-700 bg-ink-900 px-2 py-1.5 text-sm text-ink-100"
              title="Apply the same days + time range to multiple consecutive weeks"
            >
              {REPEAT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="text-[11px] text-ink-500">
              {canApply
                ? `${days.size} day${days.size === 1 ? "" : "s"} · ${
                    (endCell - startCell) * 30
                  } min · ${repeatWeeks} week${repeatWeeks === 1 ? "" : "s"}`
                : "Pick at least one day"}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => apply("remove")}
                disabled={!canApply}
                className="rounded-md border border-ink-700 px-3 py-1.5 text-xs text-ink-300 transition hover:text-ink-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Remove
              </button>
              <button
                type="button"
                onClick={() => apply("add")}
                disabled={!canApply}
                className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-ink-950 transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-40"
              >
                Add to selection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
