/**
 * Bản nháp đáp án — tự lưu để lỡ vuốt-quay-lại, tải lại trang hay hệ điều hành
 * dọn tab nền không làm mất bài đang làm.
 *
 * Chỉ giữ 12 giờ: bản nháp cũ hơn thì người học đã quên đang làm gì, và để lại
 * chỉ khiến lần mở sau hiện đáp án lạ.
 */
export type ExamDraft = {
  answers: Record<string, string>;
  marked: Record<string, boolean>;
  secondsLeft?: number;
  savedAt: number;
};

export const DRAFT_TTL_MS = 12 * 60 * 60 * 1000;

export function draftKey(scope: string, id: string): string {
  return `band9.draft.${scope}.${id}`;
}

export function hasContent(d: Pick<ExamDraft, 'answers' | 'marked'>): boolean {
  return Object.values(d.answers).some((v) => typeof v === 'string' && v.trim() !== '') || Object.values(d.marked).some(Boolean);
}

export function parseDraft(raw: string | null | undefined, now = Date.now()): ExamDraft | null {
  if (!raw) return null;
  try {
    const d = JSON.parse(raw) as Partial<ExamDraft>;
    if (!d || typeof d !== 'object' || typeof d.savedAt !== 'number') return null;
    if (now - d.savedAt > DRAFT_TTL_MS || now < d.savedAt - 60_000) return null;
    const answers: Record<string, string> = {};
    for (const [k, v] of Object.entries(d.answers ?? {})) if (typeof v === 'string') answers[k] = v;
    const marked: Record<string, boolean> = {};
    for (const [k, v] of Object.entries(d.marked ?? {})) if (v === true) marked[k] = true;
    const out: ExamDraft = { answers, marked, savedAt: d.savedAt };
    if (typeof d.secondsLeft === 'number' && d.secondsLeft >= 0) out.secondsLeft = d.secondsLeft;
    return hasContent(out) ? out : null;
  } catch {
    return null;
  }
}

export function serializeDraft(d: Omit<ExamDraft, 'savedAt'>, now = Date.now()): string {
  return JSON.stringify({ ...d, savedAt: now });
}

/** Cắt tỉa: gỡ đáp án của câu không còn trong bộ đề (bộ đề đổi giữa hai lần mở). */
export function pruneDraft(d: ExamDraft, validIds: ReadonlySet<string>): ExamDraft {
  const answers: Record<string, string> = {};
  for (const [k, v] of Object.entries(d.answers)) if (validIds.has(k)) answers[k] = v;
  const marked: Record<string, boolean> = {};
  for (const [k, v] of Object.entries(d.marked)) if (validIds.has(k)) marked[k] = v;
  return { ...d, answers, marked };
}
