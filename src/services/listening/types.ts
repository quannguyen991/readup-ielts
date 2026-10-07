/**
 * HỢP ĐỒNG DỮ LIỆU ĐỀ LISTENING.
 *
 * Mỗi đề là một tệp `src/data/listening-tests/<id>.json` theo kiểu `ListeningTest`,
 * rồi khai báo trong `src/data/listening-tests/index.ts`. `npm test` chạy bộ kiểm
 * (`validate.ts`) trên MỌI tệp trong thư mục đó.
 *
 * Một đề có 1–4 section. Đủ 4 section (1,2,3,4) = "Full đề" (40 câu); ít hơn =
 * chỉ hiện ở "Bài lẻ" (mỗi section là một thẻ). Số câu là SỐ TOÀN ĐỀ: Section 1 là
 * 1–10, Section 2 là 11–20… Một đề lẻ chỉ có Section 3 thì các câu là 21–30.
 */

export type ListeningLevel = 'easy' | 'medium' | 'hard';

export type ListeningGroupType = 'gap' | 'mcq-one' | 'mcq-many' | 'matching';

export type ListeningOption = { key: string; text: string };

export type TranscriptLine = {
  speaker?: string;
  text: string;
  /** Mốc thời gian (giây) trong tệp âm thanh của section — có thì chữ chạy theo giọng. */
  start?: number;
  end?: number;
};

export type ListeningQuestion = {
  /** Số câu toàn đề. mcq-many: số câu ĐẦU TIÊN; câu phủ n .. n + answer.length - 1. */
  n: number;
  /** mcq-one / matching: đề bài của câu. gap: không cần (chữ nằm ở `lines`). */
  prompt?: string;
  /** gap / mcq-one / matching: một chuỗi. mcq-many: mảng khoá đáp án đúng. */
  answer: string | string[];
  /** Đáp án thay thế được chấp nhận (gap). */
  accept?: string[];
  /** mcq-one: danh sách lựa chọn riêng của câu (nếu nhóm không có `options` chung). */
  options?: ListeningOption[];
};

export type ListeningGroup = {
  type: ListeningGroupType;
  /** Ví dụ 'Questions 1-5'. Thiếu thì app tự dựng từ số câu. */
  title?: string;
  instruction: string;
  /** Ví dụ 'NO MORE THAN TWO WORDS AND/OR A NUMBER'. */
  wordLimit?: string;
  /**
   * gap: mẫu điền, mỗi phần tử một dòng, ô trống là `{{n}}` (n = số câu).
   * Tiền tố `## ` = tiêu đề dòng; dòng bắt đầu bằng `|` là một hàng bảng, các ô
   * cách nhau bằng `|` (ô có thể chứa `{{n}}`).
   */
  lines?: string[];
  /** Danh sách lựa chọn dùng chung cả nhóm (mcq-many, matching, mcq-one dùng chung). */
  options?: ListeningOption[];
  questions: ListeningQuestion[];
};

export type ListeningSection = {
  n: 1 | 2 | 3 | 4;
  title: string;
  context?: string;
  /** Ví dụ '/listening/<id>/s1.mp3' (tệp trong public/). */
  audio: string;
  durationSec?: number;
  transcript: TranscriptLine[];
  groups: ListeningGroup[];
};

export type ListeningTest = {
  id: string;
  title: string;
  titleVi?: string;
  source: 'Band 9 Original' | string;
  level: ListeningLevel;
  cover: { topic: string; category?: string; hue?: number };
  sections: ListeningSection[];
};

/** Đáp án người dùng: chuỗi (gap / mcq-one / matching) hoặc mảng khoá (mcq-many). */
export type ListeningAnswers = Record<number, string | string[]>;

/** Một lượt làm đã lưu (đồng bộ lên tài khoản). */
export type ListeningAttempt = {
  id: string;
  testId: string;
  title: string;
  /** null = cả đề; 1–4 = bài lẻ. */
  section: number | null;
  task?: ListeningGroupType | null;
  mode: 'practice' | 'real';
  startedAt: string;
  finishedAt: string;
  durationSec: number;
  score: number;
  total: number;
  /** Band xấp xỉ (quy đổi theo bảng Listening chuẩn; section lẻ nhân tỉ lệ lên 40). */
  band: number;
  answers: Record<string, string | string[]>;
};
