/**
 * Gộp lịch sử Writing giữa máy này và tài khoản — HÀM THUẦN, không chạm React hay zustand.
 *
 * Trước đây kho Writing không nằm trong đồng bộ, nên bài đã nộp và bản chấm chỉ có trên
 * một máy. Ở đây gộp theo khoá đúng của từng loại: bài nộp theo `id` (không nhân đôi),
 * bản chấm theo `submissionId` (bản chấm sau thắng), bài mẫu theo `promptId:targetBand`.
 * Bản nháp đang gõ thì KHÔNG đồng bộ: nó thuộc về máy đang gõ.
 */
import type { WritingEvaluation, WritingSubmission } from '@/lib/writing/types';

export const MAX_WRITING_SUBMISSIONS = 300;

export type WritingSyncPayload = {
  submissions?: WritingSubmission[];
  evaluations?: WritingEvaluation[];
  modelEssays?: Record<string, unknown>;
};

const stampOf = (iso: string | undefined) => (iso ? Date.parse(iso) || 0 : 0);

export function mergeWriting(
  local: WritingSyncPayload | null | undefined,
  remote: WritingSyncPayload | null | undefined,
): Required<WritingSyncPayload> {
  const bySubmission = new Map<string, WritingSubmission>();
  for (const s of [...(remote?.submissions ?? []), ...(local?.submissions ?? [])]) {
    if (!s || typeof s.id !== 'string') continue;
    bySubmission.set(s.id, s);
  }
  const submissions = [...bySubmission.values()]
    .sort((a, b) => stampOf(b.submittedAt) - stampOf(a.submittedAt))
    .slice(0, MAX_WRITING_SUBMISSIONS);

  const byEvaluation = new Map<string, WritingEvaluation>();
  for (const e of [...(remote?.evaluations ?? []), ...(local?.evaluations ?? [])]) {
    if (!e || typeof e.submissionId !== 'string') continue;
    const prev = byEvaluation.get(e.submissionId);
    if (!prev || stampOf(e.evaluatedAt) >= stampOf(prev.evaluatedAt)) byEvaluation.set(e.submissionId, e);
  }
  // Chỉ giữ bản chấm của bài còn trong danh sách, để không phình mãi theo số lần chấm lại.
  const kept = new Set(submissions.map((s) => s.id));
  const evaluations = [...byEvaluation.values()]
    .filter((e) => kept.has(e.submissionId))
    .sort((a, b) => stampOf(b.evaluatedAt) - stampOf(a.evaluatedAt));

  // Bài mẫu: bản trên máy thắng khi cả hai cùng có một khoá (đều là bài sinh từ cùng đề).
  const modelEssays: Record<string, unknown> = { ...(remote?.modelEssays ?? {}), ...(local?.modelEssays ?? {}) };

  return { submissions, evaluations, modelEssays };
}
