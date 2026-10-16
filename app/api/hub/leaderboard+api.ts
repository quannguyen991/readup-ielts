import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { anonymousName } from '@/services/gamification/display-name';
import { dayKeyOf } from '@/services/hub/daily';
import { rankRows, weeklyHubPoints } from '@/services/hub/leaderboard';

/**
 * GET /api/hub/leaderboard — bảng xếp hạng tuần của khu luyện nói.
 *
 * Đọc đúng hai trường cần thiết từ store `hub` (không kéo cả cục payload). Không lộ
 * danh tính: chỉ hiện "Học viên ####" từ id; id đầy đủ không rời máy chủ. Nếu có
 * đăng nhập thì kèm thứ hạng của chính người đó.
 */
type HubRow = { user_id: string; doneByDay: Record<string, string[]> | null; phonemeBest: Record<string, number> | null };

export async function GET(request: Request): Promise<Response> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('user_state')
    .select('user_id, doneByDay:payload->doneByDay, phonemeBest:payload->phonemeBest')
    .eq('store_key', 'hub');
  if (error) return Response.json({ error: 'Không tải được bảng xếp hạng, thử lại sau.' }, { status: 502 });

  const today = dayKeyOf(new Date());
  const scored = ((data ?? []) as unknown as HubRow[]).map((r) => ({
    userId: r.user_id,
    points: weeklyHubPoints(r.doneByDay ?? {}, r.phonemeBest ?? {}, today),
  }));
  const ranked = rankRows(scored);

  let me: { rank: number | null; points: number } | null = null;
  const header = request.headers.get('authorization') ?? '';
  const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
  if (token) {
    const { data: auth } = await admin.auth.getUser(token);
    if (auth.user) {
      const mine = scored.find((r) => r.userId === auth.user!.id);
      const rank = mine ? (ranked.find((r) => r.userId === mine.userId)?.rank ?? null) : null;
      me = { rank, points: mine?.points ?? 0 };
    }
  }

  return Response.json({
    top: ranked.map((r) => ({ rank: r.rank, name: anonymousName(r.userId), points: r.points })),
    me,
    updatedAt: new Date().toISOString(),
  });
}
