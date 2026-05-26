"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { nanoid } from "nanoid";
import { DateTime } from "luxon";
import OnboardingDialog from "@/components/OnboardingDialog";
import AvailabilityGrid from "@/components/AvailabilityGrid";
import TimezonePicker from "@/components/TimezonePicker";
import ShareBar from "@/components/ShareBar";
import ParticipantList from "@/components/ParticipantList";
import BestTimes from "@/components/BestTimes";
import HoverDetails from "@/components/HoverDetails";
import QuickAdd from "@/components/QuickAdd";
import NotesBoard from "@/components/NotesBoard";
import CommonTimesCalendar from "@/components/CommonTimesCalendar";
import { SLOTS_PER_CELL } from "@/lib/timezone";
import { firstAvailableColor, PARTICIPANT_COLORS } from "@/lib/colors";
import type { CalendarEvent } from "@/lib/types";

const ThreeBackground = dynamic(() => import("@/components/ThreeBackground"), { ssr: false });

const LS_PID = (eventId: string) => `calchat:pid:${eventId}`;
const LS_LAST_NAME = "calchat:lastName";
const LS_LAST_ZONE = "calchat:lastZone";

function browserZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Etc/UTC";
  } catch {
    return "Etc/UTC";
  }
}

type Mode = "edit" | "view" | "common";

