/**
 * Nguồn từ cho các trò hỏi nghĩa nhanh của Quest (câu cá trong Thành phố, Toa
 * Từ Vựng). Người học CHỌN bộ từ (`useQuestVocabStore`): tự động (từ đang học),
 * ôn hôm nay, sổ từ, bộ tự tạo, chủ đề IELTS, bài SAT — luật chọn ở
 * `services/vocab/quest-words.ts`. Mỗi từ hỏi mang `slug` của bộ để màn chơi ghi
 * kết quả vào lịch ôn (`recordQuestAnswer`).
 */
import { useMemo } from 'react';

import { NOTEBOOK_SLUG, notebookDeck } from '@/data/study-decks';
import { SAT_VOCAB_LESSONS } from '@/data/lessons/vocab-lessons';
import { VOCAB_TOPICS } from '@/data/vocab-topics';
import { questWords, dueCount, type QuestDeck, type QuestSource, type SlugWord } from '@/services/vocab/quest-words';
import type { QuizWord } from '@/services/city/life';
import { CUSTOM_PREFIX, useCustomDeckStore } from '@/store/useCustomDeckStore';
import { todayKey } from '@/store/persist';
import { useQuestVocabStore } from '@/store/useQuestVocabStore';
import { useTopicStudyStore } from '@/store/useTopicStudyStore';
import { useVocabStore } from '@/store/useVocabStore';

const toQuiz = (w: { word: string; meaningVi: string }): QuizWord => ({ word: w.word, meaningVi: w.meaningVi });

const STATIC_DECKS: QuestDeck[] = [
  ...VOCAB_TOPICS.map((t) => ({ slug: t.slug, name: t.nameVi || t.name, group: 'ielts' as const, words: t.words.map(toQuiz) })),
  ...SAT_VOCAB_LESSONS.map((l) => ({ slug: l.slug, name: `${l.subject === 'math' ? 'SAT Math' : 'SAT Verbal'} · ${l.title}`, group: 'sat' as const, words: l.words.map(toQuiz) })),
];

/** Mọi bộ có thể chọn: sổ từ + bộ tự tạo + bộ có sẵn. */
export function useQuestDecks(): QuestDeck[] {
  const entries = useVocabStore((s) => s.entries);
  const custom = useCustomDeckStore((s) => s.decks);
  return useMemo(() => {
    const mine: QuestDeck[] = [];
    const nb = notebookDeck(Object.values(entries));
    if (nb.words.length >= 4) mine.push({ slug: NOTEBOOK_SLUG, name: 'Sổ từ của bạn', group: 'mine', words: nb.words.filter((w) => !!w.meaningVi).map(toQuiz) });
    for (const d of Object.values(custom).sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
      if (d.words.length >= 4) mine.push({ slug: `${CUSTOM_PREFIX}${d.id}`, name: d.name, group: 'mine', words: d.words.map(toQuiz) });
    return [...mine, ...STATIC_DECKS];
  }, [entries, custom]);
}

export type WordPools = { focus: SlugWord[]; pool: QuizWord[]; label: string; source: QuestSource; due: number };

/** Từ sẽ hỏi (theo bộ đang chọn) và kho từ làm nhiễu. */
export function useWordPools(): WordPools {
  const decks = useQuestDecks();
  const source = useQuestVocabStore((s) => s.source);
  const stages = useTopicStudyStore((s) => s.stages);
  const reviews = useTopicStudyStore((s) => s.reviews);
  return useMemo(() => {
    const today = todayKey();
    return { ...questWords(source, decks, stages, reviews, today), due: dueCount(reviews, today) };
  }, [source, decks, stages, reviews]);
}

/**
 * Ghi một câu trả lời Quest vào lịch ôn của bộ từ gốc — trả lời trong Quest là
 * ôn thật (đúng → lên hộp, sai → hỏi lại ngày mai). Chỉ gọi MỘT lần mỗi câu.
 */
export function recordQuestAnswer(focus: readonly SlugWord[], word: string, correct: boolean): void {
  const hit = focus.find((w) => w.word === word);
  if (hit) useTopicStudyStore.getState().review(hit.slug, word, correct);
}
