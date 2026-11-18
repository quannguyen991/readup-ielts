import seed from './seed/vocab-cambridge/index.json';
import ankiSeed from './seed/vocab-cambridge/anki-decks.json';

/** Một bài đọc (Test t · Passage p) và các từ/cụm từ xuất hiện trong đó. Chỉ có từ khóa tiếng Anh, không kèm nghĩa. */
export type CamVocabPassage = { test: number; passage: number; words: string[] };

export type CamVocabBook = { n: number; passages: CamVocabPassage[] };

export type CambridgeAnkiEntry = {
  id: string;
  word: string;
  meaningVi: string;
  definitionEn: string;
  pos: string;
  example: string;
  exampleVi: string;
  forms: string;
  ipa: string;
  synonyms: string[];
  antonyms: string[];
  sourceTags: string[];
  section: 'Reading' | 'Listening' | null;
  test: number | null;
  passage: number | null;
  part: number | null;
  markedDuplicate: boolean;
};

export type CambridgeAnkiGroup = {
  key: string;
  section: 'Reading' | 'Listening' | 'Other';
  test: number | null;
  passage: number | null;
  part: number | null;
  entries: CambridgeAnkiEntry[];
};

type CambridgeAnkiBook = { n: number; deckId: string; noteCount: number; notes: CambridgeAnkiEntry[] };
const ANKI_BOOKS = (ankiSeed as { books: CambridgeAnkiBook[] }).books;
const ANKI_BOOK_BY_NUMBER = new Map(ANKI_BOOKS.map((book) => [book.n, book]));

/** Cambridge IELTS 10–21, mỗi sách 12 bài đọc. Dựng bằng `node scripts/vocab/build-cambridge-vocab.mjs`. */
export const CAM_VOCAB_BOOKS: readonly CamVocabBook[] = (seed as { books: CamVocabBook[] }).books;

/** Books available from either the reading index or the AnkiWeb decks. */
export const CAM_VOCAB_ALL_BOOKS: readonly { n: number }[] = [...new Set([
  ...CAM_VOCAB_BOOKS.map((book) => book.n),
  ...ANKI_BOOKS.map((book) => book.n),
])].sort((a, b) => a - b).map((n) => ({ n }));

export function camVocabCount(book: CamVocabBook): number {
  return book.passages.reduce((sum, p) => sum + p.words.length, 0);
}

export function camVocabBookCount(n: number): number {
  const indexed = getCamVocabBook(n);
  return (indexed ? camVocabCount(indexed) : 0) + camAnkiCount(n);
}

export function getCamVocabBook(n: number): CamVocabBook | undefined {
  return CAM_VOCAB_BOOKS.find((b) => b.n === n);
}

export function getCambridgeAnkiEntries(n: number): CambridgeAnkiEntry[] {
  return ANKI_BOOK_BY_NUMBER.get(n)?.notes ?? [];
}

export function getCambridgeAnkiGroups(n: number): CambridgeAnkiGroup[] {
  const groups = new Map<string, CambridgeAnkiGroup>();
  for (const entry of getCambridgeAnkiEntries(n)) {
    const section = entry.section ?? 'Other';
    const key = section === 'Reading'
      ? `reading-${entry.test ?? 0}-${entry.passage ?? 0}`
      : section === 'Listening'
        ? entry.part
          ? `listening-part-${entry.part}`
          : `listening-test-${entry.test ?? 0}`
        : 'other';
    if (!groups.has(key)) {
      groups.set(key, { key, section, test: entry.test, passage: entry.passage, part: entry.part, entries: [] });
    }
    groups.get(key)!.entries.push(entry);
  }
  const order = (group: CambridgeAnkiGroup) => group.section === 'Reading'
    ? (group.test ?? 0) * 10 + (group.passage ?? 0)
    : group.section === 'Listening'
      ? 100 + (group.test ?? group.part ?? 0) * 10 + (group.part ?? 0)
      : 1000;
  return [...groups.values()].sort((a, b) => order(a) - order(b));
}

export function camAnkiCount(n: number): number {
  return ANKI_BOOK_BY_NUMBER.get(n)?.noteCount ?? 0;
}

/** Ảnh bìa sinh bằng `node scripts/vocab/cam-vocab-covers/render.mjs`. */
export function camVocabCoverUri(n: number): string {
  return n === 9 ? '/books/covers/cam-9.webp' : `/books/cam-vocab/cam-${n}.webp`;
}

export const CAM_VOCAB_TOTAL = CAM_VOCAB_BOOKS.reduce((sum, b) => sum + camVocabCount(b), 0);
export const CAM_VOCAB_PASSAGES = CAM_VOCAB_BOOKS.reduce((sum, b) => sum + b.passages.length, 0);
export const CAM_VOCAB_ANKI_BOOK_COUNT = ANKI_BOOKS.length;
export const CAM_VOCAB_ANKI_TOTAL = ANKI_BOOKS.reduce((sum, book) => sum + book.noteCount, 0);
