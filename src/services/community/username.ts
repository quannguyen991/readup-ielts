/** Tên người dùng (@username) để kết bạn: 3–20 ký tự, chữ thường a–z, số và dấu gạch dưới. */
export const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

const RESERVED = new Set(['admin', 'administrator', 'root', 'support', 'band9', 'readup', 'system', 'moderator', 'mod', 'staff']);

/** Chuẩn hoá lời nhập: bỏ khoảng trắng và @ đầu, chuyển chữ thường. */
export function normalizeUsername(raw: unknown): string {
  return typeof raw === 'string' ? raw.trim().replace(/^@+/, '').toLowerCase() : '';
}

export type UsernameCheck = { ok: true; username: string } | { ok: false; reason: 'format' | 'reserved' };

export function checkUsername(raw: unknown): UsernameCheck {
  const username = normalizeUsername(raw);
  if (!USERNAME_RE.test(username)) return { ok: false, reason: 'format' };
  if (RESERVED.has(username)) return { ok: false, reason: 'reserved' };
  return { ok: true, username };
}

/** Lời tìm kiếm có dạng tên người dùng không (bắt đầu bằng @, hoặc chỉ gồm ký tự hợp lệ)? */
export function looksLikeUsername(raw: string): boolean {
  const q = raw.trim();
  return q.startsWith('@') || /^[a-z0-9_]{3,20}$/i.test(q);
}
