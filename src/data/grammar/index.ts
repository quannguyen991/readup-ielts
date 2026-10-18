import { A1_GRAMMAR } from './a1';
import { A2_GRAMMAR } from './a2';
import { B1_GRAMMAR } from './b1';
import { B2_GRAMMAR } from './b2';
import { C1_GRAMMAR } from './c1';
import { C2_GRAMMAR } from './c2';
import { CEFR_LEVELS, type CefrLevel, type GrammarLessonDetail } from './types';

export * from './types';

/**
 * Bài ngữ pháp chi tiết A1 → C2, mỗi cấp nhiều bài theo cùng khuôn ở types.ts.
 */
export const GRAMMAR_LESSONS: GrammarLessonDetail[] = [...A1_GRAMMAR, ...A2_GRAMMAR, ...B1_GRAMMAR, ...B2_GRAMMAR, ...C1_GRAMMAR, ...C2_GRAMMAR].sort(
  (a, b) => CEFR_LEVELS.indexOf(a.level) - CEFR_LEVELS.indexOf(b.level) || a.order - b.order,
);

export function lessonsOfLevel(level: CefrLevel): GrammarLessonDetail[] {
  return GRAMMAR_LESSONS.filter((l) => l.level === level);
}

export function grammarLessonById(id: string): GrammarLessonDetail | undefined {
  return GRAMMAR_LESSONS.find((l) => l.id === id);
}
