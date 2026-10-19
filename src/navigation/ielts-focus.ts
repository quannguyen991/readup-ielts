/**
 * "Học gì với IELTS": người học tick kỹ năng và tính năng muốn dùng. Thanh bên chỉ
 * hiện những trang con đã chọn của mục IELTS, để danh sách không dài 14 dòng.
 *
 * Khoá ở đây là `key` của các trang con trong nhóm `ielts` (xem NAV_GROUPS). Thêm
 * trang con IELTS mới thì phải thêm một dòng vào IELTS_SKILL_OF — có test canh.
 */

export type IeltsSkill = 'reading' | 'listening' | 'writing' | 'speaking' | 'other';

/** Thứ tự hiển thị các nhóm kỹ năng trong màn chọn. */
export const IELTS_SKILL_ORDER: readonly IeltsSkill[] = ['reading', 'listening', 'writing', 'speaking', 'other'];

/** Mỗi trang con IELTS thuộc về một kỹ năng. */
export const IELTS_SKILL_OF: Readonly<Record<string, IeltsSkill>> = {
  'mock-tests': 'reading',
  'video-hub': 'listening',
  grammar: 'other',
  'ielts-source-practice': 'reading',
  library: 'reading',
  bilingual: 'reading',
  'luyen-doc': 'reading',
  writing: 'writing',
  listening: 'listening',
  sentence: 'listening',
  'dictation-sets': 'listening',
  'dictation-youtube': 'listening',
  shadow: 'speaking',
  speaking: 'speaking',
  hub: 'speaking',
  'toeic-toefl': 'other',
  'hsa-english': 'other',
};

/** Khoá có phải là một trang con của IELTS không (để lọc cả màn "Thêm" trên điện thoại). */
export function isIeltsFeature(key: string): boolean {
  return Object.prototype.hasOwnProperty.call(IELTS_SKILL_OF, key);
}
