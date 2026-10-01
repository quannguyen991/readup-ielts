/**
 * Chuẩn hoá và GỘP trạng thái "Du ngoạn Band 9" giữa hai máy. Hàm thuần.
 *
 *  - sổ cái: hợp theo mã khoản; vé và xu TÍNH LẠI từ sổ cái (không cộng đôi);
 *  - tiến độ địa điểm: `best`, `runs`, `level` lấy số lớn;
 *  - đã đến / quà lưu niệm: hợp; dấu hộ chiếu: bên nào có thì có;
 *  - cấp hộ chiếu: tính lại từ dấu và quà;
 *  - hạn mức ngày: ngày mới hơn thắng, cùng ngày lấy số lớn;
 *  - vị trí, thành phố, tuỳ chọn: bản có `updatedAt` mới hơn thắng;
 *  - câu đã làm: hợp, giữ mốc muộn hơn, bỏ mục quá 48 giờ.
 */
import { coinsOf, emptyCaps, mergeCaps, mergeLedgers, ticketsOf } from './economy';
import { passportLevelOf, stampCount } from './rewards';
import { isCityId } from './world';
import type { CityId, PoiProgress, TravelState } from './types';

/** Phần dữ liệu của state (không có hàm) — đúng thứ được lưu và đồng bộ. */
export type TravelPayload = TravelState;

export const SEEN_KEEP_MS = 48 * 3600 * 1000;

/** Vị trí "chưa đặt": trang thành phố sẽ đưa nhân vật về điểm xuất phát của bản đồ. */
export const POS_UNSET = { x: -1, y: -1 } as const;

export function emptyTravel(day = ''): TravelPayload {
  return {
    tickets: 0,
    coins: 0,
    city: 'hanoi',
    pos: { ...POS_UNSET },
    visited: {},
    poi: {},
    souvenirs: {},
    ledger: {},
    passportLevel: 1,
    dailyCaps: emptyCaps(day),
    prefs: { name: '', outfit: 0, sound: true },
    onboarded: false,
    updatedAt: '',
    seen: {},
  };
}

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const num = (x: unknown, d = 0) => (typeof x === 'number' && Number.isFinite(x) ? x : d);
const str = (x: unknown, d = '') => (typeof x === 'string' ? x : d);

/** Biến dữ liệu lạ / thiếu trường (bản cũ, máy chủ trả về) thành một state hợp lệ. */
export function normalizeTravel(raw: unknown): TravelPayload {
  const base = emptyTravel();
  if (!isObj(raw)) return base;
  const ledger: Record<string, number> = {};
  if (isObj(raw.ledger)) for (const [k, v] of Object.entries(raw.ledger)) if (typeof v === 'number' && Number.isFinite(v)) ledger[k] = v;

  const poi: Record<string, PoiProgress> = {};
  if (isObj(raw.poi))
    for (const [id, p] of Object.entries(raw.poi)) {
      if (!isObj(p)) continue;
      const best = Math.min(3, Math.max(0, Math.round(num(p.best)))) as 0 | 1 | 2 | 3;
      const level = Math.min(3, Math.max(1, Math.round(num(p.level, 1)))) as 1 | 2 | 3;
      poi[id] = { best, runs: Math.max(0, Math.round(num(p.runs))), level, lastAt: str(p.lastAt) };
    }

  const visited: TravelPayload['visited'] = {};
  if (isObj(raw.visited))
    for (const [c, v] of Object.entries(raw.visited)) if (isCityId(c) && isObj(v)) visited[c] = { stamp: v.stamp === true, firstAt: str(v.firstAt) };

  const souvenirs: Record<string, true> = {};
  if (isObj(raw.souvenirs)) for (const [k, v] of Object.entries(raw.souvenirs)) if (v) souvenirs[k] = true;

  const seen: Record<string, string> = {};
  if (isObj(raw.seen)) for (const [k, v] of Object.entries(raw.seen)) if (typeof v === 'string') seen[k] = v;

  const caps = isObj(raw.dailyCaps)
    ? {
        day: str(raw.dailyCaps.day),
        custom: num(raw.dailyCaps.custom),
        review: num(raw.dailyCaps.review),
        stars: num(raw.dailyCaps.stars),
        reviewWords: num(raw.dailyCaps.reviewWords),
      }
    : base.dailyCaps;

  const pos = isObj(raw.pos) ? { x: num(raw.pos.x, -1), y: num(raw.pos.y, -1) } : base.pos;
  const prefs = isObj(raw.prefs)
    ? { name: str(raw.prefs.name).slice(0, 24), outfit: Math.max(0, Math.round(num(raw.prefs.outfit))), sound: raw.prefs.sound !== false }
    : base.prefs;

  return withDerived({
    ...base,
    city: isCityId(raw.city) ? raw.city : 'hanoi',
    pos,
    visited,
    poi,
    souvenirs,
    ledger,
    dailyCaps: caps,
    prefs,
    onboarded: raw.onboarded === true,
    updatedAt: str(raw.updatedAt),
    seen,
  });
}

