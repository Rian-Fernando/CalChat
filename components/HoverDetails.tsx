"use client";

import { useMemo } from "react";
import { localFromSlot, SLOTS_PER_CELL } from "@/lib/timezone";
import type { Participant } from "@/lib/types";

interface Props {
  /** Start slot (15-min) of the hovered cell. A cell is SLOTS_PER_CELL slots wide. */
  startSlot: number | null;
  participants: Participant[];
  viewerTimezone: string;
}

export default function HoverDetails({ startSlot, participants, viewerTimezone }: Props) {
  const info = useMemo(() => {
    if (startSlot == null) return null;
    const cellSlots: number[] = [];
    for (let i = 0; i < SLOTS_PER_CELL; i++) cellSlots.push(startSlot + i);
    const free: Participant[] = [];
    const partial: { p: Participant; slots: number }[] = [];
    const busy: Participant[] = [];
    for (const p of participants) {
      const has = cellSlots.filter(s => p.availability.includes(s)).length;
      if (has === SLOTS_PER_CELL) free.push(p);
      else if (has === 0) busy.push(p);
      else partial.push({ p, slots: has });
    }
    return { free, partial, busy };
  }, [startSlot, participants]);

  if (startSlot == null || !info) {
    return (
      <div className="rounded-lg border border-ink-700 bg-ink-900/40 p-4 text-sm text-ink-400">
        Hover any cell to see who&apos;s free during that 30-min window in each timezone.
      </div>
    );
  }

  const moment = localFromSlot(startSlot, viewerTimezone);
  const endMoment = localFromSlot(startSlot + SLOTS_PER_CELL, viewerTimezone);

  return (
    <div className="rounded-lg border border-ink-700 bg-ink-900/70 p-4">
      <div className="mb-3">
        <div className="text-xs uppercase tracking-wider text-ink-400">In your view</div>
        <div className="text-base text-ink-100">
          {moment.toFormat("EEE LLL d")} ·{" "}
          <span className="tabular-nums">{moment.toFormat("h:mm a")}</span>–
          <span className="tabular-nums">{endMoment.toFormat("h:mm a")}</span>{" "}
          <span className="text-ink-400">({viewerTimezone})</span>
        </div>
      </div>

      <div className="space-y-2">
        {[
          ...info.free.map(p => ({ p, status: "free" as const, mins: SLOTS_PER_CELL * 15 })),
          ...info.partial.map(({ p, slots }) => ({ p, status: "partial" as const, mins: slots * 15 })),
          ...info.busy.map(p => ({ p, status: "busy" as const, mins: 0 }))
        ].map(({ p, status, mins }) => {
          const local = localFromSlot(startSlot, p.timezone);
          const bg =
            status === "free"
              ? "border-accent/40 bg-accent/10 text-ink-100"
              : status === "partial"
              ? "border-amber-400/30 bg-amber-400/5 text-ink-100"
              : "border-ink-700 bg-ink-900/40 text-ink-400";
          return (
            <div
              key={p.id}
              className={`flex items-center justify-between rounded border px-3 py-2 text-sm ${bg}`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="inline-block h-2.5 w-2.5 flex-none rounded-full"
                  style={{ background: p.color }}
                />
                <span className="truncate">{p.name}</span>
              </div>
              <div className="ml-3 text-xs tabular-nums text-ink-300">
                {local.toFormat("EEE h:mm a")}{" "}
                <span className="text-ink-500">
                  ·{" "}
                  {status === "free"
                    ? "free"
                    : status === "partial"
                    ? `free ${mins} min`
                    : "busy"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
