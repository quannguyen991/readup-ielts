import { BOOK_VOCAB_BOOKS, type BookVocabTheme, type VocabTopicWord } from '@/data/vocab-topics';

/**
 * Chủ đề của từng từ tiếng Trung. Sách HSK 3.0 không ghi chủ đề, nên tra ngược từ sách HSK 2.0 cộng đồng
 * (đã chia theo cấp và chủ đề, ví dụ "HSK 1 · Con người, gia đình và quan hệ"). Từ không có trong sách đó
 * được xếp vào nhóm "Chưa phân chủ đề".
 */

export const UNSORTED_THEME = 'Chưa phân chủ đề';

export type ThemeGroup = { theme: string; words: VocabTopicWord[] };

type Entry = { theme: string; level: number };

const COMMUNITY_BY_WORD: Map<string, Entry[]> = (() => {
  const map = new Map<string, Entry[]>();
  for (const book of BOOK_VOCAB_BOOKS) {
    if (book.language !== 'zh' || !book.slug.includes('community')) continue;
    for (const topic of book.topics) {
      const m = topic.nameVi.match(/^HSK\s*(\d)\s*·\s*(.+)$/);
      if (!m) continue;
      const entry: Entry = { theme: m[2]!.trim(), level: Number(m[1]) };
      for (const w of topic.words) {
        const list = map.get(w.word) ?? [];
        list.push(entry);
        map.set(w.word, list);
      }
    }
  }
  return map;
})();

/** Cấp HSK của một bộ theo tên ("HSK 4 · …" → 4, "HSK 7-9" → 7); không đọc được thì null. */
export function levelOfName(name: string): number | null {
  const m = name.match(/HSK\s*(\d)/);
  return m ? Number(m[1]) : null;
}

/** Chủ đề của một từ, ưu tiên đúng cấp HSK; không có thì null. */
export function themeOfWord(word: string, level: number | null): string | null {
  const list = COMMUNITY_BY_WORD.get(word);
  if (!list?.length) return null;
  const same = level == null ? undefined : list.find((e) => e.level === level);
  return (same ?? list[0]!).theme;
}

/** Gom các từ của một cấp theo chủ đề, nhóm nhiều từ nhất đứng trước; "Chưa phân chủ đề" luôn đứng cuối. */
export function groupWordsByTheme(topic: BookVocabTheme): ThemeGroup[] {
  const level = levelOfName(topic.nameVi);
  const groups = new Map<string, VocabTopicWord[]>();
  for (const lesson of topic.lessons) {
    for (const w of lesson.words) {
      const theme = themeOfWord(w.word, level) ?? UNSORTED_THEME;
      const list = groups.get(theme) ?? [];
      list.push(w);
      groups.set(theme, list);
    }
  }
  return [...groups.entries()]
    .map(([theme, words]) => ({ theme, words }))
    .sort((a, b) => {
      if (a.theme === UNSORTED_THEME) return 1;
      if (b.theme === UNSORTED_THEME) return -1;
      return b.words.length - a.words.length;
    });
}
