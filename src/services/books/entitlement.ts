import { PLAN_ORDER, type PlanId } from '@/lib/billing/plans';
import type { BillingCycle } from '@/services/payment/order';

/**
 * Ai được tải bộ sách PDF, và vì sao.
 *
 * LUẬT: một đơn ĐÃ TRẢ TIỀN THẬT của gói Max (trả tháng hay trả năm), hoặc của
 * bất kỳ gói nào trả năm.
 *
 * VÌ SAO KHÔNG SUY TỪ GÓI ĐANG DÙNG. Gói trên hồ sơ còn ba nguồn không qua tiền:
 * mời đủ bạn (được tháng Max), dùng thử, và quản trị viên bật tay. Cả ba đều
 * không kèm sách — đã chốt khi thiết kế phần quà. Bảng `payments` chỉ có dòng
 * khi có người chuyển khoản, nên đọc từ đó là tự loại được cả ba, không phải nhớ
 * từng ngoại lệ.
 *
 * Đơn bị hoàn tiền (`refunded`) mất quyền ngay. `amount_vnd > 0` chặn đơn 0đ nếu
 * về sau có ai tạo tay trong CSDL.
 */

/** Một đơn của gói này, chu kỳ này — khi trả tiền xong — có kèm sách không. */
export function orderIncludesBooks(plan: PlanId, cycle: BillingCycle): boolean {
  if (plan === 'free') return false;
  return plan === 'max' || cycle === 'yearly';
}

/** Câu chữ của luật trên, dùng chung cho trang giá, trang chính sách và tủ sách. */
export const BOOK_BUNDLE_RULE = 'gói Max, hoặc bất kỳ gói nào trả theo năm';

export type PaymentForBooks = {
  id: string;
  plan: string;
  billing_cycle: string;
  status: string;
  amount_vnd: number;
  reference: string | null;
  paid_at: string | null;
  created_at: string;
};

function isPlan(value: string): value is PlanId {
  return (PLAN_ORDER as readonly string[]).includes(value);
}

function isCycle(value: string): value is BillingCycle {
  return value === 'monthly' || value === 'yearly';
}

function paidTime(p: PaymentForBooks): number {
  const t = Date.parse(p.paid_at ?? p.created_at);
  return Number.isFinite(t) ? t : Number.MAX_SAFE_INTEGER;
}

/**
 * Đơn cho quyền tải sách, hoặc `null` nếu không có.
 *
 * Nhiều đơn đủ điều kiện thì lấy đơn SỚM NHẤT: mã đơn in lên sách giữ nguyên dù
 * người đó mua thêm về sau, nên bản tải hôm nay và bản tải năm sau khớp nhau.
 */
export function bookGrant<T extends PaymentForBooks>(payments: readonly T[]): T | null {
  const qualifying = payments.filter(
    (p) =>
      p.status === 'paid' &&
      p.amount_vnd > 0 &&
      isPlan(p.plan) &&
      isCycle(p.billing_cycle) &&
      orderIncludesBooks(p.plan, p.billing_cycle),
  );
  if (qualifying.length === 0) return null;
  return [...qualifying].sort((a, b) => paidTime(a) - paidTime(b))[0] ?? null;
}
