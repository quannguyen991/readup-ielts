import type { SupabaseClient } from '@supabase/supabase-js';

import type { PlanId } from '@/lib/billing/plans';
import { msg, type LocaleSource } from '@/lib/server-locale';
import type { Database } from '@/types/database';
import { buildOrder, type BillingCycle, type OrderSpec } from './order';
import {
  EARLY_RENEWAL_DISCOUNT_PERCENT,
  activeFlashSale,
  applyPercentDiscount,
  cheapestCandidate,
  groupBuyYearlyPrice,
  isBeforePriceCutoff,
  isEligibleForEarlyRenewal,
  isGroupBuyPlan,
  type GroupSize,
  type PriceCandidate,
  type PriceSource,
} from './pricing-rules';

/**
 * SERVER-ONLY. Chốt số tiền CUỐI CÙNG cho một đơn, sau khi xét đủ bốn nguồn
 * giảm giá — đây là nơi DUY NHẤT gọi cả `buildOrder()` (giá niêm yết) lẫn đọc
 * DB (lịch sử trả tiền, nhóm mua chung, hạn dùng hiện tại) để quyết định.
 *
 * Đặt tách khỏi `order.ts` vì `buildOrder()` là HÀM THUẦN có chủ đích (test
 * được không cần DB); việc đọc DB phải nằm ở một tầng khác, chỉ chạy trong
 * route có `service_role`.
 */

export type ResolvedOrder = OrderSpec & {
  source: PriceSource;
  label: string;
  /** Chỉ có giá trị khi `source === 'group'` — để ghi vào `payments.group_id`. */
  groupId: string | null;
};

/** Tên tiếng Anh của các đợt flash sale (`FLASH_SALE_WINDOWS`); đợt lạ giữ tên gốc. */
const FLASH_LABEL_EN: Record<string, string> = {
  'Mùa nộp hồ sơ ED/EA': 'ED/EA application season',
  'Hè ôn SAT': 'Summer SAT prep',
  'Mùa IELTS cuối năm': 'Year-end IELTS season',
};

export async function resolveOrderPrice(
  admin: SupabaseClient<Database>,
  userId: string,
  plan: PlanId,
  cycle: BillingCycle,
  groupCode: string | null,
  /** Ngôn ngữ của `label` hiện cho người dùng — truyền `request` của route. */
  locale: LocaleSource = 'vi',
): Promise<ResolvedOrder> {
  const base = buildOrder(plan, cycle);
  const candidates: PriceCandidate[] = [{ source: 'base', amountVnd: base.amountVnd, label: msg(locale, 'Giá niêm yết', 'List price') }];
  let groupId: string | null = null;

  /*
    GIỮ GIÁ CŨ: chỉ áp dụng CHO ĐÚNG một lần — lần trả tiếp theo tính từ lần
    trả THÀNH CÔNG gần nhất cho CÙNG gói + CÙNG chu kỳ. Tự bó hẹp một cách tự
    nhiên: đơn này trả xong thì `paid_at` của nó ở TƯƠNG LAI so với mốc tăng
    giá, nên lần trả kế tiếp không còn thấy gì trước mốc để giữ giá cũ nữa —
    không cần một cột "đã dùng ưu đãi giữ giá" riêng.
  */
  const { data: lastPaid } = await admin
    .from('payments')
    .select('amount_vnd, paid_at')
    .eq('user_id', userId)
    .eq('plan', plan)
    .eq('billing_cycle', cycle)
    .eq('status', 'paid')
    .order('paid_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastPaid?.paid_at && isBeforePriceCutoff(lastPaid.paid_at)) {
    candidates.push({
      source: 'grandfather',
      amountVnd: lastPaid.amount_vnd,
      label: msg(
        locale,
        'Giữ giá cũ — bạn đã mua gói này trước đợt tăng giá 03/09/2026',
        'Old price kept — you bought this plan before the 03/09/2026 price increase',
      ),
    });
  }

  // MUA THEO NHÓM: chỉ chu kỳ năm, nhóm phải còn "collecting", chưa quá hạn
  // `settle_by`, và đúng gói người này đang mua — không cho lách gói qua mã
  // nhóm của gói khác.
  if (groupCode && cycle === 'yearly' && isGroupBuyPlan(plan)) {
    const { data: group } = await admin
      .from('payment_groups')
      .select('id, plan, target_size, status, settle_by')
      .eq('code', groupCode.trim().toUpperCase())
      .maybeSingle();

    const stillOpen = group && group.status === 'collecting' && new Date(group.settle_by).getTime() > Date.now();

    if (group && stillOpen && group.plan === plan) {
      groupId = group.id;
      candidates.push({
        source: 'group',
        amountVnd: groupBuyYearlyPrice(plan, group.target_size as GroupSize),
        label: msg(locale, `Giá mua nhóm ${group.target_size} người`, `Group price for ${group.target_size} people`),
      });
    }
  }

  const flash = activeFlashSale();
  if (flash) {
    candidates.push({
      source: 'flash_sale',
      amountVnd: applyPercentDiscount(base.amountVnd, flash.percent),
      label: msg(
        locale,
        `${flash.label} — giảm ${flash.percent}%`,
        `${FLASH_LABEL_EN[flash.label] ?? flash.label} — ${flash.percent}% off`,
      ),
    });
  }

  // GIA HẠN SỚM: đang dùng ĐÚNG gói này (không phải nâng cấp từ gói khác) và
  // còn trong cửa sổ ngày trước khi hết hạn.
  const { data: profile } = await admin
    .from('profiles')
    .select('plan, plan_expires_at')
    .eq('id', userId)
    .maybeSingle();

  if (profile?.plan === plan && isEligibleForEarlyRenewal(profile.plan_expires_at)) {
    candidates.push({
      source: 'early_renewal',
      amountVnd: applyPercentDiscount(base.amountVnd, EARLY_RENEWAL_DISCOUNT_PERCENT),
      label: msg(
        locale,
        `Gia hạn sớm — giảm ${EARLY_RENEWAL_DISCOUNT_PERCENT}%`,
        `Early renewal — ${EARLY_RENEWAL_DISCOUNT_PERCENT}% off`,
      ),
    });
  }

  const winner = cheapestCandidate(candidates);

  return {
    ...base,
    amountVnd: winner.amountVnd,
    source: winner.source,
    label: winner.label,
    groupId: winner.source === 'group' ? groupId : null,
  };
}
