/**
 * ĐƯỜNG VÀNG (Gold Quest): luật solo kiểu cờ Blooket. Hàm thuần, không React, không store.
 *
 * Bàn có 20 ô đặt thành vòng tròn; ô nào cũng có loại (vàng, rương, sao, bẫy, thường).
 * Mỗi lượt là một câu hỏi:
 *   - Đúng: tung xúc xắc 1–3 (cộng thêm 1 khi combo từ 3 trở lên), đi tới trước ngần đó
 *     ô, rồi nhận vàng theo ô đến. Combo +1.
 *   - Sai: đứng yên, combo −1, vẫn mất lượt.
 * Ô sao: nhận vàng thường và làm lần đúng kế tiếp được nhân 2. Ô bẫy: trừ 8 vàng, không
 * xuống dưới 0.
 *
 * Thắng khi:
 *   - Quân của bạn đi đủ một vòng (>= 20 ô) trước: thắng ngay, không chờ hết lượt.
 *   - Hết lượt mà đạt >= 120 vàng.
 *   - Có bot đối thủ và hết lượt mà vàng của bạn lớn hơn vàng của bot.
 * Bot đi 1–2 ô mỗi lượt theo seed, nhận nửa vàng của ô nó đứng (làm tròn xuống), bẫy vẫn
 * trừ 8. Bot đi hết vòng thì quay lại đầu bàn, không kết thúc trận.
 *
 * Không có ngẫu nhiên ngoài seed: mỗi lần rút đều lấy từ `seed` và bộ đếm `draws`, nên
 * cùng seed và cùng chuỗi đúng/sai thì ra cùng diễn biến. Màn hình gọi `answerGold` đúng
 * một lần mỗi câu, và việc gọi `useGameStore.answer` đúng một lần nằm ở màn hình.
 */

export type TileKind = 'plain' | 'gold' | 'chest' | 'star' | 'trap';

export const BOARD_LEN = 20;
export const TURNS = 15;
export const GOAL = 120;
/** Từ combo này trở lên thì xúc xắc được cộng thêm 1. */
export const COMBO_DICE_AT = 3;
export const TRAP_PENALTY = 8;
export const STAR_MULT = 2;

/** Vàng nhận khi đứng trên ô (bẫy là số âm). Ô sao cho 5 và làm lần đúng sau được nhân 2. */
export const TILE_GOLD: Record<TileKind, number> = { plain: 5, gold: 10, chest: 25, star: 5, trap: -TRAP_PENALTY };

/** Số ô mỗi loại: tổng đúng 20. */
const BOARD_MIX: readonly [TileKind, number][] = [
  ['plain', 5],
  ['gold', 9],
  ['chest', 2],
  ['star', 2],
  ['trap', 2],
];

export type Racer = { pos: number; gold: number };
export type GoldStatus = 'playing' | 'won' | 'lost';
export type GoldReason = 'lap' | 'goal' | 'beat' | 'behind' | 'short';

export type GoldQuest = {
  seed: string;
  board: TileKind[];
  turns: number;
  /** Số lượt đã đi xong. */
  turn: number;
  you: Racer;
  bot: Racer | null;
  combo: number;
  maxCombo: number;
  /** Nhân vàng cho lần đúng kế tiếp: 1, hoặc STAR_MULT sau khi đứng ô sao. */
  boost: number;
  /** Số lần đã rút; mỗi lần rút dùng một hạt con khác nhau. */
  draws: number;
  correct: number;
  wrong: number;
  status: GoldStatus;
  reason: GoldReason | null;
};

export type GoldEvent =
  | { kind: 'roll'; value: number; bonus: number }
  | { kind: 'move'; from: number; to: number }
  | { kind: 'land'; tile: TileKind; gain: number; boosted: boolean; combo: number }
  | { kind: 'wrong' }
  | { kind: 'botMove'; from: number; to: number; tile: TileKind; gain: number }
  | { kind: 'end'; status: GoldStatus; reason: GoldReason };

