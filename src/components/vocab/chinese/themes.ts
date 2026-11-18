import { BOOK_VOCAB_BOOKS, type BookVocabTheme, type VocabTopicWord } from '@/data/vocab-topics';

/**
 * Chủ đề của từ tiếng Trung. Với HSK 3.0 và Hán ngữ 2006, khớp từ với taxonomy HSK 2.0 cộng đồng;
 * từ Hán ngữ không khớp được giữ theo bài nguồn để người học vẫn tìm đủ danh sách.
 */

export const UNSORTED_THEME = 'Chưa phân chủ đề';

export type ThemeGroup = { theme: string; words: VocabTopicWord[]; sourceLesson?: boolean };

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
  const isHanyuCourse = topic.lessons.some((lesson) => lesson.slug.startsWith('book-hanyu-revised-2006-'));
  const groups = new Map<string, ThemeGroup>();
  for (const lesson of topic.lessons) {
    for (const w of lesson.words) {
      const matchedTheme = themeOfWord(w.word, level);
      // Hán ngữ 2006 không có taxonomy HSK trong dữ liệu gốc. Từ chưa khớp một
      // chủ đề HSK vẫn được phân loại theo bài nguồn, thay vì dồn vào nhóm "khác".
      const sourceLesson = isHanyuCourse && !matchedTheme;
      const theme = matchedTheme ?? (sourceLesson ? `Theo bài · ${lesson.nameVi}` : UNSORTED_THEME);
      const key = sourceLesson ? `lesson:${lesson.slug}` : `theme:${theme}`;
      const group: ThemeGroup = groups.get(key) ?? { theme, words: [], ...(sourceLesson ? { sourceLesson: true } : {}) };
      group.words.push(w);
      groups.set(key, group);
    }
  }
  return [...groups.values()].sort((a, b) => {
    if (a.sourceLesson !== b.sourceLesson) return a.sourceLesson ? 1 : -1;
    if (a.theme === UNSORTED_THEME) return 1;
    if (b.theme === UNSORTED_THEME) return -1;
    return a.sourceLesson ? 0 : b.words.length - a.words.length;
  });
}
