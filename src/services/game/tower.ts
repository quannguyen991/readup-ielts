/**
 * THÁP BAND: luật chế độ solo tower defense. Hàm thuần, không React, không store.
 *
 * Bản đồ là lưới 5 × 5. Quái đi theo một đường (LANE) 12 ô từ ô xuất phát tới
 * đích; mọi ô còn lại là ô trống để đặt tháp.
 *
 *   - Câu đúng: được VÀNG (12 + thưởng combo, `comboBonus`) và combo tăng lên.
 *   - Câu sai: combo về 0, mất một tim, và con quái gần đích nhất lọt ra ngoài.
 *     Quái tự đi tới đích cũng lọt và trừ một tim.
 *   - Tháp tự bắn con tiến xa nhất trong tầm. Mỗi phát tính bằng `damageFor(combo)`
 *     nên combo càng dài thì tháp càng mạnh. Nâng cấp (cấp 2, 3) nhân thêm sát thương
 *     và bắn nhanh hơn.
 *   - Quái lấy từ `ENEMIES` qua `enemyAt(chỉ số toàn cục)`: hết bảy loài thì sang
 *     vòng mới, máu tăng; boss là con cuối mỗi vòng.
 *   - Sóng w (đếm từ 1) có 4 + 2w con. Hết quái của sóng thì nghỉ rồi sang sóng sau.
 *     Hết sóng cuối mà còn tim là thắng; hết tim là thua.
 *
 * Không có ngẫu nhiên: cùng thao tác thì ra cùng diễn biến, nên test được.
 * Màn hình gọi `tickTower` mỗi nhịp `TICK_MS`, và `answerTower` mỗi câu. Việc gọi
 * `useGameStore.answer` đúng một lần mỗi câu nằm ở màn hình, không nằm ở đây.
 */
import { comboBonus, damageFor, enemyAt } from './rules';

export type Cell = { c: number; r: number };

export const COLS = 5;
export const ROWS = 5;

/** Đường quái đi: ô đầu là điểm xuất phát, ô cuối là đích. Đúng 12 ô, mỗi ô kề ô trước. */
export const LANE: readonly Cell[] = [
  { c: 0, r: 0 }, { c: 1, r: 0 }, { c: 2, r: 0 }, { c: 3, r: 0 }, { c: 4, r: 0 },
  { c: 4, r: 1 }, { c: 4, r: 2 }, { c: 3, r: 2 }, { c: 2, r: 2 }, { c: 1, r: 2 },
  { c: 1, r: 3 }, { c: 1, r: 4 },
];

export const TICK_MS = 100;
export const TOWER_HEARTS = 3;
export const WAVES = 4;
/** Nhịp nghỉ trước sóng 1 (để kịp đặt tháp) và giữa các sóng. 10 nhịp = 1 giây. */
export const FIRST_BREAK_TICKS = 250;
export const BREAK_TICKS = 150;
/** Cách nhau bao nhiêu nhịp thì ra con kế tiếp. */
export const SPAWN_EVERY = 8;
/** Ô mỗi nhịp. Đi hết 11 ô mất khoảng 9 giây. */
export const FOE_SPEED = 0.12;
/** Tầm bắn: khoảng cách từ tâm ô tháp tới tâm điểm quái, tính theo đơn vị ô. */
export const TOWER_RANGE = 2.2;
export const BUILD_COST = 30;
/** Giá nâng lên cấp 2 và cấp 3. */
const UPGRADE_COSTS = [40, 70] as const;
export const MAX_LEVEL = 3;
/** Nhân sát thương và số nhịp giữa hai phát bắn, theo cấp (1, 2, 3). */
const LEVEL_DAMAGE = [1, 1.5, 2] as const;
const FIRE_EVERY = [8, 7, 6] as const;
export const GOLD_CORRECT = 12;

/** Số quái của sóng `wave` (đếm từ 1). */
export function waveSize(wave: number): number {
  return 4 + 2 * wave;
}

