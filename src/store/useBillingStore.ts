import { useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_PREFIX, storage } from './persist';
import {
  checkFeature,
  checkQuota,
  daysLeft,
  effectivePlan,
  quotaPeriodKey,
  quotaPlan,
  remainingQuota,
  type Entitlement,
} from '@/lib/billing/entitlements';
import {
  TRIAL_DAYS,
  TRIAL_PLAN,
  type Feature,
  type PlanId,
  type Quota,
} from '@/lib/billing/plans';

/**
 * Gói hiện tại và số lượt đã dùng.
 *
 * ⚠️ CHƯA PHẢI TẦNG BẢO MẬT. Gói nằm ở client nên sửa được bằng DevTools. Chấp
 * nhận được lúc chưa có cổng thanh toán, và `source` ghi lại đúng sự thật đó:
 * `local` nghĩa là chưa ai xác nhận, `server` nghĩa là máy chủ đã ghi nhận.
 *
 * Khi nối thanh toán, gói phải đọc từ `profiles.plan` (migration đã thu hồi
 * quyền UPDATE cột ấy của `authenticated`), và mọi API tốn tiền phải tự kiểm
 * gói ở server. Chỗ này lúc đó chỉ còn là bộ nhớ đệm để UI khỏi nháy.
 */

export type PlanSource = 'local' | 'trial' | 'server';

type UsageEntry = { count: number; periodKey: string };

type BillingState = {
  plan: PlanId;
  /** ISO. null = không hết hạn. */
  expiresAt: string | null;
  source: PlanSource;
  usage: Partial<Record<Quota, UsageEntry>>;
  /**
   * Đã dùng trải nghiệm thử của TỪNG loại chưa — hai cờ RIÊNG, đặt tường minh
   * lúc bấm nút chứ không suy từ `plan`/`source` hiện tại.
   *
   * Bản một-cờ cũ (`source === 'trial' || rawPlan !== 'free'`) không phân biệt
   * được Plus trial và Pro trial: dùng xong Plus trial thì cờ đó cũng bật, và
   * nút "Dùng thử Pro" biến mất vĩnh viễn dù chưa ai bấm nó lần nào.
   */
  plusTrialUsed: boolean;
  proTrialUsed: boolean;

  /** Ghi một lượt dùng. Tự reset khi sang chu kỳ mới. */
  consume: (quota: Quota, amount?: number) => void;
  usedOf: (quota: Quota) => number;
  /** Bật học thử `TRIAL_DAYS` ngày gói `TRIAL_PLAN`. */
  startVipTrial: () => void;
  /** Chỉ dùng khi chưa có thanh toán, và luôn đánh dấu nguồn là `local`. */
  setPlanLocally: (plan: PlanId, expiresAt?: string | null) => void;
  applyServerPlan: (plan: PlanId, expiresAt: string | null) => void;
  /** Quên gói lấy từ máy chủ khi đăng xuất. Máy dùng chung không được giữ lại. */
  clearServerPlan: () => void;
  resetUsage: () => void;
};

export const useBillingStore = create<BillingState>()(
  persist(
    (set, get) => ({
      plan: 'free',
      expiresAt: null,
      source: 'local',
      usage: {},
      plusTrialUsed: false,
      proTrialUsed: false,

      usedOf: (quota) => {
        const entry = get().usage[quota];
        // Khoá chu kỳ khác nghĩa là đã sang ngày/tuần/tháng mới → bộ đếm coi như 0.
        // Không cần hẹn giờ chạy nền, và không lệch khi máy tắt qua đêm.
        if (!entry || entry.periodKey !== quotaPeriodKey(quota)) return 0;
        return entry.count;
      },

      consume: (quota, amount = 1) => {
        const key = quotaPeriodKey(quota);
        set((state) => {
          const entry = state.usage[quota];
          const base = entry && entry.periodKey === key ? entry.count : 0;
          return { usage: { ...state.usage, [quota]: { count: base + amount, periodKey: key } } };
        });
      },

      startVipTrial: () => {
        const until = new Date();
        until.setDate(until.getDate() + TRIAL_DAYS);
        set({ plan: TRIAL_PLAN, expiresAt: until.toISOString(), source: 'trial', proTrialUsed: true });
      },

      setPlanLocally: (plan, expiresAt = null) => set({ plan, expiresAt, source: 'local' }),

      applyServerPlan: (plan, expiresAt) => set({ plan, expiresAt, source: 'server' }),

      clearServerPlan: () =>
        // Chỉ xoá khi gói ĐANG đến từ máy chủ. Người dùng thử (source 'trial')
        // hay tự đặt tay lúc phát triển thì không liên quan tới việc đăng xuất.
        set((state) =>
          state.source === 'server' ? { plan: 'free', expiresAt: null, source: 'local' } : state,
        ),

      resetUsage: () => set({ usage: {} }),
    }),
    { name: `${STORAGE_PREFIX}billing`, storage: storage<BillingState>() },
  ),
);

