/**
 * Album sưu tầm theo tuần — LUẬT THUẦN, không chạm React hay store.
 *
 * KHÔNG QUAY NGẪU NHIÊN. Mỗi tuần (thứ Hai 00:00 → Chủ nhật 23:59, giờ Việt Nam)
 * có một album 8 ô. Ô thứ i mở khi số câu đúng TRONG TUẦN ĐÓ đạt
 * `ALBUM_THRESHOLDS[i]`. Cùng số câu đúng thì luôn ra cùng trạng thái.
 *
 * - Album của tuần xoay vòng theo số tuần kể từ `EPOCH_MONDAY` (không rút thăm).
 * - Tuần mới là khoá mới trong `correctByWeek`: đếm lại từ 0. Tuần cũ vẫn đọc được
 *   để xem lịch sử, nhưng `recordCorrect` chỉ ghi vào tuần của "bây giờ", nên không
 *   bao giờ cộng thêm vào tuần cũ.
 * - Ngày tính theo giờ Việt Nam bằng `vnToday` của bảng vàng, không theo múi giờ máy.
 */

import { vnToday } from '../gamification/golden';
import { ALBUMS, type AlbumDef } from '../../data/album';

export const ALBUM_SLOTS = 8;
/** Số câu đúng trong tuần để mở từng ô, theo thứ tự ô 1 → 8 (tăng dần). */
export const ALBUM_THRESHOLDS: readonly number[] = [5, 10, 15, 20, 25, 30, 40, 50];

const DAY_MS = 86_400_000;
const VN_OFFSET_MS = 7 * 3_600_000;
/** Thứ Hai mốc: mọi chỉ số tuần đếm từ đây. Đổi mốc là đổi thứ tự album của mọi tuần. */
const EPOCH_MONDAY = '2026-01-05';

export type AlbumWeek = {
  /** Mã tuần: ngày thứ Hai đầu tuần theo giờ VN, dạng YYYY-MM-DD. */
  id: string;
  /** Số tuần kể từ mốc đầu; album của tuần là `ALBUMS[index mod số album]`. */
  index: number;
  /** Mốc hết tuần (ms epoch): Chủ nhật 23:59:59 giờ VN. */
  closesAt: number;
};

/** Mốc nửa đêm UTC của một ngày lịch dạng YYYY-MM-DD (dùng để so ngày, không phải giờ thật). */
function utcOfKey(key: string): number {
  const [y, m, d] = key.split('-').map(Number);
  return Date.UTC(y!, m! - 1, d!);
}

function keyOfUtc(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function weekStartingAt(monday: number): AlbumWeek {
  return {
    id: keyOfUtc(monday),
    index: Math.round((monday - utcOfKey(EPOCH_MONDAY)) / (7 * DAY_MS)),
    // Nửa đêm VN của thứ Hai kế tiếp = (ngày đó 00:00 UTC) − 7 giờ; lùi thêm 1 giây thì là 23:59:59 Chủ nhật.
    closesAt: monday + 7 * DAY_MS - VN_OFFSET_MS - 1000,
  };
}

/** Tuần chứa thời điểm `now`, theo giờ Việt Nam. */
export function weekOf(now: Date): AlbumWeek {
  const day = utcOfKey(vnToday(now).key);
  const sinceMonday = (new Date(day).getUTCDay() + 6) % 7;
  return weekStartingAt(day - sinceMonday * DAY_MS);
}

/** Tuần theo mã (YYYY-MM-DD của thứ Hai), dùng cho danh sách lịch sử. */
export function weekById(id: string): AlbumWeek {
  return weekStartingAt(utcOfKey(id));
}

/** Ngày đầu và ngày cuối tuần (YYYY-MM-DD, giờ VN). */
export function weekDays(week: AlbumWeek): { first: string; last: string } {
  return { first: week.id, last: keyOfUtc(utcOfKey(week.id) + 6 * DAY_MS) };
}

/** Album của tuần: xoay vòng đều theo số tuần, luôn cùng một kết quả với cùng tuần. */
export function albumForWeek(week: Pick<AlbumWeek, 'index'>, albums: readonly AlbumDef[] = ALBUMS): AlbumDef {
  const n = albums.length;
  return albums[((week.index % n) + n) % n]!;
}

/** Mili-giây còn lại tới khi tuần đóng; không âm. */
export function remainingMs(week: AlbumWeek, nowMs: number): number {
  return Math.max(0, week.closesAt - nowMs);
}

/** Tách khoảng thời gian thành ngày, giờ, phút, giây để hiện đồng hồ đếm ngược. */
export function splitDuration(ms: number): { days: number; hours: number; minutes: number; seconds: number } {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86_400),
    hours: Math.floor((total % 86_400) / 3_600),
    minutes: Math.floor((total % 3_600) / 60),
    seconds: total % 60,
  };
}

