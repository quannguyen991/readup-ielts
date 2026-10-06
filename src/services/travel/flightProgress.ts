/**
 * "CHUYẾN BAY HỌC TẬP": học tới đâu máy bay bay tới đó. Một tỉ lệ P (0..1) = trung bình mức hoàn thành của
 * các thành phố (tính theo SAO từng địa điểm chính, nên mỗi sao kiếm được đều nhích máy bay), rồi đổi thành vị
 * trí trên tuyến Hà Nội → Singapore → London → Paris → Rome, chia theo độ dài đường bay. Hàm thuần.
 */
import { mainPoisOfCity } from '@/data/travel/pois';
import { CITY_ORDER } from './world';
import { TRAVEL_ECONOMY } from './economy';
import type { CityId, TravelState } from './types';
import { routePoint, WORLD_ART, type RoutePoint } from './worldGeometry';

type View = Pick<TravelState, 'poi'>;

/** Tuyến chính của chuyến bay (các thành phố còn lại — Đà Nẵng, TP.HCM, Amsterdam — vẫn góp vào tiến độ). */
export const FLIGHT_CHAIN: readonly CityId[] = ['hanoi', 'danang', 'hochiminh', 'singapore', 'london', 'paris', 'amsterdam', 'rome', 'tokyo', 'seoul', 'newyork', 'istanbul', 'cairo', 'sydney', 'mexicocity', 'rio', 'capetown', 'marrakech'];
/** Thành phố góp vào tiến độ chung. */
export const LEARNING_CITIES: readonly CityId[] = CITY_ORDER.filter((city) => city !== 'hanoi');

/** Mức hoàn thành MỊN của một thành phố, 0..1: mỗi địa điểm chính tính min(1, sao / sao-đạt). */
export function cityProgressFine(v: View, city: CityId): number {
  const pois = mainPoisOfCity(city);
  if (!pois.length) return 0;
  const need = TRAVEL_ECONOMY.visit.passStars;
  let sum = 0;
  for (const p of pois) sum += Math.min(1, Math.max(0, (v.poi[p.id]?.best ?? 0) / need));
  return sum / pois.length;
}

/** Tiến độ chung P, 0..1. */
export function learningProgress(v: View): number {
  const sum = LEARNING_CITIES.reduce((a, c) => a + cityProgressFine(v, c), 0);
  return sum / LEARNING_CITIES.length;
}

function legLength(a: CityId, b: CityId): number {
  let len = 0;
  let prev = routePoint(a, b, 0);
  for (let i = 1; i <= 16; i += 1) {
    const p = routePoint(a, b, i / 16);
    len += Math.hypot(p.x - prev.x, p.y - prev.y);
    prev = p;
  }
  return len;
}

export type FlightPosition = RoutePoint & {
  /** Chặng hiện tại (chỉ số trong FLIGHT_CHAIN, chặng i nối chain[i] → chain[i+1]). */
  leg: number;
  from: CityId;
  to: CityId;
  /** Tỉ lệ trong chặng, 0..1. */
  t: number;
};

/** Vị trí máy bay khi đã đi được `p` (0..1) của cả tuyến, chia theo độ dài. */
export function positionAt(p: number): FlightPosition {
  const chain = FLIGHT_CHAIN;
  const lens: number[] = [];
  for (let i = 0; i < chain.length - 1; i += 1) lens.push(legLength(chain[i]!, chain[i + 1]!));
  const total = lens.reduce((a, b) => a + b, 0);
  let want = Math.min(1, Math.max(0, p)) * total;
  for (let i = 0; i < lens.length; i += 1) {
    if (want <= lens[i]! || i === lens.length - 1) {
      const t = lens[i]! > 0 ? Math.min(1, want / lens[i]!) : 0;
      return { ...routePoint(chain[i]!, chain[i + 1]!, t), leg: i, from: chain[i]!, to: chain[i + 1]!, t };
    }
    want -= lens[i]!;
  }
  const last = chain[chain.length - 1]!;
  return { ...WORLD_ART[last], angle: 0, leg: lens.length - 1, from: chain[chain.length - 2]!, to: last, t: 1 };
}

/** Thành phố gần nhất phía trước (đích kế tiếp) của máy bay ở tiến độ `p`. */
export function nextStop(p: number): CityId {
  const pos = positionAt(p);
  return pos.t >= 1 ? FLIGHT_CHAIN[Math.min(FLIGHT_CHAIN.length - 1, pos.leg + 2)]! : pos.to;
}
