/**
 * Kiểm ô nhập khi tạo tài khoản bằng mật khẩu — dùng CHUNG cho màn đăng nhập
 * (báo lỗi ngay, khỏi gửi đi) và `/api/auth/sign-up` (không tin client).
 */
export const MIN_PASSWORD = 8;

export type SignUpCheck =
  | { ok: true; email: string; password: string; name: string | null }
  | { ok: false; error: string };

export function validateSignUp(email: unknown, password: unknown, name?: unknown): SignUpCheck {
  const e = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e) || e.length > 254) return { ok: false, error: 'Email chưa đúng định dạng.' };
  const p = typeof password === 'string' ? password : '';
  if (p.length < MIN_PASSWORD) return { ok: false, error: `Mật khẩu cần ít nhất ${MIN_PASSWORD} ký tự.` };
  if (p.length > 72) return { ok: false, error: 'Mật khẩu dài quá 72 ký tự.' };
  if (/^\d+$/.test(p)) return { ok: false, error: 'Mật khẩu không nên chỉ toàn số — thêm vài chữ cái.' };
  if (p.toLowerCase() === e || p.toLowerCase() === e.split('@')[0]) return { ok: false, error: 'Mật khẩu đừng trùng với email.' };
  const n = typeof name === 'string' ? name.trim().slice(0, 60) : '';
  return { ok: true, email: e, password: p, name: n || null };
}
