/**
 * CHUYỂN DỮ LIỆU HỌC TẬP từ tên miền cũ sang Band 9 (01/10/2026).
 *
 * Bộ nhớ trình duyệt (localStorage) gắn với TỪNG tên miền: sang tên miền mới là
 * app trống, phải đăng nhập lại. Cách chuyển:
 *
 *   1. Trang cũ mở trang mới `/chuyen-du-lieu` bằng `window.open` (giữ `opener`).
 *   2. Trang mới báo "sẵn sàng" về đúng tên miền cũ (`postMessage` có ghi rõ
 *      origin đích).
 *   3. Trang cũ gửi toàn bộ localStorage cho đúng tên miền mới.
 *   4. Trang mới CHỈ nhận thư từ tên miền cũ trong danh sách, ghi các khoá CHƯA
 *      có (không đè dữ liệu đã có ở tên miền mới), rồi tải lại app.
 *
 * Không qua máy chủ, không đặt dữ liệu lên đường dẫn. Phiên đăng nhập đi theo
 * nên người dùng không phải đăng nhập lại; tiến độ trên máy chủ vẫn đồng bộ như
 * thường sau đó.
 */

export const READY = 'band9-handoff-ready';
export const DATA = 'band9-handoff-data';
export const DONE = 'band9-handoff-done';

export type HandoffMessage =
  | { type: typeof READY }
  | { type: typeof DATA; items: Record<string, string> }
  | { type: typeof DONE; written: number };

/** Thư có đúng dạng không (không tin bất cứ thứ gì đến qua postMessage). */
export function parseMessage(data: unknown): HandoffMessage | null {
  if (!data || typeof data !== 'object') return null;
  const m = data as Record<string, unknown>;
  if (m.type === READY) return { type: READY };
  if (m.type === DONE && typeof m.written === 'number') return { type: DONE, written: m.written };
  if (m.type === DATA && m.items && typeof m.items === 'object' && !Array.isArray(m.items)) {
    const items: Record<string, string> = {};
    for (const [k, v] of Object.entries(m.items as Record<string, unknown>)) if (typeof k === 'string' && typeof v === 'string') items[k] = v;
    return { type: DATA, items };
  }
  return null;
}

/**
 * Gộp: chỉ ghi khoá chưa có ở tên miền mới — người đã dùng Band 9 trước đó
 * không bị ghi đè; dữ liệu trên máy chủ vẫn được đồng bộ gộp như mọi lần.
 */
export function plan(existing: Record<string, string>, incoming: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(incoming)) if (!(k in existing)) out[k] = v;
  return out;
}

export function snapshot(storage: Pick<Storage, 'length' | 'key' | 'getItem'>): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < storage.length; i += 1) {
    const k = storage.key(i);
    if (k == null) continue;
    const v = storage.getItem(k);
    if (v != null) out[k] = v;
  }
  return out;
}
