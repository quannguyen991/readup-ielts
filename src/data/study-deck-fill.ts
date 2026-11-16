import type { StudyDeck } from './study-decks';
import { study4SourceHeadword } from './study4-vocab';
import englishDefinitions from './english-definitions.json';
import exampleFill from './study-example-fill.json';
import toeic600ExamplesA from './seed/vocab-study4/examples-toeic-a.json';
import toeic600ExamplesB from './seed/vocab-study4/examples-toeic-b.json';
import toeic600ExamplesC from './seed/vocab-study4/examples-toeic-c.json';
import idiomExamples from './seed/vocab-study4/examples-idioms.json';

/**
 * Hai việc sửa cho các bộ từ tĩnh (xem `study-decks.ts`), để mọi bộ đủ các dạng câu của màn Học:
 *
 * 1. CÂU VÍ DỤ CHO DẠNG ĐIỀN CHỖ TRỐNG. Dạng này chỉ hiện khi câu ví dụ có đúng từ đó
 *    (`clozeOf`). Một số bộ (Global Success 10–12, SAT Tầng 3…) thiếu câu, nên dạng này
 *    từng biến mất lặng lẽ dù ô cài đặt vẫn bật. `study-example-fill.json` bổ sung câu cho
 *    đúng những từ còn thiếu, theo khoá là chữ gốc của mục.
 *
 * 2. HEADWORD SẠCH. Một số mục ghi cả phần chú thích vào tên từ ("Disease (n) = sickness…"),
 *    nên không khoét được chỗ trống và hiện như một đoạn ghi chú. `headword` lấy phần tên
 *    chính. Các mục đổi tên sẽ mất tiến độ đã lưu của chính từ đó (tiến độ khoá theo tên).
 */

const SPECIAL: Record<string, string> = {
  'Life expectancy = life span = longevity': 'Longevity',
  'on cloud nine/ on top of the world/ over the moon': 'on cloud nine',
  'in the long/ medium/ short term': 'in the long term',
  'ACCUSTOM TO (v)': 'ACCUSTOM',
  'Impose ... (on sb) (v. phr.)': 'Impose',
  'devote to': 'devote',
  'liken to': 'liken',
  'ambiguity vsambivalence': 'ambivalence',
  sypnosis: 'synopsis',
  'AI (artificial intelligence)': 'AI (artificial intelligence)',
  'RAM (Random Access Memory)': 'RAM (Random Access Memory)',
  'CV (curriculum vitae)': 'CV (curriculum vitae)',
};

/** Tên chính của một mục: bỏ phần chú thích kiểu "(n)", "=", "➔", "#", "/". */
export function headword(raw: string): string {
  if (SPECIAL[raw]) return SPECIAL[raw];
  return (raw.split(/\s*(?:\(|=|➔|#|\/)\s*/)[0] ?? raw).trim();
}

const BASE_FILL = exampleFill as Record<string, Record<string, string>>;
const FILL = {
  ...BASE_FILL,
  'study4-600-toeic-words': {
    ...(BASE_FILL['study4-600-toeic-words'] ?? {}),
    ...(toeic600ExamplesA as Record<string, string>),
    ...(toeic600ExamplesB as Record<string, string>),
    ...(toeic600ExamplesC as Record<string, string>),
  },
  'study4-essential-english-idioms': {
    ...(BASE_FILL['study4-essential-english-idioms'] ?? {}),
    ...(idiomExamples as Record<string, string>),
  },
} as Record<string, Record<string, string>>;
/** Định nghĩa tiếng Anh (kiểu từ điển học viên) cho các từ chưa có — khoá "<từ thường>|<nghĩa Việt>". Dùng cho chế độ "Nghĩa hiển thị: Tiếng Anh". */
const DEFINITIONS = englishDefinitions as Record<string, string>;

/** Bộ đã bổ sung câu ví dụ và làm sạch tên mục. Giữ nguyên các mục đã đúng. */
export function fillStudyDeck(deck: StudyDeck): StudyDeck {
  // Tên từ tiếng Nhật có thể chứa ngoặc và dấu phân cách như một phần của mục nguồn.
  // Giữ nguyên dữ liệu OCR thay vì áp dụng quy tắc làm sạch headword dành cho tiếng Anh.
  if (deck.language === 'ja' || deck.language === 'zh' || deck.slug.startsWith('cambridge-')) return deck;
  const fills = FILL[deck.slug] ?? {};
  return {
    ...deck,
    words: deck.words.map((w) => {
      const word = headword(w.word);
      const sourceWord = deck.slug === 'study4-essential-english-idioms' ? study4SourceHeadword(w.word) : w.word;
      const example = fills[w.word] ?? fills[sourceWord] ?? w.example;
      const definitionEn = w.definitionEn?.trim() ? w.definitionEn : (DEFINITIONS[`${word.toLowerCase()}|${w.meaningVi}`] ?? w.definitionEn);
      return word === w.word && example === w.example && definitionEn === w.definitionEn ? w : { ...w, word, example, definitionEn };
    }),
  };
}
