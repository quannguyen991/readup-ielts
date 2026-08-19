import { averageBand, bandDelta } from '@/lib/band';
import type { WritingEvaluation, WritingSubmission } from '@/lib/writing/types';

/**
 * Phần tính toán của lịch sử Writing, tách khỏi zustand.
 *
 * Để riêng vì đây là chỗ dễ sai nhất (thứ tự bài, nộp trùng, bài chưa chấm) mà
 * lại là chỗ duy nhất test được mà không phải dựng React.
 */

/** Danh sách luôn xếp mới nhất trước. Nộp lại cùng id thì thay, không nhân đôi. */
export function addSubmission(
  list: WritingSubmission[],
  submission: WritingSubmission,
): WritingSubmission[] {
  const rest = list.filter((s) => s.id !== submission.id);
  return [submission, ...rest].sort(
    (a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt),
  );
}

export function submissionsForPrompt(
  list: WritingSubmission[],
  promptId: string,
): WritingSubmission[] {
  return list.filter((s) => s.promptId === promptId);
}

/**
 * Quy một khoảng band về một số để tính trung bình.
 *
 * Lấy điểm giữa chứ không lấy cận dưới: cận dưới làm mọi con số tiến độ thấp
 * hơn thực tế một cách hệ thống, mà người học nhìn tiến độ chính là để biết
 * mình có đi lên hay không.
 */
function midpoint(e: WritingEvaluation): number {
  return (e.bandLow + e.bandHigh) / 2;
}

export function writingProgress(
  submissions: WritingSubmission[],
  evaluations: WritingEvaluation[],
): {
  totalSubmissions: number;
  totalWords: number;
  averageBand: number | null;
  latestDelta: number | null;
} {
  const byId = new Map(evaluations.map((e) => [e.submissionId, e]));

  // Duyệt theo thứ tự bài đã nộp (mới nhất trước) chứ không theo thứ tự mảng
  // evaluations, để `latestDelta` so đúng hai bài liền kề gần nhất *có chấm*.
  // Bài chưa chấm bị loại hẳn, không tính thành 0 — xem `band.ts`.
  const graded = submissions
    .map((s) => byId.get(s.id))
    .filter((e): e is WritingEvaluation => e != null)
    .map(midpoint);

  return {
    totalSubmissions: submissions.length,
    totalWords: submissions.reduce((sum, s) => sum + s.wordCount, 0),
    averageBand: averageBand(graded),
    latestDelta: graded.length >= 2 ? bandDelta(graded[0], graded[1]) : null,
  };
}
