import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { anonymousName, displayableName } from '@/services/gamification/display-name';
import { vnToday } from '@/services/gamification/golden';
import { BOARD_LIMIT, rankMonth } from '@/services/travel/leaderboard';
import { errorText } from '@/lib/server-locale';

/**
 * GET /api/travel-leaderboard — "Ai đi nhiều nhất": điểm hộ chiếu THÁNG NÀY (giờ Việt Nam).
 *
 * Đọc sổ cái trong khoá `travel` của `user_state` (không cần bảng mới) và cộng
 * các khoản `pp:<tháng>-…` (`services/travel/leaderboard.ts`). Trả tối đa
 * `BOARD_LIMIT` người để máy khách tự tìm hạng của mình. Tên theo đúng luật của
 * các bảng khác: chỉ hiện tên người dùng tự đặt, còn lại "Học viên ####"; email
 * và mã đầy đủ không rời máy chủ. Trao giải do quản trị làm tay — chỗ này chỉ xếp hạng.
 */
type Row = { user_id: string; ledger: Record<string, number> | null };

export async function GET(request: Request): Promise<Response> {
  try {
    const month = vnToday(new Date()).key.slice(0, 7);
    const admin = getSupabaseAdmin();
    const { data, error } = await admin.from('user_state').select('user_id, ledger:payload->ledger').eq('store_key', 'travel');
    if (error) return Response.json({ error: error.message }, { status: 500 });

    const top = rankMonth(((data ?? []) as unknown as Row[]).map((r) => ({ userId: r.user_id, ledger: r.ledger })), month, BOARD_LIMIT);

    const names = new Map<string, string>();
    if (top.length > 0) {
      const { data: profiles } = await admin.from('profiles').select('id, display_name').in('id', top.map((t) => t.userId));
      for (const p of (profiles ?? []) as { id: string; display_name: string | null }[]) {
        const chosen = displayableName(p.display_name);
        if (chosen) names.set(p.id, chosen);
      }
    }
    return Response.json({
      month,
      board: top.map((t) => ({ id: t.userId.slice(0, 8), name: names.get(t.userId) ?? anonymousName(t.userId), points: t.points })),
    });
  } catch (err) {
    return Response.json({ error: errorText(request, err, 'Không đọc được bảng xếp hạng.', 'Could not load the leaderboard.') }, { status: 500 });
  }
}
