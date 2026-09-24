import { currentStreak, dailyPoints, type DayLog } from './points';

/**
 * BẢNG VÀNG HÔM NAY — mỗi người hôm nay được bao nhiêu sao, đúng bao nhiêu câu,
 * ôn bao nhiêu lượt từ vựng. Hàm thuần: máy chủ (xếp cả nước) và máy người dùng
 * (thẻ "Hôm nay của bạn") dùng chung một luật, nên số trên bảng khớp số trong thẻ.
 *
 * - Sao hôm nay = sao từ việc học hôm nay (điểm ngày: phút học + số câu, nhân theo
 *   chuỗi, trần 60) + sao thưởng trận đấu hôm nay (hạ quái, lên cấp, nhiệm vụ…).
 * - Câu đúng và lượt ôn từ đọc từ số liệu ngày của game khi học.
 * - Ngày chốt theo GIỜ VIỆT NAM (UTC+7), không theo giờ máy chủ (UTC): nếu không,
 *   7 giờ sáng ở Việt Nam bảng mới sang ngày, người học buổi tối bị tính sang hôm sau.
 */

export type DayStatsLite = { correct?: number; answers?: number; vocab?: number; stars?: number };
export type GoldenInput = {
  userId: string;
  daily: Record<string, DayLog> | null;
  frozen: readonly string[];
  game: { day?: string | null; today?: DayStatsLite | null } | null;
};
export type GoldenRow = { userId: string; stars: number; correct: number; vocab: number; answers: number };

/** Ngày hôm nay theo giờ Việt Nam: mã YYYY-MM-DD, và một mốc giờ trưa của ngày đó theo giờ máy. */
export function vnToday(now: Date): { key: string; date: Date } {
  const key = new Date(now.getTime() + 7 * 3_600_000).toISOString().slice(0, 10);
  const [y, m, d] = key.split('-').map(Number);
  return { key, date: new Date(y!, m! - 1, d!, 12) };
}

/** Một người hôm nay (`key` là ngày, `date` là mốc trong ngày đó). */
export function goldenOf(u: GoldenInput, key: string, date: Date): GoldenRow {
  const log = u.daily?.[key];
  const study = log && u.daily ? dailyPoints(log, Math.max(0, currentStreak(u.daily, date, u.frozen) - 1)) : 0;
  const today = u.game?.day === key ? (u.game.today ?? {}) : {};
  return {
    userId: u.userId,
    stars: study + Math.max(0, Math.round(today.stars ?? 0)),
    correct: Math.max(0, today.correct ?? 0),
    vocab: Math.max(0, today.vocab ?? 0),
    answers: Math.max(0, today.answers ?? 0),
  };
}

/** Bảng vàng: ai hôm nay có sao hoặc có câu đúng, xếp theo sao → câu đúng → lượt ôn từ. */
export function goldenBoard(users: readonly GoldenInput[], now: Date, limit = 20): { day: string; rows: GoldenRow[] } {
  const { key, date } = vnToday(now);
  const rows = users
    .map((u) => goldenOf(u, key, date))
    .filter((r) => r.stars > 0 || r.correct > 0 || r.vocab > 0)
    .sort((a, b) => b.stars - a.stars || b.correct - a.correct || b.vocab - a.vocab)
    .slice(0, limit);
  return { day: key, rows };
}
