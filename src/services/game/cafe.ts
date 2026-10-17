/**
 * QUÁN CÀ PHÊ BAND 9: luật ca làm solo kiểu Blooket "Café". Hàm thuần, không React, không store.
 *
 * Ca dài 90 giây. Khách đến khoảng mỗi 5 giây, xếp hàng tối đa `seatsOf(ghế)` người
 * (3 lúc đầu, tối đa 5). Mỗi khách gọi một từ; người chơi phục vụ bằng cách chọn
 * đúng nghĩa (câu hỏi lấy từ `buildDuel` ở màn hình, không ở đây).
 *
 *   - Phục vụ đúng: có coin (10 + thưởng nhanh tối đa 6), combo +1; từ combo 4 coin nhân 1,5.
 *     Mỗi cấp "Bánh ngọt" cộng thêm 3 coin mỗi lần đúng.
 *   - Phục vụ sai, hoặc khách hết kiên nhẫn: khách bỏ đi, mất 1 sao, combo về 0.
 *   - Khách đến khi hàng đã đầy: quay lưng đi, không mất sao (chỉ tính vào thống kê).
 *   - Hết 3 sao: quán đóng cửa sớm. Hết 90 giây: ca kết thúc, khách còn trong hàng về hết.
 *   - Nâng cấp bằng coin giữa ca: "Ghế thêm", "Máy pha nhanh" (kiên nhẫn lâu hơn), "Bánh ngọt".
 *
 * Mọi biến ngẫu nhiên (giờ khách đến) đi qua một bộ sinh số gieo bằng `seed`: cùng seed
 * thì cùng chuỗi khách. Màn hình gọi `tickCafe` mỗi nhịp và `serveCafe` mỗi lần chọn;
 * việc gọi `useGameStore.answer` đúng một lần cho mỗi lần phục vụ nằm ở màn hình.
 */

export const SHIFT_MS = 90_000;
export const MAX_STARS = 3;
export const SPAWN_MS = 5_000;
export const SPAWN_JITTER_MS = 800;
export const FIRST_CUSTOMER_MS = 1_500;
export const MIN_SEATS = 3;
export const MAX_SEATS = 5;
export const BASE_PATIENCE_MS = 12_000;
export const COIN_BASE = 10;
export const SPEED_COIN_MAX = 6;
export const COMBO_BOOST_AT = 4;
export const COMBO_MULT = 1.5;
export const BAKERY_COIN = 3;

export type UpgradeKind = 'seat' | 'machine' | 'bakery';
export const UPGRADE_KINDS: readonly UpgradeKind[] = ['seat', 'machine', 'bakery'];

/** `costs[cấp hiện tại]` là giá để lên cấp kế; `max` là số lần nâng tối đa. */
export const UPGRADES: Record<UpgradeKind, { max: number; costs: readonly number[] }> = {
  seat: { max: 2, costs: [30, 60] },
  machine: { max: 3, costs: [25, 50, 80] },
  bakery: { max: 3, costs: [20, 40, 70] },
};

export type CafeCustomer = {
  id: number;
  /** Số thứ tự khách trong ca, đếm từ 1. Màn hình lấy câu hỏi và khoá đáp án theo số này. */
  serial: number;
  /** Đã chờ bao nhiêu ms. */
  age: number;
  /** Kiên nhẫn tối đa (ms), chốt lúc khách bước vào. */
  patience: number;
};

export type CafeLevels = Record<UpgradeKind, number>;

export type CafeState = {
  seed: string;
  status: 'open' | 'done';
  endReason: 'time' | 'stars' | null;
  /** Thời gian đã trôi trong ca (ms), tối đa SHIFT_MS. */
  elapsed: number;
  /** Mốc giờ (ms trong ca) của khách kế tiếp. */
  nextSpawnAt: number;
  /** Trạng thái bộ sinh số ngẫu nhiên. */
  rng: number;
  spawned: number;
  queue: CafeCustomer[];
  /** Coin hiện có (để nâng cấp). */
  coins: number;
  /** Tổng coin đã kiếm trong ca (không trừ khi nâng cấp). */
  earned: number;
  combo: number;
  bestCombo: number;
  stars: number;
  served: number;
  wrong: number;
  missed: number;
  turnedAway: number;
  levels: CafeLevels;
};

