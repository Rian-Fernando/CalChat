import type { Participant } from "./types";

/** Returns the set of 15-min slots where EVERY participant is available. */
export function fullOverlap(participants: Participant[]): Set<number> {
  if (participants.length === 0) return new Set();
  const restSets = participants.slice(1).map(p => new Set(p.availability));
  const result = new Set<number>();
  for (const s of participants[0].availability) {
    if (restSets.every(set => set.has(s))) result.add(s);
  }
  return result;
}

/** Map from slot -> participant IDs available at that slot. */
export function availabilityIndex(participants: Participant[]): Map<number, string[]> {
  const map = new Map<number, string[]>();
  for (const p of participants) {
    for (const s of p.availability) {
      const arr = map.get(s);
      if (arr) arr.push(p.id);
      else map.set(s, [p.id]);
    }
  }
  return map;
}

/** Group consecutive integer slots into contiguous (start, endExclusive) ranges. */
export function groupIntoRanges(slots: number[]): { start: number; endExclusive: number }[] {
  if (slots.length === 0) return [];
  const sorted = [...slots].sort((a, b) => a - b);
  const ranges: { start: number; endExclusive: number }[] = [];
  let start = sorted[0];
  let prev = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === prev + 1) {
      prev = sorted[i];
    } else {
      ranges.push({ start, endExclusive: prev + 1 });
      start = sorted[i];
      prev = sorted[i];
    }
  }
  ranges.push({ start, endExclusive: prev + 1 });
  return ranges;
}
