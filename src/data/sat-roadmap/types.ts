/**
 * LỘ TRÌNH SAT MATH THEO CHỦ ĐỀ — kiểu dữ liệu.
 *
 * Người dùng yêu cầu 30/09/2026: lộ trình SAT riêng theo THỨ TỰ CHỦ ĐỀ của
 * giáo trình "The College Panda — SAT Math" (27 chương), lý thuyết song ngữ
 * Việt – Anh, bài tập / quiz nhiều hơn, chia dễ → khó.
 *
 * BẢN QUYỀN: sách ghi rõ không được sao chép. Ở đây bám THỨ TỰ, TÊN CHỦ ĐỀ và
 * DẠNG BÀI của sách (kiến thức toán và cấu trúc bài không phải nội dung có bản
 * quyền), nhưng toàn bộ câu chữ lý thuyết, ví dụ tự viết, và câu hỏi sinh bằng
 * template của app với số và bối cảnh mới (đáp án tính bằng code, có test).
 * Người dùng xác nhận 30/09: "bám sát, nhưng kiến thức và bài tập phải giống".
 */

/** Cặp song ngữ. */
export type Bi = { vi: string; en: string };

export type Level = 'easy' | 'medium' | 'hard';

export type TheoryPoint = {
  title: Bi;
  body: Bi;
  /** Công thức bằng markup toán của app (`src/lib/math/expr.ts`): x^2, frac(a,b), sqrt(…). */
  formula?: string;
};

export type Example = {
  /** Đề (tiếng Anh như đề thật, có markup toán). */
  problem: string;
  steps: Bi[];
  answer: string;
};

export type RoadChapter = {
  /** Số chương, theo thứ tự chủ đề của giáo trình. */
  n: number;
  id: string;
  title: Bi;
  /** Giai đoạn của lộ trình (1 → 4). */
  phase: 1 | 2 | 3 | 4;
  /** Minh hoạ dễ thương cho thẻ chương (khoá trong `CuteFor` / bộ minh hoạ). */
  art: 'calculator' | 'rocket' | 'book' | 'notebook' | 'globe' | 'clock' | 'star' | 'bulb' | 'magnifier' | 'trophy' | 'pencil' | 'chat' | 'calendar' | 'plant' | 'flame';
  subtopics: Bi[];
  theory: TheoryPoint[];
  examples: Example[];
  traps: Bi[];
  /** Template câu hỏi theo mức (slug trong danh bạ template). */
  templates: Record<Level, string[]>;
  /** Trang của chương trong sách (số in trên trang), để người học mở sách đối chiếu. */
  bookPages?: [number, number];
  /**
   * BỘ BÀI BÁM SÁCH: mỗi phần tử ứng với MỘT bài tập cuối chương trong sách,
   * đúng thứ tự — cùng dạng, cùng độ khó, cùng kiểu bẫy, nhưng số và bối cảnh
   * do template sinh (không chép đề sách).
   */
  bookSet?: BookExercise[];
};

export type BookExercise = {
  /** Slug template cùng dạng với bài trong sách. */
  slug: string;
  /** Bài thuộc phần được dùng máy tính trong sách. */
  calc: boolean;
};

export const PHASES: Record<1 | 2 | 3 | 4, { title: Bi; color: string }> = {
  1: { title: { vi: 'Nền tảng số & tỉ lệ', en: 'Numbers & ratios' }, color: '#F2B632' },
  2: { title: { vi: 'Phương trình & đường thẳng', en: 'Equations & lines' }, color: '#A8843F' },
  3: { title: { vi: 'Hàm số & đại số nâng cao', en: 'Functions & advanced algebra' }, color: '#F0703F' },
  4: { title: { vi: 'Hình học, lượng giác & dữ liệu', en: 'Geometry, trig & data' }, color: '#22A06B' },
};

export const LEVEL_LABEL: Record<Level, Bi> = {
  easy: { vi: 'Dễ', en: 'Easy' },
  medium: { vi: 'Trung bình', en: 'Medium' },
  hard: { vi: 'Khó', en: 'Hard' },
};
