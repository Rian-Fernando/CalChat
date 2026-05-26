"use client";

import { useEffect, useRef, useState } from "react";
import type { Participant } from "@/lib/types";

interface Props {
  participants: Participant[];
  selectedIds: Set<string>;
  onChange: (next: Set<string>) => void;
  /** ID of the current viewer — they get a "(you)" tag in the list. */
  currentId?: string | null;
}

export default function ParticipantFilter({
  participants,
  selectedIds,
  onChange,
  currentId
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open]);

  const all = participants.length > 0 && selectedIds.size === participants.length;
  const none = selectedIds.size === 0;

  const label =
    none
      ? "No one selected"
      : all
      ? `Everyone (${participants.length})`
      : participants
          .filter(p => selectedIds.has(p.id))
          .map(p => p.name)
          .join(" + ");

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  };

  const selectAll = () => onChange(new Set(participants.map(p => p.id)));
  const clearAll = () => onChange(new Set());

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-md border border-ink-700 bg-ink-900 px-3 py-1.5 text-left text-xs text-ink-200 transition hover:border-ink-500"
      >
        <span className="truncate">
          <span className="text-ink-400">Find common times with:</span>{" "}
          <span className="text-ink-100">{label}</span>
        </span>
        <span className="text-ink-400">▾</span>
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-72 rounded-lg border border-ink-700 bg-ink-900 shadow-2xl shadow-black/50">
          <div className="flex items-center justify-between gap-2 border-b border-ink-700 px-3 py-2">
            <button
              type="button"
              onClick={selectAll}
              disabled={all}
              className="rounded px-2 py-0.5 text-[11px] uppercase tracking-wider text-ink-300 transition hover:bg-ink-800 hover:text-ink-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Select all
            </button>
            <button
              type="button"
              onClick={clearAll}
              disabled={none}
              className="rounded px-2 py-0.5 text-[11px] uppercase tracking-wider text-ink-300 transition hover:bg-ink-800 hover:text-ink-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Clear
            </button>
          </div>
          <ul className="no-scrollbar max-h-72 overflow-y-auto py-1">
            {participants.length === 0 ? (
              <li className="px-3 py-2 text-xs text-ink-400">No participants yet.</li>
            ) : (
              participants.map(p => {
                const checked = selectedIds.has(p.id);
                return (
                  <li key={p.id}>
                    <label className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm transition hover:bg-ink-800">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleOne(p.id)}
                        className="h-3.5 w-3.5 accent-accent"
                      />
                      <span
                        className="inline-block h-2.5 w-2.5 flex-none rounded-full"
                        style={{ background: p.color }}
                      />
                      <span className="text-ink-100">
                        {p.name}
                        {p.id === currentId && (
                          <span className="ml-1 text-[11px] text-ink-400">(you)</span>
                        )}
                      </span>
                      <span className="ml-auto text-[10px] text-ink-500">{p.timezone}</span>
                    </label>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
