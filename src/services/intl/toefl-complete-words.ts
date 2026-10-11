import { hashString, mulberry32, shuffle } from '@/services/questions/rng';
import type { VocabEntry } from '@/data/intl/vocab-types';
import { ALL_TOEFL_VOCAB } from '@/data/intl/units';
import { levelOfWordLength, type IntlLevel } from '@/data/intl/level';

export type CompleteWordItem = {
  id: string;
  answer: string;
  masked: string;
  sentence: string;
  en: string;
  vi: string;
  level: IntlLevel;
};

/**
 * Dạng "Complete the words": giữ đầu và cuối từ, che hai chữ ở giữa. Từ luôn có
 * trong câu ví dụ để người học thấy ngữ cảnh.
 */
export function maskWord(word: string): string {
  const inner = word.length - 2;
  const first = 1 + Math.floor(inner / 3);
  const hidden = new Set([first, first + 1].filter((i) => i <= word.length - 2));
  return [...word].map((ch, i) => (hidden.has(i) ? '_' : ch)).join('');
}

function toItem(entry: VocabEntry): CompleteWordItem {
  const masked = maskWord(entry.word);
  const pattern = new RegExp(entry.word, 'i');
  const found = entry.example.match(pattern)?.[0] ?? '';
  const capitalized = found.charAt(0) !== found.charAt(0).toLowerCase();
  const shown = capitalized ? masked.charAt(0).toUpperCase() + masked.slice(1) : masked;
  const sentence = entry.example.replace(pattern, shown);
  return { id: entry.word, answer: entry.word, masked, sentence, en: entry.en, vi: entry.vi, level: levelOfWordLength(entry.word.length) };
}

export function buildCompleteWordsSet(
  seed: string,
  size = 10,
  pool: readonly VocabEntry[] = ALL_TOEFL_VOCAB,
  level: IntlLevel | 'all' = 'all',
): CompleteWordItem[] {
  const rng = mulberry32(hashString(`complete:${seed}`));
  const eligible = pool.filter((e) => level === 'all' || levelOfWordLength(e.word.length) === level);
  return shuffle([...eligible], rng).slice(0, size).map(toItem);
}

export function isCorrectWord(item: CompleteWordItem, typed: string): boolean {
  return typed.trim().toLowerCase() === item.answer.toLowerCase();
}
