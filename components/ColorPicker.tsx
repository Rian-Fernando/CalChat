"use client";

import { PARTICIPANT_COLORS } from "@/lib/colors";

interface Props {
  value: string;
  /** Colors taken by OTHER participants — these are disabled. */
  takenByOthers: string[];
  onChange: (color: string) => void;
  compact?: boolean;
}

export default function ColorPicker({ value, takenByOthers, onChange, compact = false }: Props) {
  const taken = new Set(takenByOthers);
  const size = compact ? "h-6 w-6" : "h-7 w-7";

  return (
    <div className="flex flex-wrap gap-2">
      {PARTICIPANT_COLORS.map(color => {
        const isTaken = taken.has(color);
        const isSelected = value === color;
        return (
          <button
            key={color}
            type="button"
            onClick={() => !isTaken && onChange(color)}
            disabled={isTaken}
            title={isTaken ? "Taken by another participant" : `Pick ${color}`}
            style={{ background: isTaken ? undefined : color }}
            className={`${size} rounded-full transition-all ${
              isSelected
                ? "ring-2 ring-offset-2 ring-offset-ink-900 ring-ink-100"
                : "ring-1 ring-ink-700 hover:ring-ink-500"
            } ${
              isTaken
                ? "cursor-not-allowed bg-ink-800 opacity-40 line-through"
                : "cursor-pointer"
            }`}
            aria-label={isTaken ? `Color ${color} taken` : `Select color ${color}`}
            aria-pressed={isSelected}
          />
        );
      })}
    </div>
  );
}
