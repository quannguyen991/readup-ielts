import { useMemo } from 'react';

import { getStaticDeck, NOTEBOOK_SLUG, notebookDeck, type StudyDeck } from '@/data/study-decks';
import { useVocabStore } from '@/store/useVocabStore';
import { CUSTOM_PREFIX, useCustomDeckStore } from '@/store/useCustomDeckStore';
import { useTopicStudyStore } from '@/store/useTopicStudyStore';
import { findTopicWordInfo } from '@/services/vocab/spaced-repetition';
import { useL } from '@/i18n/useL';
import { applyMeaningLang } from '@/services/vocab/meaning-lang';

/** Bộ học theo slug; sổ từ dựng lại khi người dùng lưu thêm từ hoặc học trong chủ đề. */
const NO_ENTRIES: Record<string, never> = {};
const NO_STAGES: Record<string, Record<string, 0 | 1 | 2>> = {};

export function useStudyDeck(slug: string): StudyDeck | undefined {
  const { L } = useL();
  // Ngôn ngữ nghĩa (Việt/Anh): đổi thì nghĩa của mọi từ trong bộ đổi theo ở mọi màn học.
  const meaningLang = useTopicStudyStore((s) => s.meaningLang);
  // Chỉ SỔ TỪ mới phụ thuộc tiến độ mọi bộ; bộ thường thì không đăng ký store nào — nếu không,
  // mỗi câu trả lời (đổi `stages`) làm dựng lại cả bộ và vẽ lại cả màn học.
  const notebook = slug === NOTEBOOK_SLUG;
  const entries = useVocabStore((s) => (notebook ? s.entries : NO_ENTRIES));
  const stages = useTopicStudyStore((s) => (notebook ? s.stages : NO_STAGES));
  const custom = useCustomDeckStore((s) => (slug.startsWith(CUSTOM_PREFIX) ? s.decks[slug.slice(CUSTOM_PREFIX.length)] : undefined));
  const base = useMemo(() => {
    if (slug.startsWith(CUSTOM_PREFIX)) {
      return custom && custom.words.length >= 4
        ? { slug, kind: 'custom' as const, name: 'My deck', nameVi: custom.name, blurb: L(`Bộ tự tạo · ${custom.words.length} từ`, `Custom deck · ${custom.words.length} words`), words: custom.words }
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
                  articleTitle: L(`Chủ đề: ${topicSlug}`, `Topic: ${topicSlug}`),
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
  }, [slug, entries, stages, custom, L]);
  return useMemo(() => (base && meaningLang !== 'vi' ? { ...base, words: [...applyMeaningLang(base.words, meaningLang)] } : base), [base, meaningLang]);
}