export type Foe = {
  id: number;
  /** Chỉ số toàn cục trong `enemyAt`: quái thứ mấy từ đầu trận. */
  enemy: number;
  name: string;
  color: string;
  boss: boolean;
  hp: number;
  maxHp: number;
  /** Vị trí dọc đường, đơn vị ô: 0 là ô đầu, `LANE.length - 1` là đích. */
  pos: number;
};

export type Tower = { id: number; cell: Cell; level: number; cooldown: number };

export type TowerStatus = 'playing' | 'won' | 'lost';

export type TowerGame = {
  status: TowerStatus;
  /** Sóng hiện tại (1..WAVES). */
  wave: number;
  /** `break` là nghỉ giữa sóng; `spawn` là đang ra quái của sóng này. */
  phase: 'break' | 'spawn';
  /** Số nhịp còn lại của pha hiện tại (nghỉ, hoặc tới lúc ra con kế tiếp). */
  timer: number;
  /** Số quái đã ra trong sóng này. */
  spawned: number;
  /** Chỉ số toàn cục của con sẽ ra tiếp. */
  nextEnemy: number;
  foes: Foe[];
  towers: Tower[];
  nextId: number;
  gold: number;
  hearts: number;
  combo: number;
  correct: number;
  wrong: number;
  killed: number;
  /** Tổng số quái lọt ra ngoài (do đi tới đích hoặc do câu sai). */
  leaked: number;
  ticks: number;
};

export type TowerEvent =
  | { kind: 'wave'; wave: number }
  | { kind: 'spawn'; foe: number; boss: boolean }
  | { kind: 'shot'; tower: number; foe: number; damage: number }
  | { kind: 'kill'; foe: number; boss: boolean }
  | { kind: 'leak'; foe: number }
  | { kind: 'won' }
  | { kind: 'lost' };

/** Lý do không làm được thao tác. `null` nghĩa là được. */
export type Block = 'ended' | 'outside' | 'lane' | 'occupied' | 'gold' | 'missing' | 'max';

export function createTowerGame(over: Partial<TowerGame> = {}): TowerGame {
  return {
    status: 'playing',
    wave: 1,
    phase: 'break',
    timer: FIRST_BREAK_TICKS,
    spawned: 0,
    nextEnemy: 0,
    foes: [],
    towers: [],
    nextId: 1,
    gold: 0,
    hearts: TOWER_HEARTS,
    combo: 0,
    correct: 0,
    wrong: 0,
    killed: 0,
    leaked: 0,
    ticks: 0,
    ...over,
  };
}

/** Một con quái mới ở vị trí `pos` (mặc định là ô đầu). Máu lấy từ `enemyAt`. */
export function makeFoe(id: number, enemy: number, pos = 0): Foe {
  const e = enemyAt(enemy);
  return { id, enemy, name: e.name, color: e.color, boss: e.boss, hp: e.hp, maxHp: e.hp, pos };
}

/** Tọa độ (đơn vị ô, tâm ô là x.5) của một điểm trên đường. */
export function pointAt(pos: number): { x: number; y: number } {
  const last = LANE.length - 1;
  const p = Math.min(Math.max(pos, 0), last);
  const i = Math.min(Math.floor(p), last - 1);
  const f = p - i;
  const a = LANE[i]!;
  const b = LANE[i + 1]!;
  return { x: a.c + (b.c - a.c) * f + 0.5, y: a.r + (b.r - a.r) * f + 0.5 };
}

/** Quái ở `pos` có nằm trong tầm của tháp đứng ở ô `cell` không. */
export function inRange(cell: Cell, pos: number): boolean {
  const p = pointAt(pos);
  return Math.hypot(cell.c + 0.5 - p.x, cell.r + 0.5 - p.y) <= TOWER_RANGE;
}

export function onBoard(cell: Cell): boolean {
  return cell.c >= 0 && cell.c < COLS && cell.r >= 0 && cell.r < ROWS;
}

