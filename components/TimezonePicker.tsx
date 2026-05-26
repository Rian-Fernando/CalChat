"use client";

import { useMemo, useState } from "react";
import { DateTime } from "luxon";
import { TIMEZONE_OPTIONS, isValidZone } from "@/lib/timezone";

interface Props {
  value: string;
  onChange: (zone: string) => void;
  compact?: boolean;
}

export default function TimezonePicker({ value, onChange, compact = false }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return TIMEZONE_OPTIONS;
    return TIMEZONE_OPTIONS.filter(
      o => o.label.toLowerCase().includes(q) || o.zone.toLowerCase().includes(q)
    );
  }, [query]);

  const currentLabel =
    TIMEZONE_OPTIONS.find(o => o.zone === value)?.label ?? value;

  const currentTime = isValidZone(value)
    ? DateTime.now().setZone(value).toFormat("EEE, h:mm a")
    : "—";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`flex w-full items-center justify-between gap-2 rounded-lg border border-ink-600 bg-ink-900/70 text-left transition hover:border-ink-500 ${
          compact ? "px-3 py-2 text-sm" : "px-4 py-3"
        }`}
      >
        <div className="min-w-0">
          <div className="truncate text-ink-100">{currentLabel}</div>
          {!compact && (
            <div className="text-xs text-ink-400">
              Currently <span className="text-ink-200">{currentTime}</span>
            </div>
          )}
        </div>
        <span className="text-ink-400">▾</span>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute z-40 mt-2 w-full overflow-hidden rounded-lg border border-ink-600 bg-ink-900 shadow-2xl shadow-black/50">
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search city or zone..."
              className="w-full border-b border-ink-700 bg-ink-900 px-4 py-3 text-sm text-ink-100 placeholder:text-ink-500 outline-none"
            />
            <ul className="no-scrollbar max-h-72 overflow-y-auto">
              {filtered.length === 0 && (
                <li className="px-4 py-3 text-sm text-ink-400">
                  No match. Try a city or IANA name (e.g. <span className="font-mono">Asia/Kolkata</span>).
                </li>
              )}
              {filtered.map(opt => (
                <li key={`${opt.label}|${opt.zone}`}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(opt.zone);
                      setOpen(false);
                      setQuery("");
                    }}
                    className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition hover:bg-ink-800 ${
                      opt.zone === value ? "text-accent" : "text-ink-100"
                    }`}
                  >
                    <span>{opt.label}</span>
                    <span className="ml-3 text-xs text-ink-400">
                      {DateTime.now().setZone(opt.zone).toFormat("h:mm a")}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
