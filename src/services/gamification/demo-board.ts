import { seededRng } from '@/services/vocab/topic-study';

/**
 * DỮ LIỆU MINH HOẠ cho trang Xếp hạng — chỉ dùng khi mở `/leaderboard?demo=1`.
 *
 * Người dùng cần bảng có người để chụp màn hình / trình bày (26/09/2026) trong
 * lúc app chưa có học viên thật. Ba luật để dữ liệu mẫu không thành dữ liệu giả:
 *
 * - KHÔNG BAO GIỜ tự bật: chỉ hiện khi đường dẫn có `?demo=1`. Người học mở
 *   trang Xếp hạng bình thường vẫn thấy bảng thật từ máy chủ.
 * - LUÔN CÓ NHÃN: trang hiện dải "Dữ liệu minh hoạ — không phải học viên thật".
 * - KHÔNG GHI ĐI ĐÂU: sinh tại chỗ trên máy, không đụng Supabase, không vào
 *   `/api/leaderboard`, không cộng sao hay thưởng cho ai.
 *
 * Tên là tên Việt tự đặt (họ + tên đệm + tên), không lấy tên người thật nào.
 * Số liệu gieo hạt theo ngày nên mở lại trong ngày vẫn ra cùng một bảng, và
 * nằm trong khoảng một học sinh chăm có thể đạt (điểm tháng tính theo luật
 * `points.ts`: vài chục điểm mỗi ngày học đều).
 */

export type DemoBoardRow = { id: string; name: string; points: number; streak: number; avatar: string | null; cover: string | null; effect: string | null; skin: string | null };
export type DemoPastRow = { id: string; name: string; points: number };
export type DemoGoldenRow = { id: string; name: string; stars: number; correct: number; vocab: number; avatar: string | null; skin: string | null };

const HO = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Ngô', 'Dương', 'Lý'];
const DEM = ['Minh', 'Thu', 'Gia', 'Bảo', 'Khánh', 'Ngọc', 'Hải', 'Phương', 'Đức', 'Thanh', 'Hoài', 'Quỳnh'];
const TEN = ['Anh', 'Châu', 'Linh', 'Khoa', 'Nhi', 'Huy', 'Trang', 'Long', 'My', 'Phúc', 'Vy', 'Nam', 'Hân', 'Quân', 'Tú', 'Hà', 'Sơn', 'Uyên', 'Tâm', 'Đạt'];
const AVATARS = ['avatar-owl', 'avatar-cat', 'avatar-fox', 'avatar-whale', 'avatar-dragon', 'avatar-rocket'];
const SKINS = ['skin-ninja', 'skin-mage', 'skin-samurai', 'skin-astronaut', 'skin-gold'];

function dayNumber(key: string): number {
  return Number(key.replace(/-/g, '')) || 1;
}

function names(rng: () => number, n: number): string[] {
  const out = new Set<string>();
  while (out.size < n) {
    const pick = <T,>(list: T[]) => list[Math.floor(rng() * list.length)]!;
    out.add(`${pick(HO)} ${pick(DEM)} ${pick(TEN)}`);
  }
  return [...out];
}

/** Đồ đeo: chừng một nửa có avatar động, một phần ba có skin — như một cộng đồng thật hay có. */
function gear(rng: () => number): { avatar: string | null; skin: string | null } {
  return {
    avatar: rng() < 0.5 ? AVATARS[Math.floor(rng() * AVATARS.length)]! : null,
    skin: rng() < 0.35 ? SKINS[Math.floor(rng() * SKINS.length)]! : null,
  };
}

export function demoLeaderboard(todayKey: string, prevMonthKey: string) {
  const rng = seededRng(dayNumber(todayKey));
  const people = names(rng, 24).map((name, i) => ({ id: `demo-${i + 1}`, name, ...gear(rng) }));

  // Bảng tháng: 20 người, điểm giảm dần có nhiễu; chuỗi ngày dài đi kèm điểm cao.
  const dayOfMonth = Number(todayKey.slice(8, 10)) || 15;
  const board: DemoBoardRow[] = people.slice(0, 20).map((p, i) => {
    const pace = 58 - i * 2.4 + rng() * 6;
    return {
      ...p,
      cover: null,
      // Top 3 bảng mẫu đeo hiệu ứng hồ sơ để xem được món đổi quà trông ra sao.
      effect: i < 3 ? (['fx-flame', 'fx-sakura', 'fx-meteor'] as const)[i]! : null,
      points: Math.max(12, Math.round(pace * dayOfMonth * (0.75 + rng() * 0.25))),
      streak: Math.max(1, Math.round(dayOfMonth * (1 - i / 24) * (0.6 + rng() * 0.4))),
    };
  });
  board.sort((a, b) => b.points - a.points);

  // Tháng trước: xáo lại thứ hạng một chút — người đứng đầu tháng này chưa chắc đứng đầu tháng trước.
  const previous: DemoPastRow[] = [...people.slice(2, 14)]
    .map((p, i) => ({ id: p.id, name: p.name, points: Math.round((1700 - i * 70) * (0.85 + rng() * 0.3)) }))
    .sort((a, b) => b.points - a.points)
    .slice(0, 10);

  // Bảng vàng hôm nay: sao, câu đúng, lượt ôn từ (trần câu tính điểm là 60/ngày ở luật thật).
  const golden: DemoGoldenRow[] = people.slice(0, 12)
    .map((p) => {
      const correct = Math.round(15 + rng() * 45);
      return { id: p.id, name: p.name, avatar: p.avatar, skin: p.skin, correct, vocab: Math.round(10 + rng() * 70), stars: Math.round(correct * (0.8 + rng() * 0.6)) };
    })
    .sort((a, b) => b.stars - a.stars || b.correct - a.correct);

  return { board, previous: { month: prevMonthKey, board: previous }, golden: { day: todayKey, board: golden } };
}
