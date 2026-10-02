import { isGapCorrect, normalizeAnswer } from '@/services/listening/scoring';
import type { GeneratedQuestion } from './types';
import type { QuestionType } from '@/types/database';
import { COMPLETION_TYPES } from './ielts-types';

/**
 * Chấm câu trả lời Reading.
 *
 * Dạng GÕ CHỮ dùng lại bộ chuẩn hoá của Listening (hoa/thường, dấu nối, số viết
 * chữ ↔ chữ số, Anh/Mỹ, ngoặc tuỳ chọn), cộng hai luật của đề thật:
 *   - vượt giới hạn số từ ("NO MORE THAN TWO WORDS") thì SAI dù chữ đúng;
 *   - mạo từ đứng đầu không làm sai đáp án ("the library" = "library").
 * Dạng CHỌN so theo chữ cái hoặc nguyên văn phương án; TFNG/YNNG chấp nhận viết tắt.
 * Nhóm "Choose TWO" chấm theo TẬP đáp án, không theo thứ tự.
 */

const ARTICLE = /^(?:the|a|an)\s+/i;

function stripArticle(s: string): string {
  return s.trim().replace(ARTICLE, '');
}

/** Số từ theo cách đề thi đếm: tách theo khoảng trắng, "well-known" và "1,000" là một từ. */
export function countWords(raw: string): number {
  const t = raw.trim();
  return t ? t.split(/\s+/).length : 0;
}

/** Chuẩn hoá nhãn TFNG/YNNG: "ng", "Not given", "T" → nhãn chuẩn. */
function canonicalLabel(raw: string): string {
  const s = raw.trim().toUpperCase().replace(/[^A-Z]/g, '');
  if (s === 'NG' || s === 'NOTGIVEN') return 'NOT GIVEN';
  if (s === 'T' || s === 'TRUE') return 'TRUE';
  if (s === 'F' || s === 'FALSE') return 'FALSE';
  if (s === 'Y' || s === 'YES') return 'YES';
  if (s === 'N' || s === 'NO') return 'NO';
  return s;
}

/** So khoan dung cho đáp án chọn: bỏ hoa thường, dấu câu, mạo từ. */
function looseText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\b(the|a|an)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export type GradeOptions = {
  type?: QuestionType;
  accept?: string[];
  maxWords?: number;
  /** Phương án của câu — để nhận đáp án viết bằng chữ cái khi đáp án đúng là nguyên văn. */
  options?: string[] | null;
};

export function isAnswerCorrect(userAnswer: string, correctAnswer: string, opts: GradeOptions = {}): boolean {
  const user = (userAnswer ?? '').trim();
  if (!user) return false;
  const type = opts.type;

  if (type === 'true_false_not_given' || type === 'yes_no_not_given') {
    return canonicalLabel(user) === canonicalLabel(correctAnswer);
  }

  if (type && COMPLETION_TYPES.has(type)) {
    if (opts.maxWords !== undefined && countWords(user) > opts.maxWords) return false;
    const answers = [correctAnswer, ...(opts.accept ?? [])];
    const spec = { answer: answers[0] as string, accept: answers.slice(1) };
    const loose = { answer: stripArticle(spec.answer), accept: spec.accept.map(stripArticle) };
    return isGapCorrect(user, spec) || isGapCorrect(stripArticle(user), loose) || isGapCorrect(stripArticle(user), spec);
  }

  // Chọn một / nối: chữ cái đơn hoặc nguyên văn phương án.
  const opt = opts.options ?? null;
  const letter = (s: string) => (/^[A-Za-z]$/.test(s.trim()) ? s.trim().toUpperCase() : null);
  const uL = letter(user);
  const cL = letter(correctAnswer);
  if (uL && cL) return uL === cL;
  if (opt) {
    // Một bên là chữ cái, bên kia là nguyên văn → quy chữ cái về phương án.
    const byLetter = (l: string) => opt[l.charCodeAt(0) - 65];
    if (uL && !cL) {
      const t = byLetter(uL);
      return t !== undefined && looseText(t) === looseText(correctAnswer);
    }
    if (cL && !uL) {
      const t = byLetter(cL);
      return t !== undefined && looseText(t) === looseText(user);
    }
  }
  const u = looseText(user);
  return u.length > 0 && u === looseText(correctAnswer);
}

export function isQuestionAnswerCorrect(q: GeneratedQuestion, answer: string): boolean {
  return isAnswerCorrect(answer, q.correctAnswer, {
    type: q.type,
    ...(q.accept ? { accept: q.accept } : {}),
    ...(q.maxWords !== undefined ? { maxWords: q.maxWords } : {}),
    options: q.options,
  });
}

/**
 * Chấm cả bộ: câu thường chấm riêng; nhóm "Choose TWO" chấm theo tập — người học
 * chọn đúng k trong n đáp án thì k câu đầu của nhóm được điểm.
 */
export function gradeQuestions(
  questions: GeneratedQuestion[],
  answers: Record<string, string>,
): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  const multi = new Map<string, GeneratedQuestion[]>();

  for (const q of questions) {
    if (q.type === 'multiple_choice_multi' && q.groupId) {
      const list = multi.get(q.groupId) ?? [];
      list.push(q);
      multi.set(q.groupId, list);
      continue;
    }
    result[q.id] = isQuestionAnswerCorrect(q, answers[q.id] ?? '');
  }

  for (const members of multi.values()) {
    const want = new Set(members.map((m) => looseText(m.correctAnswer)));
    const got = new Set<string>();
    for (const m of members) {
      const a = looseText(answers[m.id] ?? '');
      if (a && want.has(a)) got.add(a);
    }
    members.forEach((m, i) => {
      result[m.id] = i < got.size;
    });
  }

  return result;
}

/** Đáp án đúng để HIỆN ra cho người học khi xem lại. */
export function displayCorrect(q: GeneratedQuestion): string {
  if (q.accept && q.accept.length > 0 && q.type && COMPLETION_TYPES.has(q.type)) {
    return `${q.correctAnswer} (${q.accept.join(' / ')})`;
  }
  return q.correctAnswer;
}

/** Dùng cho test và cho bộ kiểm: hai đáp án có "cùng một chữ" sau chuẩn hoá không. */
export function sameAnswerText(a: string, b: string): boolean {
  return normalizeAnswer(stripArticle(a)) === normalizeAnswer(stripArticle(b));
}