export default function EventPage() {
  const params = useParams<{ id: string }>();
  const eventId = params.id;

  const [event, setEvent] = useState<CalendarEvent | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const [myName, setMyName] = useState<string>("");
  const [myZone, setMyZone] = useState<string>(browserZone());
  const [myColor, setMyColor] = useState<string>(PARTICIPANT_COLORS[0]);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const [mode, setMode] = useState<Mode>("edit");
  const [viewerZone, setViewerZone] = useState<string>(browserZone());
  const [hoverStartSlot, setHoverStartSlot] = useState<number | null>(null);

  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<number | null>(null);
  const [autoRefreshing, setAutoRefreshing] = useState(false);

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/event/${eventId}`;
  }, [eventId]);

  // Fetch event
  const refetch = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${eventId}`, { cache: "no-store" });
      if (!res.ok) {
        if (res.status === 404) {
          setLoadError("This event doesn't exist or has expired.");
        } else {
          setLoadError(`Failed to load (${res.status}).`);
        }
        return;
      }
      const data: CalendarEvent = await res.json();
      setEvent(data);
      setLastFetchedAt(Date.now());
      return data;
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Network error");
    }
  }, [eventId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Auto-refresh every 5 minutes when in view mode (and tab is visible).
  // We skip edit mode to avoid surprising the user mid-drag.
  useEffect(() => {
    if (mode !== "view") return;
    const tick = async () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      setAutoRefreshing(true);
      try {
        await refetch();
      } finally {
        setAutoRefreshing(false);
      }
    };
    const interval = setInterval(tick, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [mode, refetch]);

  // Resolve current participant + onboarding
  useEffect(() => {
    if (!event) return;
    const stored = typeof window !== "undefined" ? localStorage.getItem(LS_PID(eventId)) : null;
    if (stored && event.participants[stored]) {
      const me = event.participants[stored];
      setParticipantId(stored);
      setMyName(me.name);
      setMyZone(me.timezone);
      setMyColor(me.color);
      setSelected(new Set(me.availability));
      setViewerZone(me.timezone);
      setShowOnboarding(false);
    } else {
      // first visit — pre-fill from last-used and show dialog
      if (typeof window !== "undefined") {
        const lastName = localStorage.getItem(LS_LAST_NAME) ?? "";
        const lastZone = localStorage.getItem(LS_LAST_ZONE) ?? browserZone();
        setMyName(lastName);
        setMyZone(lastZone);
        setViewerZone(lastZone);
      }
      setShowOnboarding(true);
    }
  }, [event, eventId]);

  const onOnboardingSubmit = (name: string, zone: string, color: string) => {
    const pid = nanoid(12);
    setParticipantId(pid);
    setMyName(name);
    setMyZone(zone);
    setMyColor(color);
    setViewerZone(zone);
    if (typeof window !== "undefined") {
      localStorage.setItem(LS_PID(eventId), pid);
      localStorage.setItem(LS_LAST_NAME, name);
      localStorage.setItem(LS_LAST_ZONE, zone);
    }
    setShowOnboarding(false);
  };

  // Claim an existing participant entry (from any device).
  // Switches this browser's identity to the claimed participant — no new entry created.
  const claimParticipant = (claimedId: string) => {
    if (!event) return;
    const target = event.participants[claimedId];
    if (!target) return;
    setParticipantId(claimedId);
    setMyName(target.name);
    setMyZone(target.timezone);
    setMyColor(target.color);
    setViewerZone(target.timezone);
    setSelected(new Set(target.availability));
    if (typeof window !== "undefined") {
      localStorage.setItem(LS_PID(eventId), claimedId);
      localStorage.setItem(LS_LAST_NAME, target.name);
      localStorage.setItem(LS_LAST_ZONE, target.timezone);
    }
    setShowOnboarding(false);
  };

  const saveAvailability = async () => {
    if (!participantId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/events/${eventId}/participants`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          participantId,
          name: myName.trim(),
          timezone: myZone,
          color: myColor,
          availability: Array.from(selected)
        })
      });
      if (!res.ok) {
        if (res.status === 409) {
          // Color collision — server tells us what's taken; pick the next free one
          const data = await res.json().catch(() => null);
          const taken: string[] = (data?.takenByOthers ?? []) as string[];
          const next = firstAvailableColor(taken);
          setMyColor(next);
          alert(
            `That color was just taken by someone else. We picked ${next} for you — hit Save again.`
          );
          return;
        }
        throw new Error(`Save failed (${res.status})`);
      }
      const updated: CalendarEvent = await res.json();
      setEvent(updated);
      setSavedAt(Date.now());
      if (typeof window !== "undefined") {
        localStorage.setItem(LS_LAST_NAME, myName.trim());
        localStorage.setItem(LS_LAST_ZONE, myZone);
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  // (color picker only appears in onboarding; locked after first save)

  // Save just my note (preserves my existing availability/timezone/color server-side).
  const saveMyNote = async (note: string) => {
    if (!participantId) return;
    const res = await fetch(`/api/events/${eventId}/participants`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        participantId,
        name: myName.trim() || "Anon",
        timezone: myZone,
        color: myColor,
        availability: Array.from(selected),
        note
      })
    });
    if (!res.ok) {
      alert("Couldn't save your note");
      return;
    }
    const updated: CalendarEvent = await res.json();
    setEvent(updated);
  };

  if (loadError) {
    return (
      <>
        <ThreeBackground />
        <main className="relative mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
          <h1 className="mb-3 text-2xl text-ink-100">Hmm.</h1>
          <p className="mb-6 text-sm text-ink-400">{loadError}</p>
          <a href="/" className="rounded-lg bg-accent px-4 py-2 text-sm text-ink-950 hover:bg-accent-strong">
            Start a new one
          </a>
        </main>
      </>
    );
  }

  if (!event) {
    return (
      <>
        <ThreeBackground />
        <main className="relative mx-auto flex min-h-screen max-w-md items-center justify-center text-sm text-ink-400">
          Loading...
        </main>
      </>
    );
  }

  const participantsArray = Object.values(event.participants).sort((a, b) => a.updatedAt - b.updatedAt);

  return (
    <>
      <ThreeBackground />
      {showOnboarding && (
        <OnboardingDialog
          initialName={myName}
          initialZone={myZone}
          existingParticipants={Object.values(event.participants).sort(
            (a, b) => a.updatedAt - b.updatedAt
          )}
          onSubmit={onOnboardingSubmit}
          onClaim={claimParticipant}
        />
      )}

      <main className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Header */}
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <a href="/" className="text-xs uppercase tracking-[0.3em] text-ink-400 hover:text-ink-200">
              calchat
            </a>
            <h1 className="mt-1 text-2xl font-medium text-ink-100 sm:text-3xl">{event.title}</h1>
            <p className="text-sm text-ink-400">
              Week of{" "}
              <span className="text-ink-200">
                {DateTime.fromISO(event.weekStartDate).toFormat("LLL d, yyyy")}
              </span>
            </p>
          </div>
          <div className="w-full sm:w-[420px]">
            <ShareBar url={shareUrl} />
          </div>
        </header>

        {/* Greeting — so you always know which entry this browser is editing */}
        {participantId && myName && (
          <div className="mb-3 flex items-center gap-2 text-sm">
            <span className="text-ink-400">Hi,</span>
            <span
              className="inline-flex items-center gap-1.5 rounded-full border border-ink-700 bg-ink-900/60 px-2.5 py-0.5"
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: myColor }}
              />
              <span className="text-ink-100">{myName}</span>
            </span>
            <span className="text-ink-500">— editing your own entry</span>
          </div>
        )}

        {/* Mode toggle */}
        <div className="mb-5 flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-ink-700 bg-ink-900/60 p-1">
            <button
              onClick={() => setMode("edit")}
              className={`rounded-md px-4 py-1.5 text-sm transition ${
                mode === "edit" ? "bg-ink-700 text-ink-100" : "text-ink-400 hover:text-ink-200"
              }`}
            >
              My availability
            </button>
            <button
              onClick={() => setMode("view")}
              className={`rounded-md px-4 py-1.5 text-sm transition ${
                mode === "view" ? "bg-ink-700 text-ink-100" : "text-ink-400 hover:text-ink-200"
              }`}
            >
              Group overlap
              {participantsArray.length > 0 && (
                <span className="ml-1.5 text-xs text-ink-500">({participantsArray.length})</span>
              )}
            </button>
            <button
              onClick={() => setMode("common")}
              className={`rounded-md px-4 py-1.5 text-sm transition ${
                mode === "common" ? "bg-ink-700 text-ink-100" : "text-ink-400 hover:text-ink-200"
              }`}
            >
              Common times
            </button>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {lastFetchedAt && (
              <span className="text-[11px] text-ink-500" title={new Date(lastFetchedAt).toLocaleString()}>
                {autoRefreshing ? "Updating…" : `Updated ${DateTime.fromMillis(lastFetchedAt).toFormat("h:mm a")}`}
                {mode === "view" && (
                  <span className="ml-1.5 text-ink-600">· auto every 5 min</span>
                )}
              </span>
            )}
            <button
              onClick={() => refetch()}
              className="rounded-md border border-ink-700 px-3 py-1.5 text-xs text-ink-300 hover:text-ink-100"
              title="Pull latest from your friends right now"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Left: grid */}
          <section className="card rounded-2xl p-4 sm:p-6">
            {mode === "edit" ? (
              <>
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-ink-400">
                      In your timezone
                    </div>
                    <div className="text-sm text-ink-200">{myZone}</div>
                  </div>
                  <div className="w-full sm:w-64">
                    <TimezonePicker value={myZone} onChange={setMyZone} compact />
                  </div>
                </div>

                <QuickAdd
                  weekStartDate={event.weekStartDate}
                  timezone={myZone}
                  selected={selected}
                  onChange={setSelected}
                />

                <p className="mb-3 mt-4 text-xs text-ink-400">
                  Click and drag to mark when you&apos;re free — each cell is 30 minutes, so you
                  can start at the hour or the half-hour. Drag across an already-selected area to deselect.
                </p>
                <AvailabilityGrid
                  weekStartDate={event.weekStartDate}
                  timezone={myZone}
                  mode="edit"
                  selected={selected}
                  onChange={setSelected}
                />
                <div className="mt-5 flex items-center justify-between gap-3">
                  <div className="text-xs text-ink-400">
                    {selected.size > 0 ? (
                      <>
                        <span className="text-ink-200">{selected.size * 15}</span> min
                        {" "}({(selected.size / 4).toFixed(2)} hours) selected
                      </>
                    ) : (
                      <>No time selected yet — click and drag any 30-min cell.</>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {savedAt && !saving && (
                      <span className="text-xs text-accent animate-pulse-soft">
                        Saved {DateTime.fromMillis(savedAt).toRelative()}
                      </span>
                    )}
                    <button
                      onClick={saveAvailability}
                      disabled={saving || !participantId}
                      className="rounded-lg bg-accent px-5 py-2 text-sm font-medium text-ink-950 transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              </>
            ) : mode === "view" ? (
              <>
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-ink-400">View in</div>
                    <div className="text-sm text-ink-200">{viewerZone}</div>
                  </div>
                  <div className="w-full sm:w-64">
                    <TimezonePicker value={viewerZone} onChange={setViewerZone} compact />
                  </div>
                </div>
                <p className="mb-3 text-xs text-ink-400">
                  Each cell is split into stripes — one per friend, in their color. Full color =
                  they&apos;re free, dim = busy. A green glow border means everyone is free.
                </p>
                <AvailabilityGrid
                  weekStartDate={event.weekStartDate}
                  timezone={viewerZone}
                  mode="view"
                  participants={participantsArray}
                  onHoverStartSlot={setHoverStartSlot}
                />
              </>
            ) : (
              <CommonTimesCalendar
                participants={participantsArray}
                weekStartDate={event.weekStartDate}
                viewerTimezone={viewerZone}
                onViewerTimezoneChange={setViewerZone}
              />
            )}

            {/* Shared notes board — visible in all modes, below the main panel */}
            <div className="mt-8 border-t border-ink-700 pt-6">
              <NotesBoard
                participants={participantsArray}
                currentId={participantId}
                onSaveMyNote={saveMyNote}
              />
            </div>
          </section>

          {/* Right: side panel */}
          <aside className="space-y-5">
            <div>
              <h3 className="mb-2 text-xs uppercase tracking-wider text-ink-300">
                People ({participantsArray.length})
              </h3>
              <ParticipantList
                participants={participantsArray}
                currentId={participantId}
                onClaim={claimParticipant}
              />
            </div>

            {mode === "view" && (
              <>
                <div>
                  <h3 className="mb-2 text-xs uppercase tracking-wider text-ink-300">Best times</h3>
                  <BestTimes participants={participantsArray} viewerTimezone={viewerZone} />
                </div>
                <div>
                  <h3 className="mb-2 text-xs uppercase tracking-wider text-ink-300">
                    At hovered hour
                  </h3>
                  <HoverDetails
                    startSlot={hoverStartSlot}
                    participants={participantsArray}
                    viewerTimezone={viewerZone}
                  />
                </div>
              </>
            )}
          </aside>
        </div>

        <footer className="mt-10 text-center text-xs text-ink-500">
          Times are stored as UTC under the hood — every friend&apos;s timezone is normalized
          before computing overlap.
        </footer>
      </main>
    </>
  );
}
