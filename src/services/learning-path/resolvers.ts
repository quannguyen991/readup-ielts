import { articleIdForSlug } from '@/data/learning-path';
import { questionsForUnit } from '@/data/sat-rw-repository';
import { deckWords } from '@/services/classes/catalog';
import { getSatRwSet } from '@/services/sat-rw/curriculum';

import type { PathResolvers } from './progress';

/**
 * Mã các câu của một bộ SAT Verbal — cắt đúng như màn làm bộ
 * (`app/sat-rw/set/[setId].tsx`). Bộ "sinh mới" không có câu cố định nên
 * không đo được (lộ trình không dùng loại bộ này).
 */
export function rwSetQuestionIds(setId: string): readonly string[] | undefined {
  const set = getSatRwSet(setId);
  if (!set || set.kind === 'generated') return undefined;
  const all = questionsForUnit(set.unitNumber);
  return (set.slice ? all.slice(set.slice.from, set.slice.to) : all).map((q) => q.id);
}

/** Bộ tra cứu dùng chung cho màn lộ trình và test. */
export const PATH_RESOLVERS: PathResolvers = {
  deckWords,
  articleId: articleIdForSlug,
  rwSetQuestions: rwSetQuestionIds,
};
