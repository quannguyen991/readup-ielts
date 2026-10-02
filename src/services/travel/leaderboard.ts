/**
 * "AI ĐI NHIỀU NHẤT" — bảng xếp hạng THÁNG theo điểm hộ chiếu. Hàm thuần.
 *
 * Không có bảng riêng: điểm hộ chiếu nằm trong sổ cái của kho `travel` mà máy
 * người dùng đã đồng bộ lên `user_state` (khoá `travel`). Máy chủ chỉ đọc lại
 * sổ cái đó (`app/api/travel-leaderboard+api.ts`) và cộng các khoản `pp:<tháng>-…`.
 * Như mọi bảng xếp hạng khác của app, số liệu do máy người dùng ghi nên chỉ là
 * thi đua vui; vì thế mỗi khoản bị chặn trần và phát giải do quản trị làm tay.
 */
import { PASSPORT_POINTS } from './passport-rewards';
import { monthPointsOf } from './passport';

export const BOARD_LIMIT = 50;
export const TOP_SHOWN = 10;

export type BoardRow = { id: string; name: string; points: number };
export type BoardData = { month: string; board: BoardRow[] };

/** Khoản điểm hợp lệ lớn nhất một dòng (con dấu). Dòng lớn hơn là dữ liệu bịa → bỏ. */
const MAX_ENTRY = PASSPORT_POINTS.stamp;

/** Chỉ giữ khoản `pp:` có số hợp lệ, rồi cộng điểm tháng. */
export function monthScore(ledger: unknown, month: string): number {
  if (typeof ledger !== 'object' || ledger === null || Array.isArray(ledger)) return 0;
  const clean: Record<string, number> = {};
  for (const [id, v] of Object.entries(ledger as Record<string, unknown>)) {
    if (typeof v === 'number' && Number.isFinite(v) && v > 0 && v <= MAX_ENTRY) clean[id] = v;
  }
  return monthPointsOf(clean, month);
}

/** Từ các dòng `user_state` ra bảng xếp hạng: điểm > 0, cao trước, hòa thì theo mã cho ổn định. */
export function rankMonth(rows: { userId: string; ledger: unknown }[], month: string, limit = BOARD_LIMIT): { userId: string; points: number }[] {
  return rows
    .map((r) => ({ userId: r.userId, points: monthScore(r.ledger, month) }))
    .filter((r) => r.points > 0)
    .sort((a, b) => b.points - a.points || (a.userId < b.userId ? -1 : 1))
    .slice(0, limit);
}

/** Đọc phản hồi máy chủ; sai dạng / thiếu → null (giao diện hiện trạng thái trống). */
export function parseBoard(raw: unknown): BoardData | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as { month?: unknown; board?: unknown };
  if (typeof r.month !== 'string' || !Array.isArray(r.board)) return null;
  const board: BoardRow[] = [];
  for (const x of r.board) {
    if (typeof x !== 'object' || x === null) continue;
    const { id, name, points } = x as Record<string, unknown>;
    if (typeof id === 'string' && typeof name === 'string' && typeof points === 'number' && Number.isFinite(points)) board.push({ id, name: name.slice(0, 28), points });
  }
  return { month: r.month, board };
}

export type MyStanding = { rank: number | null; points: number; inTop: boolean };

/** Vị trí của mình: có trong bảng thì lấy hạng; ngoài bảng thì chỉ có điểm (rank null). */
export function myStanding(board: readonly BoardRow[], myId: string | null, myPoints: number): MyStanding {
  const i = myId ? board.findIndex((b) => b.id === myId) : -1;
  if (i < 0) return { rank: null, points: myPoints, inTop: false };
  return { rank: i + 1, points: board[i]!.points, inTop: i < TOP_SHOWN };
}
