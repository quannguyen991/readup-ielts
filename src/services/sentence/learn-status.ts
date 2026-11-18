/**
 * Trạng thái HỌC của từng câu / từng bài — "chưa học", "đang học", "đã học".
 *
 * Mọi con số lấy từ LỊCH SỬ LÀM BÀI THẬT đã lưu, không có trạng thái nào được gán
 * tay. Hai nguồn, gộp lại:
 *   - `itemStats`: ghi NGAY khi xong từng câu (kể cả khi bỏ dở giữa bài);
 *   - `sessions`: lịch sử cũ, chỉ có khi cả bài đã xong — dùng cho câu chưa có
 *     trong `itemStats` để người dùng cũ không bị mất tiến độ.
 *
 * "Đã học" nghĩa là TỰ làm đúng (chép chính tả ≥ 80% không mở đáp án, dịch tự
 * làm đúng không xem gợi ý, tự diễn đạt qua cổng chấm). Làm rồi mà chưa đạt là
 * "đang học" chứ không phải "đã học" — nhãn nói đúng điều đã xảy ra.
 */

export type LearnMode = 'dictation' | 'translation' | 'express' | 'paragraph' | 'essay';
export type LearnState = 'new' | 'learning' | 'learned';

export type ItemStat = {
  tries: number;
  /** Điểm cao nhất 0–1. */
  best: number;
  passed: boolean;
  lastAt: string;
};
export type StatMap = Record<string, ItemStat>;

/** Chép chính tả: đủ ngưỡng này mới tính là đã học câu đó. */
export const PASS_ACCURACY = 0.8;

export const itemKey = (mode: LearnMode, id: string): string => `${mode}:${id}`;

type SessionLike = {
  mode: 'dictation' | 'translation';
  finishedAt: string;
  attempts: { itemId: string; accuracy?: number; selfCorrect?: boolean }[];
};

/** Dựng thống kê từ lịch sử bài đã xong (nguồn cũ). */
export function statsFromSessions(sessions: readonly SessionLike[]): StatMap {
  const out: StatMap = {};
  for (const s of sessions) {
    for (const a of s.attempts) {
      const key = itemKey(s.mode, a.itemId);
      const score = s.mode === 'dictation' ? (a.accuracy ?? 0) : a.selfCorrect ? 1 : 0;
      const passed = s.mode === 'dictation' ? score >= PASS_ACCURACY : !!a.selfCorrect;
      const prev = out[key];
      out[key] = prev
        ? {
            tries: prev.tries + 1,
            best: Math.max(prev.best, score),
            passed: prev.passed || passed,
            lastAt: prev.lastAt > s.finishedAt ? prev.lastAt : s.finishedAt,
          }
        : { tries: 1, best: score, passed, lastAt: s.finishedAt };
    }
  }
  return out;
}

/** `live` (ghi theo từng câu) thắng `legacy` khi trùng khoá. */
export function mergeStats(legacy: StatMap, live: StatMap): StatMap {
  return { ...legacy, ...live };
}

export function itemState(stats: StatMap, mode: LearnMode, id: string): LearnState {
  const s = stats[itemKey(mode, id)];
  if (!s || s.tries === 0) return 'new';
  return s.passed ? 'learned' : 'learning';
}

export type SetProgress = { total: number; learned: number; tried: number; state: LearnState };

/** Tiến độ cả bài: đã học hết → "đã học"; đã đụng tới nhưng chưa hết → "đang học". */
export function setProgress(stats: StatMap, mode: LearnMode, ids: readonly string[]): SetProgress {
  let learned = 0;
  let tried = 0;
  for (const id of ids) {
    const st = itemState(stats, mode, id);
    if (st === 'learned') learned += 1;
    if (st !== 'new') tried += 1;
  }
  const total = ids.length;
  const state: LearnState = total > 0 && learned === total ? 'learned' : tried > 0 ? 'learning' : 'new';
  return { total, learned, tried, state };
}

/** Cập nhật thống kê một câu (hàm thuần, dùng cho store và test). */
export function bumpStat(prev: ItemStat | undefined, score: number, passed: boolean, at: string): ItemStat {
  return {
    tries: (prev?.tries ?? 0) + 1,
    best: Math.max(prev?.best ?? 0, score),
    passed: (prev?.passed ?? false) || passed,
    lastAt: at,
  };
}

export const STATE_LABEL: Record<LearnState, { vi: string; en: string }> = {
  new: { vi: 'Chưa học', en: 'Not started' },
  learning: { vi: 'Đang học', en: 'In progress' },
  learned: { vi: 'Đã học', en: 'Learned' },
};

/** Một lần nộp bài Tự diễn đạt. */
export type ExpressRoundLike = { text: string; at: string; errors: number; passed: boolean };
export type ExpressRecordLike = { rounds: ExpressRoundLike[]; hintLevel: number };

/** Điểm một lần nộp Tự diễn đạt: đạt = 1, còn lỗi thì trừ dần (cho thanh tiến độ, không để xét "đã học"). */
export function expressScore(round: { errors: number; passed: boolean }): number {
  return round.passed ? 1 : Math.max(0, 1 - round.errors * 0.25);
}

/** Thêm một lần nộp vào hồ sơ câu (giữ 30 lần gần nhất, giữ mức gợi ý cao nhất đã mở). */
export function addExpressRound(prev: ExpressRecordLike | undefined, round: ExpressRoundLike, hintLevel: number): ExpressRecordLike {
  return { rounds: [...(prev?.rounds ?? []), round].slice(-30), hintLevel: Math.max(prev?.hintLevel ?? 0, hintLevel) };
}

/** Bài viết cả đoạn tính là "đã học" khi đủ số câu tối thiểu và ≥ 80% câu sạch lỗi cứng. */
export function paragraphResult(sentences: number, cleanSentences: number, minSentences = 4): { score: number; passed: boolean } {
  const ratio = sentences > 0 ? cleanSentences / sentences : 0;
  return { score: ratio, passed: ratio >= 0.8 && sentences >= minSentences };
}
