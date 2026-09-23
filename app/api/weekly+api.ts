import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { anonymousName, displayableName } from '@/services/gamification/display-name';
import { better, parseWeekId, weekId, type WeeklyResult } from '@/services/weekly/challenge';

/**
 * GET /api/weekly?week=w2026_39 — kết quả Đề của tuần của CẢ NƯỚC.
 *
 * Đọc khoá `weekly` trong `user_state` (máy người dùng đồng bộ lên sau khi nộp
 * bài), chỉ lấy đúng kết quả của tuần được hỏi — không kéo payload khác.
 *
 * Trả về: số người làm, mọi cặp (điểm, thời gian) ẩn danh để máy khách tự tính
 * mình đứng thứ mấy, và top 10 kèm tên (luật tên giống bảng xếp hạng tháng:
 * không bao giờ lộ email).
 */
type Row = { user_id: string; result: WeeklyResult | null };

export async function GET(request: Request): Promise<Response> {
  try {
    const asked = new URL(request.url).searchParams.get('week') ?? weekId();
    if (!parseWeekId(asked)) return Response.json({ error: 'Mã tuần không hợp lệ.' }, { status: 400 });

    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from('user_state')
      .select(`user_id, result:payload->results->${asked}`)
      .eq('store_key', 'weekly');
    if (error) return Response.json({ error: error.message }, { status: 500 });

    const rows = ((data ?? []) as unknown as Row[]).filter(
      (r): r is { user_id: string; result: WeeklyResult } =>
        !!r.result && typeof r.result.score === 'number' && typeof r.result.ms === 'number',
    );
    rows.sort((a, b) => (better(a.result, b.result) ? -1 : better(b.result, a.result) ? 1 : 0));

    const topRows = rows.slice(0, 10);
    const names = new Map<string, string>();
    if (topRows.length > 0) {
      const { data: profiles } = await admin
        .from('profiles')
        .select('id, display_name')
        .in(
          'id',
          topRows.map((r) => r.user_id),
        );
      for (const p of (profiles ?? []) as { id: string; display_name: string | null }[]) {
        const chosen = displayableName(p.display_name);
        if (chosen) names.set(p.id, chosen);
      }
    }

    return Response.json({
      week: asked,
      participants: rows.length,
      results: rows.map((r) => ({ score: r.result.score, ms: r.result.ms })),
      top: topRows.map((r) => ({
        name: names.get(r.user_id) ?? anonymousName(r.user_id),
        score: r.result.score,
        total: r.result.total,
        ms: r.result.ms,
      })),
    });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Không đọc được kết quả tuần.' }, { status: 500 });
  }
}
