/**
 * Nguồn từ cho các trò hỏi nghĩa nhanh (câu cá trong Thành phố, Chuyến tàu từ
 * vựng): từ ĐANG HỌC (có tiến độ trong bộ từ chủ đề / SAT) để hỏi, và kho từ
 * của các bộ đó để làm nhiễu. Chưa học bộ nào thì dùng ba bộ IELTS đầu tiên.
 */
import { useMemo } from 'react';

import { SAT_VOCAB_LESSONS } from '@/data/lessons/vocab-lessons';
import { VOCAB_TOPICS } from '@/data/vocab-topics';
import type { QuizWord } from '@/services/city/life';
import { useTopicStudyStore } from '@/store/useTopicStudyStore';

/** Từ đang học (có tiến độ) và kho từ chung để làm nhiễu. */
export function useWordPools(): { focus: QuizWord[]; pool: QuizWord[] } {
  const stages = useTopicStudyStore((s) => s.stages);
  return useMemo(() => {
    const bySlug = new Map<string, QuizWord[]>();
    for (const t of VOCAB_TOPICS) bySlug.set(t.slug, t.words.map((w) => ({ word: w.word, meaningVi: w.meaningVi })));
    for (const l of SAT_VOCAB_LESSONS) bySlug.set(l.slug, l.words.map((w) => ({ word: w.word, meaningVi: w.meaningVi })));
    const focus: QuizWord[] = [];
    const pool: QuizWord[] = [];
    for (const [slug, words] of Object.entries(stages ?? {})) {
      const lesson = bySlug.get(slug);
      if (!lesson) continue;
      pool.push(...lesson);
      const learning = new Set(Object.keys(words ?? {}));
      focus.push(...lesson.filter((w) => learning.has(w.word)));
    }
    // Chưa học bộ nào (hoặc quá ít để làm nhiễu): thêm ba bộ IELTS đầu tiên.
    if (pool.length < 40) for (const t of VOCAB_TOPICS.slice(0, 3)) pool.push(...t.words.map((w) => ({ word: w.word, meaningVi: w.meaningVi })));
    return { focus, pool };
  }, [stages]);
}

