import { PLAN_ORDER, type PlanId } from '@/lib/billing/plans';
import { requireAdmin } from '@/services/admin/guard';
import { errorText, msg } from '@/lib/server-locale';

/**
 * POST /api/admin/plan
 * body: { userId, plan, months?: number | null, note?: string }
 *
 * Cấp gói bằng tay. Đây là đường DUY NHẤT đổi được `profiles.plan` cho tới khi
 * có cổng thanh toán — migration đã thu hồi quyền UPDATE cột đó của
 * `authenticated`, nên client không tự nâng gói cho mình được.
 *
 * `months` là số tháng kể từ BÂY GIỜ; `null` nghĩa là không hết hạn (dùng cho
 * tài khoản nội bộ, đối tác, hoặc chính chủ app).
 *
 * MỌI THAY ĐỔI ĐỀU GHI NHẬT KÝ, kèm giá trị TRƯỚC và SAU. Cấp gói là thao tác
 * đụng tới tiền; tháng sau không ai nhớ nổi vì sao một tài khoản thành Max, và
 * "đổi thành Max" một mình không cho biết đã lấy đi cái gì.
 */
const MAX_MONTHS = 120;

export async function POST(request: Request): Promise<Response> {
  try {
    const guard = await requireAdmin(request);
    if (!guard.ok) return guard.response;
    const { admin, actor } = guard;

    const body = (await request.json()) as {
      userId?: unknown;
      plan?: unknown;
      months?: unknown;
      note?: unknown;
    };

    const userId = typeof body.userId === 'string' ? body.userId : '';
    const plan = body.plan as PlanId;
    if (!userId) return Response.json({ error: msg(request, 'Thiếu userId.', 'userId is required.') }, { status: 400 });
    if (!PLAN_ORDER.includes(plan)) {
      return Response.json(
        {
          error: msg(
            request,
            `Gói không hợp lệ. Chỉ nhận: ${PLAN_ORDER.join(', ')}.`,
            `Invalid plan. Allowed: ${PLAN_ORDER.join(', ')}.`,
          ),
        },
        { status: 400 },
      );
    }

    // `months` phải là số nguyên dương hoặc null. Nhận bừa thì một giá trị âm
    // sẽ tạo ra gói đã hết hạn ngay lúc cấp — trông như cấp thành công mà không.
    let months: number | null = null;
    if (body.months !== null && body.months !== undefined) {
      const value = Number(body.months);
      if (!Number.isInteger(value) || value < 1 || value > MAX_MONTHS) {
        return Response.json(
          {
            error: msg(
              request,
              `Số tháng phải là số nguyên từ 1 tới ${MAX_MONTHS}, hoặc để trống.`,
              `Months must be a whole number from 1 to ${MAX_MONTHS}, or left empty.`,
            ),
          },
          { status: 400 },
        );
      }
      months = value;
    }

    const { data: before, error: beforeError } = await admin
      .from('profiles')
      .select('plan, plan_started_at, plan_expires_at, role')
      .eq('id', userId)
      .maybeSingle();
    if (beforeError) return Response.json({ error: beforeError.message }, { status: 500 });
    if (!before) return Response.json({ error: msg(request, 'Không có hồ sơ cho userId này.', 'No profile for this userId.') }, { status: 404 });

    const now = new Date();
    let expiresAt: string | null = null;
    if (plan !== 'free' && months !== null) {
      const until = new Date(now);
      until.setMonth(until.getMonth() + months);
      expiresAt = until.toISOString();
    }

    const after = {
      plan,
      // Gói Free không có mốc bắt đầu — để lại ngày cũ thì bảng thống kê tưởng
      // họ vẫn đang trả tiền.
      plan_started_at: plan === 'free' ? null : now.toISOString(),
      plan_expires_at: expiresAt,
    };

    const { error: updateError } = await admin.from('profiles').update(after).eq('id', userId);
    if (updateError) return Response.json({ error: updateError.message }, { status: 500 });

    const { error: auditError } = await admin.from('admin_audit').insert({
      actor_id: actor.userId,
      target_id: userId,
      action: 'set_plan',
      before,
      after,
      note: typeof body.note === 'string' && body.note.trim() ? body.note.trim().slice(0, 500) : null,
    });
    // Ghi nhật ký hỏng thì BÁO, không im lặng. Gói đã đổi rồi mà nhật ký trống
    // là đúng tình huống mà nhật ký sinh ra để tránh.
    if (auditError) {
      return Response.json(
        { ok: true, plan, expiresAt, auditWarning: auditError.message },
        { status: 200 },
      );
    }

    return Response.json({ ok: true, plan, expiresAt });
  } catch (err) {
    const message = errorText(request, err, 'Lỗi không xác định', 'Unknown error');
    return Response.json({ error: message }, { status: 500 });
  }
}
