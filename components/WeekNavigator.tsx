"use client";

import { useRef, useState } from "react";
import { DateTime } from "luxon";
import { currentWeekMondayISO } from "@/lib/timezone";
import DatePicker from "./DatePicker";

interface Props {
  /** Monday of the currently displayed week, as YYYY-MM-DD. */
  value: string;
  onChange: (newMondayISO: string) => void;
  /** Used to know what "this week" means in the user's TZ for the Today button. */
  timezone: string;
}

function mondayOf(isoDate: string): string {
  const dt = DateTime.fromISO(isoDate);
  if (!dt.isValid) return isoDate;
  // Luxon weekday: 1 (Mon) .. 7 (Sun). Snap any picked date back to its Monday.
  return dt.minus({ days: dt.weekday - 1 }).toFormat("yyyy-LL-dd");
}

export default function WeekNavigator({ value, onChange, timezone }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const monday = DateTime.fromISO(value);
  const sunday = monday.plus({ days: 6 });

  const sameMonth = monday.month === sunday.month;
  const sameYear = monday.year === sunday.year;

  const label = sameMonth
    ? `${monday.toFormat("LLL d")} – ${sunday.toFormat("d, yyyy")}`
    : sameYear
    ? `${monday.toFormat("LLL d")} – ${sunday.toFormat("LLL d, yyyy")}`
    : `${monday.toFormat("LLL d, yyyy")} – ${sunday.toFormat("LLL d, yyyy")}`;

  const shift = (days: number) => onChange(monday.plus({ days }).toFormat("yyyy-LL-dd"));
  const isThisWeek = value === currentWeekMondayISO(timezone);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => shift(-28)}
          className="rounded-md border border-control px-2 py-1.5 text-[11px] text-ink-300 transition hover:bg-ink-800 hover:text-ink-100"
          title="Jump back ~1 month"
          aria-label="Previous month"
        >
          ⟪
        </button>
        <button
          type="button"
          onClick={() => shift(-7)}
          className="rounded-md border border-control px-2 py-1.5 text-xs text-ink-200 transition hover:bg-ink-800 hover:text-ink-100"
          title="Previous week"
          aria-label="Previous week"
        >
          ‹ Prev
        </button>

        {/* Date label opens the custom dark-theme picker (portaled to body so it
            escapes the navigator card's stacking context) */}
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setPickerOpen(o => !o)}
          className="ml-1 rounded-md border border-control bg-ink-900/60 px-3 py-1.5 text-sm font-medium text-ink-100 transition hover:border-ink-500"
          title="Pick any week — full month + year navigation inside"
          aria-haspopup="dialog"
          aria-expanded={pickerOpen}
        >
          {label}
        </button>
        <DatePicker
          open={pickerOpen}
          value={value}
          onChange={iso => onChange(mondayOf(iso))}
          onClose={() => setPickerOpen(false)}
          anchorRef={triggerRef}
        />

        <button
          type="button"
          onClick={() => shift(7)}
          className="rounded-md border border-control px-2 py-1.5 text-xs text-ink-200 transition hover:bg-ink-800 hover:text-ink-100"
          title="Next week"
          aria-label="Next week"
        >
          Next ›
        </button>
        <button
          type="button"
          onClick={() => shift(28)}
          className="rounded-md border border-control px-2 py-1.5 text-[11px] text-ink-300 transition hover:bg-ink-800 hover:text-ink-100"
          title="Jump forward ~1 month"
          aria-label="Next month"
        >
          ⟫
        </button>
      </div>

      {!isThisWeek && (
        <button
          type="button"
          onClick={() => onChange(currentWeekMondayISO(timezone))}
          className="rounded-md bg-accent/20 px-3 py-1.5 text-xs font-medium text-accent transition hover:bg-accent/30"
          title="Jump back to this week"
        >
          Today
        </button>
      )}
    </div>
  );
}
