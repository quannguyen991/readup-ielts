/**
 * LỘ TRÌNH HỌC THEO TRÌNH ĐỘ — kiểu dữ liệu.
 *
 * Người dùng duyệt 01/10/2026: chọn kỳ thi (IELTS | SAT) và trình độ, mỗi trình
 * độ là 5–7 PART theo chủ đề, mỗi Part 4–7 bài. Mỗi bài chỉ là MỘT LỜI GIỚI
 * THIỆU tự viết (học gì, vì sao) + đường dẫn tới nội dung CÓ SẴN trong app —
 * không có bài tập mới. "Xong" đọc từ dữ liệu học thật (xem
 * `services/learning-path/progress.ts`); loại nào máy không đo được thì người
 * học tự đánh dấu, và giao diện ghi rõ là tự đánh dấu.
 */

export type Bi = { vi: string; en: string };

export type PathExam = 'ielts' | 'sat';

/**
 * Đích của một bài — luôn là MÃ của nội dung có thật (test đối chiếu với danh
 * mục thật, không có link gãy).
 */
export type PathTarget =
  /** Bộ 50 từ chủ đề IELTS — `/vocabulary/topic/[slug]`. */
  | { kind: 'vocab'; slug: string }
  /** Quiz ôn từ vựng SAT — `/vocabulary/sat-quiz/[slug]`. */
  | { kind: 'sat-vocab'; slug: string }
  /** Bài đọc trong kho (theo slug, ổn định hơn id) — `/read/[id]`. */
  | { kind: 'read'; slug: string }
  /** Bài đọc song ngữ — `/bilingual/[id]`. App không lưu dấu đã đọc → tự đánh dấu. */
  | { kind: 'bilingual'; id: string }
  /** Bộ đề chép chính tả 12 câu — `/sentence/dictation?set=`. */
  | { kind: 'dictation'; set: string }
  /** Bộ dịch câu Việt → Anh — `/sentence/translate?set=`. */
  | { kind: 'translate'; set: string }
  /** Đề Writing Task 1/2 — `/write/[promptId]`. */
  | { kind: 'write'; prompt: string }
  /**
   * Phòng luyện nói theo đúng chủ đề — `/speaking?mode=p1&p1=` (Part 1) hoặc
   * `?mode=p2|p3&cue=` (thẻ đề Part 2 và câu Part 3 đi kèm).
   */
  | { kind: 'speak'; part: 'p1' | 'p2' | 'p3'; topic: string }
  /** Bài lý thuyết SAT Math — `/math/learn/[skill]`. */
  | { kind: 'math-lesson'; skill: string }
  /** Bộ đề SAT Math trong lộ trình kỹ năng — `/math/set/[setId]`. */
  | { kind: 'math-set'; set: string }
  /** Chương Lộ trình SAT Math 27 chủ đề — `/sat/lo-trinh/[id]`. */
  | { kind: 'sat-chapter'; id: string }
  /** Bài lý thuyết SAT Verbal — `/sat-rw/learn/[skill]`. */
  | { kind: 'rw-lesson'; skill: string }
  /** Bộ câu SAT Reading & Writing — `/sat-rw/set/[setId]`. */
  | { kind: 'rw-set'; set: string };

export type PathTargetKind = PathTarget['kind'];

export type PathNode = {
  /** Mã bài, duy nhất trong toàn bộ lộ trình (cả hai kỳ thi). */
  id: string;
  title: Bi;
  /** 2–3 câu tự viết: học gì và vì sao. */
  desc: Bi;
  /** Thời gian ước tính, phút. */
  minutes: number;
  target: PathTarget;
};

export type PathPart = {
  id: string;
  /** Tên chủ đề, vd. "Education" — không chấm câu cuối. */
  title: Bi;
  /** Một câu: Part này luyện gì. */
  blurb: Bi;
  nodes: PathNode[];
};

export type PathLevel = {
  id: string;
  exam: PathExam;
  /** Nhãn mức, vd. "4.0–5.0", "~1200". */
  label: string;
  title: Bi;
  blurb: Bi;
  parts: PathPart[];
};
