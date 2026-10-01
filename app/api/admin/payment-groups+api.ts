import { requireAdmin } from '@/services/admin/guard';
import { errorText, msg } from '@/lib/server-locale';

/**
 * GET  /api/admin/payment-groups?status=collecting   → danh sách nhóm mua chung
 * POST /api/admin/payment-groups  { groupId }        → CHỐT một nhóm
 *
 * CHỐT NHÓM chỉ làm ĐÚNG MỘT VIỆC: ghi lại số người THẬT SỰ đã trả tiền
 * (`settled_size`), đổi `status` sang 'settled'. KHÔNG tự động cộng ngày bù cho
 * ai — nếu nhóm không đủ số người mục tiêu, admin đọc con số `paidCount` ở đây
 * rồi TỰ TAY quyết định có bù gì không, qua đúng công cụ cấp gói đã có sẵn
 * (`/api/admin/plan`). Tự động tính "bao nhiêu ngày bù là đủ công bằng" là một
 * quyết định tiền bạc mơ hồ — không nên để máy tự quyết không ai xem lại.
 */

type GroupRow = {
  id: string;
  leader_id: string;
  plan: string;
  target_size: number;
  discount_percent: number;
  code: string;
  status: string;
  created_at: string;
  settle_by: string;
  settled_size: number | null;
  settled_at: string | null;
};

export async function GET(request: Request): Promise<Response> {
  try {
    const guard = await requireAdmin(request);
    if (!guard.ok) return guard.response;

    const raw = new URL(request.url).searchParams.get('status') ?? 'collecting';
    const ALLOWED = ['collecting', 'settled', 'expired', 'all'] as const;
    const status = (ALLOWED as readonly string[]).includes(raw) ? (raw as (typeof ALLOWED)[number]) : 'collecting';

    let query = guard.admin
      .from('payment_groups')
      .select('id, leader_id, plan, target_size, discount_percent, code, status, created_at, settle_by, settled_size, settled_at')
      .order('created_at', { ascending: false })
      .limit(100);
    if (status !== 'all') query = query.eq('status', status);

    const { data: groups, error } = await query;
    if (error) return Response.json({ error: error.message }, { status: 500 });

    const rows = (groups ?? []) as GroupRow[];
    if (rows.length === 0) return Response.json({ groups: [] });

    // Đếm số đơn ĐÃ TRẢ cho mỗi nhóm — một truy vấn duy nhất, đếm theo group_id,
    // không lặp N truy vấn cho N nhóm.
    const { data: paidPayments } = await guard.admin
      .from('payments')
      .select('group_id')
      .in('group_id', rows.map((g) => g.id))
      .eq('status', 'paid');

    const paidCountByGroup = new Map<string, number>();
    for (const p of paidPayments ?? []) {
      const key = (p as { group_id: string | null }).group_id;
      if (!key) continue;
      paidCountByGroup.set(key, (paidCountByGroup.get(key) ?? 0) + 1);
    }

    const { data: authData } = await guard.admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const emailById = new Map((authData?.users ?? []).map((u) => [u.id, u.email ?? null]));

    return Response.json({
      groups: rows.map((g) => ({
        ...g,
        leaderEmail: emailById.get(g.leader_id) ?? null,
        paidCount: paidCountByGroup.get(g.id) ?? 0,
        pastDeadline: new Date(g.settle_by).getTime() < Date.now(),
      })),
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

    const body = (await request.json()) as { groupId?: unknown };
    const groupId = typeof body.groupId === 'string' ? body.groupId : '';
    if (!groupId) return Response.json({ error: msg(request, 'Thiếu groupId.', 'groupId is required.') }, { status: 400 });

    const { data: group, error: groupError } = await admin
      .from('payment_groups')
      .select('id, status, leader_id')
      .eq('id', groupId)
      .maybeSingle();
    if (groupError) return Response.json({ error: groupError.message }, { status: 500 });
    if (!group) return Response.json({ error: msg(request, 'Không tìm thấy nhóm.', 'Group not found.') }, { status: 404 });
    if (group.status !== 'collecting') {
      return Response.json({ error: msg(request, 'Nhóm này đã được chốt rồi.', 'This group has already been settled.') }, { status: 409 });
    }

    const { count: paidCount } = await admin
      .from('payments')
      .select('id', { count: 'exact', head: true })
      .eq('group_id', groupId)
      .eq('status', 'paid');

    const settledSize = paidCount ?? 0;

    const { error: updateError } = await admin
      .from('payment_groups')
      .update({
        status: 'settled',
        settled_size: settledSize,
        settled_at: new Date().toISOString(),
        settled_by: actor.userId,
      })
      .eq('id', groupId);
    if (updateError) return Response.json({ error: updateError.message }, { status: 500 });

    await admin.from('admin_audit').insert({
      actor_id: actor.userId,
      // "Đối tượng" của lượt chốt nhóm là TRƯỞNG NHÓM — người tạo ra nhóm này,
      // không phải một cột nào khác hợp lý hơn trong bảng audit vốn thiết kế
      // cho các thao tác nhắm vào MỘT người dùng.
      target_id: group.leader_id,
      action: 'settle_payment_group',
      before: { status: 'collecting' },
      after: { status: 'settled', settled_size: settledSize },
      note: `Nhóm ${groupId}: ${settledSize} người đã trả`,
    });

    return Response.json({ settledSize });
  } catch (err) {
    return Response.json({ error: message(request, err) }, { status: 500 });
  }
}

function message(request: Request, err: unknown): string {
  return errorText(request, err, 'Lỗi không xác định', 'Unknown error');
}