export function onLane(cell: Cell): boolean {
  return LANE.some((l) => l.c === cell.c && l.r === cell.r);
}

export function towerAt(g: TowerGame, cell: Cell): Tower | undefined {
  return g.towers.find((t) => t.cell.c === cell.c && t.cell.r === cell.r);
}

/** Sát thương một phát của tháp cấp `level` khi combo đang là `combo`. */
export function shotDamage(combo: number, level: number): number {
  return Math.round(damageFor(combo, false) * LEVEL_DAMAGE[level - 1]!);
}

/** Giá nâng từ `level` lên `level + 1`, hoặc `null` nếu đã tối đa. */
export function upgradeCost(level: number): number | null {
  return level >= MAX_LEVEL ? null : UPGRADE_COSTS[level - 1]!;
}

/** Con quái gần đích nhất (pos lớn nhất), hoặc `undefined` nếu không còn con nào. */
export function frontmost(foes: readonly Foe[]): Foe | undefined {
  let best: Foe | undefined;
  for (const f of foes) if (!best || f.pos > best.pos) best = f;
  return best;
}

export function buildBlock(g: TowerGame, cell: Cell): Block | null {
  if (g.status !== 'playing') return 'ended';
  if (!onBoard(cell)) return 'outside';
  if (onLane(cell)) return 'lane';
  if (towerAt(g, cell)) return 'occupied';
  if (g.gold < BUILD_COST) return 'gold';
  return null;
}

/** Đặt tháp cấp 1 ở ô trống. Không đủ vàng, sai chỗ hoặc đã có tháp thì giữ nguyên trạng thái. */
export function buildTower(g: TowerGame, cell: Cell): { game: TowerGame; block: Block | null } {
  const block = buildBlock(g, cell);
  if (block) return { game: g, block };
  const tower: Tower = { id: g.nextId, cell: { c: cell.c, r: cell.r }, level: 1, cooldown: 0 };
  return { game: { ...g, gold: g.gold - BUILD_COST, towers: [...g.towers, tower], nextId: g.nextId + 1 }, block: null };
}

export function upgradeBlock(g: TowerGame, towerId: number): Block | null {
  if (g.status !== 'playing') return 'ended';
  const t = g.towers.find((x) => x.id === towerId);
  if (!t) return 'missing';
  const cost = upgradeCost(t.level);
  if (cost === null) return 'max';
  if (g.gold < cost) return 'gold';
  return null;
}

export function upgradeTower(g: TowerGame, towerId: number): { game: TowerGame; block: Block | null } {
  const block = upgradeBlock(g, towerId);
  if (block) return { game: g, block };
  const cost = upgradeCost(g.towers.find((x) => x.id === towerId)!.level)!;
  const towers = g.towers.map((t) => (t.id === towerId ? { ...t, level: t.level + 1 } : t));
  return { game: { ...g, gold: g.gold - cost, towers }, block: null };
}

/**
 * Một lượt trả lời. Đúng: vàng và combo tăng. Sai: combo về 0, mất một tim, và
 * con quái gần đích nhất lọt ra ngoài (nó biến mất khỏi đường).
 */
export function answerTower(g: TowerGame, correct: boolean): { game: TowerGame; events: TowerEvent[]; gold: number } {
  if (g.status !== 'playing') return { game: g, events: [], gold: 0 };
  if (correct) {
    const combo = g.combo + 1;
    const gold = GOLD_CORRECT + comboBonus(combo);
    return { game: { ...g, combo, gold: g.gold + gold, correct: g.correct + 1 }, events: [], gold };
  }
  const front = frontmost(g.foes);
  const hearts = Math.max(0, g.hearts - 1);
  const status: TowerStatus = hearts <= 0 ? 'lost' : 'playing';
  const events: TowerEvent[] = [];
  if (front) events.push({ kind: 'leak', foe: front.id });
  if (status === 'lost') events.push({ kind: 'lost' });
  const game: TowerGame = {
    ...g,
    status,
    combo: 0,
    hearts,
    wrong: g.wrong + 1,
    foes: front ? g.foes.filter((f) => f.id !== front.id) : g.foes,
    leaked: g.leaked + (front ? 1 : 0),
  };
  return { game, events, gold: 0 };
}

