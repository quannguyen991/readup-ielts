import { ARTICLES } from '@/data/articles';
import type { PlanInput } from '@/services/plan/custom';

import { IELTS_LEVELS } from './ielts';
import { SAT_LEVELS } from './sat';
import type { Bi, PathExam, PathLevel, PathNode, PathPart, PathTarget, PathTargetKind } from './types';

export * from './types';
export { IELTS_LEVELS, SAT_LEVELS };

export const PATH_LEVELS: Record<PathExam, readonly PathLevel[]> = { ielts: IELTS_LEVELS, sat: SAT_LEVELS };

export function levelsOf(exam: PathExam): readonly PathLevel[] {
  return PATH_LEVELS[exam];
}

export function levelById(id: string | null | undefined): PathLevel | undefined {
  if (!id) return undefined;
  return [...IELTS_LEVELS, ...SAT_LEVELS].find((l) => l.id === id);
}

export function nodesOf(level: PathLevel): PathNode[] {
  return level.parts.flatMap((p) => p.nodes);
}

export function allPathNodes(): PathNode[] {
  return [...IELTS_LEVELS, ...SAT_LEVELS].flatMap(nodesOf);
}

export function partOfNode(level: PathLevel, nodeId: string): PathPart | undefined {
  return level.parts.find((p) => p.nodes.some((n) => n.id === nodeId));
}

/** Bài đọc theo slug → id dùng trong đường dẫn `/read/[id]`. */
export function articleIdForSlug(slug: string): string | undefined {
  return ARTICLES.find((a) => a.slug === slug)?.id;
}

/**
 * Đường dẫn tới nội dung của một bài. `undefined` chỉ khi nội dung không còn
 * trong kho (test canh để không bao giờ xảy ra với dữ liệu đang có).
 */
export function targetHref(t: PathTarget): string | undefined {
  const e = encodeURIComponent;
  switch (t.kind) {
    case 'vocab':
      return `/vocabulary/topic/${e(t.slug)}`;
    case 'sat-vocab':
      return `/vocabulary/sat-quiz/${e(t.slug)}`;
    case 'read': {
      const id = articleIdForSlug(t.slug);
      return id ? `/read/${e(id)}` : undefined;
    }
    case 'bilingual':
      return `/bilingual/${e(t.id)}`;
    case 'dictation':
      return `/sentence/dictation?set=${e(t.set)}`;
    case 'translate':
      return `/sentence/translate?set=${e(t.set)}`;
    case 'write':
      return `/write/${e(t.prompt)}`;
    case 'speak':
      return t.part === 'p1' ? `/speaking?mode=p1&p1=${e(t.topic)}` : `/speaking?mode=${t.part}&cue=${e(t.topic)}`;
    case 'math-lesson':
      return `/math/learn/${e(t.skill)}`;
    case 'math-set':
      return `/math/set/${e(t.set)}`;
    case 'sat-chapter':
      return `/sat/lo-trinh/${e(t.id)}`;
    case 'rw-lesson':
      return `/sat-rw/learn/${e(t.skill)}`;
    case 'rw-set':
      return `/sat-rw/set/${e(t.set)}`;
  }
}

/** Nhãn kỹ năng của từng loại bài (hiện trên thẻ bài). */
export const KIND_SKILL: Record<PathTargetKind, Bi> = {
  vocab: { vi: 'Từ vựng', en: 'Vocabulary' },
  'sat-vocab': { vi: 'Từ vựng', en: 'Vocabulary' },
  read: { vi: 'Reading', en: 'Reading' },
  bilingual: { vi: 'Đọc song ngữ', en: 'Bilingual reading' },
  dictation: { vi: 'Nghe chép', en: 'Listening' },
  translate: { vi: 'Dịch câu', en: 'Translation' },
  write: { vi: 'Writing', en: 'Writing' },
  speak: { vi: 'Speaking', en: 'Speaking' },
  'math-lesson': { vi: 'Lý thuyết Toán', en: 'Math lesson' },
  'math-set': { vi: 'Bộ đề Toán', en: 'Math practice' },
  'sat-chapter': { vi: 'Chương SAT Math', en: 'SAT Math chapter' },
  'rw-lesson': { vi: 'Lý thuyết Verbal', en: 'Verbal lesson' },
  'rw-set': { vi: 'Bộ câu Verbal', en: 'Verbal practice' },
};

/**
 * Trình độ mặc định theo lộ trình người học đã khai (`useRoadmapStore`).
 * Không biết điểm hiện tại thì lấy mục tiêu trừ một bậc — đúng giả định của
 * `services/plan/custom.ts`. Chưa khai gì thì là trình độ đầu.
 */
export function defaultLevelFor(exam: PathExam, input: PlanInput | null): PathLevel {
  const levels = levelsOf(exam);
  const g = input?.[exam] ?? null;
  if (!g) return levels[0]!;
  if (exam === 'ielts') {
    const est = g.now ?? g.target - 1;
    return est >= 7 ? levels[2]! : est >= 5.5 ? levels[1]! : levels[0]!;
  }
  const est = g.now ?? g.target - 150;
  return est >= 1300 ? levels[2]! : est >= 1100 ? levels[1]! : levels[0]!;
}

/** Kỳ thi mặc định: chỉ khai SAT thì SAT, còn lại IELTS. */
export function defaultExamFor(input: PlanInput | null): PathExam {
  return input?.sat && !input.ielts ? 'sat' : 'ielts';
}
