"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { buildWeekGrid, CELLS_PER_DAY, SLOTS_PER_CELL } from "@/lib/timezone";
import type { Participant } from "@/lib/types";

type Mode = "edit" | "view";

interface Props {
  weekStartDate: string;
  timezone: string;
  mode: Mode;

  // edit mode
  selected?: Set<number>;
  onChange?: (next: Set<number>) => void;

  // view mode
  participants?: Participant[];

  // both
  onHoverStartSlot?: (startSlot: number | null) => void;
}

function hourLabel(h: number) {
  if (h === 0) return "12 AM";
  if (h === 12) return "12 PM";
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
}

export default function AvailabilityGrid({
  weekStartDate,
  timezone,
  mode,
  selected,
  onChange,
  participants = [],
  onHoverStartSlot
}: Props) {
  const grid = useMemo(() => buildWeekGrid(weekStartDate, timezone), [weekStartDate, timezone]);

  // Edit-mode drag state
  const draggingRef = useRef<null | "add" | "remove">(null);
  const localSelectedRef = useRef<Set<number>>(selected ?? new Set());
  const [, forceRender] = useState(0);

  useEffect(() => {
    localSelectedRef.current = new Set(selected);
    forceRender(n => n + 1);
  }, [selected]);

  // Per-slot availability count for view mode
  const slotCounts = useMemo(() => {
    const counts = new Map<number, number>();
    for (const p of participants) {
      for (const s of p.availability) counts.set(s, (counts.get(s) ?? 0) + 1);
    }
    return counts;
  }, [participants]);

  const totalParticipants = participants.length;

  const commit = () => {
    if (onChange) onChange(new Set(localSelectedRef.current));
  };

  const cellIsSelected = (slots: readonly number[]) =>
    slots.every(s => localSelectedRef.current.has(s));

  const applyToCell = (slots: readonly number[], op: "add" | "remove") => {
    if (op === "add") for (const s of slots) localSelectedRef.current.add(s);
    else for (const s of slots) localSelectedRef.current.delete(s);
    forceRender(n => n + 1);
  };

  const startDrag = (slots: readonly number[]) => {
    if (mode !== "edit") return;
    draggingRef.current = cellIsSelected(slots) ? "remove" : "add";
    applyToCell(slots, draggingRef.current);
  };

  const continueDrag = (slots: readonly number[]) => {
    if (mode !== "edit" || !draggingRef.current) return;
    applyToCell(slots, draggingRef.current);
  };

  const endDrag = () => {
    if (draggingRef.current) {
      draggingRef.current = null;
      commit();
    }
  };

  useEffect(() => {
    if (mode !== "edit") return;
    const onUp = () => endDrag();
    window.addEventListener("pointerup", onUp);
    return () => window.removeEventListener("pointerup", onUp);
  }, [mode]);

  const onTouchMove: React.TouchEventHandler = e => {
    if (mode !== "edit" || !draggingRef.current) return;
    const touch = e.touches[0];
    if (!touch) return;
    const el = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null;
    const raw = el?.dataset?.slots;
    if (raw) {
      const slots = raw.split(",").map(Number);
      continueDrag(slots);
    }
  };

  const renderCellClasses = (slots: readonly number[]) => {
    if (mode === "edit") {
      return cellIsSelected(slots)
        ? "bg-accent/80 hover:bg-accent"
        : "bg-ink-800/60 hover:bg-ink-700/80";
    }
    if (totalParticipants === 0) return "bg-ink-800/40";
    const density =
      slots.reduce((sum, s) => sum + (slotCounts.get(s) ?? 0), 0) /
      (slots.length * totalParticipants);
    if (density === 0) return "bg-ink-800/40";
    if (density >= 0.95) return "bg-accent ring-1 ring-accent-strong";
    if (density >= 0.66) return "bg-accent/60";
    if (density >= 0.33) return "bg-accent/35";
    return "bg-accent/20";
  };

  const cellIsFullOverlap = (slots: readonly number[]) =>
    totalParticipants > 0 &&
    slots.every(s => (slotCounts.get(s) ?? 0) === totalParticipants);

  return (
    <div
      className="no-select"
      onTouchMove={onTouchMove}
      onMouseLeave={() => onHoverStartSlot?.(null)}
    >
      {/* Header */}
      <div
        className="mb-1 grid"
        style={{ gridTemplateColumns: "56px repeat(7, minmax(0, 1fr))" }}
      >
        <div />
        {grid.map(day => (
          <div key={day.dayIndex} className="px-1 text-center">
            <div className="text-xs font-medium uppercase tracking-wider text-ink-300">
              {day.date.toFormat("EEE")}
            </div>
            <div className="text-[11px] text-ink-400">{day.date.toFormat("LLL d")}</div>
          </div>
        ))}
      </div>

      {/* Body: 48 half-hour rows */}
      <div>
        {Array.from({ length: CELLS_PER_DAY }).map((_, cellIndex) => {
          const isHourStart = cellIndex % 2 === 0;
          const hour = Math.floor(cellIndex / 2);
          return (
            <div
              key={cellIndex}
              className="grid items-stretch"
              style={{
                gridTemplateColumns: "56px repeat(7, minmax(0, 1fr))",
                marginTop: isHourStart && cellIndex !== 0 ? 2 : 0
              }}
            >
              <div className="flex h-[18px] items-center pr-2 text-right text-[10px] tabular-nums text-ink-400">
                {isHourStart ? hourLabel(hour) : <span className="text-ink-600">·</span>}
              </div>
              {grid.map(day => {
                const cell = day.cells[cellIndex];
                const slots = cell.slots;
                const isFull = mode === "view" && cellIsFullOverlap(slots);
                return (
                  <button
                    key={`${day.dayIndex}-${cellIndex}`}
                    data-slots={slots.join(",")}
                    onPointerDown={e => {
                      if (mode !== "edit") return;
                      e.preventDefault();
                      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
                      startDrag(slots);
                    }}
                    onPointerEnter={() => {
                      onHoverStartSlot?.(cell.startSlot);
                      if (mode === "edit" && draggingRef.current) continueDrag(slots);
                    }}
                    onPointerLeave={() => onHoverStartSlot?.(null)}
                    style={{
                      // visually separate hour starts with a thin top border
                      borderTop: isHourStart ? "1px solid rgba(58, 65, 81, 0.45)" : "none",
                      // very subtle inner gap between half-hours within the same hour
                      borderBottom: !isHourStart ? "none" : undefined
                    }}
                    className={`h-[18px] transition-colors ${renderCellClasses(slots)} ${
                      isFull ? "shadow-[0_0_0_1px_rgba(154,230,180,0.9)]" : ""
                    } ${mode === "edit" ? "cursor-pointer" : "cursor-default"} ${
                      isHourStart ? "rounded-t-sm" : "rounded-b-sm"
                    }`}
                    type="button"
                    aria-label={`${day.date.toFormat("EEE LLL d")} ${hourLabel(hour)}${
                      isHourStart ? "" : ":30"
                    }`}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
