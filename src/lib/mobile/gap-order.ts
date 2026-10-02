/** Số câu kế tiếp có ô điền sau `n`, hoặc null nếu `n` là ô cuối. */
export function nextGapNumber(numbers: readonly number[], n: number): number | null {
  let best: number | null = null;
  for (const x of numbers) if (x > n && (best === null || x < best)) best = x;
  return best;
}
