"use client";

import { Fragment, useMemo } from "react";
import { DateTime } from "luxon";
import { SLOT_MS } from "@/lib/timezone";
import type { Participant } from "@/lib/types";

interface Props {
  participants: Participant[];
  viewerTimezone: string;
  /** If provided, clicking a cell jumps to a representative week where overlap happened there. */
  onJumpToWeek?: (mondayISO: string) => void;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const HOURS = 24;
const DAYS = 7;

function hourLabel(h: number) {
  if (h === 0) return "12a";
  if (h === 12) return "12p";
  return h < 12 ? `${h}a` : `${h - 12}p`;
}

export default function WeeklyPatternHeatmap({
  participants,
  viewerTimezone,
  onJumpToWeek
}: Props) {
  const total = participants.length;

  const { grid, sampleWeeks, bestPick } = useMemo(() => {
    type Cell = { weeksWithData: Set<string>; weeksWithFull: Set<string>; firstFullWeek?: string };
    const grid: Cell[][] = Array.from({ length: DAYS }, () =>
      Array.from({ length: HOURS }, () => ({
        weeksWithData: new Set<string>(),
        weeksWithFull: new Set<string>()
      }))
    );

    if (total === 0) return { grid, sampleWeeks: 0, bestPick: null as null | { day: number; hour: number; score: number; firstFullWeek?: string } };

    // First, count availability per UTC slot
    const slotCount = new Map<number, number>();
    for (const p of participants) {
      for (const s of p.availability) {
        slotCount.set(s, (slotCount.get(s) ?? 0) + 1);
      }
    }

    // For each occupied slot, drop it into a (day-of-week, hour-of-day) bucket
    // in the viewer's timezone, and remember WHICH week it came from. That lets us
    // measure "how reliably does this time-of-week have full overlap?"
    const allWeeks = new Set<string>();
    for (const [slot, count] of slotCount) {
      const dt = DateTime.fromMillis(slot * SLOT_MS, { zone: viewerTimezone });
      const day = dt.weekday - 1;     // Luxon: 1 (Mon) .. 7 (Sun)
      const hour = dt.hour;
      const monday = dt.minus({ days: dt.weekday - 1 }).toFormat("yyyy-LL-dd");
      allWeeks.add(monday);
      const cell = grid[day][hour];
      cell.weeksWithData.add(monday);
      if (count === total) {
        cell.weeksWithFull.add(monday);
        if (!cell.firstFullWeek) cell.firstFullWeek = monday;
      }
    }

    // Find the best cell — highest fraction of weeks with full overlap, tie-break by
    // number of weeks (more data points = more confidence).
    let bestPick: { day: number; hour: number; score: number; firstFullWeek?: string } | null = null;
    for (let d = 0; d < DAYS; d++) {
      for (let h = 0; h < HOURS; h++) {
        const c = grid[d][h];
        if (c.weeksWithData.size === 0) continue;
        const score = c.weeksWithFull.size / c.weeksWithData.size;
        if (
          !bestPick ||
          score > bestPick.score ||
          (score === bestPick.score && c.weeksWithFull.size > 0)
        ) {
          bestPick = { day: d, hour: h, score, firstFullWeek: c.firstFullWeek };
        }
      }
    }

    return { grid, sampleWeeks: allWeeks.size, bestPick };
  }, [participants, viewerTimezone, total]);

  if (total < 2) return null;

  const hasAnyData = grid.some(row => row.some(c => c.weeksWithData.size > 0));

  return (
    <section className="mt-5 rounded-lg border border-ink-700 bg-ink-900/40 p-3">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="text-xs uppercase tracking-wider text-ink-300">
          Recurring sweet spots
        </h4>
        <span className="text-[11px] text-ink-500">
          Aggregated across {sampleWeeks} week{sampleWeeks === 1 ? "" : "s"} of data
        </span>
      </div>

      {!hasAnyData ? (
        <p className="text-xs text-ink-400">
          As soon as people add availability across multiple weeks, the cells most reliably
          green here are the moments that work for the whole group week after week.
        </p>
      ) : (
        <>
          {bestPick && bestPick.score > 0 && (
            <p className="mb-3 text-[11px] text-ink-300">
              Best recurring slot:{" "}
              <span className="font-medium text-accent">
                {DAY_LABELS[bestPick.day]} {hourLabel(bestPick.hour)}
              </span>
              {bestPick.score < 1 ? (
                <>
                  {" "}— full overlap in {Math.round(bestPick.score * 100)}% of weeks with data.
                </>
              ) : (
                <> — full overlap every week we have data for.</>
              )}
            </p>
          )}

          <div
            className="grid gap-[1px]"
            style={{ gridTemplateColumns: "34px repeat(7, minmax(0, 1fr))" }}
          >
            <div />
            {DAY_LABELS.map(d => (
              <div
                key={d}
                className="text-center text-[10px] font-medium uppercase tracking-wider text-ink-300"
              >
                {d}
              </div>
            ))}
            {Array.from({ length: HOURS }).map((_, h) => (
              <Fragment key={h}>
                <div className="pr-1 text-right text-[9px] tabular-nums leading-[16px] text-ink-500">
                  {h % 3 === 0 ? hourLabel(h) : ""}
                </div>
                {Array.from({ length: DAYS }).map((_, d) => {
                  const c = grid[d][h];
                  const dataN = c.weeksWithData.size;
                  const fullN = c.weeksWithFull.size;
                  const score = dataN > 0 ? fullN / dataN : 0;
                  const cls =
                    score >= 0.95
                      ? "bg-accent"
                      : score >= 0.66
                      ? "bg-accent/65"
                      : score >= 0.33
                      ? "bg-accent/40"
                      : score > 0
                      ? "bg-accent/22"
                      : dataN > 0
                      ? "bg-ink-700/60"
                      : "bg-ink-800/40";
                  const tip =
                    dataN === 0
                      ? `${DAY_LABELS[d]} ${hourLabel(h)} — no data yet`
                      : `${DAY_LABELS[d]} ${hourLabel(h)} — full overlap in ${fullN}/${dataN} weeks${
                          c.firstFullWeek ? ` (e.g. week of ${c.firstFullWeek})` : ""
                        }`;
                  return (
                    <button
                      key={`${d}-${h}`}
                      type="button"
                      onClick={() => c.firstFullWeek && onJumpToWeek?.(c.firstFullWeek)}
                      disabled={!c.firstFullWeek || !onJumpToWeek}
                      className={`h-[16px] rounded-sm ${cls} transition disabled:cursor-default ${
                        c.firstFullWeek && onJumpToWeek
                          ? "hover:ring-1 hover:ring-accent"
                          : ""
                      }`}
                      title={tip}
                      aria-label={tip}
                    />
                  );
                })}
              </Fragment>
            ))}
          </div>

          <div className="mt-2 flex items-center justify-end gap-2 text-[10px] text-ink-500">
            <span>fewer weeks</span>
            <span className="inline-block h-2 w-3 rounded-sm bg-accent/22" />
            <span className="inline-block h-2 w-3 rounded-sm bg-accent/40" />
            <span className="inline-block h-2 w-3 rounded-sm bg-accent/65" />
            <span className="inline-block h-2 w-3 rounded-sm bg-accent" />
            <span>every week</span>
          </div>
        </>
      )}
    </section>
  );
}
