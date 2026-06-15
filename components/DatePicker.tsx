"use client";

import { useEffect, useRef, useState } from "react";
import { DateTime } from "luxon";

interface Props {
  open: boolean;
  /** Currently-selected date (YYYY-MM-DD). Used to highlight the selected cell + opening month. */
  value: string;
  onChange: (iso: string) => void;
  onClose: () => void;
}

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

export default function DatePicker({ open, value, onChange, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [viewMonth, setViewMonth] = useState(() =>
    DateTime.fromISO(value).isValid
      ? DateTime.fromISO(value).startOf("month")
      : DateTime.now().startOf("month")
  );

  // Re-anchor view to the selection each time it opens
  useEffect(() => {
    if (open && DateTime.fromISO(value).isValid) {
      setViewMonth(DateTime.fromISO(value).startOf("month"));
    }
  }, [open, value]);

  // Outside click closes
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open, onClose]);

  // ESC closes
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const firstOfMonth = viewMonth.startOf("month");
  const gridStart = firstOfMonth.minus({ days: firstOfMonth.weekday - 1 });
  const todayIso = DateTime.now().toFormat("yyyy-LL-dd");
  const selectedIso = DateTime.fromISO(value).toFormat("yyyy-LL-dd");
  const selDt = DateTime.fromISO(value);
  const selWeekStart = selDt.isValid
    ? selDt.minus({ days: selDt.weekday - 1 }).toFormat("yyyy-LL-dd")
    : "";

  return (
    <div
      ref={ref}
      className="card animate-fade-in absolute right-0 z-40 mt-2 w-[320px] rounded-xl p-3"
      style={{ background: "rgba(12, 14, 19, 0.95)" }}
      role="dialog"
      aria-modal="false"
      aria-label="Pick a date"
    >
      {/* Header: year / month nav + close */}
      <div className="mb-2 flex items-center justify-between gap-1">
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => setViewMonth(m => m.minus({ years: 1 }))}
            className="rounded-md px-1.5 py-1 text-xs text-ink-300 hover:bg-ink-800 hover:text-ink-100"
            title="Previous year"
            aria-label="Previous year"
          >
            ⟪
          </button>
          <button
            type="button"
            onClick={() => setViewMonth(m => m.minus({ months: 1 }))}
            className="rounded-md px-1.5 py-1 text-xs text-ink-300 hover:bg-ink-800 hover:text-ink-100"
            title="Previous month"
            aria-label="Previous month"
          >
            ‹
          </button>
        </div>
        <div className="text-sm font-medium tabular-nums text-ink-100">
          {viewMonth.toFormat("MMMM yyyy")}
        </div>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => setViewMonth(m => m.plus({ months: 1 }))}
            className="rounded-md px-1.5 py-1 text-xs text-ink-300 hover:bg-ink-800 hover:text-ink-100"
            title="Next month"
            aria-label="Next month"
          >
            ›
          </button>
          <button
            type="button"
            onClick={() => setViewMonth(m => m.plus({ years: 1 }))}
            className="rounded-md px-1.5 py-1 text-xs text-ink-300 hover:bg-ink-800 hover:text-ink-100"
            title="Next year"
            aria-label="Next year"
          >
            ⟫
          </button>
          <button
            type="button"
            onClick={onClose}
            className="ml-1 rounded-md px-1.5 py-1 text-base leading-none text-ink-400 hover:bg-ink-800 hover:text-ink-100"
            title="Close (Esc)"
            aria-label="Close date picker"
          >
            ×
          </button>
        </div>
      </div>

      {/* Weekday header row */}
      <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-wider text-ink-500">
        {WEEKDAYS.map(d => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* 6-week day grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 42 }).map((_, i) => {
          const day = gridStart.plus({ days: i });
          const inMonth = day.month === viewMonth.month;
          const iso = day.toFormat("yyyy-LL-dd");
          const isToday = iso === todayIso;
          const dayWeekStart = day.minus({ days: day.weekday - 1 }).toFormat("yyyy-LL-dd");
          const isSelectedWeek = dayWeekStart === selWeekStart;
          const isSelectedDay = iso === selectedIso;

          let cls: string;
          if (isSelectedDay) {
            cls = "bg-accent text-ink-950 font-semibold";
          } else if (isSelectedWeek) {
            cls = "bg-accent/20 text-ink-100";
          } else if (inMonth) {
            cls = "text-ink-100 hover:bg-ink-800";
          } else {
            cls = "text-ink-500 hover:bg-ink-800";
          }

          return (
            <button
              key={i}
              type="button"
              onClick={() => {
                onChange(iso);
                onClose();
              }}
              className={`h-9 rounded-md text-xs tabular-nums transition ${cls} ${
                isToday && !isSelectedDay ? "ring-1 ring-accent/50" : ""
              }`}
              title={day.toFormat("EEE LLL d, yyyy")}
            >
              {day.day}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between border-t border-ink-700 pt-2 text-[11px]">
        <button
          type="button"
          onClick={() => {
            onChange(DateTime.now().toFormat("yyyy-LL-dd"));
            onClose();
          }}
          className="rounded-md px-2 py-1 text-ink-300 hover:bg-ink-800 hover:text-ink-100"
        >
          Jump to today
        </button>
        <span className="text-ink-500">Snaps to that week's Monday</span>
      </div>
    </div>
  );
}
