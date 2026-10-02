/**
 * LỘ TRÌNH một thành phố — hàm thuần: các địa điểm theo thứ tự mở khoá, sao, tiến độ đóng dấu,
 * % tiến tới ngưỡng mở thành phố kế và bước gợi ý tiếp theo. Dùng cho khung "Nhiệm vụ → Lộ trình"
 * và để làm nổi địa điểm được gợi ý trên bản đồ.
 */
import { mainPoisOfCity, poisOfCity, type PoiContent } from '@/data/travel/pois';
import { TRAVEL_ECONOMY } from './economy';
import { isPoiUnlocked } from './rewards';
import type { CityId, TravelState } from './types';
import { CITIES, CITY_ORDER, cityCompletion } from './world';

const TRAVEL_UNLOCK_AT = TRAVEL_ECONOMY.unlockAt;

type View = Pick<TravelState, 'poi' | 'visited'>;

export type StepState = 'done' | 'next' | 'open' | 'locked';

export type JourneyStep = {
  poi: PoiContent;
  stars: number;
  state: StepState;
  /** Địa điểm cần làm trước (khi bị khoá). */
  needs?: PoiContent;
};

export type Journey = {
  city: CityId;
  steps: JourneyStep[];
  passed: number;
  total: number;
  /** Phần trăm hoàn thành 0–100. */
  pct: number;
  stamped: boolean;
  /** Thành phố kế tiếp mở khi đạt `unlockAt` ở thành phố này (nếu có). */
  nextCity: CityId | null;
  /** Mọi thành phố sẽ mở khi đạt ngưỡng ở thành phố này. */
  nextCities: CityId[];
  /** Tiến tới ngưỡng mở khoá thành phố kế, 0–100. */
  unlockPct: number;
  /** Số địa điểm còn phải đạt để đủ ngưỡng. */
  needMore: number;
  next: PoiContent | null;
};

const isDone = (v: View, id: string) => (v.poi[id]?.best ?? 0) >= 2;

/** Địa điểm đang mở, chưa đạt, đứng đầu trong chuỗi mở khoá. Ô bí mật chỉ gợi ý khi hết địa điểm chính. */
export function recommendedPoi(v: View, city: CityId): PoiContent | null {
  const main = mainPoisOfCity(city);
  const open = main.find((p) => !isDone(v, p.id) && isPoiUnlocked(v, p));
  if (open) return open;
  return poisOfCity(city).find((p) => p.kind === 'secret' && !isDone(v, p.id) && isPoiUnlocked(v, p)) ?? null;
}

export function journeyOf(v: View, city: CityId): Journey {
  const main = mainPoisOfCity(city);
  const rec = recommendedPoi(v, city);
  const extra = poisOfCity(city).filter((p) => p.kind === 'secret');
  // thứ tự lộ trình: theo độ sâu của chuỗi mở khoá (sau địa điểm nào), cùng độ sâu thì theo danh mục
  const all = [...main, ...extra];
  const depthOf = (p: PoiContent, seen = 0): number => {
    const parent = p.unlock?.after ? all.find((q) => q.id === p.unlock!.after) : undefined;
    return parent && seen < 12 ? 1 + depthOf(parent, seen + 1) : p.kind === 'secret' ? 99 : 0;
  };
  const ordered = all.map((p, i) => ({ p, i, d: depthOf(p) })).sort((a, b) => a.d - b.d || a.i - b.i).map((x) => x.p);
  const steps: JourneyStep[] = ordered.map((poi) => {
    const stars = v.poi[poi.id]?.best ?? 0;
    const done = stars >= 2;
    const unlocked = isPoiUnlocked(v, poi);
    const state: StepState = done ? 'done' : rec?.id === poi.id ? 'next' : unlocked ? 'open' : 'locked';
    const needs = !unlocked && poi.unlock?.after ? poisOfCity(city).find((p) => p.id === poi.unlock!.after) : undefined;
    return { poi, stars, state, needs };
  });
  const passed = main.filter((p) => isDone(v, p.id)).length;
  const total = main.length;
  const nextCities = CITY_ORDER.filter((c) => CITIES[c].requires === city);
  const nextCity = nextCities[0] ?? null;
  const comp = cityCompletion(v as Pick<TravelState, 'poi'>, city);
  const needCount = Math.ceil(total * TRAVEL_UNLOCK_AT);
  return {
    city,
    steps,
    passed,
    total,
    pct: total ? Math.round((passed / total) * 100) : 0,
    stamped: !!v.visited[city]?.stamp,
    nextCity,
    nextCities,
    unlockPct: Math.min(100, Math.round((comp / TRAVEL_UNLOCK_AT) * 100)),
    needMore: Math.max(0, needCount - passed),
    next: rec,
  };
}
