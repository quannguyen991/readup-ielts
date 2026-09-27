import { useMemo } from 'react';

import { getStaticDeck, NOTEBOOK_SLUG, notebookDeck, type StudyDeck } from '@/data/study-decks';
import { useVocabStore } from '@/store/useVocabStore';
import { CUSTOM_PREFIX, useCustomDeckStore } from '@/store/useCustomDeckStore';
import { useTopicStudyStore } from '@/store/useTopicStudyStore';
import { findTopicWordInfo } from '@/services/vocab/spaced-repetition';

/** Bộ học theo slug; sổ từ dựng lại khi người dùng lưu thêm từ hoặc học trong chủ đề. */
export function useStudyDeck(slug: string): StudyDeck | undefined {
  const entries = useVocabStore((s) => s.entries);
  const stages = useTopicStudyStore((s) => s.stages);
  const custom = useCustomDeckStore((s) => (slug.startsWith(CUSTOM_PREFIX) ? s.decks[slug.slice(CUSTOM_PREFIX.length)] : undefined));
  return useMemo(() => {
    if (slug.startsWith(CUSTOM_PREFIX)) {
      return custom && custom.words.length >= 4
        ? { slug, kind: 'custom' as const, name: 'My deck', nameVi: custom.name, blurb: `Bộ tự tạo · ${custom.words.length} từ`, words: custom.words }
        : undefined;
    }
    if (slug === NOTEBOOK_SLUG) {
      const allEntries = { ...entries };
      for (const [topicSlug, wordStages] of Object.entries(stages)) {
        for (const [word, stage] of Object.entries(wordStages)) {
          if (stage >= 1) {
            const lower = word.toLowerCase();
            const exists = Object.values(allEntries).some(
              (e) => (e.lemma || e.word).toLowerCase() === lower,
            );
            if (!exists) {
              const info = findTopicWordInfo(word);
              if (info) {
                const id = `topic_${topicSlug}_${lower}`;
                allEntries[id] = {
                  id,
                  word: info.word,
                  lemma: info.word,
                  phonetic: info.ipa,
                  partOfSpeech: info.pos,
                  definitionContext: info.collocation,
                  definitionGeneral: info.definitionEn,
                  definitionVi: info.meaningVi,
                  exampleSentence: info.example,
                  sourceSentence: info.example,
                  articleId: null,
                  articleTitle: `Chủ đề: ${topicSlug}`,
                  paragraphIndex: null,
                  isCollocation: false,
                  masteryPercent: Math.min(100, stage * 33),
                  createdAt: new Date().toISOString(),
                };
              }
            }
          }
        }
      }
      return notebookDeck(Object.values(allEntries));
    }
    return getStaticDeck(slug);
  }, [slug, entries, stages, custom]);
}