function cleanCount(correct: number): number {
  return Number.isFinite(correct) ? Math.max(0, Math.floor(correct)) : 0;
}

export type SlotState = { index: number; threshold: number; unlocked: boolean; missing: number };

/** Trạng thái cả 8 ô theo số câu đúng trong tuần. Chỉ phụ thuộc vào số câu đúng. */
export function slotStates(correct: number): SlotState[] {
  const n = cleanCount(correct);
  return ALBUM_THRESHOLDS.map((threshold, index) => ({
    index,
    threshold,
    unlocked: n >= threshold,
    missing: Math.max(0, threshold - n),
  }));
}

export type AlbumProgress = {
  correct: number;
  /** Số ô đã mở. */
  unlocked: number;
  /** Ô khoá đầu tiên (ô sẽ mở tiếp); null khi đã mở đủ 8 ô. */
  next: SlotState | null;
  /** Tiến độ tới ô kế tiếp trong khoảng [mốc ô trước, mốc ô kế], 0..1. */
  fraction: number;
};

export function albumProgress(correct: number): AlbumProgress {
  const n = cleanCount(correct);
  const slots = slotStates(n);
  const next = slots.find((s) => !s.unlocked) ?? null;
  let fraction = 1;
  if (next) {
    const from = next.index === 0 ? 0 : ALBUM_THRESHOLDS[next.index - 1]!;
    fraction = (n - from) / (next.threshold - from);
  }
  return {
    correct: n,
    unlocked: slots.filter((s) => s.unlocked).length,
    next,
    fraction: Math.min(1, Math.max(0, fraction)),
  };
}

/** Số câu đúng theo từng tuần, khoá là mã tuần. */
export type CorrectByWeek = Record<string, number>;

/**
 * Ghi thêm một câu đúng vào tuần của `now`. Trả về bản mới, không sửa bản cũ.
 * Hàm này chỉ đụng tới một khoá (tuần hiện tại), nên tuần cũ không bao giờ tăng.
 */
export function recordCorrect(counts: CorrectByWeek, now: Date): CorrectByWeek {
  const id = weekOf(now).id;
  return { ...counts, [id]: cleanCount(counts[id] ?? 0) + 1 };
}

export type AlbumHistoryRow = {
  week: AlbumWeek;
  album: AlbumDef;
  correct: number;
  unlocked: number;
  current: boolean;
};

/** Mọi tuần đã có câu đúng, tuần mới nhất đứng đầu. */
export function albumHistory(counts: CorrectByWeek, now: Date): AlbumHistoryRow[] {
  const current = weekOf(now).id;
  return Object.keys(counts)
    .sort((a, b) => (a < b ? 1 : a > b ? -1 : 0))
    .map((id) => {
      const week = weekById(id);
      const correct = cleanCount(counts[id] ?? 0);
      return { week, album: albumForWeek(week), correct, unlocked: albumProgress(correct).unlocked, current: id === current };
    });
}
