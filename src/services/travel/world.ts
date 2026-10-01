/**
 * ĐỒ THỊ THẾ GIỚI của "Du ngoạn Band 9": sáu thành phố, đường bay, giá vé, luật
 * mở khoá. Hàm thuần, không đụng store hay giao diện.
 */
import type { Bi } from '@/i18n/useL';
import { mainPoisOfCity } from '@/data/travel/pois';
import { TRAVEL_ECONOMY } from './economy';
import type { CityId, Level, TravelState } from './types';

export type CityMeta = {
  id: CityId;
  name: Bi;
  country: Bi;
  /** Độ lệch UTC chuẩn (giờ mùa đông). Giờ mùa hè châu Âu tính ở `clock.ts`. */
  utcOffsetHours: number;
  /** Châu Âu có đổi giờ mùa hè (EU DST) hay không. */
  eurDst: boolean;
  level: Level;
  /** Dải band hiển thị trên thẻ thành phố. */
  band: string;
  /** Một dòng gợi nội dung. */
  tagline: Bi;
  /** Màu đặc trưng của thành phố. */
  tint: string;
  /** Toạ độ chấm trên bản đồ thế giới, theo ô lưới 56×32 (xem `components/travel/WorldMap`). */
  mapAt: { x: number; y: number };
  /** Thành phố phải đạt ≥ `unlockAt` mới mở được thành phố này. */
  requires?: CityId;
  /** Số địa điểm chính (không tính ô bí mật) — dự phòng khi chưa có bản đồ. */
  poiCount: number;
};

export const CITY_ORDER: CityId[] = ['hanoi', 'singapore', 'london', 'paris', 'amsterdam', 'rome'];

export const CITIES: Record<CityId, CityMeta> = {
  hanoi: {
    id: 'hanoi',
    name: { vi: 'Hà Nội', en: 'Hanoi' },
    country: { vi: 'Việt Nam', en: 'Vietnam' },
    utcOffsetHours: 7,
    eurDst: false,
    level: 1,
    band: '5–6',
    tagline: { vi: 'Sân bay Nội Bài, nơi xuất phát', en: 'Noi Bai Airport, where it starts' },
    tint: '#B8955A',
    mapAt: { x: 45, y: 13 },
    poiCount: 2,
  },
  singapore: {
    id: 'singapore',
    name: { vi: 'Singapore', en: 'Singapore' },
    country: { vi: 'Singapore', en: 'Singapore' },
    utcOffsetHours: 8,
    eurDst: false,
    level: 1,
    band: '5–6.5',
    tagline: { vi: 'Sân bay, tàu điện, khu ăn vặt', en: 'Airport, MRT, hawker food' },
    tint: '#2F8F6B',
    mapAt: { x: 46, y: 25 },
    poiCount: 6,
  },
  london: {
    id: 'london',
    name: { vi: 'London', en: 'London' },
    country: { vi: 'Anh', en: 'United Kingdom' },
    utcOffsetHours: 0,
    eurDst: true,
    level: 2,
    band: '6–7',
    tagline: { vi: 'Tube, quán trà, chợ Borough', en: 'The Tube, tea rooms, Borough Market' },
    tint: '#B23A3A',
    mapAt: { x: 7, y: 6 },
    requires: 'singapore',
    poiCount: 6,
  },
  paris: {
    id: 'paris',
    name: { vi: 'Paris', en: 'Paris' },
    country: { vi: 'Pháp', en: 'France' },
    utcOffsetHours: 1,
    eurDst: true,
    level: 2,
    band: '6.5–7',
    tagline: { vi: 'Bảo tàng, thời trang, nhà hàng', en: 'Museums, fashion, restaurants' },
    tint: '#4C7BC0',
    mapAt: { x: 11, y: 13 },
    requires: 'london',
    poiCount: 6,
  },
  amsterdam: {
    id: 'amsterdam',
    name: { vi: 'Amsterdam', en: 'Amsterdam' },
    country: { vi: 'Hà Lan', en: 'Netherlands' },
    utcOffsetHours: 1,
    eurDst: true,
    level: 2,
    band: '6–7',
    tagline: { vi: 'Kênh đào, xe đạp, gió', en: 'Canals, bikes, wind' },
    tint: '#A4543A',
    mapAt: { x: 17, y: 5 },
    requires: 'london',
    poiCount: 6,
  },
  rome: {
    id: 'rome',
    name: { vi: 'Rome', en: 'Rome' },
    country: { vi: 'Ý', en: 'Italy' },
    utcOffsetHours: 1,
    eurDst: true,
    level: 3,
    band: '7+',
    tagline: { vi: 'Colosseum, đài Trevi, Vatican', en: 'Colosseum, Trevi, Vatican' },
    tint: '#D98A3D',
    mapAt: { x: 22, y: 19 },
    requires: 'london',
    poiCount: 6,
  },
};

