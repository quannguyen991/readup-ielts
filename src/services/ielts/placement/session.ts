/**
 * Máy trạng thái bài Reading kiểm tra đầu vào. Hàm thuần: không đọc store, không đồng hồ thật.
 * Người gọi truyền thời điểm vào, nên test được mà không cần chờ.
 *
 * Luật thi thật, được giữ ở đây:
 * - Một lượt thi, chỉ nộp một lần. Sau khi nộp không sửa được đáp án.
 * - Hết giờ thì tự nộp, đáp án đang điền vẫn được chấm.
 * - Không hiện đáp án đúng và không gợi ý trong lúc làm.
 */

import { READING_DURATION_MS, READING } from './blueprint';
import { READING_QUESTIONS, type ReadingQuestion } from './reading-paper';
import { rawScoreToBand } from '@/lib/band';

export type Answers = Record<number, string>;

export type ReadingSession = {
  startedAt: number;
  answers: Answers;
  submittedAt: number | null;
};

export type ReadingResult = {
  correct: number;
  total: number;
  band: number;
  /** Câu sai và đáp án đúng; chỉ có sau khi nộp. */
  wrong: Array<{ n: number; given: string; expected: string }>;
};

export function startReading(now: number): ReadingSession {
  return { startedAt: now, answers: {}, submittedAt: null };
}

/** Còn bao nhiêu mili-giây; 0 khi đã hết giờ hoặc đã nộp. */
export function remainingMs(session: ReadingSession, now: number): number {
  if (session.submittedAt !== null) return 0;
  return Math.max(0, READING_DURATION_MS - (now - session.startedAt));
}

export function isExpired(session: ReadingSession, now: number): boolean {
  return session.submittedAt === null && now - session.startedAt >= READING_DURATION_MS;
}

/** Ghi đáp án. Bỏ qua khi đã nộp hoặc hết giờ, hoặc số câu không tồn tại. */
export function setAnswer(session: ReadingSession, n: number, value: string, now: number): ReadingSession {
  if (session.submittedAt !== null || isExpired(session, now)) return session;
  if (!READING_QUESTIONS.some((q) => q.n === n)) return session;
  return { ...session, answers: { ...session.answers, [n]: value } };
}

/** Nộp bài (chủ động hoặc tự động khi hết giờ). Nộp rồi thì giữ nguyên lần đầu. */
export function submitReading(session: ReadingSession, now: number): ReadingSession {
  if (session.submittedAt !== null) return session;
  return { ...session, submittedAt: Math.min(now, session.startedAt + READING_DURATION_MS) };
}

/** Chuẩn hoá đáp án điền chỗ trống: bỏ khoảng trắng thừa, thường hoá, bỏ dấu câu cuối. */
export function normalizeGap(text: string): string {
  return text.trim().replace(/\s+/g, ' ').replace(/[.,;:!?]+$/, '').toLowerCase();
}

/** Đúng hay sai của một câu. Trắc nghiệm so chỉ số phương án; còn lại so chữ. */
export function isCorrect(q: ReadingQuestion, given: string | undefined): boolean {
  if (given === undefined) return false;
  if (q.type === 'mcq') return Number(given) === q.answer;
  if (q.type === 'tfng') return given === q.answer;
  return normalizeGap(given) === normalizeGap(q.answer);
}

/** Chấm bài đã nộp. Chấm bài chưa nộp là không hợp lệ: trả về null để người gọi tự quyết. */
export function gradeReading(session: ReadingSession): ReadingResult | null {
  if (session.submittedAt === null) return null;
  const wrong: ReadingResult['wrong'] = [];
  let correct = 0;
  for (const q of READING_QUESTIONS) {
    const given = session.answers[q.n];
    if (isCorrect(q, given)) {
      correct += 1;
    } else {
      wrong.push({ n: q.n, given: displayOf(q, given), expected: displayOf(q, String(q.type === 'mcq' ? q.answer : q.answer)) });
    }
  }
  const total = READING.questions;
  return { correct, total, band: rawScoreToBand(correct, total), wrong };
}

/** Đổi đáp án lưu trong máy thành chữ người đọc được (trắc nghiệm: nhãn A–D). */
export function displayOf(q: ReadingQuestion, raw: string | undefined): string {
  if (raw === undefined || raw === '') return '—';
  if (q.type === 'mcq') {
    const i = Number(raw);
    return Number.isInteger(i) && q.options[i] !== undefined ? `${'ABCD'[i]}. ${q.options[i]}` : '—';
  }
  return raw;
}
