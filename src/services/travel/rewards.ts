/**
 * PHẦN THƯỞNG của một lượt tham quan: sao, xu, quà lưu niệm, con dấu, cấp hộ chiếu.
 * Hàm thuần: nhận trạng thái, trả về phần cần ghi + kết quả để hiển thị.
 */
import { mainPoisOfCity } from '@/data/travel/pois';
import { COIN_PREFIX, TICKET_PREFIX, TRAVEL_ECONOMY, coinsOf, ledgerAdd, ticketsOf } from './economy';
import type { CityId, Level, PoiProgress, TravelState } from './types';

export type Stars = 0 | 1 | 2 | 3;

/** ≥ 80% → 3 sao, ≥ 60% → 2 sao, ≥ 40% → 1 sao, còn lại 0. */
export function starsFor(correct: number, total: number): Stars {
  if (total <= 0) return 0;
  const r = correct / total;
  const [one, two, three] = TRAVEL_ECONOMY.visit.starAt;
  if (r >= three) return 3;
  if (r >= two) return 2;
  if (r >= one) return 1;
  return 0;
}

export function isPass(stars: number): boolean {
  return stars >= TRAVEL_ECONOMY.visit.passStars;
}

/** Nhãn kết quả theo sao (song ngữ ở giao diện). */
export function gradeLabel(stars: Stars): 'excellent' | 'pass' | 'retry' {
  return stars === 3 ? 'excellent' : stars === 2 ? 'pass' : 'retry';
}

/** xu = cơ sở × (1 + 0.25 × sao); chỉ khi ĐẠT; làm lại địa điểm đã đạt thì còn một nửa. */
export function coinsFor(base: number, stars: number, replay: boolean): number {
  if (!isPass(stars) || base <= 0) return 0;
  const raw = base * (1 + TRAVEL_ECONOMY.coins.starBonus * stars);
  return Math.max(1, Math.round(replay ? raw * TRAVEL_ECONOMY.coins.replayFactor : raw));
}

/** Cấp hộ chiếu: 1 + số con dấu + cứ 6 quà lưu niệm thêm một cấp. */
export function passportLevelOf(stamps: number, souvenirs: number): number {
  return 1 + stamps + Math.floor(souvenirs / 6);
}

export function stampCount(visited: TravelState['visited']): number {
  return Object.values(visited).filter((v) => v?.stamp).length;
}

export type VisitInput = {
  poi: { id: string; city: CityId; reward: { coins: number; souvenir?: string }; content: { level: Level } };
  correct: number;
  total: number;
  /** Mức đã chơi (có thể khác mức gốc của địa điểm). */
  playedLevel?: Level;
  nowIso: string;
  /** Danh sách địa điểm chính của thành phố (mặc định lấy từ danh mục). */
  mainPoiIds?: string[];
};

export type VisitResult = {
  stars: Stars;
  passed: boolean;
  /** Lần ĐẠT đầu tiên của địa điểm này. */
  firstCompletion: boolean;
  coins: number;
  souvenir?: string;
  /** Thành phố vừa được đóng dấu (đạt đủ mọi địa điểm chính). */
  stamp?: CityId;
  /** Vé thưởng khi đóng dấu. */
  bonusTickets: number;
  /** Mức mới mở của địa điểm (khi 3 sao ở mức hiện có). */
  levelUnlocked?: Level;
  runNo: number;
};

export type VisitPatch = Pick<TravelState, 'poi' | 'ledger' | 'souvenirs' | 'visited' | 'passportLevel' | 'tickets' | 'coins'>;

export function applyVisit(
  state: Pick<TravelState, 'poi' | 'ledger' | 'souvenirs' | 'visited'>,
  input: VisitInput,
): { patch: VisitPatch; result: VisitResult } {
  const { poi, correct, total, nowIso } = input;
  const stars = starsFor(correct, total);
  const passed = isPass(stars);
  const prev: PoiProgress | undefined = state.poi[poi.id];
  const runNo = (prev?.runs ?? 0) + 1;
  const wasPassed = isPass(prev?.best ?? 0);
  const baseLevel: Level = prev?.level ?? poi.content.level;
  const played: Level = input.playedLevel ?? baseLevel;

  let level = baseLevel;
  let levelUnlocked: Level | undefined;
  if (stars === 3 && played >= baseLevel && baseLevel < 3) {
    level = (baseLevel + 1) as Level;
    levelUnlocked = level;
  }

  const best = Math.max(prev?.best ?? 0, stars) as 0 | 1 | 2 | 3;
  const nextPoi = { ...state.poi, [poi.id]: { best, runs: runNo, level, lastAt: nowIso } as PoiProgress };

  const coins = coinsFor(poi.reward.coins, stars, wasPassed);
  let ledger = ledgerAdd(state.ledger, `${COIN_PREFIX}visit:${poi.id}:${runNo}`, coins);

  const firstCompletion = passed && !wasPassed;
  const souvenir = firstCompletion ? poi.reward.souvenir : undefined;
  const souvenirs = souvenir ? { ...state.souvenirs, [souvenir]: true as const } : state.souvenirs;

  const ids = input.mainPoiIds ?? mainPoisOfCity(poi.city).map((x) => x.id);
  const isMain = ids.includes(poi.id);
  const cityDone = isMain && ids.length > 0 && ids.every((id) => isPass(nextPoi[id]?.best ?? 0));
  const had = state.visited[poi.city];
  let stamp: CityId | undefined;
  let bonusTickets = 0;
  if (cityDone && !had?.stamp) {
    stamp = poi.city;
    bonusTickets = TRAVEL_ECONOMY.cityCompleteTickets;
    ledger = ledgerAdd(ledger, `${TICKET_PREFIX}city:${poi.city}`, bonusTickets);
  }
  const visited = { ...state.visited, [poi.city]: { stamp: !!(had?.stamp || stamp), firstAt: had?.firstAt ?? nowIso } };

  return {
    patch: {
      poi: nextPoi,
      ledger,
      souvenirs,
      visited,
      passportLevel: passportLevelOf(stampCount(visited), Object.keys(souvenirs).length),
      tickets: ticketsOf(ledger),
      coins: coinsOf(ledger),
    },
    result: { stars, passed, firstCompletion, coins, souvenir, stamp, bonusTickets, levelUnlocked, runNo },
  };
}

/** Địa điểm đã mở chưa (theo `unlock` của danh mục). Địa điểm bí mật cần đạt hết các chỗ chính. */
export function isPoiUnlocked(
  state: Pick<TravelState, 'poi'>,
  poi: { id: string; city: CityId; kind: string; unlock?: { after?: string; minStars?: number } },
  mainPoiIds?: string[],
): boolean {
  const ids = mainPoiIds ?? mainPoisOfCity(poi.city).map((x) => x.id);
  if (poi.kind === 'secret') return ids.length > 0 && ids.every((id) => isPass(state.poi[id]?.best ?? 0));
  const u = poi.unlock;
  if (!u) return true;
  if (u.after && !isPass(state.poi[u.after]?.best ?? 0)) return false;
  if (u.minStars) {
    const sum = ids.reduce((n, id) => n + (state.poi[id]?.best ?? 0), 0);
    if (sum < u.minStars) return false;
  }
  return true;
}