/** Gói CÒN HIỆU LỰC — đã trừ trường hợp hết hạn. Mọi chỗ chặn phải dùng cái này. */
export function usePlan(): PlanId {
  const plan = useBillingStore((s) => s.plan);
  const expiresAt = useBillingStore((s) => s.expiresAt);
  return useMemo(() => effectivePlan(plan, expiresAt), [expiresAt, plan]);
}

export function usePlanStatus() {
  const plan = usePlan();
  const rawPlan = useBillingStore((s) => s.plan);
  const expiresAt = useBillingStore((s) => s.expiresAt);
  const source = useBillingStore((s) => s.source);
  const plusTrialUsed = useBillingStore((s) => s.plusTrialUsed);
  const proTrialUsed = useBillingStore((s) => s.proTrialUsed);

  return useMemo(
    () => ({
      plan,
      source,
      expiresAt,
      daysLeft: daysLeft(expiresAt),
      plusTrialUsed,
      proTrialUsed,
      /*
        Đủ điều kiện bấm nút học thử: gói HIỆU LỰC (đã trừ hết hạn) đang là
        Free, và chưa học thử lần nào. Dùng `plan` (đã decay qua
        `effectivePlan`) chứ không dùng `rawPlan` — trial hết hạn thì `rawPlan`
        vẫn kẹt ở giá trị cũ (ví dụ 'plus') mãi mãi vì không có gì tự đặt lại
        nó, chỉ `plan` mới đúng là "bây giờ có đang Free hay không".

      */
      canStartTrial: plan === 'free' && !proTrialUsed,
      /** Đang học thử (còn hạn). Lượt AI khi đó vẫn theo Free. */
      onTrial: source === 'trial' && plan !== 'free',
      expired: rawPlan !== 'free' && plan === 'free',
    }),
    [expiresAt, plan, plusTrialUsed, proTrialUsed, rawPlan, source],
  );
}

export function useFeature(feature: Feature): Entitlement {
  const plan = usePlan();
  return useMemo(() => checkFeature(plan, feature), [feature, plan]);
}

/**
 * Trạng thái một hạn mức: còn dùng được không, còn bao nhiêu lượt.
 *
 * Trả về cả `used` và `limit` để màn hình hiện được "3/5 bài hôm nay" — con số
 * cụ thể khiến giới hạn thành thông tin, còn một chữ "hết lượt" trống trơn thì
 * chỉ gây bực.
 */
export function useQuota(quota: Quota) {
  const effective = usePlan();
  const source = useBillingStore((s) => s.source);
  const usage = useBillingStore((s) => s.usage);

  return useMemo(() => {
    const plan = quotaPlan(effective, quota, source === 'trial' && effective !== 'free');
    const entry = usage[quota];
    const used = !entry || entry.periodKey !== quotaPeriodKey(quota) ? 0 : entry.count;
    return {
      used,
      remaining: remainingQuota(plan, quota, used),
      entitlement: checkQuota(plan, quota, used),
    };
  }, [effective, quota, source, usage]);
}