/**
 * Một nhịp mô phỏng (`TICK_MS`). Thứ tự: ra quái hoặc đếm nghỉ, quái đi tới,
 * tháp bắn, rồi xét thắng / thua.
 */
export function tickTower(g: TowerGame): { game: TowerGame; events: TowerEvent[] } {
  if (g.status !== 'playing') return { game: g, events: [] };
  const events: TowerEvent[] = [];
  const end = LANE.length - 1;
  let { wave, phase, timer, spawned, nextEnemy, nextId, hearts, killed, leaked } = g;
  let foes: Foe[] = g.foes.map((f) => ({ ...f }));
  const towers: Tower[] = g.towers.map((t) => ({ ...t }));
  let status: TowerStatus = 'playing';

  // 1. Nghỉ xong thì sang pha ra quái; đang ra thì cứ mỗi SPAWN_EVERY nhịp ra một con.
  if (phase === 'break') {
    timer -= 1;
    if (timer <= 0) {
      phase = 'spawn';
      timer = 0;
      events.push({ kind: 'wave', wave });
    }
  } else if (spawned < waveSize(wave)) {
    if (timer <= 0) {
      const foe = makeFoe(nextId, nextEnemy);
      nextId += 1;
      nextEnemy += 1;
      spawned += 1;
      foes.push(foe);
      timer = SPAWN_EVERY - 1;
      events.push({ kind: 'spawn', foe: foe.id, boss: foe.boss });
    } else timer -= 1;
  }

  // 2. Quái đi tới. Con nào tới đích thì lọt ra ngoài và trừ một tim.
  for (const f of foes) f.pos += FOE_SPEED;
  const escaped = foes.filter((f) => f.pos >= end);
  if (escaped.length > 0) {
    foes = foes.filter((f) => f.pos < end);
    hearts -= escaped.length;
    leaked += escaped.length;
    for (const f of escaped) events.push({ kind: 'leak', foe: f.id });
  }

  // 3. Mỗi tháp sẵn sàng thì bắn con tiến xa nhất trong tầm.
  for (const t of towers) {
    if (t.cooldown > 0) {
      t.cooldown -= 1;
      continue;
    }
    let target: Foe | undefined;
    for (const f of foes) if (inRange(t.cell, f.pos) && (!target || f.pos > target.pos)) target = f;
    if (!target) continue;
    const damage = shotDamage(g.combo, t.level);
    target.hp -= damage;
    t.cooldown = FIRE_EVERY[t.level - 1]! - 1;
    events.push({ kind: 'shot', tower: t.id, foe: target.id, damage });
    if (target.hp <= 0) {
      const down = target;
      foes = foes.filter((f) => f !== down);
      killed += 1;
      events.push({ kind: 'kill', foe: down.id, boss: down.boss });
    }
  }

  // 4. Hết tim thì thua. Hết quái của sóng: sóng cuối thì thắng, còn lại thì nghỉ rồi sang sóng sau.
  if (hearts <= 0) {
    hearts = 0;
    status = 'lost';
    events.push({ kind: 'lost' });
  } else if (phase === 'spawn' && spawned >= waveSize(wave) && foes.length === 0) {
    if (wave >= WAVES) {
      status = 'won';
      events.push({ kind: 'won' });
    } else {
      wave += 1;
      phase = 'break';
      timer = BREAK_TICKS;
      spawned = 0;
    }
  }

  return {
    game: { ...g, status, wave, phase, timer, spawned, nextEnemy, foes, towers, nextId, hearts, killed, leaked, ticks: g.ticks + 1 },
    events,
  };
}
