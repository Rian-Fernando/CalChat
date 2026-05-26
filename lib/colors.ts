// 22 distinct colors spanning the full rainbow. No duplicates, no near-duplicate pairs;
// every color has a clearly different hue or lightness from its neighbours. Each participant
// gets a unique entry from this list, so the event capacity is up to 22 unique participants.
export const PARTICIPANT_COLORS = [
  "#ef4444", // 1.  red
  "#f97316", // 2.  orange
  "#fb923c", // 3.  light orange
  "#facc15", // 4.  yellow
  "#fde047", // 5.  pale yellow
  "#a3e635", // 6.  lime
  "#22c55e", // 7.  green
  "#4ade80", // 8.  light green
  "#10b981", // 9.  emerald
  "#2dd4bf", // 10. teal
  "#06b6d4", // 11. cyan
  "#67e8f9", // 12. light cyan
  "#3b82f6", // 13. blue
  "#60a5fa", // 14. light blue
  "#6366f1", // 15. indigo
  "#a78bfa", // 16. violet
  "#c084fc", // 17. purple
  "#d946ef", // 18. fuchsia
  "#f0abfc", // 19. light fuchsia
  "#ec4899", // 20. pink
  "#f43f5e", // 21. rose
  "#fda4af"  // 22. light rose
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
