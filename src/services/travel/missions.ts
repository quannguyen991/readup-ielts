/**
 * NHIỆM VỤ KIẾM VÉ của "Du ngoạn Band 9" — hàm thuần, không giữ trạng thái riêng.
 *
 * Mọi thứ nằm trong SỔ CÁI (đã đồng bộ nhiều máy, hợp theo mã):
 *  - tiến độ được ĐẾM từ sổ cái + tiến độ địa điểm + hạn mức ngày (không có bộ đếm riêng);
 *  - đã nhận = có khoản đánh dấu `mc:<nhiệm vụ>:<kỳ>`; thưởng ghi `tk:mi:…` / `co:mi:…`
 *    nên nhận hai lần (hoặc hai máy cùng nhận) vẫn chỉ cộng một lần.
 *
 * TRẦN VÉ (chống lạm phát, ép ngay lúc nhận):
 *  - nhiệm vụ NGÀY: tối đa `MISSION_CAPS.dailyTickets` = 2 vé / ngày;
 *  - nhiệm vụ TUẦN: tối đa `MISSION_CAPS.weeklyTickets` = 4 vé / tuần (tuần bắt đầu thứ Hai);
 *  - nhiệm vụ THÀNH PHỐ: mỗi thành phố một lần, tối đa 2 vé / thành phố (≤ 16 vé trọn đời với 8 thành phố);
 *  - nhiệm vụ CHUỖI: một lần trọn đời, tối đa 3 vé.
 * Xu thưởng thêm không có trần riêng nhưng mỗi nhiệm vụ chỉ nhận một lần mỗi kỳ.
 */
import type { Bi } from '@/i18n/useL';
import { mainPoisOfCity } from '@/data/travel/pois';
import { ledgerAdd, type Ledger } from './economy';
import { POINTS_PREFIX, travelStreak } from './passport';
import type { CityId, PoiProgress, TravelState } from './types';

export const MISSION_CAPS = { dailyTickets: 2, weeklyTickets: 4 } as const;

export type MissionScope = 'daily' | 'weekly' | 'city' | 'streak';

export type MissionCtx = {
  ledger: Ledger;
  poi: Record<string, PoiProgress>;
  souvenirs: Record<string, true>;
  dailyCaps: TravelState['dailyCaps'];
  /** Ngày hôm nay, `YYYY-MM-DD` (giờ máy). */
  day: string;
};

export type Mission = {
  id: string;
  scope: MissionScope;
  /** Chỉ nhiệm vụ thành phố. */
  city?: CityId;
  title: Bi;
  hint: Bi;
  goal: number;
  reward: { tickets: number; coins: number };
};

// ---------------------------------------------------------------- kỳ (ngày / tuần)

