import { EVERYONE_PLAN, EVERYONE_SEARCH_AI_PER_MONTH, type PlanId } from '@/lib/billing/plans';
import { quotaLimit } from '@/lib/billing/entitlements';
import { msg, type LocaleSource } from '@/lib/server-locale';
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

/**
 * LOẠI LƯỢT GỌI. `standard` là lượt AI tính vào hạn mức của gói (chấm bài, trợ
 * giảng…). `search` là lượt "Hỏi AI" trong ô tìm bài: một câu hỏi ngắn tới model
 * rẻ nhất, trả về vài dòng — đắt bằng một phần nhỏ của một lượt chấm Writing.
 *
 * Đếm RIÊNG chứ không trừ vào hạn mức chính: Free chỉ có 3 lượt AI mỗi tháng, và
 * bắt người học đổi một lượt chấm bài lấy một lần tìm bài là vô lý. Vẫn phải có
 * trần — mỗi lượt vẫn là tiền thật — nên đếm bằng đúng bảng `ai_usage`, chỉ khác
 * khoá kỳ (`search:YYYY-MM`). Không cần đổi lược đồ: `period_key` là chuỗi tự do.
 */
export type AiCallKind = 'standard' | 'search';

/** Trần lượt "Hỏi AI" khi tìm bài, mỗi tháng. */
export const SEARCH_AI_LIMIT: Record<PlanId, number> = {
  free: 30,
  plus: 150,
  pro: 600,
  max: EVERYONE_SEARCH_AI_PER_MONTH,
};

function periodFor(kind: AiCallKind, now: Date = new Date()): string {
  return kind === 'search' ? `search:${monthKey(now)}` : monthKey(now);
}

/** Gói còn hiệu lực của một người dùng, đọc từ máy chủ. */
async function planOfUser(_admin: Admin, _userId: string): Promise<PlanId> {
  // App cộng đồng không thương mại: mọi người dùng dùng hạn mức của gói cao nhất (trần kỹ thuật, không phải hàng rào trả phí).
  return EVERYONE_PLAN;
}

/** `locale`: ngôn ngữ của lời nhắn hết lượt — truyền `request` của route vào. */
export async function consumeAiCall(
  admin: Admin,
  userId: string,
  locale: LocaleSource = 'vi',
  kind: AiCallKind = 'standard',
): Promise<UsageVerdict> {
  const plan = await planOfUser(admin, userId);
  const limit = kind === 'search' ? SEARCH_AI_LIMIT[plan] : quotaLimit(plan, 'ai_calls_per_month');
  const period = periodFor(kind);

  const { data, error } = await admin.rpc('bump_ai_usage', { p_user: userId, p_period: period });
  if (error) {
    // Bộ đếm hỏng thì KHÔNG cho gọi. Mở cửa khi không đếm được là biến một sự
    // cố database thành một hoá đơn AI không giới hạn.
    return {
      allowed: false,
      used: 0,
      limit: limit ?? 0,
      plan,
      message: msg(
        locale,
        'Không đọc được hạn mức AI. Thử lại sau ít phút.',
        'Could not read your AI quota. Please try again in a few minutes.',
      ),
    };
  }

  const used = typeof data === 'number' ? data : 0;
  if (limit === null) return { allowed: true, used, limit: null, plan };

  if (used > limit && kind === 'search') {
    return {
      allowed: false,
      used,
      limit,
      plan,
      message:
        plan === 'max'
          ? msg(
              locale,
              `Bạn đã dùng hết ${limit} lượt Hỏi AI khi tìm bài trong tháng này. Ô tìm kiếm thường vẫn dùng được.`,
              `You've used all ${limit} AI searches this month. Regular search still works.`,
            )
          : msg(
              locale,
              `Gói ${plan === 'free' ? 'Free' : plan} có ${limit} lượt Hỏi AI khi tìm bài mỗi tháng và bạn đã dùng hết. Ô tìm kiếm thường vẫn dùng được; nâng cấp để có thêm lượt.`,
              `The ${plan === 'free' ? 'Free' : plan} plan includes ${limit} AI searches per month and you've used them all. Regular search still works; upgrade for more.`,
            ),
    };
  }

  if (used > limit) {
    return {
      allowed: false,
      used,
      limit,
      plan,
      message:
        plan === 'free'
          ? msg(
              locale,
              `Gói Free có ${limit} lượt AI mỗi tháng và bạn đã dùng hết. Nâng cấp để có thêm.`,
              `The Free plan includes ${limit} AI uses per month and you've used them all. Upgrade to get more.`,
            )
          : msg(
              locale,
              `Gói ${plan} có ${limit} lượt AI mỗi tháng và bạn đã dùng hết. Hạn mức đặt lại vào đầu tháng sau.`,
              `Your ${plan} plan includes ${limit} AI uses per month and you've used them all. Your quota resets at the start of next month.`,
            ),
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
export async function refundAiCall(admin: Admin, userId: string, kind: AiCallKind = 'standard'): Promise<void> {
  const period = periodFor(kind);
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
