import { balanceOf } from '@/services/study-abroad/economy';
import { ledgerAdd, ledgerSum, type Ledger } from '@/services/travel/economy';

/** Mọi con số của quán ở một chỗ. */
export const SHOP_RULES = { capital: 150, ordersPerDay: 12 } as const;

export const SHOP_PREFIX = 'shop:';
const SALE = 'shop:sale:';
const COST = 'shop:cost:';

const has = (ledger: Ledger, id: string) => Object.prototype.hasOwnProperty.call(ledger, id);

/** Khoản vốn nằm trong sổ ĐỒNG DU HỌC. Khoá có tên thành phố nên mỗi thành phố chỉ trả vốn một lần. */
export function capitalId(city: string): string {
  return `pay:shop:${city}`;
}

export type CapitalReason = 'ok' | 'already' | 'poor';

export function chargeCapital(studyLedger: Ledger, city: string): { ledger: Ledger; reason: CapitalReason } {
  if (has(studyLedger, capitalId(city))) return { ledger: studyLedger, reason: 'already' };
  if (balanceOf(studyLedger) < SHOP_RULES.capital) return { ledger: studyLedger, reason: 'poor' };
  return { ledger: ledgerAdd(studyLedger, capitalId(city), -SHOP_RULES.capital), reason: 'ok' };
}

export function ordersToday(ledger: Ledger, day: string): number {
  const prefix = `${SALE}${day}:`;
  return Object.keys(ledger).filter((id) => id.startsWith(prefix)).length;
}

export type SaleReason = 'paid' | 'full' | 'duplicate';

/**
 * Ghi một đơn đã phục vụ đúng. `orderId` sinh một lần cho mỗi lần phục vụ, nên bấm hai lần
 * vẫn chỉ bán một lần. Đơn thứ 13 trong ngày bị từ chối và không ghi gì.
 */
export function recordSale(ledger: Ledger, day: string, orderId: string, price: number, cost: number): { ledger: Ledger; paid: number; reason: SaleReason } {
  const saleId = `${SALE}${day}:${orderId}`;
  if (has(ledger, saleId)) return { ledger, paid: 0, reason: 'duplicate' };
  if (ordersToday(ledger, day) >= SHOP_RULES.ordersPerDay) return { ledger, paid: 0, reason: 'full' };
  const next = ledgerAdd(ledgerAdd(ledger, saleId, price), `${COST}${day}:${orderId}`, -cost);
  return { ledger: next, paid: price - cost, reason: 'paid' };
}

/**
 * Phục vụ sai: không có doanh thu, nhưng nguyên liệu đã dùng bị trừ (spec §4.5). Mỗi khách chỉ bị
 * trừ một lần, theo mã lượt phục vụ, để người học thử lại đáp án không bị phạt thêm.
 */
export function recordWaste(ledger: Ledger, day: string, attemptId: string, cost: number): Ledger {
  return ledgerAdd(ledger, `shop:waste:${day}:${attemptId}`, -cost);
}

export function shopBalance(ledger: Ledger): number {
  return Math.max(0, ledgerSum(ledger, SHOP_PREFIX));
}
