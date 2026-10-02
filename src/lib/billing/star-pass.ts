import { effectivePlan } from './entitlements';
import { PLAN_ORDER, type PlanId } from './plans';

/**
 * VÉ GÓI ĐỔI BẰNG SAO — mở gói Plus/Pro trong vài ngày, cộng dồn nếu đang có vé
 * cùng gói. Luật thuần để test được.
 *
 * KHÔNG ĐÈ GÓI TRẢ TIỀN: đang có gói do máy chủ ghi nhận (đã thanh toán) thì
 * không bán vé — vé chỉ ghi ở máy (`source: 'local'`), đè lên là làm lẫn hạn của
 * gói thật. Cũng không bán vé thấp hơn gói đang dùng: đổi sao để tụt gói là mất sao.
 */
export type PassResult =
  | { ok: true; plan: PlanId; expiresAt: string }
  | { ok: false; reason: 'đang-có-gói-cao-hơn' | 'đang-có-gói-trả-phí' };

export function applyStarPass(
  current: { plan: PlanId; expiresAt: string | null; source: 'local' | 'trial' | 'server' },
  pass: { id: Exclude<PlanId, 'free'>; days: number },
  now: Date = new Date(),
): PassResult {
  const active = effectivePlan(current.plan, current.expiresAt, now);
  if (active !== 'free' && current.source === 'server') return { ok: false, reason: 'đang-có-gói-trả-phí' };
  if (PLAN_ORDER.indexOf(active) > PLAN_ORDER.indexOf(pass.id)) return { ok: false, reason: 'đang-có-gói-cao-hơn' };
  // Cùng gói và còn hạn thì cộng tiếp vào hạn cũ; khác gói (lên từ Plus, hay từ Free) thì tính từ bây giờ.
  const from = active === pass.id && current.expiresAt ? Math.max(now.getTime(), new Date(current.expiresAt).getTime()) : now.getTime();
  return { ok: true, plan: pass.id, expiresAt: new Date(from + pass.days * 86_400_000).toISOString() };
}
