/**
 * Giới hạn và kiểm tra đầu vào của Lớp học — hàm thuần, dùng chung cho API
 * (chặn thật) và giao diện (báo sớm).
 */
export const MAX_ACTIVE_CLASSES_PER_TEACHER = 20;
export const MAX_MEMBERS_PER_CLASS = 200;
export const MAX_ASSIGNMENTS_PER_CLASS = 100;

export const CLASS_NAME_MAX = 60;
export const DISPLAY_NAME_MAX = 40;
export const ASSIGNMENT_TITLE_MAX = 120;

/** Gộp khoảng trắng thừa, cắt hai đầu. Rỗng sau khi dọn thì trả null. */
export function cleanName(raw: unknown, max: number): string | null {
  if (typeof raw !== 'string') return null;
  const s = raw.replace(/\s+/gu, ' ').trim();
  if (!s) return null;
  return s.length > max ? null : s;
}

/** Ngày hạn dạng YYYY-MM-DD có thật trên lịch, hoặc null nếu bỏ trống. `false` = sai định dạng. */
export function parseDueOn(raw: unknown): string | null | false {
  if (raw === null || raw === undefined || raw === '') return null;
  if (typeof raw !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return false;
  const t = Date.parse(`${raw}T00:00:00Z`);
  if (Number.isNaN(t)) return false;
  return new Date(t).toISOString().slice(0, 10) === raw ? raw : false;
}
