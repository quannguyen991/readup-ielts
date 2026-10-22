/**
 * Công cụ đo lường nào đang bật — suy từ mã đã khai, không từ một cờ riêng.
 *
 * Mã sai định dạng thì coi như chưa khai. Tải fbevents.js với một mã rác vẫn đặt
 * cookie lên máy người dùng mà không đo được gì — tức là xin họ đồng ý rồi đổi
 * lấy con số không.
 */
export type TrackerConfig = { metaPixelId: string | null; ga4Id: string | null };

export function trackerConfig(input: { metaPixelId?: string; ga4Id?: string }): TrackerConfig {
  const meta = (input.metaPixelId ?? '').trim();
  const ga = (input.ga4Id ?? '').trim().toUpperCase();
  return {
    metaPixelId: /^\d{10,20}$/.test(meta) ? meta : null,
    ga4Id: /^G-[A-Z0-9]{4,20}$/.test(ga) ? ga : null,
  };
}

/** Tên hiện cho người dùng ở thông báo cookie và trang quyền riêng tư. */
export function trackerNames(config: TrackerConfig): string[] {
  const names: string[] = [];
  if (config.metaPixelId) names.push('Meta Pixel');
  if (config.ga4Id) names.push('Google Analytics');
  return names;
}

// Đã bỏ Meta Pixel và GA4: không tải script, không có banner đồng ý cho hai công cụ này.
// Đo lường hiện dùng /api/track và /api/event (bảng riêng, ẩn danh).
export const TRACKERS: TrackerConfig = { metaPixelId: null, ga4Id: null };

export function hasTrackers(config: TrackerConfig = TRACKERS): boolean {
  return Boolean(config.metaPixelId || config.ga4Id);
}
