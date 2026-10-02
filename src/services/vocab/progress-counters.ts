/**
 * SỐ ĐẾM TRUNG THỰC của màn Học — hàm thuần.
 *
 * Bản cũ ghi "x/10 từ xong" mà "xong" nghĩa là đã qua đủ MỌI lần gặp lại của vòng
 * (lật thẻ + 3 dạng câu, mỗi dạng cách xa dần ≈ 4 lần gặp mỗi từ). Làm 10 câu đầu thì
 * chưa từ nào tới đó, nên số cứ đứng ở 0/10 — đúng về kỹ thuật, vô nghĩa với người học.
 *
 * Giờ có hai số rõ nghĩa:
 *  - `passed`: số từ của vòng đang ở mức ≥ 1 — tức là đã trả lời ĐÚNG ít nhất một câu
 *    luyện (không tính lật thẻ tự chấm) và chưa bị sai làm tụt về 0. Làm đúng câu nào là
 *    số nhích câu đó.
 *  - `done`: số từ đã qua hết các lần gặp lại (đã xong hẳn trong vòng) — hiện ở thanh đoạn.
 *
 * "Cả bộ đã nhớ" = từ đã xong sạch trong một vòng (chặng 2) HOẶC đã đứng vững ở hộp ôn
 * từ 1 trở lên (đã trả lời đúng khi tới hạn ≥ 1 lần) — thứ app thực sự biết là đã nhớ.
 */
import type { ReviewEntry } from './review-schedule';
import type { LoopState } from './learn-loop';

export type RoundStats = { passed: number; done: number; total: number; answered: number };

export function roundStats(state: LoopState, words: readonly { word: string }[]): RoundStats {
  let passed = 0;
  let done = 0;
  for (const w of words) {
    const s = state.slots.find((x) => x.word === w.word);
    if (!s) continue;
    if (s.done) {
      done += 1;
      passed += 1;
    } else if (s.level >= 1) passed += 1;
  }
  return { passed, done, total: words.length, answered: state.now };
}

/** Số từ của bộ đã thật sự nhớ: chặng 2 hoặc hộp ôn ≥ 1. */
export function learnedCount(
  words: readonly { word: string }[],
  stages: Record<string, number> | undefined,
  reviews: Record<string, ReviewEntry> | undefined,
): number {
  let n = 0;
  for (const w of words) {
    if ((stages?.[w.word] ?? 0) >= 2 || (reviews?.[w.word]?.box ?? 0) >= 1) n += 1;
  }
  return n;
}

/** Dòng số liệu gọn dưới màn: "3/10 từ · 12 câu · Bộ 5/61". */
export function footerLine(stats: RoundStats, learned: number, setSize: number, en: boolean): string {
  return en
    ? `${stats.passed}/${stats.total} words · ${stats.answered} answered · Set ${learned}/${setSize} learned`
    : `${stats.passed}/${stats.total} từ · ${stats.answered} câu · Cả bộ nhớ ${learned}/${setSize}`;
}