/** Tính lại các giá trị suy ra từ sổ cái / dấu / quà. */
export function withDerived<T extends Pick<TravelState, 'ledger' | 'visited' | 'souvenirs'>>(s: T): T & Pick<TravelState, 'tickets' | 'coins' | 'passportLevel'> {
  return {
    ...s,
    tickets: ticketsOf(s.ledger),
    coins: coinsOf(s.ledger),
    passportLevel: passportLevelOf(stampCount(s.visited), Object.keys(s.souvenirs).length),
  };
}

export function pruneSeen(seen: Record<string, string> | undefined, nowMs: number): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, at] of Object.entries(seen ?? {})) if (nowMs - Date.parse(at) < SEEN_KEEP_MS) out[k] = at;
  return out;
}

export function mergeTravel(local: unknown, remote: unknown | null, nowMs: number = Date.now()): TravelPayload {
  const a = normalizeTravel(local);
  if (remote === null || remote === undefined) return a;
  const b = normalizeTravel(remote);

  const ledger = mergeLedgers(a.ledger, b.ledger);

  const poi: Record<string, PoiProgress> = { ...a.poi };
  for (const [id, p] of Object.entries(b.poi)) {
    const cur = poi[id];
    poi[id] = cur
      ? {
          best: Math.max(cur.best, p.best) as 0 | 1 | 2 | 3,
          runs: Math.max(cur.runs, p.runs),
          level: Math.max(cur.level, p.level) as 1 | 2 | 3,
          lastAt: cur.lastAt > p.lastAt ? cur.lastAt : p.lastAt,
        }
      : p;
  }

  const visited: TravelPayload['visited'] = { ...a.visited };
  for (const [c, v] of Object.entries(b.visited) as [CityId, { stamp: boolean; firstAt: string }][]) {
    const cur = visited[c];
    visited[c] = cur
      ? { stamp: cur.stamp || v.stamp, firstAt: cur.firstAt && v.firstAt ? (cur.firstAt < v.firstAt ? cur.firstAt : v.firstAt) : cur.firstAt || v.firstAt }
      : v;
  }

  const souvenirs = { ...a.souvenirs, ...b.souvenirs };

  const seen: Record<string, string> = { ...a.seen };
  for (const [k, at] of Object.entries(b.seen ?? {})) if (!seen[k] || at > seen[k]!) seen[k] = at;

  const newer = (b.updatedAt ?? '') > (a.updatedAt ?? '') ? b : a;

  return withDerived({
    ...a,
    ledger,
    poi,
    visited,
    souvenirs,
    dailyCaps: mergeCaps(a.dailyCaps, b.dailyCaps) ?? a.dailyCaps,
    city: newer.city,
    pos: newer.pos,
    prefs: newer.prefs,
    onboarded: a.onboarded === true || b.onboarded === true,
    updatedAt: newer.updatedAt,
    seen: pruneSeen(seen, nowMs),
  });
}
