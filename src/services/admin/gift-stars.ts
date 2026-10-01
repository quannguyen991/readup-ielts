/**
 * TẶNG SAO TỪ QUẢN TRỊ (01/10/2026: "tôi làm host thì có thể tặng sao miễn phí
 * cho mọi người").
 *
 * Sao tặng ghi thành MỘT KHOẢN RIÊNG trong `prizes` của payload `reward`:
 * `prizes['gift:<mã đợt>'] = số sao`. Không cộng vào `bonusStars` của game:
 * khi gộp hai máy, `bonusStars` lấy số LỚN HƠN — máy người dùng đang có số lớn
 * hơn là sao tặng biến mất. `prizes` gộp theo từng khoá (giữ mọi khoá, mỗi khoá
 * lấy số lớn hơn), nên khoản tặng luôn còn, và gửi lại cùng một mã đợt cũng
 * không cộng hai lần.
 */
export const GIFT_MAX = 100_000;
export const GIFT_PREFIX = 'gift:';

export type GiftCheck = { ok: true; stars: number } | { ok: false; error: string };

export function checkGiftAmount(raw: unknown): GiftCheck {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > GIFT_MAX) return { ok: false, error: `Số sao phải là số nguyên từ 1 tới ${GIFT_MAX.toLocaleString('vi-VN')}.` };
  return { ok: true, stars: n };
}

/** Mã đợt tặng: ngày + chuỗi ngẫu nhiên ngắn (đọc được trong nhật ký). */
export function newGiftId(now: Date, rand: () => number = Math.random): string {
  const day = now.toISOString().slice(0, 10).replace(/-/g, '');
  return `${day}-${Math.floor(rand() * 36 ** 6).toString(36).padStart(6, '0')}`;
}

/** Ghi khoản tặng vào payload `reward` (giữ nguyên mọi trường khác). Gửi lại cùng mã thì không đổi. */
export function applyGift(payload: Record<string, unknown> | null | undefined, giftId: string, stars: number): Record<string, unknown> {
  const base = payload && typeof payload === 'object' ? payload : {};
  const prizes = base.prizes && typeof base.prizes === 'object' ? (base.prizes as Record<string, number>) : {};
  const key = `${GIFT_PREFIX}${giftId}`;
  if (prizes[key] === stars) return base;
  return { ...base, prizes: { ...prizes, [key]: stars } };
}

/** Tổng sao đã được tặng (để hiện trong trang quản trị / hồ sơ). */
export function giftedTotal(prizes: Record<string, number> | undefined): number {
  return Object.entries(prizes ?? {}).reduce((sum, [k, n]) => (k.startsWith(GIFT_PREFIX) ? sum + Math.max(0, n) : sum), 0);
}
