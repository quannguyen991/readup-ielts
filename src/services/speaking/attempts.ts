import type { SessionMode, SpeakingPart } from './bank';
import type { SpeakingGrade } from './grade';
import type { AnswerMetrics, AttemptMetrics, RecognizedSegment } from './metrics';

/** Một câu trả lời trong lượt thi. */
export type SpeakingAnswer = {
  questionId: string;
  part: SpeakingPart;
  question: string;
  transcript: string;
  /** Các đoạn máy chốt kèm độ tin cậy — dùng cho độ rõ và để đánh dấu chỗ máy nghe không chắc. */
  segments: RecognizedSegment[];
  metrics: AnswerMetrics;
  /** Ghi chú Part 2 người học viết lúc chuẩn bị. */
  notes?: string;
  skipped?: boolean;
};

export type SpeakingAttempt = {
  id: string;
  mode: SessionMode;
  /** true = trả lời bằng GÕ PHÍM (máy không nhận giọng) — không phải điểm Speaking. */
  typed: boolean;
  titleVi: string;
  startedAt: string;
  finishedAt: string;
  answers: SpeakingAnswer[];
  metrics: AttemptMetrics;
  grade: SpeakingGrade | null;
  /** Lý do chưa có điểm AI (hết lượt, chưa đăng nhập, lỗi) — màn kết quả hiện nguyên văn. */
  gradeError?: string | null;
  /** Đã cộng thưởng game cho lượt này chưa (chống cộng hai lần khi mở lại). */
  awarded?: boolean;
  /** Giữ cùng chủ đề qua vòng trả lời → phân tích → nói lại. */
  practice?: { topicId: string; questionCount: 1 | 2; questionOffset: number };
  retryOf?: string;
};

export const MAX_ATTEMPTS = 50;

const stamp = (a: SpeakingAttempt) => Date.parse(a.finishedAt) || 0;

/**
 * Gộp lượt thi hai máy: hợp theo id. Cùng một id thì bản ĐÃ CÓ ĐIỂM AI thắng
 * (máy kia có thể chấm sau), rồi tới bản có cờ thưởng. Giữ 50 lượt mới nhất.
 */
export function mergeSpeakingAttempts(
  local: SpeakingAttempt[] | null | undefined,
  remote: SpeakingAttempt[] | null | undefined,
): SpeakingAttempt[] {
  const byId = new Map<string, SpeakingAttempt>();
  for (const a of [...(Array.isArray(remote) ? remote : []), ...(Array.isArray(local) ? local : [])]) {
    if (!a || typeof a !== 'object' || typeof a.id !== 'string') continue;
    const cur = byId.get(a.id);
    if (!cur) {
      byId.set(a.id, a);
      continue;
    }
    const pick = (!cur.grade && a.grade) || (!!cur.grade === !!a.grade && !cur.awarded && a.awarded) ? a : cur;
    byId.set(a.id, { ...pick, awarded: !!(cur.awarded || a.awarded) });
  }
  return [...byId.values()].sort((a, b) => stamp(b) - stamp(a)).slice(0, MAX_ATTEMPTS);
}

/** Bản hay hơn gần nhất AI đã viết cho một câu hỏi — phòng thi cho xem lại khi "Luyện lại câu này". */
export function latestSampleFor(attempts: SpeakingAttempt[], questionId: string): string | null {
  for (const a of attempts) {
    if (!a.grade) continue;
    for (const s of a.grade.samples) {
      if (a.answers[s.questionIndex]?.questionId === questionId) return s.improved;
    }
  }
  return null;
}
