"use client";

import { useEffect, useState } from "react";
import { DateTime } from "luxon";
import type { Participant } from "@/lib/types";

interface Props {
  participants: Participant[];
  currentId: string | null;
  /** Save the current user's own note. Resolves with the updated note value. */
  onSaveMyNote: (note: string) => Promise<void>;
}

const MAX_NOTE = 500;

export default function NotesBoard({ participants, currentId, onSaveMyNote }: Props) {
  const me = participants.find(p => p.id === currentId);
  const others = participants.filter(p => p.id !== currentId);

  const [draft, setDraft] = useState(me?.note ?? "");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  // Re-sync the textarea if the server-side value of my note changes (e.g. after a refetch).
  useEffect(() => {
    setDraft(me?.note ?? "");
  }, [me?.note]);

  const dirty = (me?.note ?? "") !== draft;

  const save = async () => {
    setSaving(true);
    try {
      await onSaveMyNote(draft.trim().slice(0, MAX_NOTE));
      setSavedAt(Date.now());
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-3">
      <div>
        <h3 className="mb-2 text-xs uppercase tracking-wider text-ink-300">Notes</h3>
        <p className="text-[11px] text-ink-500">
          Add something for the group — context, what kind of call, links, agenda. Everyone sees
          each other&apos;s notes; only you can edit yours.
        </p>
      </div>

      {/* My note (editable) */}
      {currentId ? (
        <div
          className="rounded-lg border-2 bg-ink-900/40 p-3"
          style={{ borderColor: me?.color ?? "#3a4151" }}
        >
          <div className="mb-2 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ background: me?.color ?? "#5a6478" }}
              />
              <span className="text-ink-200">
                {me?.name ?? "You"} <span className="text-ink-500">(you)</span>
              </span>
            </div>
            <span className="text-ink-500">
              {draft.length}/{MAX_NOTE}
            </span>
          </div>
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value.slice(0, MAX_NOTE))}
            placeholder="e.g. quick catch-up, ~30 min should do it. let's use Zoom"
            rows={3}
            className="w-full resize-y rounded-md border border-control bg-ink-900/60 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 outline-none focus:border-ink-500"
          />
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-[11px] text-ink-500">
              {savedAt && !dirty && !saving && (
                <>Saved {DateTime.fromMillis(savedAt).toRelative()}</>
              )}
              {dirty && !saving && <>Unsaved changes</>}
            </span>
            <button
              type="button"
              onClick={save}
              disabled={!dirty || saving}
              className="rounded-md bg-accent px-3 py-1 text-xs font-medium text-ink-950 transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving ? "Saving…" : "Save note"}
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-ink-700 p-3 text-xs text-ink-400">
          Pick your name + timezone first to add your own note.
        </div>
      )}

      {/* Other people's notes (read-only) */}
      {others.filter(p => (p.note ?? "").trim().length > 0).map(p => (
        <div
          key={p.id}
          className="rounded-lg border bg-ink-900/30 p-3"
          style={{ borderColor: p.color + "55" }}
        >
          <div className="mb-1.5 flex items-center gap-2 text-xs">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ background: p.color }}
            />
            <span className="text-ink-200">{p.name}</span>
            <span className="text-ink-500">
              · {DateTime.fromMillis(p.updatedAt).toRelative()}
            </span>
          </div>
          <p className="whitespace-pre-wrap text-sm text-ink-100">{p.note}</p>
        </div>
      ))}
    </section>
  );
}
