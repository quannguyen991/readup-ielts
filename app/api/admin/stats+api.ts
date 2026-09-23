import { requireAdmin } from '@/services/admin/guard';
import { summarizeUsers, type StatsProfile, type StatsState, type StatsUser } from '@/services/admin/stats';

/**
 * GET /api/admin/stats — tổng quan người dùng cho trang quản trị.
 *
 * Chỉ trả SỐ ĐẾM (xem `services/admin/stats.ts`). Chọn đúng cột cần: với
 * `user_state` chỉ lấy `user_id, updated_at`, không kéo payload học nặng vài
 * trăm KB mỗi người.
 */
export async function GET(request: Request): Promise<Response> {
  try {
    const guard = await requireAdmin(request);
    if (!guard.ok) return guard.response;
    const { admin } = guard;

    const users: StatsUser[] = [];
    for (let page = 1; page <= 50; page += 1) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) return Response.json({ error: error.message }, { status: 500 });
      users.push(...data.users.map((u) => ({ created_at: u.created_at, last_sign_in_at: u.last_sign_in_at ?? null })));
      if (data.users.length < 1000) break;
    }

    const { data: profiles, error: pErr } = await admin.from('profiles').select('plan, plan_expires_at, role');
    if (pErr) return Response.json({ error: pErr.message }, { status: 500 });

    const { data: states, error: sErr } = await admin.from('user_state').select('user_id, updated_at');
    if (sErr) return Response.json({ error: sErr.message }, { status: 500 });

    return Response.json({
      stats: summarizeUsers(users, (profiles ?? []) as StatsProfile[], (states ?? []) as StatsState[], Date.now()),
    });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Không đọc được thống kê.' }, { status: 500 });
  }
}
