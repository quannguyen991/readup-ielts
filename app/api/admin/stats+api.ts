import { fetchAllPages } from '@/services/admin/fetch-all';
import { requireAdmin } from '@/services/admin/guard';
import { summarizeUsers, type StatsProfile, type StatsState, type StatsUser } from '@/services/admin/stats';
import { errorText } from '@/lib/server-locale';

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

    // Đọc theo trang: PostgREST cắt im lặng ở 1.000 dòng mỗi lần (xem `fetch-all.ts`).
    // `user_state` có ~10 dòng mỗi người, nên tới khoảng 100 người là đã chạm trần.
    const { rows: profiles, error: pErr } = await fetchAllPages<StatsProfile>((from, to) =>
      admin.from('profiles').select('plan, plan_expires_at, role').order('id').range(from, to),
    );
    if (pErr) return Response.json({ error: pErr.message }, { status: 500 });

    const { rows: states, error: sErr } = await fetchAllPages<StatsState>((from, to) =>
      admin.from('user_state').select('user_id, updated_at').order('user_id').order('store_key').range(from, to),
    );
    if (sErr) return Response.json({ error: sErr.message }, { status: 500 });

    return Response.json({
      stats: summarizeUsers(users, profiles, states, Date.now()),
    });
  } catch (err) {
    return Response.json({ error: errorText(request, err, 'Không đọc được thống kê.', 'Could not load stats.') }, { status: 500 });
  }
}
