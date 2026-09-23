import { useMemo } from 'react';

import { getStaticDeck, NOTEBOOK_SLUG, notebookDeck, type StudyDeck } from '@/data/study-decks';
import { useVocabStore } from '@/store/useVocabStore';

/** Bộ học theo slug; sổ từ dựng lại khi người dùng lưu thêm từ. */
export function useStudyDeck(slug: string): StudyDeck | undefined {
  const entries = useVocabStore((s) => s.entries);
  return useMemo(() => {
    if (slug === NOTEBOOK_SLUG) {
      const deck = notebookDeck(Object.values(entries));
      return deck.words.length >= 4 ? deck : undefined;
    }
    return getStaticDeck(slug);
  }, [slug, entries]);
}
