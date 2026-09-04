import { PLAN_ORDER, type PlanId } from '@/lib/billing/plans';
import { quotaLimit } from '@/lib/billing/entitlements';
import type { getSupabaseAdmin } from '@/lib/supabase-admin';

/**
 * Chặn hạn mức AI Ở MÁY CHỦ.
 *
 * SERVER-ONLY.
 *
 * Bộ đếm trong `useBillingStore` nằm ở trình duyệt của chính người dùng, nên nó
 * là GIAO DIỆN chứ không phải hàng rào — nó cho biết "còn 12 lượt", và ai mở
 * DevTools sửa con số đó là gọi được không giới hạn. Chấp nhận được khi chưa
 * bán gói. Giờ mỗi lượt gọi là tiền thật, nên hàng rào phải nằm ở đây.
 *
 * THỨ TỰ QUAN TRỌNG: cộng bộ đếm TRƯỚC khi gọi AI, không phải sau.
 *
 * Cộng sau thì một lời gọi hỏng giữa chừng — timeout, đứt mạng, người dùng đóng
 * tab — vẫn tốn tiền của ta mà không tốn lượt của họ, và bấm lại liên tục là
 * cách khai thác đơn giản nhất. Cộng trước nghĩa là thỉnh thoảng có người mất
 * oan một lượt khi hệ thống hỏng; đó là đánh đổi đúng, và `refundAiCall` trả
 * lại lượt đó khi ta biết chắc lỗi thuộc về mình.
 */

type Admin = ReturnType<typeof getSupabaseAdmin>;

export type UsageVerdict =
  | { allowed: true; used: number; limit: number | null; plan: PlanId }
  | { allowed: false; used: number; limit: number; plan: PlanId; message: string };

/** 'YYYY-MM' theo giờ ĐỊA PHƯƠNG, khớp `periodKey('month')` phía client. */
export function monthKey(now: Date = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/** Gói còn hiệu lực của một người dùng, đọc từ máy chủ. */
async function planOfUser(admin: Admin, userId: string): Promise<PlanId> {
  const { data } = await admin
    .from('profiles')
    .select('plan, plan_expires_at')
    .eq('id', userId)
    .maybeSingle();

  const row = data as { plan?: string; plan_expires_at?: string | null } | null;
  if (!row || !PLAN_ORDER.includes(row.plan as PlanId)) return 'free';
  const plan = row.plan as PlanId;
  if (plan === 'free') return 'free';
  // Hết hạn thì rơi về Free — cùng luật với `effectivePlan` ở client, nhưng đây
  // mới là chỗ nói lời cuối.
  if (row.plan_expires_at && new Date(row.plan_expires_at).getTime() <= Date.now()) return 'free';
  return plan;
}

export async function consumeAiCall(admin: Admin, userId: string): Promise<UsageVerdict> {
  const plan = await planOfUser(admin, userId);
  const limit = quotaLimit(plan, 'ai_calls_per_month');
  const period = monthKey();

  const { data, error } = await admin.rpc('bump_ai_usage', { p_user: userId, p_period: period });
  if (error) {
    // Bộ đếm hỏng thì KHÔNG cho gọi. Mở cửa khi không đếm được là biến một sự
    // cố database thành một hoá đơn AI không giới hạn.
    return {
      allowed: false,
      used: 0,
      limit: limit ?? 0,
      plan,
      message: 'Không đọc được hạn mức AI. Thử lại sau ít phút.',
    };
  }

  const used = typeof data === 'number' ? data : 0;
  if (limit === null) return { allowed: true, used, limit: null, plan };

  if (used > limit) {
    return {
      allowed: false,
      used,
      limit,
      plan,
      message:
        plan === 'free'
          ? `Gói Free có ${limit} lượt AI mỗi tháng và bạn đã dùng hết. Nâng cấp để có thêm.`
          : `Gói ${plan} có ${limit} lượt AI mỗi tháng và bạn đã dùng hết. Hạn mức đặt lại vào đầu tháng sau.`,
    };
  }

  return { allowed: true, used, limit, plan };
}

/**
 * Trả lại một lượt khi lỗi thuộc về ta.
 *
 * Chỉ gọi khi CHẮC CHẮN người dùng không nhận được gì: AI trả về rác, cả hai
 * proxy đều chết. Không gọi khi họ đã nhận được kết quả rồi mới có sự cố phụ —
 * lúc đó lượt đã được dùng thật.
 */
export async function refundAiCall(admin: Admin, userId: string): Promise<void> {
  const period = monthKey();
  const { data } = await admin
    .from('ai_usage')
    .select('calls')
    .eq('user_id', userId)
    .eq('period_key', period)
    .maybeSingle();

  const current = (data as { calls?: number } | null)?.calls ?? 0;
  if (current <= 0) return;
  await admin
    .from('ai_usage')
    .update({ calls: current - 1 })
    .eq('user_id', userId)
    .eq('period_key', period);
}
