/**
 * GIỜ ĐỊA PHƯƠNG, ngày/đêm và thời tiết của từng thành phố. Hàm thuần.
 *
 * Giờ tính bằng ĐỘ LỆCH UTC cố định cộng thêm giờ mùa hè châu Âu theo luật EU
 * (Chủ nhật cuối tháng 3 → Chủ nhật cuối tháng 10, lúc 01:00 UTC). TUYỆT ĐỐI
 * không dùng biến môi trường TZ: trên Windows `TZ=Asia/Ho_Chi_Minh` làm lệch 7 giờ.
 */
import { CITIES } from './world';
import type { CityId, WeatherPlan } from './types';

const HOUR = 3600 * 1000;

/** Chủ nhật cuối của tháng `month` (0 = tháng 1) năm `year`, lúc 01:00 UTC, theo ms. */
function lastSundayUtc(year: number, month: number): number {
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDay(); // 0 = Chủ nhật
  const day = new Date(Date.UTC(year, month + 1, 0)).getUTCDate() - lastDay;
  return Date.UTC(year, month, day, 1);
}

/** Đang trong giờ mùa hè châu Âu không (theo ms UTC). */
export function isEuSummerTime(utcMs: number): boolean {
  const year = new Date(utcMs).getUTCFullYear();
  return utcMs >= lastSundayUtc(year, 2) && utcMs < lastSundayUtc(year, 9);
}

/** Độ lệch UTC (giờ) của thành phố tại thời điểm `utcMs`. */
export function cityOffsetHours(city: CityId, utcMs: number): number {
  const meta = CITIES[city];
  return meta.utcOffsetHours + (meta.eurDst && isEuSummerTime(utcMs) ? 1 : 0);
}

export type LocalTime = {
  /** 0..23 */
  hour: number;
  minute: number;
  /** Giờ dạng số thực, ví dụ 13.5 = 13:30. */
  hourFloat: number;
  /** YYYY-MM-DD theo giờ địa phương. */
  dayKey: string;
  /** 0 = Chủ nhật. */
  weekday: number;
};

export function localTime(city: CityId, utcMs: number): LocalTime {
  const shifted = new Date(utcMs + cityOffsetHours(city, utcMs) * HOUR);
  const hour = shifted.getUTCHours();
  const minute = shifted.getUTCMinutes();
  const mm = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(shifted.getUTCDate()).padStart(2, '0');
  return {
    hour,
    minute,
    hourFloat: hour + minute / 60,
    dayKey: `${shifted.getUTCFullYear()}-${mm}-${dd}`,
    weekday: shifted.getUTCDay(),
  };
}

export type DayPhase = 'night' | 'dawn' | 'day' | 'dusk';

/** Pha trong ngày theo giờ địa phương: 5:30–7:00 bình minh, 17:30–19:30 hoàng hôn, 19:30–5:30 đêm. */
export function dayPhase(hourFloat: number): DayPhase {
  if (hourFloat >= 5.5 && hourFloat < 7) return 'dawn';
  if (hourFloat >= 7 && hourFloat < 17.5) return 'day';
  if (hourFloat >= 17.5 && hourFloat < 19.5) return 'dusk';
  return 'night';
}

/** Độ sáng 0 (tối hẳn) .. 1 (sáng hẳn), trơn theo giờ — để nhân màu bầu trời. */
export function daylight(hourFloat: number): number {
  const ramp = (x: number, a: number, b: number) => Math.min(1, Math.max(0, (x - a) / (b - a)));
  if (hourFloat < 12) return ramp(hourFloat, 5, 7.5);
  return 1 - ramp(hourFloat, 17.5, 19.75);
}

/** Bật đèn đường / cửa sổ sáng. */
export function lampsOn(hourFloat: number): boolean {
  return daylight(hourFloat) < 0.55;
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Kế hoạch thời tiết theo thành phố, giờ địa phương và ngày (cùng ngày cùng kết
 * quả — không ngẫu nhiên theo lần mở).
 *  - London: hay mưa nhẹ, có ngày sương;
 *  - Singapore: nắng, mưa rào bất chợt buổi chiều (14–18 giờ);
 *  - Amsterdam: gió;
 *  - Paris, Rome, Hà Nội: nắng, thi thoảng mưa phùn.
 */
export function weatherPlan(city: CityId, hourFloat: number, dayKey: string): WeatherPlan {
  const roll = (hash(`${city}:${dayKey}`) % 1000) / 1000;
  switch (city) {
    case 'london':
      if (roll < 0.45) return { kind: 'rain', intensity: 0.4 + roll };
      if (roll < 0.65) return { kind: 'fog', intensity: 0.5 };
      if (roll < 0.8) return { kind: 'drizzle', intensity: 0.35 };
      return { kind: 'clear', intensity: 0 };
    case 'singapore':
      if (hourFloat >= 14 && hourFloat < 18 && roll < 0.6) return { kind: 'shower-evening', intensity: 0.8 };
      return { kind: 'clear', intensity: 0 };
    case 'amsterdam':
      return { kind: 'wind', intensity: 0.4 + roll * 0.4 };
    case 'hochiminh':
      if (hourFloat >= 14 && hourFloat < 18 && roll < 0.5) return { kind: 'shower-evening', intensity: 0.7 };
      return { kind: 'clear', intensity: 0 };
    case 'danang':
    case 'hanoi':
      return roll < 0.2 ? { kind: 'drizzle', intensity: 0.3 } : { kind: 'clear', intensity: 0 };
    case 'paris':
      return roll < 0.15 ? { kind: 'drizzle', intensity: 0.3 } : { kind: 'clear', intensity: 0 };
    case 'rome':
    default:
      return { kind: 'clear', intensity: 0 };
  }
}

/** Gói tiện: mọi thứ B cần để dựng bầu trời của một thành phố tại thời điểm `utcMs`. */
export function skyAt(city: CityId, utcMs: number): { time: LocalTime; phase: DayPhase; light: number; lamps: boolean; weather: WeatherPlan } {
  const time = localTime(city, utcMs);
  return {
    time,
    phase: dayPhase(time.hourFloat),
    light: daylight(time.hourFloat),
    lamps: lampsOn(time.hourFloat),
    weather: weatherPlan(city, time.hourFloat, time.dayKey),
  };
}

/** "13:05" */
export function formatClock(t: Pick<LocalTime, 'hour' | 'minute'>): string {
  return `${String(t.hour).padStart(2, '0')}:${String(t.minute).padStart(2, '0')}`;
}
