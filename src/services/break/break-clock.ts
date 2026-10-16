/**
 * ĐỒNG HỒ GIỜ HỌC — luật thuần, không chạm React hay store.
 *
 * Chỉ đếm khi: tab đang hiện, đang ở màn học, không ở màn thi có đồng hồ, và có
 * thao tác trong IDLE_MS gần nhất. Đọc một bài dài mà không di chuột vẫn là học,
 * nên ngưỡng không thao tác đặt thoáng (10 phút), không phải 1–2 phút.
 *
 * Đủ `studyMs` thì vào GIỜ NGHỈ (`breakMs`). Giờ nghỉ tính theo mốc epoch
 * (`breakEndsAt`), không theo số lần tick, nên tải lại trang không làm nó dài ra
 * hay ngắn đi. Hết giờ nghỉ thì tự về trạng thái học, không cần bấm gì.
 *
 * Khoảng trống giữa hai lần tick lớn hơn MAX_GAP_MS (máy ngủ, tab bị trình duyệt
 * ép chạy chậm) thì bỏ qua, không tính vào giờ học.
 */

export const IDLE_MS = 10 * 60_000;
export const MAX_GAP_MS = 5_000;

export type BreakPhase = 'study' | 'break';

export type BreakClock = {
  /** Ngày theo giờ máy (YYYY-MM-DD). Sang ngày mới thì đếm lại từ 0. */
  day: string;
  phase: BreakPhase;
  studiedMs: number;
  /** Mốc epoch (ms) kết thúc giờ nghỉ; chỉ có khi đang nghỉ. */
  breakEndsAt: number | null;
};

export type TickInput = {
  now: number;
  /** Ngày hôm nay theo giờ máy, YYYY-MM-DD. */
  today: string;
  /** Khoảng thời gian từ lần tick trước, ms. */
  gapMs: number;
  visible: boolean;
  studyRoute: boolean;
  /** Đang ở màn thi có đồng hồ: không đếm, và không bắt đầu giờ nghỉ. */
  exempt: boolean;
  /** Lần thao tác gần nhất (chuột, phím, cuộn), mốc epoch ms. */
  lastActivityAt: number;
  studyMs: number;
  breakMs: number;
};

export function startClock(today: string): BreakClock {
  return { day: today, phase: 'study', studiedMs: 0, breakEndsAt: null };
}

export function advance(clock: BreakClock, input: TickInput): BreakClock {
  const c = clock.day === input.today ? clock : startClock(input.today);

  if (c.phase === 'break') {
    if (c.breakEndsAt !== null && input.now < c.breakEndsAt) return c;
    return startClock(input.today);
  }

  const counting =
    input.visible &&
    input.studyRoute &&
    !input.exempt &&
    input.now - input.lastActivityAt < IDLE_MS &&
    input.gapMs > 0 &&
    input.gapMs <= MAX_GAP_MS;
  const studiedMs = counting ? c.studiedMs + input.gapMs : c.studiedMs;

  // Ngưỡng kiểm cả khi không đếm: thi xong mà đã đủ giờ thì nghỉ ngay, không mất lượt.
  if (!input.exempt && studiedMs >= input.studyMs) {
    return { ...c, studiedMs, phase: 'break', breakEndsAt: input.now + input.breakMs };
  }
  if (c === clock && studiedMs === c.studiedMs) return clock;
  return { ...c, studiedMs };
}

/** mm:ss cho đồng hồ hiển thị; không bao giờ âm. */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
