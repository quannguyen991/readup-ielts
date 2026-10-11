import type { Bi } from '@/i18n/useL';
import type { ReadingQuestion } from '@/data/intl/reading-types';
import type { IntlLevel } from '@/data/intl/level';
import type { Part5Item } from './toeic-part5';

/** Dạng câu hỏi thống nhất cho mọi bài luyện trắc nghiệm trong TOEIC và TOEFL. */
export type PracticeQuestion = {
  id: string;
  prompt: string;
  choices: readonly string[];
  answer: number;
  explanation: Bi;
  kind?: Bi;
  level?: IntlLevel;
};

export function fromPart5(items: readonly Part5Item[]): PracticeQuestion[] {
  return items.map((item) => ({
    id: item.id,
    prompt: item.stem,
    choices: item.options.map((o) => o.text),
    answer: Math.max(0, item.options.findIndex((o) => o.correct)),
    explanation: item.explanation,
    kind: item.kind,
    level: item.level,
  }));
}

export function fromReading(questions: readonly ReadingQuestion[]): PracticeQuestion[] {
  return questions.map((q) => ({
    id: q.id,
    prompt: q.prompt,
    choices: q.choices,
    answer: q.answer,
    explanation: q.explanation,
    kind: q.kind,
    level: q.level,
  }));
}

/**
 * Câu "chèn câu": cho một câu và bốn vị trí [A]–[D] trong đoạn văn, chọn vị trí đúng nhất.
 * Đoạn văn phải có đúng bốn dấu [A], [B], [C], [D] theo thứ tự.
 */
export function insertionQuestion(id: string, sentence: string, answer: number, explanation: Bi): PracticeQuestion {
  return {
    id,
    prompt: `Câu sau nên được chèn vào vị trí nào? "${sentence}"`,
    choices: ['[A]', '[B]', '[C]', '[D]'],
    answer,
    explanation,
    kind: { vi: 'Chèn câu', en: 'Sentence insertion' },
  };
}

/** Đếm số câu đúng trong các câu đã trả lời. `picked[i]` là chỉ số lựa chọn, hoặc null nếu bỏ qua. */
export function scorePractice(questions: readonly PracticeQuestion[], picked: readonly (number | null)[]): number {
  return questions.reduce((sum, q, i) => sum + (picked[i] === q.answer ? 1 : 0), 0);
}
