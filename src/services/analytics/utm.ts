/**
 * Nguồn truy cập (utm_source, utm_medium, utm_campaign, utm_content).
 * Lấy theo lần ĐẦU khách vào bằng link có utm, lưu trên máy để gắn lại khi khách đăng ký.
 * Lần vào sau bằng link khác không ghi đè nguồn đầu tiên.
 */
export type UtmParams = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
};

const KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'] as const;
export const UTM_STORAGE_KEY = 'band9-utm-first';

/** Đọc utm từ chuỗi query (ví dụ "?utm_source=instagram&utm_campaign=writing"). Giá trị dài quá 100 ký tự bị cắt. */
export function parseUtm(search: string): UtmParams {
  const params = new URLSearchParams(search);
  const out: UtmParams = {};
  for (const key of KEYS) {
    const value = (params.get(key) ?? '').trim().slice(0, 100);
    if (value) out[key] = value;
  }
  return out;
}

/** Ghi utm lần đầu. Trả về utm đã lưu (đầu tiên). Không có utm mới thì giữ nguyên. */
export function rememberFirstUtm(search: string, storage: Pick<Storage, 'getItem' | 'setItem'> | null): UtmParams {
  const stored = readStoredUtm(storage);
  if (Object.keys(stored).length > 0) return stored;
  const fresh = parseUtm(search);
  if (Object.keys(fresh).length > 0 && storage) {
    try {
      storage.setItem(UTM_STORAGE_KEY, JSON.stringify(fresh));
    } catch {
      // Chế độ riêng tư hoặc bộ nhớ đầy: bỏ qua, không làm hỏng trang.
    }
  }
  return fresh;
}

export function readStoredUtm(storage: Pick<Storage, 'getItem'> | null): UtmParams {
  if (!storage) return {};
  try {
    const raw = storage.getItem(UTM_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const out: UtmParams = {};
    for (const key of KEYS) if (typeof parsed[key] === 'string') out[key] = parsed[key] as string;
    return out;
  } catch {
    return {};
  }
}
