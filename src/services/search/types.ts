import type { Bi } from '@/i18n/useL';

/**
 * Loại mục trong chỉ mục tìm kiếm — cũng là cách bảng kết quả gom nhóm.
 *
 * Gom theo VIỆC NGƯỜI HỌC LÀM (đọc, nghe, viết…) chứ không theo tệp dữ liệu:
 * người tìm "môi trường" muốn thấy bài đọc, bộ từ và đề Writing về môi trường
 * nằm thành từng cụm, không quan tâm chúng nằm ở kho nào.
 */
export type SearchKind =
  | 'page'
  | 'path'
  | 'lesson'
  | 'practice'
  | 'vocab'
  | 'reading'
  | 'listening'
  | 'writing'
  | 'speaking'
  | 'test';

export type SearchSkill =
  | 'reading'
  | 'listening'
  | 'writing'
  | 'speaking'
  | 'vocab'
  | 'math'
  | 'verbal'
  | 'general';

export type SearchExam = 'ielts' | 'sat' | 'both';

export type SearchEntry = {
  /** Duy nhất trong cả chỉ mục, dạng `<nguồn>:<mã>`. */
  id: string;
  kind: SearchKind;
  title: Bi;
  subtitle?: Bi;
  /** Từ khoá phụ (cả Việt lẫn Anh) — chủ đề, dạng bài, tên kỹ năng. */
  keywords: string[];
  exam: SearchExam;
  skill: SearchSkill;
  /** Nhãn trình độ ngắn: "B2", "Band 6–7", "Nâng cao"… */
  level?: string;
  href: string;
};

/** Thứ tự nhóm trong bảng kết quả, kèm tên nhóm. */
export const KIND_ORDER: SearchKind[] = [
  'page',
  'path',
  'lesson',
  'practice',
  'vocab',
  'reading',
  'listening',
  'writing',
  'speaking',
  'test',
];

export const KIND_LABEL: Record<SearchKind, Bi> = {
  page: { vi: 'Mục trong app', en: 'App sections' },
  path: { vi: 'Lộ trình', en: 'Learning paths' },
  lesson: { vi: 'Bài học lý thuyết', en: 'Theory lessons' },
  practice: { vi: 'Luyện kỹ năng SAT', en: 'SAT skill practice' },
  vocab: { vi: 'Từ vựng', en: 'Vocabulary' },
  reading: { vi: 'Bài đọc', en: 'Reading' },
  listening: { vi: 'Nghe & chép', en: 'Listening & dictation' },
  writing: { vi: 'Writing & dịch', en: 'Writing & translation' },
  speaking: { vi: 'Speaking', en: 'Speaking' },
  test: { vi: 'Thi thử', en: 'Practice tests' },
};
