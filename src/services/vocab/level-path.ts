import { learnedCount } from './progress-counters';
import type { ReviewEntry } from './review-schedule';

/**
 * LỘ TRÌNH ĐÁNH SỐ của một bộ nhiều cấp (B1 → B2 → C1 → C2) — hàm thuần.
 *
 * Mỗi bước là một cấp, đánh số từ 1. Số liệu lấy từ tiến độ đã lưu, nên không cần lưu thêm
 * trạng thái nào:
 *  - `studied`: từ đã được học ít nhất một lần (đã trả lời một câu, hoặc đã có lịch ôn);
 *  - `learned`: từ đã nhớ (cùng định nghĩa với số "đã nhớ" ở chân màn học);
 *  - `due`: từ đến hạn ôn hôm nay;
 *  - `roundAsked`: số câu đã trả lời của vòng đang dở (null nếu không có vòng dở).
 *
 * Bước hiện tại là bước đầu tiên chưa học hết mọi từ. Học hết bước 1 thì tự sang bước 2.
 */

export type StepInput = {
  words: readonly { word: string }[];
  stages?: Record<string, number>;
  reviews?: Record<string, ReviewEntry>;
  /** Từ (viết thường) đã được hỏi ít nhất một lần theo lịch FSRS, kể cả trả lời sai. */
  studied?: ReadonlySet<string>;
  /** Từ đến hạn ôn hôm nay, viết thường và đã cắt khoảng trắng. */
  dueWords?: ReadonlySet<string>;
  roundAsked: number | null;
};

export type PathStep = {
  n: number;
  total: number;
  studied: number;
  learned: number;
  due: number;
  roundAsked: number | null;
  finished: boolean;
};

export function stepSummary(input: StepInput, n: number): PathStep {
  const total = input.words.length;
  let studied = 0;
  let due = 0;
  for (const w of input.words) {
    const key = w.word.trim().toLowerCase();
    if ((input.stages?.[w.word] ?? 0) >= 1 || input.reviews?.[w.word] !== undefined || input.studied?.has(key)) studied += 1;
    if (input.dueWords?.has(key)) due += 1;
  }
  return {
    n,
    total,
    studied,
    learned: learnedCount(input.words, input.stages, input.reviews),
    due,
    roundAsked: input.roundAsked,
    finished: total > 0 && studied >= total,
  };
}

/** Bước đang học: bước đầu tiên chưa học hết. Mọi bước đã xong thì null. */
export function currentStep(steps: readonly PathStep[]): PathStep | null {
  return steps.find((s) => !s.finished) ?? null;
}
