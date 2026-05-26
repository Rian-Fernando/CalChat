// Diverse, distinguishable palette. Each participant gets a unique entry from this list.
// Max participants per event = palette length (currently 20).
export const PARTICIPANT_COLORS = [
  "#9ae6b4", // 1.  mint
  "#90cdf4", // 2.  sky blue
  "#fbb6ce", // 3.  soft pink
  "#fbd38d", // 4.  amber
  "#d6bcfa", // 5.  lavender
  "#fed7aa", // 6.  peach
  "#4fd1c5", // 7.  cyan
  "#f687b3", // 8.  hot pink
  "#9f7aea", // 9.  purple
  "#f6ad55", // 10. orange
  "#fc8181", // 11. coral red
  "#fef08a", // 12. bright yellow
  "#86efac", // 13. lime green
  "#67e8f9", // 14. light cyan
  "#c4b5fd", // 15. violet
  "#fdba74", // 16. tangerine
  "#fca5a5", // 17. salmon
  "#a7f3d0", // 18. seafoam
  "#f0abfc", // 19. magenta
  "#bfdbfe"  // 20. powder blue
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
