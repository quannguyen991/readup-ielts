import seed from './seed/vocab-cambridge/index.json';

/** Một bài đọc (Test t · Passage p) và các từ/cụm từ xuất hiện trong đó. Chỉ có từ khóa tiếng Anh, không kèm nghĩa. */
export type CamVocabPassage = { test: number; passage: number; words: string[] };

export type CamVocabBook = { n: number; passages: CamVocabPassage[] };

/** Cambridge IELTS 10–21, mỗi sách 12 bài đọc. Dựng bằng `node scripts/vocab/build-cambridge-vocab.mjs`. */
export const CAM_VOCAB_BOOKS: readonly CamVocabBook[] = (seed as { books: CamVocabBook[] }).books;

export function camVocabCount(book: CamVocabBook): number {
  return book.passages.reduce((sum, p) => sum + p.words.length, 0);
}

export function getCamVocabBook(n: number): CamVocabBook | undefined {
  return CAM_VOCAB_BOOKS.find((b) => b.n === n);
}

/** Ảnh bìa sinh bằng `node scripts/vocab/cam-vocab-covers/render.mjs`. */
export function camVocabCoverUri(n: number): string {
  return `/books/cam-vocab/cam-${n}.webp`;
}

export const CAM_VOCAB_TOTAL = CAM_VOCAB_BOOKS.reduce((sum, b) => sum + camVocabCount(b), 0);
export const CAM_VOCAB_PASSAGES = CAM_VOCAB_BOOKS.reduce((sum, b) => sum + b.passages.length, 0);
