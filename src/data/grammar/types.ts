/**
 * Bài ngữ pháp chi tiết theo khung CEFR (A1 → C2).
 *
 * Mỗi bài là chuỗi BƯỚC trình bày rõ ràng: Định nghĩa → Dùng khi nào → Quy tắc → Lỗi hay mắc.
 * Giao diện (LessonShell) vẽ mục lục bên trái từ danh sách bước, nên mọi bài có cùng bố cục.
 */

export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export const CEFR_LEVELS: readonly CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export type GrammarExample = {
  en: string;
  vi: string;
  /** Đoạn trong `en` cần tô nổi bật (khớp đúng một chuỗi con). */
  mark?: string;
};

export type GrammarMistake = { wrong: string; right: string; why: string };

export type GrammarStep = {
  /** Nhãn ở mục lục bên trái: "Định nghĩa", "Dùng khi nào", "Quy tắc 1", "Lỗi hay mắc". */
  label: string;
  /** Tiêu đề lớn của bước. */
  title: string;
  /** Giải thích 1–3 câu bằng tiếng Việt. */
  body: string;
  formula?: string;
  bullets?: string[];
  examples?: GrammarExample[];
  mistakes?: GrammarMistake[];
};

export type GrammarQuizItem = {
  q: string;
  options: string[];
  /** Chỉ số đáp án đúng trong `options`. */
  answer: number;
  /** Vì sao đúng, một câu. */
  explain: string;
};

export type GrammarLessonDetail = {
  /** Duy nhất toàn khoá, ví dụ "a1-to-be". */
  id: string;
  level: CefrLevel;
  /** Thứ tự trong cấp (1, 2, 3…). */
  order: number;
  title: string;
  titleEn: string;
  /** Học xong làm được gì, một câu. */
  summary: string;
  minutes: number;
  steps: GrammarStep[];
  /** Năm câu kiểm tra cuối, không gợi ý. */
  quiz: GrammarQuizItem[];
};
