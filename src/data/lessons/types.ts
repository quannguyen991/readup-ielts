/**
 * Bài học lý thuyết SAT — theo mô hình Học → Luyện → Chứng minh (Kaplan "Learn
 * it / Drill it / Prove it", Khan Academy "bài học → bài tập → unit test"):
 *
 *   1. HỌC:  mục tiêu, kiến thức cốt lõi, ví dụ giải từng bước, bẫy, mẹo.
 *   2. LUYỆN: ba câu tự kiểm tra ngay cuối bài, chấm tức thì.
 *   3. CHỨNG MINH: sang danh sách bộ đề của đúng kỹ năng đó.
 *
 * Nội dung VIẾT TAY, không sinh bằng AI. Toán trong bài dùng markup của
 * `lib/math/expr.ts` (x^2, frac(a,b), sqrt(…)) và được `validateMath` kiểm ở test.
 */

export type LessonLevel = 'Nền tảng' | 'Trung bình' | 'Nâng cao';

export type LessonBlock =
  /** Một ý kiến thức: tên ngắn, giải thích, công thức (tuỳ chọn). */
  | { kind: 'rule'; title: string; body: string; formula?: string }
  /** Ví dụ giải từng bước. */
  | { kind: 'example'; problem: string; steps: string[]; answer: string }
  /** Cái bẫy đề hay giăng. */
  | { kind: 'trap'; text: string }
  /** Mẹo làm nhanh / chiến thuật phòng thi. */
  | { kind: 'tip'; text: string };

export type TheoryLesson = {
  /** = mã kỹ năng (MathSkill hoặc skill của SAT Verbal). */
  skill: string;
  title: string;
  englishName: string;
  level: LessonLevel;
  minutes: number;
  /** Học xong bài này bạn làm được gì — một câu. */
  goal: string;
  /** Kiến thức tiên quyết cần nhớ lại trước khi học. */
  prerequisite?: string;
  /** Dấu hiệu nhận ra kỹ năng này trong một câu hỏi SAT. */
  recognize?: string;
  /** Ý chính để tự nhắc lại sau khi học. */
  summary?: string;
  blocks: LessonBlock[];
};
