// Soft, distinguishable palette. Each participant gets a unique entry from this list.
// Max participants per event = palette length.
export const PARTICIPANT_COLORS = [
  "#9ae6b4", // mint
  "#90cdf4", // sky
  "#fbb6ce", // rose
  "#fbd38d", // amber
  "#d6bcfa", // lavender
  "#fed7aa", // peach
  "#a3e0d2", // teal
  "#f687b3", // pink
  "#9f7aea", // purple
  "#4fd1c5", // cyan
  "#f6ad55", // orange
  "#fc8181"  // coral
];

export function isPaletteColor(c: string): boolean {
  return PARTICIPANT_COLORS.includes(c);
}

export function availableColors(taken: string[]): string[] {
  const t = new Set(taken);
  return PARTICIPANT_COLORS.filter(c => !t.has(c));
}

export function firstAvailableColor(taken: string[]): string {
  return availableColors(taken)[0] ?? PARTICIPANT_COLORS[0];
}

/** Back-compat default assignment when a participant joins without picking a color. */
export function nextColor(index: number): string {
  return PARTICIPANT_COLORS[index % PARTICIPANT_COLORS.length];
}
