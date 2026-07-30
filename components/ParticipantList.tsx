"use client";

import { DateTime } from "luxon";
import type { Participant } from "@/lib/types";

interface Props {
  participants: Participant[];
  currentId: string | null;
  onClaim?: (participantId: string) => void;
}

export default function ParticipantList({ participants, currentId, onClaim }: Props) {
  if (participants.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-ink-700 px-4 py-6 text-center text-sm text-ink-400">
        No one&apos;s added their availability yet. Share the link above!
      </div>
    );
  }
  return (
    <ul className="space-y-1.5">
      {participants.map(p => {
        const isMe = p.id === currentId;
        const localTime = DateTime.now().setZone(p.timezone).toFormat("h:mm a");
        return (
          <li
            key={p.id}
            className="flex flex-col gap-1.5 rounded-lg border border-ink-700 bg-ink-900/40 px-3 py-2 text-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="inline-block h-2.5 w-2.5 flex-none rounded-full"
                  style={{ background: p.color }}
                />
                <span className="truncate text-ink-100">
                  {p.name}
                  {isMe && <span className="ml-1 text-xs text-ink-400">(you)</span>}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-ink-400">
                <span className="truncate">{p.timezone}</span>
                <span className="tabular-nums text-ink-500">{localTime}</span>
              </div>
            </div>
            {!isMe && onClaim && (
              <button
                type="button"
                onClick={() => {
                  if (
                    confirm(
                      `Take over ${p.name}'s entry on this device? You'll be able to edit their availability from here.`
                    )
                  ) {
                    onClaim(p.id);
                  }
                }}
                className="self-start rounded border border-control px-2 py-0.5 text-[10px] uppercase tracking-wider text-ink-300 transition hover:border-accent hover:text-accent"
              >
                this is me
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