/** Đường bay trực tiếp (vô hướng) và giá vé — bảng ở mục 3 của kế hoạch. */
export const ROUTES: { a: CityId; b: CityId; tickets: number }[] = [
  { a: 'hanoi', b: 'singapore', tickets: 1 },
  { a: 'singapore', b: 'london', tickets: 2 },
  { a: 'london', b: 'paris', tickets: 1 },
  { a: 'paris', b: 'amsterdam', tickets: 1 },
  { a: 'paris', b: 'rome', tickets: 1 },
];

export const HOME_CITY: CityId = 'hanoi';

export function isCityId(x: unknown): x is CityId {
  return typeof x === 'string' && (CITY_ORDER as string[]).includes(x);
}

/**
 * Số vé một chuyến bay. Theo đường bay trực tiếp; các cặp không nối thẳng thì
 * cộng dọc đường ngắn nhất (Hà Nội → London = 3). Về Hà Nội luôn miễn phí.
 */
export function flightCost(from: CityId, to: CityId): number {
  if (from === to) return 0;
  if (to === HOME_CITY && TRAVEL_ECONOMY.freeHome) return 0;
  const dist = new Map<CityId, number>([[from, 0]]);
  const todo = new Set<CityId>(CITY_ORDER);
  while (todo.size) {
    let best: CityId | null = null;
    for (const c of todo) if (dist.has(c) && (best === null || dist.get(c)! < dist.get(best)!)) best = c;
    if (best === null) break;
    todo.delete(best);
    for (const r of ROUTES) {
      const next = r.a === best ? r.b : r.b === best ? r.a : null;
      if (!next) continue;
      const d = dist.get(best)! + r.tickets;
      if (d < (dist.get(next) ?? Infinity)) dist.set(next, d);
    }
  }
  return dist.get(to) ?? Infinity;
}

type ProgressView = Pick<TravelState, 'poi'>;

/**
 * Tỉ lệ hoàn thành của một thành phố, 0..1: số địa điểm chính đã ĐẠT (≥ 2 sao)
 * trên tổng. `poiIds` cho phép bản đồ thật ghi đè danh sách mặc định.
 */
export function cityCompletion(state: ProgressView, city: CityId, poiIds?: string[]): number {
  const ids = poiIds ?? mainPoisOfCity(city).map((x) => x.id);
  if (!ids.length) return 0;
  const passed = ids.filter((id) => (state.poi[id]?.best ?? 0) >= TRAVEL_ECONOMY.visit.passStars).length;
  return passed / ids.length;
}

/** Thành phố đã mở chưa: không đòi gì, hoặc thành phố đòi đã đạt ≥ 60%. */
export function isCityUnlocked(state: ProgressView, city: CityId): boolean {
  if (!TRAVEL_ECONOMY.requireUnlock) return true;
  const need = CITIES[city].requires;
  if (!need) return true;
  return cityCompletion(state, need) >= TRAVEL_ECONOMY.unlockAt;
}

export type FlyCheck =
  | { ok: true; cost: number }
  | { ok: false; reason: 'same' | 'locked' | 'tickets'; cost: number };

export function canFly(state: Pick<TravelState, 'tickets' | 'city' | 'poi'>, to: CityId): FlyCheck {
  const cost = flightCost(state.city, to);
  if (to === state.city) return { ok: false, reason: 'same', cost: 0 };
  if (!isCityUnlocked(state, to)) return { ok: false, reason: 'locked', cost };
  if (state.tickets < cost) return { ok: false, reason: 'tickets', cost };
  return { ok: true, cost };
}
