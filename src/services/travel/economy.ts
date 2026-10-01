/**
 * KINH TẾ của "Du ngoạn Band 9": vé và xu, sổ cái, hạn mức theo ngày. Hàm thuần.
 *
 * SỔ CÁI là nguồn sự thật của số vé và số xu: `tickets` / `coins` trong store luôn
 * được TÍNH LẠI từ sổ cái (cộng mọi khoản có tiền tố `tk:` / `co:`). Mỗi khoản
 * có một mã duy nhất, nên hai máy cùng ghi một khoản thì hợp lại vẫn chỉ tính một
 * lần — đúng cái mà đồng bộ nhiều máy cần. Khoản chi là số ÂM với mã riêng.
 *
 * Hạn mức ngày được ép BẰNG MÃ KHOẢN: vé hải quan có mã `tk:customs:<ngày>:<lượt>`
 * với lượt 1..6, nên dù hai máy cùng làm "lượt 1" thì cũng chỉ ra một vé.
 */
import type { TravelState } from './types';

/** Mọi con số của game ở MỘT chỗ — chỉnh ở đây, test canh theo đây. */
export const TRAVEL_ECONOMY = {
  customs: { questions: 5, passAt: 4, runsPerDay: 6, ticketsPerPass: 1 },
  review: { wordsPerTicket: 10, ticketsPerDay: 3 },
  stars: { starsPerTicket: 150, ticketsPerDay: 3 },
  /** Vé tặng lúc vào game. */
  welcomeTickets: 2,
  /** Thưởng khi hoàn thành cả thành phố (đóng dấu). */
  cityCompleteTickets: 1,
  /** Về Hà Nội luôn miễn phí. */
  freeHome: true,
  /** Bật = phải đạt ≥ `unlockAt` thành phố trước mới bay tới được (điều 2 mục 15). */
  requireUnlock: true,
  unlockAt: 0.6,
  visit: {
    questions: 7,
    /** ≥ 80% → 3 sao; ≥ 60% → 2 sao; ≥ 40% → 1 sao; còn lại 0. */
    starAt: [0.4, 0.6, 0.8] as const,
    /** Sao tối thiểu để tính là ĐẠT (mở địa điểm kế, tính vào tiến độ thành phố). */
    passStars: 2,
  },
  coins: {
    /** xu = cơ sở × (1 + starBonus × sao). */
    starBonus: 0.25,
    /** Làm lại địa điểm đã đạt: xu giảm còn một nửa. */
    replayFactor: 0.5,
  },
  /** Câu / từ vừa làm không hỏi lại trong khoảng này. */
  seenWindowMs: 24 * 3600 * 1000,
} as const;

export type Ledger = Record<string, number>;

export const TICKET_PREFIX = 'tk:';
export const COIN_PREFIX = 'co:';

/** Ghi một khoản vào sổ cái. Mã đã có thì KHÔNG đổi gì (idempotent). */
export function ledgerAdd(ledger: Ledger, id: string, amount: number): Ledger {
  if (!Number.isFinite(amount) || amount === 0) return ledger;
  if (Object.prototype.hasOwnProperty.call(ledger, id)) return ledger;
  return { ...ledger, [id]: amount };
}

export function ledgerSum(ledger: Ledger, prefix: string): number {
  let sum = 0;
  for (const [id, amount] of Object.entries(ledger)) if (id.startsWith(prefix)) sum += amount;
  return sum;
}

/** Số vé hiện có (không âm — hai máy cùng tiêu một vé có thể làm tổng âm tạm thời). */
export function ticketsOf(ledger: Ledger): number {
  return Math.max(0, ledgerSum(ledger, TICKET_PREFIX));
}

export function coinsOf(ledger: Ledger): number {
  return Math.max(0, ledgerSum(ledger, COIN_PREFIX));
}

export type DailyCaps = TravelState['dailyCaps'];

export function emptyCaps(day: string): DailyCaps {
  return { day, custom: 0, review: 0, stars: 0, reviewWords: 0 };
}

/** Sang ngày mới thì đếm lại từ 0. */
export function rolloverCaps(caps: DailyCaps | undefined, day: string): DailyCaps {
  return caps && caps.day === day ? caps : emptyCaps(day);
}

export type EconState = { ledger: Ledger; dailyCaps: DailyCaps };

export type EarnResult = EconState & {
  /** Số vé thật sự được cộng lần này. */
  tickets: number;
  ok: boolean;
  reason?: 'cap' | 'fail' | 'not-enough-stars' | 'no-words';
};

/** Điều kiện đạt ở hải quan: ≥ 4/5 đúng. Số câu khác 5 thì giữ nguyên tỉ lệ 80%. */
export function customsPassed(correct: number, total: number): boolean {
  const { questions, passAt } = TRAVEL_ECONOMY.customs;
  if (total <= 0) return false;
  if (total === questions) return correct >= passAt;
  return correct / total >= passAt / questions;
}

