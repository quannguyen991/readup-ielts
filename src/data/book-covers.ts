import type { DeckSource } from '@/components/vocab/deck-style';

/**
 * Bìa các bộ sách trong thư viện bộ từ. Ảnh sinh bằng `node scripts/vocab/book-covers/render.mjs`
 * từ `scripts/vocab/book-covers/books.json`; thứ tự id ở đây PHẢI giống thứ tự trong file đó,
 * vì màu mỗi bìa suy ra từ vị trí của nó.
 */
export const BOOK_COVER_IDS = [
  'vfi', 'vfia', 'gs10', 'gs11', 'gs12', 'listening', 'ielts-topics', 'oxford', 'daily',
  'dest-b1', 'dest-b2', 'dest-c1c2', 'sat-math', 'sat-verbal', 'toeic', 'toefl',
  'study4-common-ielts-listening', 'study4-barrons-essentials-ielts', 'study4-toeic-word-list', 'study4-600-toeic-words',
  'study4-barrons-sat-words', 'study4-college-panda-400-sat', 'study4-new-academic-word-list', 'study4-business-word-list',
  'study4-toefl-word-list', 'study4-powerscore-gre-repeat-offenders', 'study4-essential-english-idioms',
] as const;

export type BookCoverId = (typeof BOOK_COVER_IDS)[number];

export function bookCoverUri(id: string): string {
  return `/books/vocab-books/${id}.webp`;
}

/** Góc màu của bìa (cùng công thức với `palette()` trong gen.html), dùng để tô nền banner cho hợp bìa. */
export function bookHue(id: string): number {
  const i = Math.max(0, (BOOK_COVER_IDS as readonly string[]).indexOf(id));
  return (i * 137.508 + 252) % 360;
}

/** Nhóm bộ từ nào có bìa riêng, theo thứ tự bìa hiện ra (nhóm nhiều sách có nhiều bìa). */
export const SOURCE_BOOKS: Partial<Record<DeckSource, readonly BookCoverId[]>> = {
  vfi: ['vfi'],
  vfia: ['vfia'],
  listening: ['listening'],
  ielts: ['ielts-topics'],
  oxford: ['oxford'],
  daily: ['daily'],
  satMath: ['sat-math'],
  satVerbal: ['sat-verbal'],
  toeic: ['toeic'],
  toefl: ['toefl'],
  globalSuccess: ['gs10', 'gs11', 'gs12'],
  destination: ['dest-b1', 'dest-b2', 'dest-c1c2'],
};

/** Tên sách cho nhóm có nhiều sách (Global Success, Destination). */
export const BOOK_NAMES: Partial<Record<BookCoverId, { vi: string; en: string }>> = {
  gs10: { vi: 'Global Success 10', en: 'Global Success 10' },
  gs11: { vi: 'Global Success 11', en: 'Global Success 11' },
  gs12: { vi: 'Global Success 12', en: 'Global Success 12' },
  'dest-b1': { vi: 'Destination B1', en: 'Destination B1' },
  'dest-b2': { vi: 'Destination B2', en: 'Destination B2' },
  'dest-c1c2': { vi: 'Destination C1 & C2', en: 'Destination C1 & C2' },
};

/** Bộ thuộc sách nào, suy từ mã bộ; nhóm không chia sách thì trả undefined. */
export function bookIdOfDeck(slug: string): BookCoverId | undefined {
  const gs = slug.match(/^global-success-(10|11|12)-/);
  if (gs) return `gs${gs[1]}` as BookCoverId;
  const dest = slug.match(/^destination-(b1|b2|c1c2)-/);
  if (dest) return `dest-${dest[1]}` as BookCoverId;
  return undefined;
}

/** Bộ bổ trợ mỗi bộ là một cuốn: mã bộ chính là mã bìa. */
export function hasOwnCover(slug: string): boolean {
  return (BOOK_COVER_IDS as readonly string[]).includes(slug);
}
