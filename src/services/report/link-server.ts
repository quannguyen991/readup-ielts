/**
 * Đường dẫn báo cáo phụ huynh: `<userId>.<chữ ký>`.
 *
 * Chữ ký là HMAC-SHA256 của userId bằng một bí mật CHỈ Ở MÁY CHỦ, nên không ai
 * đoán hay sửa được đường dẫn của người khác (đổi userId là sai chữ ký). Không
 * cần bảng mới trong cơ sở dữ liệu. Bí mật: `REPORT_LINK_SECRET` nếu có khai,
 * không thì dẫn xuất từ service key (không bao giờ rời máy chủ; HMAC không làm
 * lộ khoá gốc).
 *
 * CHỈ IMPORT TỪ API ROUTE — file dùng `node:crypto`.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function secret(): string {
  const s = process.env.REPORT_LINK_SECRET ?? process.env.SUPABASE_SERVICE_KEY ?? '';
  if (!s) throw new Error('Thiếu bí mật ký đường dẫn báo cáo.');
  return s;
}

export function signUser(userId: string, key: string = secret()): string {
  const sig = createHmac('sha256', key).update(`parent-report:${userId}`).digest('base64url').slice(0, 24);
  return `${userId}.${sig}`;
}

/** Trả userId nếu đường dẫn hợp lệ, null nếu giả / sai. */
export function verifyToken(token: string, key: string = secret()): string | null {
  const [userId, sig] = token.split('.');
  if (!userId || !sig || !UUID.test(userId)) return null;
  const expected = signUser(userId, key).split('.')[1]!;
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b) ? userId : null;
}