/** Một lượt hải quan: tính vào hạn mức 6 lượt/ngày dù đạt hay không; đạt thì có 1 vé. */
export function earnTicketFromCustoms(s: EconState, correct: number, total: number, day: string): EarnResult {
  const caps = rolloverCaps(s.dailyCaps, day);
  const { runsPerDay, ticketsPerPass } = TRAVEL_ECONOMY.customs;
  if (caps.custom >= runsPerDay) return { ledger: s.ledger, dailyCaps: caps, tickets: 0, ok: false, reason: 'cap' };
  const run = caps.custom + 1;
  const nextCaps = { ...caps, custom: run };
  if (!customsPassed(correct, total)) return { ledger: s.ledger, dailyCaps: nextCaps, tickets: 0, ok: false, reason: 'fail' };
  const ledger = ledgerAdd(s.ledger, `${TICKET_PREFIX}customs:${day}:${run}`, ticketsPerPass);
  return { ledger, dailyCaps: nextCaps, tickets: ledger === s.ledger ? 0 : ticketsPerPass, ok: true };
}

/**
 * Ôn từ đến hạn: cộng `n` từ ôn đúng vào bộ đếm của ngày; cứ 10 từ ra 1 vé, tối
 * đa 3 vé/ngày. Trả về số vé mới nhận.
 */
export function earnTicketsFromReview(s: EconState, n: number, day: string): EarnResult {
  const caps = rolloverCaps(s.dailyCaps, day);
  const { wordsPerTicket, ticketsPerDay } = TRAVEL_ECONOMY.review;
  if (!(n > 0)) return { ledger: s.ledger, dailyCaps: caps, tickets: 0, ok: false, reason: 'no-words' };
  const words = Math.min(wordsPerTicket * ticketsPerDay, (caps.reviewWords ?? 0) + Math.floor(n));
  const owed = Math.min(ticketsPerDay, Math.floor(words / wordsPerTicket));
  let ledger = s.ledger;
  let got = 0;
  for (let k = caps.review + 1; k <= owed; k += 1) {
    const next = ledgerAdd(ledger, `${TICKET_PREFIX}review:${day}:${k}`, 1);
    if (next !== ledger) got += 1;
    ledger = next;
  }
  const dailyCaps = { ...caps, reviewWords: words, review: Math.max(caps.review, owed) };
  if (got === 0 && caps.review >= ticketsPerDay) return { ledger, dailyCaps, tickets: 0, ok: false, reason: 'cap' };
  return { ledger, dailyCaps, tickets: got, ok: true };
}

export type ExchangeResult = EarnResult & { starsSpent: number };

/** Đổi 150 sao lấy 1 vé, tối đa 3 vé/ngày. `starBalance` là số sao đang có. */
export function exchangeStarsForTicket(s: EconState, starBalance: number, day: string): ExchangeResult {
  const caps = rolloverCaps(s.dailyCaps, day);
  const { starsPerTicket, ticketsPerDay } = TRAVEL_ECONOMY.stars;
  if (caps.stars >= ticketsPerDay) return { ledger: s.ledger, dailyCaps: caps, tickets: 0, ok: false, reason: 'cap', starsSpent: 0 };
  if (starBalance < starsPerTicket) return { ledger: s.ledger, dailyCaps: caps, tickets: 0, ok: false, reason: 'not-enough-stars', starsSpent: 0 };
  const n = caps.stars + 1;
  const ledger = ledgerAdd(s.ledger, `${TICKET_PREFIX}stars:${day}:${n}`, 1);
  const fresh = ledger !== s.ledger;
  return { ledger, dailyCaps: { ...caps, stars: n }, tickets: fresh ? 1 : 0, ok: true, starsSpent: fresh ? starsPerTicket : 0 };
}

/** Chi vé cho một chuyến bay. Mã có mốc thời gian nên mỗi chuyến là một khoản riêng. */
export function spendTickets(ledger: Ledger, id: string, amount: number): { ledger: Ledger; ok: boolean } {
  if (!(amount > 0) || ticketsOf(ledger) < amount) return { ledger, ok: false };
  return { ledger: ledgerAdd(ledger, `${TICKET_PREFIX}${id}`, -amount), ok: true };
}

export function spendCoins(ledger: Ledger, id: string, amount: number): { ledger: Ledger; ok: boolean } {
  if (!(amount > 0) || coinsOf(ledger) < amount) return { ledger, ok: false };
  return { ledger: ledgerAdd(ledger, `${COIN_PREFIX}${id}`, -amount), ok: true };
}

/** Gộp hai sổ cái: hợp theo mã. Hai bên khác số cho cùng mã (không nên xảy ra) thì lấy số lớn hơn về độ lớn. */
export function mergeLedgers(a: Ledger | undefined, b: Ledger | undefined): Ledger {
  const out: Ledger = { ...(a ?? {}) };
  for (const [id, amount] of Object.entries(b ?? {})) {
    if (!Number.isFinite(amount)) continue;
    const cur = out[id];
    if (cur === undefined || Math.abs(amount) > Math.abs(cur)) out[id] = amount;
  }
  return out;
}

/** Gộp hạn mức ngày: ngày mới hơn thắng; cùng ngày lấy số lớn hơn từng trường. */
export function mergeCaps(a: DailyCaps | undefined, b: DailyCaps | undefined): DailyCaps | undefined {
  if (!a) return b;
  if (!b) return a;
  if (a.day !== b.day) return a.day > b.day ? a : b;
  return {
    day: a.day,
    custom: Math.max(a.custom, b.custom),
    review: Math.max(a.review, b.review),
    stars: Math.max(a.stars, b.stars),
    reviewWords: Math.max(a.reviewWords ?? 0, b.reviewWords ?? 0),
  };
}
