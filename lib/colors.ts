// Soft, distinguishable palette assigned to participants in order.
export const PARTICIPANT_COLORS = [
  "#9ae6b4", // mint
  "#90cdf4", // sky
  "#fbb6ce", // rose
  "#fbd38d", // amber
  "#d6bcfa", // lavender
  "#fed7aa", // peach
  "#a3e0d2", // teal
  "#fcd5ce"  // blush
];

export function nextColor(index: number): string {
  return PARTICIPANT_COLORS[index % PARTICIPANT_COLORS.length];
}
