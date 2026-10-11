import type { VocabEntry } from '@/data/intl/vocab-types';
import { hashString, mulberry32, shuffle } from '@/services/questions/rng';
import type { PracticeQuestion } from './practice';

export type VocabQuizKind = 'meaning' | 'cloze';

const LETTERS_COUNT = 4;

/** Câu điền từ chỉ dùng được khi ví dụ chứa đúng dạng gốc của từ, như "consist" trong "consists of". */
function canCloze(entry: VocabEntry): boolean {
  const pattern = new RegExp(`\\b${entry.word}\\b`, 'i');
  return pattern.test(entry.example);
}

function pickDistractors<T>(items: T[], count: number, rng: () => number): T[] {
  return shuffle(items, rng).slice(0, count);
}

/**
 * Trắc nghiệm từ vựng. "meaning" hỏi nghĩa của từ (dễ). "cloze" đưa câu có chỗ trống và hỏi từ
 * điền vào (vừa). Đáp án sai lấy từ cùng danh sách, nên không có đáp án sai nào trùng đáp án đúng.
 */
export function buildVocabQuiz(
  entries: readonly VocabEntry[],
  pool: readonly VocabEntry[],
  seed: string,
  kind: VocabQuizKind,
  size = 10,
): PracticeQuestion[] {
  const rng = mulberry32(hashString(`vocab-quiz:${kind}:${seed}`));
  if (kind === 'meaning') {
    const picked = shuffle([...entries], rng).slice(0, size);
    return picked.map((entry) => {
      const others = pool.filter((e) => e.word !== entry.word && e.vi !== entry.vi);
      const distractors = pickDistractors([...new Set(others.map((e) => e.vi))], LETTERS_COUNT - 1, rng);
      const choices = shuffle([entry.vi, ...distractors], rng);
      return {
        id: `meaning:${entry.word}`,
        prompt: `Nghĩa đúng của "${entry.word}" (${entry.pos}) là gì?`,
        choices,
        answer: choices.indexOf(entry.vi),
        explanation: { vi: `${entry.word}: ${entry.vi}.`, en: `${entry.word}: ${entry.en}. Example: ${entry.example}` },
        kind: { vi: 'Nghĩa của từ', en: 'Word meaning' },
        level: 'easy',
      };
    });
  }

  const eligible = entries.filter(canCloze);
  const picked = shuffle([...eligible], rng).slice(0, size);
  return picked.map((entry) => {
    const sameClass = pool.filter((e) => e.word !== entry.word && e.pos === entry.pos);
    const distractors = pickDistractors([...new Set(sameClass.map((e) => e.word))], LETTERS_COUNT - 1, rng);
    const choices = shuffle([entry.word, ...distractors], rng);
    const blanked = entry.example.replace(new RegExp(`\\b${entry.word}\\b`, 'i'), '_____');
    return {
      id: `cloze:${entry.word}`,
      prompt: blanked,
      choices,
      answer: choices.indexOf(entry.word),
      explanation: { vi: `${entry.word} nghĩa là ${entry.vi}.`, en: `${entry.word} means ${entry.en}.` },
      kind: { vi: 'Điền từ vào câu', en: 'Word in context' },
      level: 'medium',
    };
  });
}
