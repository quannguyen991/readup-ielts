import { dayKeyOf } from './daily';

/**
 * Điểm tuần của khu luyện nói, để xếp bảng: mỗi nhiệm vụ làm trong 7 ngày gần nhất
 * được 10 điểm, mỗi âm đã thuộc (điểm tốt nhất từ 80) được 5 điểm.
 *
 * Chỉ dùng số đã có trong tiến độ, không có điểm cộng thêm nào do giao diện.
 */
export function weeklyHubPoints(doneByDay: Record<string, string[]>, phonemeBest: Record<string, number>, today: string): number {
  const days = new Set<string>();
  const [y, m, d] = today.split('-').map(Number) as [number, number, number];
  for (let i = 0; i < 7; i += 1) days.add(dayKeyOf(new Date(y, m - 1, d - i)));
  let tasks = 0;
  for (const day of Object.keys(doneByDay)) {
    if (days.has(day)) tasks += doneByDay[day]?.length ?? 0;
  }
  const mastered = Object.values(phonemeBest).filter((s) => s >= 80).length;
  return tasks * 10 + mastered * 5;
}

export function rankRows(rows: { userId: string; points: number }[], limit = 10): { userId: string; points: number; rank: number }[] {
  return [...rows]
    .filter((r) => r.points > 0)
    .sort((a, b) => b.points - a.points || a.userId.localeCompare(b.userId))
    .slice(0, limit)
    .map((r, k) => ({ ...r, rank: k + 1 }));
}
