import { extendExpiry } from '@/services/payment/order';
import { requireAdmin } from '@/services/admin/guard';
import { errorText, msg } from '@/lib/server-locale';

/**
 * GET  /api/admin/payments?status=pending   → danh sách đơn để đối chiếu
 * POST /api/admin/payments  { paymentId, action: 'confirm' | 'reject', note? }
 *
 * Đây là bước ĐỔI TIỀN THÀNH GÓI, nên nó là route nhạy cảm nhất trong app.
 * Bốn điều bắt buộc:
 *
 * 1. Chỉ admin. `requireAdmin` đọc vai trò từ database bằng service key.
 * 2. GÓI VÀ SỐ THÁNG LẤY TỪ ĐƠN ĐÃ LƯU, không lấy từ body. Nhận từ body nghĩa
 *    là admin (hoặc bất cứ ai chiếm được phiên admin) cấp gói Max vĩnh viễn cho
 *    một đơn 79.000đ chỉ bằng cách đổi một chuỗi.
 * 3. XÁC NHẬN ĐÚNG MỘT LẦN. Đơn đã `paid` thì từ chối, không cộng gói lần hai.
 * 4. Ghi `admin_audit` kèm trước/sau. Tiền đã chạy thì phải truy được.
 */
export async function GET(request: Request): Promise<Response> {
  try {
    const guard = await requireAdmin(request);
    if (!guard.ok) return guard.response;

    const raw = new URL(request.url).searchParams.get('status') ?? 'pending';
    // Chỉ nhận giá trị có trong ràng buộc check của bảng — chuyền thẳng chuỗi
    // từ query string vào `.eq()` thì một tham số lạ cho ra danh sách rỗng và
    // trông y như "không có đơn nào".
    const ALLOWED = ['pending', 'paid', 'failed', 'refunded', 'all'] as const;
    const status = (ALLOWED as readonly string[]).includes(raw) ? (raw as (typeof ALLOWED)[number]) : 'pending';
    let query = guard.admin
      .from('payments')
      .select(
        'id, user_id, plan, amount_vnd, billing_cycle, months, status, reference, admin_note, created_at, paid_at, confirmed_at',
      )
      .order('created_at', { ascending: false })
      .limit(100);

    if (status !== 'all') query = query.eq('status', status);

    const { data: payments, error } = await query;
    if (error) return Response.json({ error: error.message }, { status: 500 });

    // Ghép email vào để người đối chiếu biết đơn của ai — `payments` chỉ có
    // user_id, mà đối chiếu bằng UUID thì không ai làm nổi.
    const { data: authData } = await guard.admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const emailById = new Map((authData?.users ?? []).map((u) => [u.id, u.email ?? null]));

    return Response.json({
      payments: (payments ?? []).map((p) => ({ ...p, email: emailById.get(p.user_id) ?? null })),
    });
  } catch (err) {
    return Response.json({ error: message(request, err) }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const guard = await requireAdmin(request);
    if (!guard.ok) return guard.response;
    const { admin, actor } = guard;

    const body = (await request.json()) as { paymentId?: unknown; action?: unknown; note?: unknown };
    const paymentId = typeof body.paymentId === 'string' ? body.paymentId : '';
    const action = body.action;
    if (!paymentId) return Response.json({ error: msg(request, 'Thiếu paymentId.', 'paymentId is required.') }, { status: 400 });
    if (action !== 'confirm' && action !== 'reject') {
      return Response.json({ error: msg(request, "action chỉ nhận 'confirm' hoặc 'reject'.", "action must be 'confirm' or 'reject'.") }, { status: 400 });
    }
    const note =
      typeof body.note === 'string' && body.note.trim() ? body.note.trim().slice(0, 500) : null;

    const { data: payment, error: readError } = await admin
      .from('payments')
      .select('id, user_id, plan, months, amount_vnd, billing_cycle, status, reference')
      .eq('id', paymentId)
      .maybeSingle();
    if (readError) return Response.json({ error: readError.message }, { status: 500 });
    if (!payment) return Response.json({ error: msg(request, 'Không có đơn này.', 'Payment not found.') }, { status: 404 });

    if (payment.status !== 'pending') {
      // Chặn cộng gói hai lần khi admin bấm nhầm hoặc bấm đúp. Đây là lý do
      // trạng thái được kiểm ở ĐÂY chứ không chỉ ẩn nút ở giao diện.
      return Response.json(
        {
          error: msg(
            request,
            `Đơn này đã ở trạng thái "${payment.status}", không xử lý lại được.`,
            `This payment is already "${payment.status}" and can't be processed again.`,
          ),
        },
        { status: 409 },
      );
    }

    const now = new Date();

    if (action === 'reject') {
      const { error } = await admin
        .from('payments')
        .update({ status: 'failed', admin_note: note, confirmed_by: actor.userId, confirmed_at: now.toISOString() })
        .eq('id', paymentId)
        .eq('status', 'pending');
      if (error) return Response.json({ error: error.message }, { status: 500 });

      await admin.from('admin_audit').insert({
        actor_id: actor.userId,
        target_id: payment.user_id,
        action: 'reject_payment',
        before: { status: 'pending', reference: payment.reference },
        after: { status: 'failed' },
        note,
      });
      return Response.json({ ok: true, status: 'failed' });
    }

    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('plan, plan_started_at, plan_expires_at')
      .eq('id', payment.user_id)
      .maybeSingle();
    if (profileError) return Response.json({ error: profileError.message }, { status: 500 });
    if (!profile) return Response.json({ error: msg(request, 'Người dùng không có hồ sơ.', 'This user has no profile.') }, { status: 404 });

    /*
      Gia hạn cộng dồn nếu gói đang mua TRÙNG gói đang có; đổi sang gói khác thì
      tính lại từ hôm nay.

      Cộng dồn khi đổi gói là sai theo cả hai chiều: nâng từ Plus lên Max mà giữ
      hạn cũ là cho không phần chênh lệch, còn hạ từ Max xuống Plus mà cộng thêm
      là kéo dài một gói rẻ hơn bằng tiền của gói đắt hơn.
    */
    const samePlan = profile.plan === payment.plan;
    const expiresAt = extendExpiry(samePlan ? profile.plan_expires_at : null, payment.months ?? 1, now);

    const after = {
      plan: payment.plan,
      plan_started_at: samePlan ? (profile.plan_started_at ?? now.toISOString()) : now.toISOString(),
      plan_expires_at: expiresAt,
    };

    const { error: updateError } = await admin.from('profiles').update(after).eq('id', payment.user_id);
    if (updateError) return Response.json({ error: updateError.message }, { status: 500 });

    // `eq('status', 'pending')` lần nữa: hai admin bấm cùng lúc thì chỉ một lệnh
    // ăn, lệnh kia không đổi hàng nào. Kiểm ở trên là chưa đủ — giữa lúc đọc và
    // lúc ghi vẫn có khoảng trống.
    const { data: marked, error: payError } = await admin
      .from('payments')
      .update({
        status: 'paid',
        paid_at: now.toISOString(),
        confirmed_by: actor.userId,
        confirmed_at: now.toISOString(),
        admin_note: note,
      })
      .eq('id', paymentId)
      .eq('status', 'pending')
      .select('id');
    if (payError) return Response.json({ error: payError.message }, { status: 500 });
    if (!marked || marked.length === 0) {
      return Response.json({ error: msg(request, 'Đơn vừa được người khác xử lý.', 'Someone else just processed this payment.') }, { status: 409 });
    }

    const { error: auditError } = await admin.from('admin_audit').insert({
      actor_id: actor.userId,
      target_id: payment.user_id,
      action: 'confirm_payment',
      before: { ...profile, payment_status: 'pending', reference: payment.reference },
      after: { ...after, payment_status: 'paid', amount_vnd: payment.amount_vnd },
      note,
    });

    return Response.json({
      ok: true,
      status: 'paid',
      plan: payment.plan,
      expiresAt,
      ...(auditError ? { auditWarning: auditError.message } : {}),
    });
  } catch (err) {
    return Response.json({ error: message(request, err) }, { status: 500 });
  }
}

function message(request: Request, err: unknown): string {
  return errorText(request, err, 'Lỗi không xác định', 'Unknown error');
}
