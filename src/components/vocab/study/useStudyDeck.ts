import { useMemo } from 'react';

import { getStaticDeck, NOTEBOOK_SLUG, notebookDeck, type StudyDeck } from '@/data/study-decks';
import { useVocabStore } from '@/store/useVocabStore';
import { CUSTOM_PREFIX, useCustomDeckStore } from '@/store/useCustomDeckStore';

/** Bộ học theo slug; sổ từ dựng lại khi người dùng lưu thêm từ. */
export function useStudyDeck(slug: string): StudyDeck | undefined {
  const entries = useVocabStore((s) => s.entries);
  const custom = useCustomDeckStore((s) => (slug.startsWith(CUSTOM_PREFIX) ? s.decks[slug.slice(CUSTOM_PREFIX.length)] : undefined));
  return useMemo(() => {
    if (slug.startsWith(CUSTOM_PREFIX)) {
      return custom && custom.words.length >= 4
        ? { slug, kind: 'custom' as const, name: 'My deck', nameVi: custom.name, blurb: `Bộ tự tạo · ${custom.words.length} từ`, words: custom.words }
        : undefined;
    }
    if (slug === NOTEBOOK_SLUG) {
      const deck = notebookDeck(Object.values(entries));
      return deck.words.length >= 4 ? deck : undefined;
    }
    return getStaticDeck(slug);
  }, [slug, entries, custom]);
}
