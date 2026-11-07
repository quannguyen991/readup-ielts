import { generateGroupCode, isValidGroupCode } from '@/lib/payment/reference';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { isPaidPlan } from '@/services/payment/order';
import { GROUP_BUY_SIZES, groupBuyDiscountPercent, groupBuyYearlyPrice, type GroupSize } from '@/services/payment/pricing-rules';
import { errorText, msg } from '@/lib/server-locale';

/**
 * POST /api/payment-groups        { plan, targetSize }   → tạo nhóm mới, trả mã chia sẻ
 * GET  /api/payment-groups?code=… → tra một nhóm bằng mã (KHÔNG cần đăng nhập)
 *
 * GET KHÔNG ĐÒI ĐĂNG NHẬP có chủ đích: người bấm vào link chia sẻ ("rủ bạn mua
 * Max theo nhóm") thường chưa có tài khoản. Bắt đăng nhập rồi mới cho xem nhóm
 * đang rủ mua gì, giá bao nhiêu là dựng thêm một bức tường trước khi họ kịp
 * thấy có gì đáng để đăng nhập.
 *
 * TẠO NHÓM thì ngược lại — PHẢI đăng nhập, vì group.leader_id gắn với một
 * user_id thật. Và bảng `payment_groups` không cho `authenticated` tự ghi
 * (xem migration `20260903000100_payment_groups.sql`), nên route này là cách
 * DUY NHẤT tạo được một nhóm.
 */

async function identify(
  request: Request,
): Promise<{ ok: true; admin: ReturnType<typeof getSupabaseAdmin>; userId: string } | { ok: false; error: Response }> {
  const header = request.headers.get('authorization') ?? '';
  const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
  if (!token) {
    return { ok: false, error: Response.json({ error: msg(request, 'Thiếu access token.', 'Missing access token.') }, { status: 401 }) };
  }
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) {
    return { ok: false, error: Response.json({ error: msg(request, 'Phiên đăng nhập không hợp lệ.', 'Invalid session. Please sign in again.') }, { status: 401 }) };
  }
  return { ok: true, admin, userId: data.user.id };
}

function isGroupSize(value: unknown): value is GroupSize {
  return typeof value === 'number' && (GROUP_BUY_SIZES as number[]).includes(value);
}

export async function POST(request: Request): Promise<Response> {
  try {
    const who = await identify(request);
    if (!who.ok) return who.error;

    const body = (await request.json()) as { plan?: unknown; targetSize?: unknown };
    const plan = String(body.plan ?? '');

    if (!isPaidPlan(plan)) {
      return Response.json({ error: msg(request, 'Chỉ mua theo nhóm được với gói Plus, Pro hoặc Max.', 'Group buying is only available for Plus, Pro or Max.') }, { status: 400 });
    }
    if (!isGroupSize(body.targetSize)) {
      return Response.json({ error: msg(request, `Mốc số người chỉ nhận: ${GROUP_BUY_SIZES.join(', ')}.`, `Group size must be one of: ${GROUP_BUY_SIZES.join(', ')}.`) }, { status: 400 });
    }

    const targetSize = body.targetSize;
    const discountPercent = groupBuyDiscountPercent(plan, targetSize);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = generateGroupCode();
      const { data, error } = await who.admin
        .from('payment_groups')
        .insert({
          leader_id: who.userId,
          plan,
          target_size: targetSize,
          discount_percent: discountPercent,
          code,
        })
        .select('id, code, plan, target_size, discount_percent, status, created_at, settle_by')
        .single();

      if (!error && data) {
        return Response.json({
          group: data,
          priceVnd: groupBuyYearlyPrice(plan, targetSize),
        });
      }
      // 23505 = vi phạm ràng buộc duy nhất trên `code` — cực hiếm, thử lại là đủ.
      if (error && error.code !== '23505') {
        return Response.json({ error: error.message }, { status: 500 });
      }
    }

    return Response.json({
        error: msg(
          request,
          'Không sinh được mã nhóm chưa trùng. Thử lại sau ít phút.',
          "Couldn't generate a unique group code. Please try again in a few minutes.",
        ),
      }, { status: 503 });
  } catch (err) {
    return Response.json({ error: message(request, err) }, { status: 500 });
  }
}

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const code = (url.searchParams.get('code') ?? '').trim().toUpperCase();
    if (!code || !isValidGroupCode(code)) {
      return Response.json({ error: msg(request, 'Mã nhóm không hợp lệ.', 'Invalid group code.') }, { status: 400 });
    }

    // GET không cần token — dùng service_role trực tiếp vì đây là dữ liệu công
    // khai theo thiết kế (ai có link cũng xem được nhóm đang rủ mua gì).
    const admin = getSupabaseAdmin();
    const { data: group, error } = await admin
      .from('payment_groups')
      .select('id, code, plan, target_size, discount_percent, status, created_at, settle_by, settled_size')
      .eq('code', code)
      .maybeSingle();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    if (!group) return Response.json({ error: msg(request, 'Không tìm thấy nhóm với mã này.', 'No group found with this code.') }, { status: 404 });

    const { count: paidCount } = await admin
      .from('payments')
      .select('id', { count: 'exact', head: true })
      .eq('group_id', group.id)
      .eq('status', 'paid');

    return Response.json({
      group,
      paidCount: paidCount ?? 0,
      priceVnd: groupBuyYearlyPrice(group.plan, group.target_size as GroupSize),
      expired: group.status === 'collecting' && new Date(group.settle_by).getTime() < Date.now(),
    });
  } catch (err) {
    return Response.json({ error: message(request, err) }, { status: 500 });
  }
}

function message(request: Request, err: unknown): string {
  return errorText(request, err, 'Lỗi không xác định', 'Unknown error');
}
