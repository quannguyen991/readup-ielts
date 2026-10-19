import type { StudyDeck } from './study-decks';
import exampleFill from './study-example-fill.json';

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

const FILL = exampleFill as Record<string, Record<string, string>>;

/** Bộ đã bổ sung câu ví dụ và làm sạch tên mục. Giữ nguyên các mục đã đúng. */
export function fillStudyDeck(deck: StudyDeck): StudyDeck {
  const fills = FILL[deck.slug] ?? {};
  return {
    ...deck,
    words: deck.words.map((w) => {
      const word = headword(w.word);
      const example = fills[w.word] ?? w.example;
      return word === w.word && example === w.example ? w : { ...w, word, example };
    }),
  };
}
