import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { generateReference } from '@/lib/payment/reference';
import { isCycle, isPaidPlan } from '@/services/payment/order';
import { resolveOrderPrice } from '@/services/payment/resolvePrice';

/**
 * POST /api/payments/order   { plan, cycle, group? }   → tạo hoặc lấy lại đơn đang chờ
 * GET  /api/payments/order                             → đơn đang chờ gần nhất của tôi
 *
 * ĐIỂM QUAN TRỌNG NHẤT: SỐ TIỀN KHÔNG BAO GIỜ ĐẾN TỪ CLIENT. Route chỉ nhận
 * `plan`, `cycle` và `group` (mã, không phải số tiền), rồi TỰ CHỐT giá phía
 * máy chủ qua `resolveOrderPrice()` — xét cả giữ giá cũ, mua nhóm, flash sale,
 * gia hạn sớm, rồi lấy mức RẺ NHẤT. Nhận `amount` từ body nghĩa là ai cũng mua
 * gói Max với giá 1.000đ bằng cách sửa một số trong DevTools.
 *
 * Danh tính cũng lấy từ access token, không lấy từ body — nếu không thì tạo được
 * đơn đứng tên người khác, và người đó bị tính tiền cho gói mình không đặt.
 *
 * TÁI SỬ DỤNG ĐƠN ĐANG CHỜ thay vì tạo mới mỗi lần mở trang. Người dùng tải lại
 * trang giữa chừng mà nhận mã đối chiếu khác thì lần chuyển khoản họ vừa thực
 * hiện mang mã cũ — vẫn khớp được, nhưng danh sách quản trị đầy đơn rác và
 * người đối chiếu phải đoán xem cái nào là thật. Đơn ĐANG CHỜ là một BÁO GIÁ ĐÃ
 * CHỐT — tái sử dụng nó giữ nguyên giá cũ, không chấm lại giảm giá mỗi lần mở
 * trang (mã nhóm/flash sale có thể đổi trạng thái giữa chừng).
 */

/** Đơn cũ hơn ngần này thì coi như bỏ, cấp mã mới. */
const REUSE_WINDOW_HOURS = 24;

type Identity =
  | { ok: true; admin: ReturnType<typeof getSupabaseAdmin>; userId: string }
  | { ok: false; error: Response };

async function identify(request: Request): Promise<Identity> {
  const header = request.headers.get('authorization') ?? '';
  const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
  if (!token) {
    return { ok: false, error: Response.json({ error: 'Thiếu access token.' }, { status: 401 }) };
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) {
    return {
      ok: false,
      error: Response.json({ error: 'Phiên đăng nhập không hợp lệ.' }, { status: 401 }),
    };
  }
  return { ok: true, admin, userId: data.user.id };
}

export async function GET(request: Request): Promise<Response> {
  try {
    const who = await identify(request);
    if (!who.ok) return who.error;

    const { data, error } = await who.admin
      .from('payments')
      .select('id, plan, billing_cycle, amount_vnd, reference, status, created_at, confirmed_at')
      .eq('user_id', who.userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ orders: data ?? [] });
  } catch (err) {
    return Response.json({ error: message(err) }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const who = await identify(request);
    if (!who.ok) return who.error;

    const body = (await request.json()) as { plan?: unknown; cycle?: unknown; group?: unknown };
    const plan = String(body.plan ?? '');
    const cycle = body.cycle;

    if (!isPaidPlan(plan)) {
      return Response.json({ error: `Gói "${plan}" không mua được.` }, { status: 400 });
    }
    if (!isCycle(cycle)) {
      return Response.json({ error: "Chu kỳ chỉ nhận 'monthly' hoặc 'yearly'." }, { status: 400 });
    }

    const since = new Date(Date.now() - REUSE_WINDOW_HOURS * 3600_000).toISOString();
    const { data: existing } = await who.admin
      .from('payments')
      .select('id, plan, billing_cycle, amount_vnd, reference, status, created_at')
      .eq('user_id', who.userId)
      .eq('status', 'pending')
      .eq('plan', plan)
      .eq('billing_cycle', cycle)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(1);

    if (existing && existing.length > 0) {
      return Response.json({ order: existing[0], reused: true });
    }

    let order;
    try {
      const groupCode = typeof body.group === 'string' && body.group.trim() ? body.group : null;
      order = await resolveOrderPrice(who.admin, who.userId, plan, cycle, groupCode);
    } catch (err) {
      // Lỗi do đầu vào của client, không phải lỗi máy chủ — trả 400 kèm lý do
      // thật để trang thanh toán hiện được, thay vì một 500 câm.
      return Response.json({ error: message(err) }, { status: 400 });
    }

    /*
      Mã đối chiếu là DUY NHẤT toàn bảng (ràng buộc ở tầng database). Xác suất
      trùng trên 30^6 tổ hợp là cực nhỏ, nhưng "cực nhỏ" nhân với thời gian vẫn
      ra "một lúc nào đó" — và lúc đó người dùng thấy một lỗi khó hiểu ngay ở
      bước trả tiền. Thử lại vài lần là đủ, và nếu vẫn trượt thì báo thật.
    */
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const reference = generateReference();
      const { data, error } = await who.admin
        .from('payments')
        .insert({
          user_id: who.userId,
          plan: order.plan,
          amount_vnd: order.amountVnd,
          billing_cycle: order.cycle,
          months: order.months,
          status: 'pending',
          provider: 'manual_qr',
          reference,
          group_id: order.groupId,
        })
        .select('id, plan, billing_cycle, amount_vnd, reference, status, created_at')
        .single();

      if (!error && data) {
        // `source`/`label` chỉ để hiện cho người dùng biết VÌ SAO số tiền là số
        // này ("giữ giá cũ", "giá mua nhóm"...) — không lưu vào DB, vì số tiền
        // cuối trong `amount_vnd` đã đủ cho việc đối chiếu/kế toán.
        return Response.json({ order: data, reused: false, priceSource: order.source, priceLabel: order.label });
      }
      // 23505 = vi phạm ràng buộc duy nhất. Chỉ trường hợp đó mới đáng thử lại.
      if (error && error.code !== '23505') {
        return Response.json({ error: error.message }, { status: 500 });
      }
    }

    return Response.json(
      { error: 'Không sinh được mã đối chiếu chưa trùng. Thử lại sau ít phút.' },
      { status: 503 },
    );
  } catch (err) {
    return Response.json({ error: message(err) }, { status: 500 });
  }
}

function message(err: unknown): string {
  return err instanceof Error ? err.message : 'Lỗi không xác định';
}
