/**
 * KHUYẾN MÃI CUỐI THÁNG 9/2026 — người dùng yêu cầu 29/09/2026:
 *   "cho thêm sao rộng lượng hơn trong khoảng 30/9 đến 30/10; ngày 30/9 mỗi
 *    người được cộng 2 nghìn sao, thông báo phủ lên màn hình chính, + 7 ngày
 *    dùng thử Pro".
 *
 * LUẬT THUẦN (test ở `promo.test.ts`), ngày tính theo khoá YYYY-MM-DD:
 *  - Mùa sao rộng lượng: mọi ngày học từ 30/09 tới hết 30/10 được nhân đôi sao,
 *    trần ngày nâng từ 60 lên 150. Tính lại từ nhật ký học như mọi ngày khác —
 *    không có biến điểm cộng tay nào.
 *  - Quà: +2.000 sao (ghi vào `prizes` với khoá riêng — gộp hai máy lấy max nên
 *    không bao giờ nhận hai lần) và vé Pro 7 ngày trên máy nhận quà. Nhận được
 *    trong suốt mùa khuyến mãi, để ai vào muộn vẫn có.
 */

export const PROMO = {
  id: 'qua-cuoi-thang-9-2026',
  /** Ngày đầu / ngày cuối (bao gồm), khoá ngày YYYY-MM-DD. */
  from: '2026-09-30',
  to: '2026-10-30',
  giftStars: 2000,
  proDays: 7,
  /** Hệ số nhân thêm và trần sao mỗi ngày trong mùa khuyến mãi. */
  multiplier: 2,
  dailyCap: 150,
} as const;

/** Ngày (khoá YYYY-MM-DD) có nằm trong mùa khuyến mãi không. */
export function inPromo(dayKey: string | undefined | null): boolean {
  return !!dayKey && dayKey >= PROMO.from && dayKey <= PROMO.to;
}

/** Hệ số và trần sao của một ngày. */
export function dayBoost(dayKey: string | undefined | null, baseCap: number): { multiplier: number; cap: number } {
  return inPromo(dayKey) ? { multiplier: PROMO.multiplier, cap: PROMO.dailyCap } : { multiplier: 1, cap: baseCap };
}

/** Quà còn nhận được không (đang trong mùa và chưa nhận). */
export function giftAvailable(todayKey: string, prizes: Record<string, number> | undefined): boolean {
  return inPromo(todayKey) && !((prizes?.[PROMO.id] ?? 0) > 0);
}
