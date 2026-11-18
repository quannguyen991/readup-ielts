import { getDictationSet } from '@/data/dictation-sets';
import { SENTENCE_NOTES } from '@/data/sentence-notes';
import { getTranslationSet } from '@/data/translation-sets';
import type { ExpressTarget } from './expression-check';

/**
 * Đề cho bài TỰ DIỄN ĐẠT, dựng từ hai kho bộ đề đã có: nghĩa tiếng Việt là đề,
 * câu tiếng Anh là đáp án mẫu để so ý và cấu trúc. Không viết thêm nội dung.
 */
export type ExpressSet = { id: string; title: string; kind: 'dictation' | 'translation'; items: ExpressTarget[] };

export function expressSetOf(setId: string): ExpressSet | null {
  const dset = getDictationSet(setId);
  if (dset) {
    return {
      id: dset.id,
      title: dset.title,
      kind: 'dictation',
      items: dset.sentences.map((s, i) => {
        const id = `${dset.id}-${String(i + 1).padStart(2, '0')}`;
        const note = SENTENCE_NOTES[id];
        return {
          id,
          en: s.en,
          vi: s.vi,
          ...(note ? { structureIds: note.s, equivalents: note.y } : {}),
        };
      }),
    };
  }
  const tset = getTranslationSet(setId);
  if (tset) {
    return {
      id: tset.id,
      title: tset.title,
      kind: 'translation',
      items: tset.items.map((it) => ({ id: it.id, en: it.en, vi: it.vi, hintVi: it.hint })),
    };
  }
  return null;
}