export type CafeEvent =
  | { kind: 'arrive'; id: number }
  | { kind: 'turnaway' }
  | { kind: 'abandon'; id: number; stars: number }
  | { kind: 'served'; id: number; coin: number; combo: number; speed: number; boosted: boolean }
  | { kind: 'wrong'; id: number; stars: number }
  | { kind: 'closed'; reason: 'time' | 'stars' };

export type UpgradeBlock = 'ended' | 'max' | 'coins';

/* ---------------------------------------------------------------- tiện ích thuần */

function hashSeed(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Một bước của bộ sinh số (mulberry32 dạng hàm thuần): trả về số trong [0, 1) và trạng thái mới. */
function nextRng(state: number): { value: number; next: number } {
  const a = (state + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return { value: ((t ^ (t >>> 14)) >>> 0) / 4294967296, next: a };
}

export function seatsOf(seatLevel: number): number {
  return Math.min(MAX_SEATS, MIN_SEATS + seatLevel);
}

export function patienceOf(machineLevel: number): number {
  return Math.round(BASE_PATIENCE_MS * (1 + 0.25 * machineLevel));
}

/** Thưởng nhanh: còn nguyên kiên nhẫn thì được đủ SPEED_COIN_MAX, về 0 khi sắp hết chờ. */
export function speedBonus(age: number, patience: number): number {
  return Math.round(SPEED_COIN_MAX * Math.max(0, 1 - age / patience));
}

/** Coin của một lần phục vụ đúng. `combo` là combo SAU khi cộng lần này. */
export function coinFor(combo: number, speed: number, bakeryLevel: number): number {
  const base = COIN_BASE + speed;
  const boosted = combo >= COMBO_BOOST_AT ? base * COMBO_MULT : base;
  return Math.round(boosted) + BAKERY_COIN * bakeryLevel;
}

/** Giá lên cấp kế tiếp, hoặc null nếu đã tối đa. */
export function nextUpgradeCost(s: CafeState, kind: UpgradeKind): number | null {
  const level = s.levels[kind];
  const def = UPGRADES[kind];
  return level >= def.max ? null : def.costs[level] ?? null;
}

export function secondsLeft(s: CafeState): number {
  return Math.max(0, Math.ceil((SHIFT_MS - s.elapsed) / 1000));
}

/** Ca hết giờ với còn từ 2 sao trở lên: đủ để mừng bằng pháo giấy. */
export function isGoodShift(s: CafeState): boolean {
  return s.status === 'done' && s.endReason === 'time' && s.stars >= 2;
}

/* ---------------------------------------------------------------- ca làm */

export function createCafe(seed: string): CafeState {
  return {
    seed,
    status: 'open',
    endReason: null,
    elapsed: 0,
    nextSpawnAt: FIRST_CUSTOMER_MS,
    rng: hashSeed(seed),
    spawned: 0,
    queue: [],
    coins: 0,
    earned: 0,
    combo: 0,
    bestCombo: 0,
    stars: MAX_STARS,
    served: 0,
    wrong: 0,
    missed: 0,
    turnedAway: 0,
    levels: { seat: 0, machine: 0, bakery: 0 },
  };
}

/**
 * Trôi thêm `dtMs`: khách chờ lâu hơn (có thể bỏ đi), khách mới đến theo nhịp, và
 * kiểm tra hết giờ hoặc hết sao. Không làm gì nếu ca đã kết thúc.
 */
export function tickCafe(s: CafeState, dtMs: number): { state: CafeState; events: CafeEvent[] } {
  if (s.status !== 'open' || !(dtMs > 0)) return { state: s, events: [] };
  const events: CafeEvent[] = [];
  const elapsed = Math.min(SHIFT_MS, s.elapsed + dtMs);
  let stars = s.stars;
  let combo = s.combo;
  let missed = s.missed;
  const queue: CafeCustomer[] = [];

  for (const c of s.queue) {
    const age = c.age + dtMs;
    if (age >= c.patience) {
      missed += 1;
      stars = Math.max(0, stars - 1);
      combo = 0;
      events.push({ kind: 'abandon', id: c.id, stars });
    } else {
      queue.push({ ...c, age });
    }
  }

  let next = s.nextSpawnAt;
  let rng = s.rng;
  let spawned = s.spawned;
  let turnedAway = s.turnedAway;
  while (stars > 0 && next <= elapsed && next < SHIFT_MS) {
    spawned += 1;
    if (queue.length < seatsOf(s.levels.seat)) {
      queue.push({ id: spawned, serial: spawned, age: 0, patience: patienceOf(s.levels.machine) });
      events.push({ kind: 'arrive', id: spawned });
    } else {
      turnedAway += 1;
      events.push({ kind: 'turnaway' });
    }
    const r = nextRng(rng);
    rng = r.next;
    next += SPAWN_MS + Math.round((r.value * 2 - 1) * SPAWN_JITTER_MS);
    const r2 = nextRng(rng);
    rng = r2.next;
  }

  const closedByStars = stars <= 0;
  const closedByTime = elapsed >= SHIFT_MS;
  const ended = closedByStars || closedByTime;
  const reason: 'time' | 'stars' | null = closedByStars ? 'stars' : closedByTime ? 'time' : null;

  const state: CafeState = {
    ...s,
    elapsed,
    nextSpawnAt: next,
    rng,
    spawned,
    queue: ended ? [] : queue,
    combo,
    stars,
    missed,
    turnedAway,
    status: ended ? 'done' : 'open',
    endReason: reason,
  };
  if (ended && reason) events.push({ kind: 'closed', reason });
  return { state, events };
}

/**
 * Phục vụ khách `id` với đáp án `correct`. Khách không có trong hàng (đã phục vụ, đã
 * bỏ đi, hoặc ca đã đóng) thì `ok` là false và trạng thái không đổi, nên gọi hai lần
 * cho cùng khách chỉ có hiệu lực lần đầu.
 */
export function serveCafe(
  s: CafeState,
  id: number,
  correct: boolean,
): { state: CafeState; events: CafeEvent[]; coin: number; ok: boolean } {
  const cust = s.status === 'open' ? s.queue.find((c) => c.id === id) : undefined;
  if (!cust) return { state: s, events: [], coin: 0, ok: false };
  const queue = s.queue.filter((c) => c.id !== id);

  if (!correct) {
    const stars = Math.max(0, s.stars - 1);
    const ended = stars <= 0;
    const state: CafeState = {
      ...s,
      queue: ended ? [] : queue,
      combo: 0,
      stars,
      wrong: s.wrong + 1,
      status: ended ? 'done' : 'open',
      endReason: ended ? 'stars' : null,
    };
    const events: CafeEvent[] = [{ kind: 'wrong', id, stars }];
    if (ended) events.push({ kind: 'closed', reason: 'stars' });
    return { state, events, coin: 0, ok: true };
  }

  const combo = s.combo + 1;
  const speed = speedBonus(cust.age, cust.patience);
  const coin = coinFor(combo, speed, s.levels.bakery);
  const state: CafeState = {
    ...s,
    queue,
    combo,
    bestCombo: Math.max(s.bestCombo, combo),
    served: s.served + 1,
    coins: s.coins + coin,
    earned: s.earned + coin,
  };
  return {
    state,
    events: [{ kind: 'served', id, coin, combo, speed, boosted: combo >= COMBO_BOOST_AT }],
    coin,
    ok: true,
  };
}

/** Nâng một món giữa ca. Không đủ coin, đã tối đa, hoặc ca đã đóng thì không đổi gì. */
export function upgradeCafe(s: CafeState, kind: UpgradeKind): { state: CafeState; block: UpgradeBlock | null } {
  if (s.status !== 'open') return { state: s, block: 'ended' };
  const cost = nextUpgradeCost(s, kind);
  if (cost === null) return { state: s, block: 'max' };
  if (s.coins < cost) return { state: s, block: 'coins' };
  return {
    state: { ...s, coins: s.coins - cost, levels: { ...s.levels, [kind]: s.levels[kind] + 1 } },
    block: null,
  };
}
