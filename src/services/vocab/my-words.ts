import type { VocabEntry } from '@/store/useVocabStore';

/**
 * "Thêm vào từ mới" từ thẻ chạm-vào-từ — dùng CHUNG sổ từ (`useVocabStore`) với
 * "Lưu vào sổ từ" khi đọc bài, nên từ thêm ở đây tự vào lịch ôn FSRS, hiện ở
 * bộ "Sổ từ" của thư viện và đi theo cơ chế đồng bộ sẵn có. Module thuần để test.
 */

export const MY_WORDS_CAP = 1500;

export type MyWordInput = Omit<VocabEntry, 'id' | 'createdAt' | 'masteryPercent'>;

export type MyWordsApi = {
  entries: Record<string, VocabEntry>;
  saveWord: (input: MyWordInput) => string;
  removeWord: (id: string) => void;
};

export type WordForSave = {
  word: string;
  lemma: string;
  phonetic: string | null;
  partOfSpeech: string | null;
  definitionVi: string | null;
  definitionGeneral: string | null;
  definitionContext?: string | null;
};

/** Khoá so khớp không phân biệt hoa thường. */
export function lemmaKey(s: string): string {
  return s.trim().toLowerCase();
}

/** Mục đã có trong sổ (bất kể nơi gặp), so không phân biệt hoa thường. */
export function findMyWord(entries: Record<string, VocabEntry>, lemma: string): VocabEntry | null {
  const k = lemmaKey(lemma);
  return Object.values(entries).find((e) => lemmaKey(e.lemma) === k) ?? null;
}

export function addMyWord(
  api: MyWordsApi,
  w: WordForSave,
  context: { sentence: string; source: string },
): { status: 'added' | 'exists' | 'full'; id: string | null } {
  const lemma = lemmaKey(w.lemma || w.word);
  if (!lemma) return { status: 'full', id: null };
  const existing = findMyWord(api.entries, lemma);
  if (existing) return { status: 'exists', id: existing.id };
  if (Object.keys(api.entries).length >= MY_WORDS_CAP) return { status: 'full', id: null };

  const id = api.saveWord({
    word: w.word.trim(),
    lemma,
    phonetic: w.phonetic,
    partOfSpeech: w.partOfSpeech,
    definitionContext: w.definitionContext ?? null,
    definitionGeneral: w.definitionGeneral,
    definitionVi: w.definitionVi,
    exampleSentence: context.sentence || null,
    sourceSentence: context.sentence || w.word,
    articleId: null,
    articleTitle: context.source,
    paragraphIndex: null,
    isCollocation: lemma.includes(' '),
  });
  return { status: 'added', id };
}

export function undoMyWord(api: MyWordsApi, lemma: string): boolean {
  const e = findMyWord(api.entries, lemma);
  if (!e) return false;
  api.removeWord(e.id);
  return true;
}
