/**
 * Tiến độ SAT Verbal theo kỹ năng — hàm thuần, để thẻ kỹ năng ở trang Verbal
 * và bài test cùng đọc một luật.
 *
 * Mỗi câu chỉ giữ LẦN LÀM GẦN NHẤT. "Đã làm 30/96" nghĩa là 30 câu KHÁC NHAU,
 * không phải 30 lượt bấm: làm đi làm lại một bộ 8 câu bốn lần không được tính
 * là đã phủ 32 câu của kỹ năng đó.
 */
export type RwAttempt = {
  correct: boolean;
  /** Thời gian nghĩ câu này, mili giây. */
  ms: number;
  at: string;
};

export type RwSkillProgress = {
  skill: string;
  /** Số câu trong kho thuộc kỹ năng này. */
  bank: number;
  answered: number;
  correct: number;
  wrong: number;
  /** null khi chưa làm câu nào — khác 0%. */
  accuracy: number | null;
  totalMs: number;
};

export function summarizeRwBySkill(
  questions: readonly { id: string; skill: string }[],
  attempts: Readonly<Record<string, RwAttempt>>,
): Record<string, RwSkillProgress> {
  const out: Record<string, RwSkillProgress> = {};
  for (const q of questions) {
    const p = (out[q.skill] ??= { skill: q.skill, bank: 0, answered: 0, correct: 0, wrong: 0, accuracy: null, totalMs: 0 });
    p.bank += 1;
    const a = attempts[q.id];
    if (!a) continue;
    p.answered += 1;
    if (a.correct) p.correct += 1;
    else p.wrong += 1;
    p.totalMs += a.ms;
  }
  for (const p of Object.values(out)) p.accuracy = p.answered > 0 ? p.correct / p.answered : null;
  return out;
}

/** Gộp lượt làm Verbal giữa hai máy: mỗi câu giữ LẦN LÀM GẦN NHẤT (theo `at`). */
export function mergeRwAttempts(
  local: Readonly<Record<string, RwAttempt>> | undefined,
  remote: Readonly<Record<string, RwAttempt>> | undefined,
): Record<string, RwAttempt> {
  const out: Record<string, RwAttempt> = { ...(remote ?? {}) };
  for (const [id, a] of Object.entries(local ?? {})) {
    const other = out[id];
    if (!other || a.at > other.at) out[id] = a;
  }
  return out;
}
