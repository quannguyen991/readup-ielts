import { hasSupabaseConfig } from '@/lib/env';
import { getSupabase } from '@/lib/supabase';
import type { Json } from '@/types/database';

/**
 * Đồng bộ dữ liệu học lên tài khoản.
 *
 * KIẾN TRÚC: mỗi store cục bộ đăng ký một `SyncedStore` gồm ba việc — đọc trạng
 * thái hiện tại, gộp với bản trên máy chủ, và ghi kết quả về. Engine không biết
 * gì về nội dung; nó chỉ điều phối.
 *
 * VÌ SAO LƯU JSON THEO STORE, KHÔNG LƯU VÀO CÁC BẢNG QUAN HỆ đã dựng sẵn
 * (`math_sessions`, `math_attempts`…):
 *
 * - Mục đích trước mắt là DỮ LIỆU KHÔNG MẤT KHI ĐỔI MÁY. Một bảng khoá-giá trị
 *   giải quyết trọn vẹn việc đó cho MỌI store cùng lúc, thay vì viết pipeline
 *   đọc/ghi riêng cho từng bảng — mà mỗi pipeline lại là một chỗ có thể lệch
 *   với kiểu dữ liệu cục bộ.
 * - Các bảng quan hệ vẫn còn nguyên và vẫn đúng. Chúng dành cho việc mà JSON
 *   không làm được: truy vấn phía máy chủ, thống kê nhiều người, bảng xếp hạng.
 *   Khi nào cần những thứ đó thì viết thêm một `SyncedStore` đẩy song song, chứ
 *   không phải sửa lại chỗ này.
 *
 * ĐÁNH ĐỔI ĐÃ BIẾT: máy chủ không truy vấn được vào trong payload, và gộp diễn
 * ra ở client nên máy khách phải tải cả cụm về. Với khối lượng của một người
 * học (vài nghìn lượt làm bài) thì đó là vài trăm KB — chấp nhận được.
 */

export type SyncedStore = {
  /** Khoá của store trong bảng `user_state`. Đổi là mất dữ liệu cũ. */
  key: string;
  /** Trạng thái hiện tại trên máy này. */
  read: () => unknown;
  /** Ghi đè trạng thái cục bộ bằng bản đã gộp. */
  write: (payload: unknown) => void;
  /**
   * Gộp bản cục bộ với bản trên máy chủ.
   *
   * `remote` là null khi máy chủ chưa có gì — lần đầu đăng nhập trên tài khoản
   * mới. Lúc ấy trả về `local` là đúng: đó chính là bước "mang dữ liệu đang có
   * trên máy vào tài khoản".
   */
  merge: (local: unknown, remote: unknown | null) => unknown;
};

const registry = new Map<string, SyncedStore>();

export function registerSyncedStore(store: SyncedStore): void {
  registry.set(store.key, store);
}

export function registeredStoreKeys(): string[] {
  return [...registry.keys()];
}

/**
 * Xoá dữ liệu học của tài khoản khỏi máy này: mỗi store được ghi bằng bản rỗng do chính
 * hàm gộp của nó trả về khi cả hai phía đều trống. Dùng khi đổi sang tài khoản khác, để
 * dữ liệu của người trước không bị gộp vào tài khoản mới. Store nào không reset được thì
 * trả về danh sách lỗi và người gọi phải dừng, không được gộp tiếp.
 */
export function resetSyncedStores(): { ok: true } | { ok: false; failed: string[] } {
  const failed: string[] = [];
  for (const store of registry.values()) {
    try {
      store.write(store.merge(null, null));
    } catch {
      failed.push(store.key);
    }
  }
  return failed.length ? { ok: false, failed } : { ok: true };
}

export type SyncOutcome =
  | { ok: true; synced: string[] }
  | { ok: false; reason: 'not_configured' | 'signed_out' | 'error'; message: string };

type UserStateRow = { store_key: string; payload: unknown };

/**
 * Đồng bộ hai chiều toàn bộ store đã đăng ký.
 *
 * Thứ tự bắt buộc là TẢI VỀ → GỘP → ĐẨY LÊN. Đẩy trước rồi mới tải là ghi đè
 * dữ liệu của thiết bị kia bằng dữ liệu máy này, đúng cái mà `merge.ts` sinh ra
 * để tránh.
 */
export async function syncAll(userId: string): Promise<SyncOutcome> {
  if (!hasSupabaseConfig()) {
    return { ok: false, reason: 'not_configured', message: 'Chưa nối máy chủ tài khoản.' };
  }
  if (!userId) {
    return { ok: false, reason: 'signed_out', message: 'Chưa đăng nhập.' };
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('user_state')
      .select('store_key, payload')
      .eq('user_id', userId);

    if (error) throw error;

    const remoteByKey = new Map<string, unknown>();
    for (const row of (data ?? []) as UserStateRow[]) remoteByKey.set(row.store_key, row.payload);

    const rows: Array<{ user_id: string; store_key: string; payload: Json; updated_at: string }> = [];
    const synced: string[] = [];

    for (const store of registry.values()) {
      const local = store.read();
      const remote = remoteByKey.has(store.key) ? remoteByKey.get(store.key) : null;
      const merged = store.merge(local, remote ?? null);

      store.write(merged);
      rows.push({
        user_id: userId,
        store_key: store.key,
        // Payload là JSON tự do theo thiết kế: hình dạng do từng store quy định
        // và đổi theo phiên bản app, nên không ép kiểu cứng ở tầng này được.
        payload: merged as Json,
        updated_at: new Date().toISOString(),
      });
      synced.push(store.key);
    }

    if (rows.length > 0) {
      const { error: upsertError } = await supabase
        .from('user_state')
        .upsert(rows, { onConflict: 'user_id,store_key' });
      if (upsertError) throw upsertError;
    }

    return { ok: true, synced };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi đồng bộ không xác định.';
    return { ok: false, reason: 'error', message };
  }
}

/**
 * Chỉ đẩy lên, không gộp — dùng cho lần lưu định kỳ sau khi đã đồng bộ đầy đủ.
 *
 * Rẻ hơn `syncAll` một vòng tải về, nên gọi được thường xuyên. Nhưng nó GHI ĐÈ
 * bản trên máy chủ, nên chỉ an toàn khi phiên này đã gộp xong ít nhất một lần —
 * engine tự giữ cờ đó thay vì tin nơi gọi.
 */
const mergedThisSession = new Set<string>();

export function markMerged(userId: string): void {
  mergedThisSession.add(userId);
}

export function forgetMerged(userId: string): void {
  mergedThisSession.delete(userId);
}

export async function pushAll(userId: string): Promise<SyncOutcome> {
  if (!mergedThisSession.has(userId)) return syncAll(userId);
  if (!hasSupabaseConfig()) {
    return { ok: false, reason: 'not_configured', message: 'Chưa nối máy chủ tài khoản.' };
  }

  try {
    const rows = [...registry.values()].map((store) => ({
      user_id: userId,
      store_key: store.key,
      payload: store.read() as Json,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await getSupabase()
      .from('user_state')
      .upsert(rows, { onConflict: 'user_id,store_key' });
    if (error) throw error;

    return { ok: true, synced: rows.map((r) => r.store_key) };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi đồng bộ không xác định.';
    return { ok: false, reason: 'error', message };
  }
}
