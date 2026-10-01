/**
 * Ba bậc độ khó dùng chung cho SAT Math và SAT Verbal.
 *
 * Một chỗ duy nhất cho tên bậc, thứ tự và nhãn hai thứ tiếng, để thẻ "Dễ / Vừa /
 * Khó" ở màn làm bài, danh sách bộ đề và trang tổng quan nói cùng một giọng.
 * `MathDifficulty` và `RwDifficulty` đều là đúng union này.
 */

export type Difficulty = 'easy' | 'medium' | 'hard';

export const DIFFICULTIES: readonly Difficulty[] = ['easy', 'medium', 'hard'];

export const DIFFICULTY_LABEL: Record<Difficulty, { vi: string; en: string }> = {
  easy: { vi: 'Dễ', en: 'Easy' },
  medium: { vi: 'Vừa', en: 'Medium' },
  hard: { vi: 'Khó', en: 'Hard' },
};

export function difficultyLabel(d: Difficulty, en = false): string {
  return en ? DIFFICULTY_LABEL[d].en : DIFFICULTY_LABEL[d].vi;
}

export function difficultyRank(d: Difficulty): number {
  return d === 'easy' ? 0 : d === 'medium' ? 1 : 2;
}

/** Xếp dễ → khó, GIỮ NGUYÊN thứ tự gốc trong cùng một bậc. */
export function sortByDifficulty<T>(items: readonly T[], get: (item: T) => Difficulty): T[] {
  return items
    .map((item, i) => ({ item, i, r: difficultyRank(get(item)) }))
    .sort((a, b) => a.r - b.r || a.i - b.i)
    .map((x) => x.item);
}

/** Đúng khi dãy không bao giờ đi lùi về bậc dễ hơn. */
export function isSortedByDifficulty<T>(items: readonly T[], get: (item: T) => Difficulty): boolean {
  for (let i = 1; i < items.length; i += 1) {
    if (difficultyRank(get(items[i]!)) < difficultyRank(get(items[i - 1]!))) return false;
  }
  return true;
}

/** Tỉ lệ ba bậc trong một bộ đề. Không cần cộng lại đúng 1 — chỉ là trọng số. */
export type DifficultyMix = Record<Difficulty, number>;

/** Bậc "chủ đạo" của một tỉ lệ — để gắn một nhãn duy nhất cho cả bộ đề. */
export function dominantDifficulty(mix: DifficultyMix): Difficulty {
  const total = mix.easy + mix.medium + mix.hard || 1;
  // Trung bình có trọng số trên thang 0–2, cắt ở 0,7 và 1,3.
  const mean = (mix.medium + 2 * mix.hard) / total;
  return mean < 0.7 ? 'easy' : mean < 1.3 ? 'medium' : 'hard';
}

/**
 * Chia `count` câu theo tỉ lệ, làm tròn kiểu phần dư lớn nhất để tổng luôn
 * đúng `count`. Bậc trọng số 0 nhận 0 câu.
 */
export function allocateByMix(count: number, mix: DifficultyMix): Record<Difficulty, number> {
  const total = mix.easy + mix.medium + mix.hard;
  if (total <= 0) return { easy: 0, medium: count, hard: 0 };
  const raw = DIFFICULTIES.map((d) => (count * mix[d]) / total);
  const out = raw.map(Math.floor);
  let left = count - out.reduce((a, b) => a + b, 0);
  const order = raw
    .map((r, i) => ({ i, rem: r - Math.floor(r) }))
    .sort((a, b) => b.rem - a.rem || a.i - b.i);
  for (const { i } of order) {
    if (left <= 0) break;
    out[i]! += 1;
    left -= 1;
  }
  return { easy: out[0]!, medium: out[1]!, hard: out[2]! };
}
