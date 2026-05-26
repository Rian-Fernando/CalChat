"use client";

import { useState } from "react";
import TimezonePicker from "./TimezonePicker";
import type { Participant } from "@/lib/types";

interface Props {
  initialName?: string;
  initialZone: string;
  existingParticipants: Participant[];
  onSubmit: (name: string, zone: string) => void;
  onClaim: (participantId: string) => void;
}

export default function OnboardingDialog({
  initialName = "",
  initialZone,
  existingParticipants,
  onSubmit,
  onClaim
}: Props) {
  const [name, setName] = useState(initialName);
  const [zone, setZone] = useState(initialZone);

  const canSubmit = name.trim().length > 0 && zone.length > 0;

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="card animate-fade-in w-full max-w-md rounded-2xl p-6 shadow-2xl shadow-black/50">
        <h2 className="mb-1 text-xl font-medium text-ink-100">Welcome</h2>
        <p className="mb-6 text-sm text-ink-400">
          Tell us your name and timezone. You&apos;ll mark when you&apos;re free in your own local time.
        </p>

        {existingParticipants.length > 0 && (
          <div className="mb-6 rounded-lg border border-ink-700 bg-ink-900/40 p-3">
            <div className="mb-2 text-xs uppercase tracking-wider text-ink-300">
              Already added before, on another device?
            </div>
            <div className="flex flex-wrap gap-2">
              {existingParticipants.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onClaim(p.id)}
                  className="flex items-center gap-1.5 rounded-full border border-ink-600 bg-ink-800 px-3 py-1.5 text-xs text-ink-100 transition hover:border-accent hover:bg-ink-700"
                  title={`Continue editing ${p.name}'s entry on this device`}
                >
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ background: p.color }}
                  />
                  Continue as {p.name}
                </button>
              ))}
            </div>
            <div className="mt-2 text-[11px] text-ink-500">
              Or fill out a fresh entry below.
            </div>
          </div>
        )}

        <label className="mb-2 block text-xs uppercase tracking-wider text-ink-300">
          Your name
        </label>
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && canSubmit) onSubmit(name.trim(), zone);
          }}
          placeholder="e.g. Rian"
          className="mb-5 w-full rounded-lg border border-ink-600 bg-ink-900/70 px-4 py-3 text-ink-100 placeholder:text-ink-500 transition focus:border-accent"
          maxLength={40}
        />

        <label className="mb-2 block text-xs uppercase tracking-wider text-ink-300">
          Your timezone
        </label>
        <TimezonePicker value={zone} onChange={setZone} />

        <button
          onClick={() => onSubmit(name.trim(), zone)}
          disabled={!canSubmit}
          className="mt-6 w-full rounded-lg bg-accent px-4 py-3 font-medium text-ink-950 transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
