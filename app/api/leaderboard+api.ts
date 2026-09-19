import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { currentStreak, monthPoints, type DayLog } from '@/services/gamification/points';

/**
 * GET /api/leaderboard — bảng xếp hạng điểm THÁNG NÀY.
 *
 * CHỈ LẤY ĐÚNG THỨ CẦN. Câu truy vấn chọn `payload->daily`, không kéo cả cục
 * payload: nhật ký học của một người nặng hơn 150 KB, mà bảng này chỉ cần số
 * phút mỗi ngày. Kéo cả cục là vài chục megabyte cho một bảng hai mươi dòng.
 *
 * KHÔNG LỘ DANH TÍNH. Chỉ hiện tên khi người dùng ĐÃ TỰ ĐẶT một cái tên trông
 * như tên người; còn lại là "Học viên ####" lấy từ id. Khi đăng ký bằng email,
 * `display_name` thường được điền sẵn bằng phần trước dấu @ — đem lên bảng là
 * phát tán email của người khác cho người lạ, mà họ chưa hề đồng ý. Email và
 * id đầy đủ thì không bao giờ rời khỏi máy chủ.
 *
 * XẾP THEO ĐIỂM THÁNG, tính lại bằng chính bộ luật mà máy người dùng dùng
 * (`services/gamification/points.ts`), nên số trên bảng khớp số trong thẻ của
 * họ. Một bộ luật, hai nơi chạy.
 */
type StudyRow = { user_id: string; daily: Record<string, DayLog> | null };

/**
 * Tên chỉ được hiện khi trông như tên người TỰ ĐẶT.
 *
 * Bỏ qua mọi chuỗi có '@', và mọi chuỗi kiểu định danh máy — một từ liền, chỉ
 * chữ thường, số, dấu chấm hoặc gạch (vd "quannguyen.ulis207"): đó gần như
 * luôn là phần trước @ của email do hệ thống điền sẵn.
 */
function displayableName(raw: string | null): string | null {
  const name = raw?.trim();
  if (!name || name.includes('@')) return null;
  if (/^[a-z0-9._-]+$/.test(name)) return null;
  return name.slice(0, 28);
}

export async function GET(): Promise<Response> {
  try {
    const admin = getSupabaseAdmin();

    const { data, error } = await admin
      .from('user_state')
      .select('user_id, daily:payload->daily')
      .eq('store_key', 'study');

    if (error) return Response.json({ error: error.message }, { status: 500 });

    const rows = (data ?? []) as unknown as StudyRow[];
    const ids = rows.map((r) => r.user_id);

    const names = new Map<string, string>();
    if (ids.length > 0) {
      const { data: profiles } = await admin.from('profiles').select('id, display_name').in('id', ids);
      for (const p of (profiles ?? []) as { id: string; display_name: string | null }[]) {
        const chosen = displayableName(p.display_name);
        if (chosen) names.set(p.id, chosen);
      }
    }

    const now = new Date();
    const board = rows
      .map((row) => {
        const daily = row.daily ?? {};
        return {
          id: row.user_id.slice(0, 8),
          name: names.get(row.user_id) ?? `Học viên ${row.user_id.slice(0, 4).toUpperCase()}`,
          points: monthPoints(daily, now),
          streak: currentStreak(daily, now),
        };
      })
      .filter((entry) => entry.points > 0)
      .sort((a, b) => b.points - a.points)
      .slice(0, 20);

    return Response.json({ month: `${now.getFullYear()}-${now.getMonth() + 1}`, board });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Không đọc được bảng xếp hạng.' },
      { status: 500 },
    );
  }
}