/* ---------------------------------------------------------------- rút ngẫu nhiên */

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Số thực trong [0, 1) từ một hạt. Cùng hạt thì cùng số. */
function unitOf(seed: string): number {
  let a = hash(seed) | 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Rút một số trong [0, 1) và tăng bộ đếm. Trả về cả trạng thái mới. */
function draw(g: GoldQuest): { u: number; draws: number } {
  return { u: unitOf(`${g.seed}#${g.draws}`), draws: g.draws + 1 };
}

/* ---------------------------------------------------------------- bàn cờ */

/** Sinh 20 ô theo `BOARD_MIX`, xáo bằng hạt `seed`. Cùng seed thì cùng bàn. */
export function makeBoard(seed: string): TileKind[] {
  const tiles: TileKind[] = [];
  for (const [kind, n] of BOARD_MIX) for (let i = 0; i < n; i += 1) tiles.push(kind);
  for (let i = tiles.length - 1; i > 0; i -= 1) {
    const j = Math.floor(unitOf(`${seed}:board:${i}`) * (i + 1));
    const tmp = tiles[i]!;
    tiles[i] = tiles[j]!;
    tiles[j] = tmp;
  }
  return tiles;
}

/** Ô đứng tại vị trí tổng `pos` (đếm từ 0 ở ô xuất phát, quay vòng mỗi 20 ô). */
export function tileAt(board: readonly TileKind[], pos: number): TileKind {
  return board[pos % BOARD_LEN]!;
}

/* ---------------------------------------------------------------- luật vàng */

/**
 * Áp dụng một ô lên số vàng hiện có. `boost` là hệ số đang chờ (1 hoặc STAR_MULT):
 * chỉ nhân khi ô cho vàng dương. Bẫy trừ 8 nhưng không xuống dưới 0; `gain` là phần
 * thay đổi thực tế nên bẫy khi đã gần 0 chỉ trừ tới 0.
 */
export function applyTile(gold: number, tile: TileKind, boost: number): { gold: number; gain: number; boosted: boolean } {
  if (tile === 'trap') {
    const next = Math.max(0, gold - TRAP_PENALTY);
    return { gold: next, gain: next - gold, boosted: false };
  }
  const boosted = boost > 1;
  const gain = TILE_GOLD[tile] * (boosted ? boost : 1);
  return { gold: gold + gain, gain, boosted };
}

/** Bot nhận nửa vàng của ô (làm tròn xuống); bẫy vẫn trừ 8. */
function botGainOf(tile: TileKind): number {
  return tile === 'trap' ? -TRAP_PENALTY : Math.floor(TILE_GOLD[tile] / 2);
}

/* ---------------------------------------------------------------- khởi tạo */

export function createGoldQuest(opts: { seed: string; turns?: number; rival?: boolean; board?: TileKind[] }): GoldQuest {
  return {
    seed: opts.seed,
    board: opts.board ?? makeBoard(opts.seed),
    turns: Math.max(1, Math.min(TURNS, Math.floor(opts.turns ?? TURNS))),
    turn: 0,
    you: { pos: 0, gold: 0 },
    bot: opts.rival ? { pos: 0, gold: 0 } : null,
    combo: 0,
    maxCombo: 0,
    boost: 1,
    draws: 0,
    correct: 0,
    wrong: 0,
    status: 'playing',
    reason: null,
  };
}

/* ---------------------------------------------------------------- một lượt */

/**
 * Chấm một câu và đi hết lượt đó. Trả về trạng thái mới (không sửa `g`) và các sự kiện
 * để màn hình diễn hiệu ứng. Khi trận đã kết thúc thì không làm gì.
 */
export function answerGold(g: GoldQuest, correct: boolean): { game: GoldQuest; events: GoldEvent[] } {
  if (g.status !== 'playing') return { game: g, events: [] };
  const events: GoldEvent[] = [];
  let s: GoldQuest = { ...g };

  if (correct) {
    const combo = s.combo + 1;
    const d = draw(s);
    const value = 1 + Math.floor(d.u * 3);
    const bonus = combo >= COMBO_DICE_AT ? 1 : 0;
    const from = s.you.pos;
    const to = from + value + bonus;
    const tile = tileAt(s.board, to);
    const res = applyTile(s.you.gold, tile, s.boost);
    events.push({ kind: 'roll', value, bonus });
    events.push({ kind: 'move', from, to });
    events.push({ kind: 'land', tile, gain: res.gain, boosted: res.boosted, combo });
    s = {
      ...s,
      draws: d.draws,
      combo,
      maxCombo: Math.max(s.maxCombo, combo),
      correct: s.correct + 1,
      you: { pos: to, gold: res.gold },
      boost: tile === 'star' ? STAR_MULT : 1,
    };
    if (to >= BOARD_LEN) {
      // Đi đủ một vòng: thắng ngay, không cần chờ hết lượt.
      const turn = s.turn + 1;
      events.push({ kind: 'end', status: 'won', reason: 'lap' });
      return { game: { ...s, turn, status: 'won', reason: 'lap' }, events };
    }
  } else {
    events.push({ kind: 'wrong' });
    s = { ...s, combo: Math.max(0, s.combo - 1), wrong: s.wrong + 1 };
  }

  if (s.bot) {
    const d = draw(s);
    const step = 1 + (d.u >= 0.5 ? 1 : 0);
    const from = s.bot.pos;
    const to = from + step;
    const tile = tileAt(s.board, to);
    const gain = botGainOf(tile);
    const gold = Math.max(0, s.bot.gold + gain);
    events.push({ kind: 'botMove', from, to, tile, gain: gold - s.bot.gold });
    s = { ...s, draws: d.draws, bot: { pos: to, gold } };
  }

  const turn = s.turn + 1;
  s = { ...s, turn };
  if (turn < s.turns) return { game: s, events };

  // Hết lượt: đạt mục tiêu thì thắng; không thì so với bot (nếu có).
  let status: GoldStatus = 'lost';
  let reason: GoldReason = 'short';
  if (s.you.gold >= GOAL) {
    status = 'won';
    reason = 'goal';
  } else if (s.bot) {
    status = s.you.gold > s.bot.gold ? 'won' : 'lost';
    reason = status === 'won' ? 'beat' : 'behind';
  }
  events.push({ kind: 'end', status, reason });
  return { game: { ...s, status, reason }, events };
}
