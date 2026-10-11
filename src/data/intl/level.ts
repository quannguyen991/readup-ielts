import type { Bi } from '@/i18n/useL';

/** Mức độ của một câu hỏi hoặc bài luyện. Dùng chung cho TOEIC và TOEFL. */
export type IntlLevel = 'easy' | 'medium' | 'hard';

export const LEVEL_LABEL: Record<IntlLevel, Bi> = {
  easy: { vi: 'Dễ', en: 'Easy' },
  medium: { vi: 'Vừa', en: 'Medium' },
  hard: { vi: 'Khó', en: 'Hard' },
};

export const LEVEL_ORDER: readonly IntlLevel[] = ['easy', 'medium', 'hard'];

/** Độ dài từ quyết định mức của bài điền chữ: từ ngắn dễ, từ dài khó. */
export function levelOfWordLength(length: number): IntlLevel {
  if (length <= 6) return 'easy';
  if (length <= 9) return 'medium';
  return 'hard';
}

/** Số khối ghép câu quyết định mức của bài ghép câu TOEFL. */
export function levelOfChunks(count: number): IntlLevel {
  if (count <= 3) return 'easy';
  if (count === 4) return 'medium';
  return 'hard';
}
