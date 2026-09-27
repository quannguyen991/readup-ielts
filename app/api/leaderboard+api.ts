import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { currentStreak, monthPoints, type DayLog } from '@/services/gamification/points';
import { anonymousName, displayableName } from '@/services/gamification/display-name';
import { goldenBoard, type DayStatsLite } from '@/services/gamification/golden';
import { endOfPreviousMonth, monthKey } from '@/services/gamification/monthly';
import { findItem, type ShopItemKind } from '@/services/gamification/shop';

/**
 * GET /api/leaderboard — bảng xếp hạng điểm THÁNG NÀY, kèm top 10 tháng trước
 * (để người trong top nhận thưởng sao, `services/gamification/monthly.ts`) và
 * BẢNG VÀNG HÔM NAY: sao, câu đúng, lượt ôn từ vựng của từng người trong ngày
 * (`services/gamification/golden.ts`, chốt ngày theo giờ Việt Nam).
 *
 * CHỈ LẤY ĐÚNG THỨ CẦN. Câu truy vấn chọn `payload->daily`, không kéo cả cục
 * payload: nhật ký học của một người nặng hơn 150 KB, mà bảng này chỉ cần số
 * phút mỗi ngày. Kéo cả cục là vài chục megabyte cho một bảng hai mươi dòng.
 * Phần đồ đang đeo cũng chỉ lấy ba mã avatar/bìa/skin và danh sách ngày giữ chuỗi.
 *
 * KHÔNG LỘ DANH TÍNH. Chỉ hiện tên khi người dùng ĐÃ TỰ ĐẶT một cái tên trông
 * như tên người; còn lại là "Học viên ####" lấy từ id. Khi đăng ký bằng email,
 * `display_name` thường được điền sẵn bằng phần trước dấu @ — đem lên bảng là
 * phát tán email của người khác cho người lạ, mà họ chưa hề đồng ý. Email và
 * id đầy đủ thì không bao giờ rời khỏi máy chủ. Tên chỉ tra cho những người
 * thật sự có mặt trên bảng.
 *
 * XẾP THEO ĐIỂM THÁNG, tính lại bằng chính bộ luật mà máy người dùng dùng
 * (`services/gamification/points.ts`), KỂ CẢ ngày giữ chuỗi — nên số trên bảng
 * khớp số trong thẻ của họ. Một bộ luật, hai nơi chạy.
 */
type StudyRow = { user_id: string; daily: Record<string, DayLog> | null };
type LookRow = { user_id: string; avatar: string | null; cover: string | null; effect: string | null; skin: string | null; frozen: unknown };
type GameRow = { user_id: string; day: string | null; today: DayStatsLite | null };

/** Chỉ trả mã món có thật trong danh mục, đúng loại — không chuyển chuỗi lạ từ máy người khác sang. */
function known(id: string | null | undefined, kinds: ShopItemKind[]): string | null {
  const item = findItem(id);
  return item && kinds.includes(item.kind) ? item.id : null;
}

export async function GET(): Promise<Response> {
  try {
    const admin = getSupabaseAdmin();

    const [study, looks, games] = await Promise.all([
      admin.from('user_state').select('user_id, daily:payload->daily').eq('store_key', 'study'),
      admin
        .from('user_state')
        .select('user_id, avatar:payload->>avatar, cover:payload->>cover, effect:payload->>effect, skin:payload->>skin, frozen:payload->frozenDays')
        .eq('store_key', 'reward'),
      // Chỉ hai trường của game: ngày của số liệu và số liệu hôm đó — không kéo cả túi đồ, huy hiệu.
      admin.from('user_state').select('user_id, day:payload->>day, today:payload->today').eq('store_key', 'game'),
    ]);

    if (study.error) return Response.json({ error: study.error.message }, { status: 500 });

    const lookBy = new Map<string, LookRow>();
    for (const row of (looks.data ?? []) as unknown as LookRow[]) lookBy.set(row.user_id, row);

    const now = new Date();
    const lastMonth = endOfPreviousMonth(now);
    const scored = ((study.data ?? []) as unknown as StudyRow[]).map((row) => {
      const daily = row.daily ?? {};
      const look = lookBy.get(row.user_id);
      const frozen = Array.isArray(look?.frozen) ? (look.frozen as unknown[]).filter((d): d is string => typeof d === 'string') : [];
      return {
        userId: row.user_id,
        look,
        points: monthPoints(daily, now, frozen),
        previous: monthPoints(daily, lastMonth, frozen),
        streak: currentStreak(daily, now, frozen),
      };
    });

    const top = scored.filter((s) => s.points > 0).sort((a, b) => b.points - a.points).slice(0, 20);
    const prevTop = scored.filter((s) => s.previous > 0).sort((a, b) => b.previous - a.previous).slice(0, 10);

    // Bảng vàng hôm nay: mọi người có nhật ký học hoặc số liệu game.
    const dailyBy = new Map(((study.data ?? []) as unknown as StudyRow[]).map((r) => [r.user_id, r.daily ?? {}]));
    const gameBy = new Map(((games.data ?? []) as unknown as GameRow[]).map((r) => [r.user_id, r]));
    const everyone = [...new Set([...dailyBy.keys(), ...gameBy.keys()])];
    const golden = goldenBoard(
      everyone.map((userId) => {
        const look = lookBy.get(userId);
        return {
          userId,
          daily: dailyBy.get(userId) ?? null,
          frozen: Array.isArray(look?.frozen) ? (look.frozen as unknown[]).filter((d): d is string => typeof d === 'string') : [],
          game: gameBy.get(userId) ?? null,
        };
      }),
      now,
    );

    const names = new Map<string, string>();
    const ids = [...new Set([...top.map((s) => s.userId), ...prevTop.map((s) => s.userId), ...golden.rows.map((r) => r.userId)])];
    if (ids.length > 0) {
      const { data: profiles } = await admin.from('profiles').select('id, display_name').in('id', ids);
      for (const p of (profiles ?? []) as { id: string; display_name: string | null }[]) {
        const chosen = displayableName(p.display_name);
        if (chosen) names.set(p.id, chosen);
      }
    }
    const nameOf = (userId: string) => names.get(userId) ?? anonymousName(userId);

    const board = top.map((s) => ({
      id: s.userId.slice(0, 8),
      name: nameOf(s.userId),
      points: s.points,
      streak: s.streak,
      avatar: known(s.look?.avatar, ['avatar', 'avatarAnim']),
      cover: known(s.look?.cover, ['cover']),
      effect: known(s.look?.effect, ['effect']),
      skin: known(s.look?.skin, ['skin']),
    }));
    const previous = prevTop.map((s) => ({ id: s.userId.slice(0, 8), name: nameOf(s.userId), points: s.previous }));
    const goldenRows = golden.rows.map((r) => ({
      id: r.userId.slice(0, 8),
      name: nameOf(r.userId),
      stars: r.stars,
      correct: r.correct,
      vocab: r.vocab,
      avatar: known(lookBy.get(r.userId)?.avatar, ['avatar', 'avatarAnim']),
      skin: known(lookBy.get(r.userId)?.skin, ['skin']),
    }));

    return Response.json({
      month: monthKey(now),
      board,
      previous: { month: monthKey(lastMonth), board: previous },
      golden: { day: golden.day, board: goldenRows },
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Không đọc được bảng xếp hạng.' },
      { status: 500 },
    );
  }
}