/** Ngày của một mốc ISO theo giờ máy. */
export function dayOfIso(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${dd}`;
}

/** Thứ Hai của tuần chứa `day` (khoá của tuần). */
export function weekKey(day: string): string {
  const d = new Date(`${day}T00:00:00Z`);
  const back = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - back);
  return d.toISOString().slice(0, 10);
}

export function weekDays(day: string): string[] {
  const start = new Date(`${weekKey(day)}T00:00:00Z`);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

// ---------------------------------------------------------------- đếm tiến độ từ dữ liệu có sẵn

const passed = (p: PoiProgress | undefined) => (p?.best ?? 0) >= 2;

/** Số câu đúng ghi vào hộ chiếu trong các ngày `days`. */
export function correctAnswers(ledger: Ledger, days: readonly string[]): number {
  const set = new Set(days);
  let n = 0;
  for (const id of Object.keys(ledger)) if (id.startsWith(POINTS_PREFIX) && id.includes(':ans:') && set.has(id.slice(POINTS_PREFIX.length, POINTS_PREFIX.length + 10))) n += 1;
  return n;
}

/** Số ngày trong `days` có đi du ngoạn. */
export function travelDays(ledger: Ledger, days: readonly string[]): number {
  const set = new Set(days);
  let n = 0;
  for (const id of Object.keys(ledger)) if (id.startsWith(POINTS_PREFIX) && id.includes(':day:') && set.has(id.slice(POINTS_PREFIX.length, POINTS_PREFIX.length + 10))) n += 1;
  return n;
}

/** Địa điểm có lượt làm gần nhất rơi vào `days`. */
function playedIn(poi: Record<string, PoiProgress>, days: readonly string[]): PoiProgress[] {
  const set = new Set(days);
  return Object.values(poi).filter((p) => p.runs > 0 && set.has(dayOfIso(p.lastAt)));
}

const FOOD = new Set(['restaurant', 'cafe']);
const SIGHT = new Set(['landmark', 'museum', 'garden']);

// ---------------------------------------------------------------- danh sách nhiệm vụ

const DAILY: Mission[] = [
  { id: 'd-answer10', scope: 'daily', title: { vi: 'Trả lời đúng 10 câu', en: 'Answer 10 questions correctly' }, hint: { vi: 'Ở bất kỳ địa điểm hay quầy vé nào.', en: 'At any place or the ticket counter.' }, goal: 10, reward: { tickets: 1, coins: 10 } },
  { id: 'd-review10', scope: 'daily', title: { vi: 'Ôn 10 từ đến hạn', en: 'Review 10 due words' }, hint: { vi: 'Ở quầy vé sân bay.', en: 'At the airport ticket counter.' }, goal: 10, reward: { tickets: 0, coins: 15 } },
  { id: 'd-visit2', scope: 'daily', title: { vi: 'Làm xong 2 địa điểm', en: 'Finish 2 places' }, hint: { vi: 'Mỗi địa điểm một lượt hỏi.', en: 'One question run each.' }, goal: 2, reward: { tickets: 1, coins: 10 } },
  { id: 'd-star2', scope: 'daily', title: { vi: 'Đạt 2 sao ở một địa điểm', en: 'Get 2 stars at a place' }, hint: { vi: 'Trả lời đúng từ 60% trở lên.', en: 'Score 60% or more.' }, goal: 1, reward: { tickets: 0, coins: 20 } },
];

const WEEKLY: Mission[] = [
  { id: 'w-visit8', scope: 'weekly', title: { vi: 'Làm xong 8 địa điểm trong tuần', en: 'Finish 8 places this week' }, hint: { vi: 'Tuần bắt đầu từ thứ Hai.', en: 'The week starts on Monday.' }, goal: 8, reward: { tickets: 2, coins: 20 } },
  { id: 'w-answer60', scope: 'weekly', title: { vi: 'Trả lời đúng 60 câu trong tuần', en: 'Answer 60 questions correctly this week' }, hint: { vi: 'Mỗi ngày tính tối đa 20 câu.', en: 'Up to 20 count each day.' }, goal: 60, reward: { tickets: 1, coins: 30 } },
  { id: 'w-days4', scope: 'weekly', title: { vi: 'Đi du ngoạn 4 ngày trong tuần', en: 'Travel on 4 days this week' }, hint: { vi: 'Chỉ cần làm xong một lượt mỗi ngày.', en: 'One finished run a day is enough.' }, goal: 4, reward: { tickets: 1, coins: 0 } },
];

const STREAK: Mission[] = [
  { id: 's-3', scope: 'streak', title: { vi: 'Chuỗi 3 ngày liền', en: '3-day streak' }, hint: { vi: 'Du ngoạn 3 ngày liên tiếp.', en: 'Travel 3 days in a row.' }, goal: 3, reward: { tickets: 1, coins: 0 } },
  { id: 's-7', scope: 'streak', title: { vi: 'Chuỗi 7 ngày liền', en: '7-day streak' }, hint: { vi: 'Du ngoạn 7 ngày liên tiếp.', en: 'Travel 7 days in a row.' }, goal: 7, reward: { tickets: 2, coins: 50 } },
];

function cityMissions(city: CityId): Mission[] {
  const main = mainPoisOfCity(city);
  const food = main.filter((p) => FOOD.has(p.kind)).length;
  const list: Mission[] = [];
  if (food > 0) list.push({ id: `c-food-${city}`, scope: 'city', city, title: { vi: 'Ăn hết các quán ăn', en: 'Try every food place' }, hint: { vi: 'Đạt 2 sao ở mọi nhà hàng và quán cà phê.', en: '2 stars at every restaurant and café.' }, goal: food, reward: { tickets: 1, coins: 15 } });
  list.push({ id: `c-souvenir-${city}`, scope: 'city', city, title: { vi: 'Sưu tầm 3 quà lưu niệm', en: 'Collect 3 souvenirs' }, hint: { vi: 'Quà nhận ở lần đạt đầu của mỗi địa điểm.', en: 'Earned the first time you pass each place.' }, goal: 3, reward: { tickets: 0, coins: 20 } });
  if (main.some((p) => SIGHT.has(p.kind))) list.push({ id: `c-star3-${city}`, scope: 'city', city, title: { vi: '3 sao ở một thắng cảnh', en: '3 stars at a landmark' }, hint: { vi: 'Danh thắng, bảo tàng hoặc vườn.', en: 'A landmark, museum or garden.' }, goal: 1, reward: { tickets: 1, coins: 15 } });
  list.push({ id: `c-five-${city}`, scope: 'city', city, title: { vi: 'Làm xong 5 địa điểm', en: 'Finish 5 places' }, hint: { vi: 'Tính các nơi đã đạt.', en: 'Counting places you have passed.' }, goal: Math.max(1, Math.min(5, main.length)), reward: { tickets: 0, coins: 30 } });
  return list;
}

/** Nhiệm vụ đang hiển thị: ngày, tuần, (nếu có) thành phố hiện tại, chuỗi. */
export function missionsFor(city: CityId | null): Mission[] {
  return [...DAILY, ...WEEKLY, ...(city ? cityMissions(city) : []), ...STREAK];
}

export function allMissions(cities: readonly CityId[]): Mission[] {
  return [...DAILY, ...WEEKLY, ...cities.flatMap(cityMissions), ...STREAK];
}

// ---------------------------------------------------------------- tiến độ + nhận thưởng

export function periodOf(m: Mission, day: string): string {
  if (m.scope === 'daily') return day;
  if (m.scope === 'weekly') return weekKey(day);
  if (m.scope === 'city') return m.city ?? 'x';
  return 'once';
}

function cityProgress(m: Mission, c: MissionCtx): number {
  const main = mainPoisOfCity(m.city!);
  if (m.id.startsWith('c-food-')) return main.filter((p) => FOOD.has(p.kind) && passed(c.poi[p.id])).length;
  if (m.id.startsWith('c-souvenir-')) {
    const mine = new Set(main.map((p) => p.reward.souvenir).filter((s): s is string => !!s));
    return Object.keys(c.souvenirs).filter((s) => mine.has(s)).length;
  }
  if (m.id.startsWith('c-star3-')) return main.filter((p) => SIGHT.has(p.kind) && (c.poi[p.id]?.best ?? 0) >= 3).length;
  if (m.id.startsWith('c-five-')) return main.filter((p) => passed(c.poi[p.id])).length;
  return 0;
}

export function progressOf(m: Mission, c: MissionCtx): number {
  const days = m.scope === 'weekly' ? weekDays(c.day) : [c.day];
  let n = 0;
  switch (m.id) {
    case 'd-answer10':
    case 'w-answer60':
      n = correctAnswers(c.ledger, days);
      break;
    case 'd-review10':
      n = c.dailyCaps?.day === c.day ? (c.dailyCaps.reviewWords ?? 0) : 0;
      break;
    case 'd-visit2':
    case 'w-visit8':
      n = playedIn(c.poi, days).length;
      break;
    case 'd-star2':
      n = playedIn(c.poi, days).filter((p) => passed(p)).length;
      break;
    case 'w-days4':
      n = travelDays(c.ledger, days);
      break;
    case 's-3':
    case 's-7':
      n = travelStreak(c.ledger, c.day);
      break;
    default:
      if (m.city) n = cityProgress(m, c);
  }
  return Math.max(0, Math.min(m.goal, n));
}

export const markId = (m: Mission, day: string) => `mc:${m.id}:${periodOf(m, day)}`;

export function isMissionClaimed(ledger: Ledger, m: Mission, day: string): boolean {
  return Object.prototype.hasOwnProperty.call(ledger, markId(m, day));
}

/** Vé đã nhận từ nhiệm vụ cùng phạm vi trong kỳ hiện tại (để ép trần). */
export function missionTicketsClaimed(ledger: Ledger, scope: 'daily' | 'weekly', day: string): number {
  const prefix = scope === 'daily' ? 'tk:mi:d-' : 'tk:mi:w-';
  const suffix = scope === 'daily' ? `:${day}` : `:${weekKey(day)}`;
  let n = 0;
  for (const [id, amount] of Object.entries(ledger)) if (id.startsWith(prefix) && id.endsWith(suffix)) n += amount;
  return n;
}

export type MissionStatus = {
  progress: number;
  goal: number;
  done: boolean;
  claimed: boolean;
  /** Đủ điều kiện và còn trong trần → nút Nhận sáng. */
  claimable: boolean;
  /** Đã xong nhưng hết trần vé của kỳ này. */
  capped: boolean;
};

function ticketRoom(c: MissionCtx, m: Mission): number {
  if (m.scope === 'daily') return MISSION_CAPS.dailyTickets - missionTicketsClaimed(c.ledger, 'daily', c.day);
  if (m.scope === 'weekly') return MISSION_CAPS.weeklyTickets - missionTicketsClaimed(c.ledger, 'weekly', c.day);
  return Infinity;
}

export function statusOf(m: Mission, c: MissionCtx): MissionStatus {
  const progress = progressOf(m, c);
  const done = progress >= m.goal;
  const claimed = isMissionClaimed(c.ledger, m, c.day);
  const capped = done && !claimed && m.reward.tickets > 0 && ticketRoom(c, m) < m.reward.tickets;
  return { progress, goal: m.goal, done, claimed, claimable: done && !claimed && !capped, capped };
}

export type ClaimResult = { ok: boolean; reason?: 'not-done' | 'claimed' | 'cap'; ledger: Ledger; tickets: number; coins: number };

/** Nhận thưởng một nhiệm vụ. Idempotent: gọi lại (hoặc hai máy cùng nhận) chỉ cộng một lần. */
export function claimMission(m: Mission, c: MissionCtx): ClaimResult {
  const st = statusOf(m, c);
  if (st.claimed) return { ok: false, reason: 'claimed', ledger: c.ledger, tickets: 0, coins: 0 };
  if (!st.done) return { ok: false, reason: 'not-done', ledger: c.ledger, tickets: 0, coins: 0 };
  if (st.capped) return { ok: false, reason: 'cap', ledger: c.ledger, tickets: 0, coins: 0 };
  const period = periodOf(m, c.day);
  let ledger = ledgerAdd(c.ledger, markId(m, c.day), 1);
  if (m.reward.tickets > 0) ledger = ledgerAdd(ledger, `tk:mi:${m.id}:${period}`, m.reward.tickets);
  if (m.reward.coins > 0) ledger = ledgerAdd(ledger, `co:mi:${m.id}:${period}`, m.reward.coins);
  return { ok: true, ledger, tickets: m.reward.tickets, coins: m.reward.coins };
}

/** Số nhiệm vụ đang chờ nhận (chấm đỏ trên nút Nhiệm vụ). */
export function claimableCount(city: CityId | null, c: MissionCtx): number {
  return missionsFor(city).filter((m) => statusOf(m, c).claimable).length;
}
