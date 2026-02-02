export function hotScore({
  score,
  date,
}: {
  score: number;
  date: Date;
}) {
  // Simple Reddit-ish hot ranking
  const order = Math.log10(Math.max(Math.abs(score), 1));
  const sign = score > 0 ? 1 : score < 0 ? -1 : 0;
  const seconds = date.getTime() / 1000;
  const epoch = 1134028003; // reddit epoch
  return sign * order + (seconds - epoch) / 45000;
}
