export function ratingHistogram(scores: number[]) {
  const bins = Array.from({ length: 10 }, () => 0);
  for (const s of scores) {
    if (s >= 1 && s <= 10) bins[s - 1] += 1;
  }
  return bins;
}

export function median(scores: number[]) {
  if (scores.length === 0) return null;
  const sorted = [...scores].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid] ?? null;
  const a = sorted[mid - 1];
  const b = sorted[mid];
  return a != null && b != null ? (a + b) / 2 : null;
}
