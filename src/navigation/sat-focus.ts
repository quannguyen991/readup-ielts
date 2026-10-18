/**
 * "Học gì với SAT": người học tick phần muốn học với SAT. Thanh bên chỉ
 * hiện những trang con đã chọn của mục SAT, tương tự như IELTS.
 *
 * Khoá ở đây là `key` của các trang con trong nhóm `sat` (xem NAV_GROUPS).
 */

export type SatSkill = 'practice' | 'math' | 'verbal' | 'mock';

/** Thứ tự hiển thị các nhóm tính năng SAT trong màn chọn. */
export const SAT_SKILL_ORDER: readonly SatSkill[] = ['practice', 'math', 'verbal', 'mock'];

/** Mỗi trang con SAT thuộc về một nhóm tính năng. */
export const SAT_SKILL_OF: Readonly<Record<string, SatSkill>> = {
  'sat-home': 'practice',
  'sat-practice-tests': 'practice',
  math: 'math',
  'sat-rw': 'verbal',
  'sat-full-test': 'mock',
};

/** Khoá có phải là một trang con của SAT không. */
export function isSatFeature(key: string): boolean {
  return Object.prototype.hasOwnProperty.call(SAT_SKILL_OF, key);
}

/** Mục này có hiện không, theo lựa chọn của người học. */
export function satShown(key: string, selected: readonly string[] | null): boolean {
  return !isSatFeature(key) || selected === null || selected.includes(key);
}
