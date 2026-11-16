import type { StudyWord } from '@/services/vocab/topic-study';

import entries from './seed/vocab-cambridge/entries.json';

/** [phiên âm, từ loại, định nghĩa tiếng Anh, nghĩa tiếng Việt, câu ví dụ, đồng nghĩa, cụm kết hợp]. Dựng bằng `scripts/vocab/build-cambridge-entries.ts`. */
type Row = [string, string, string, string, string, string[], string];
const TABLE = entries as unknown as Record<string, Row>;

const norm = (s: string) => s.normalize('NFKC').toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();

/** Từ khóa của một bài đọc thành một từ học được; không có nghĩa thì trả undefined (từ đó chưa vào bộ học). */
export function camStudyWord(word: string): StudyWord | undefined {
  const row = TABLE[norm(word)];
  if (!row || !row[3]) return undefined;
  const [ipa, pos, definitionEn, meaningVi, example, synonyms, collocation] = row;
  return {
    word,
    pos,
    ipa,
    meaningVi,
    definitionEn,
    example,
    collocation,
    band: 'Cambridge',
    ...(synonyms.length ? { synonyms } : null),
  };
}

export const CAM_ENTRY_COUNT = Object.keys(TABLE).length;
