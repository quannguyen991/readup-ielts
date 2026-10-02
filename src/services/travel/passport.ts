/**
 * ĐIỂM HỘ CHIẾU — hàm thuần. Mọi điểm là một khoản trong SỔ CÁI của kho du ngoạn
 * với mã `pp:<ngày>:<loại>:<tham chiếu>`, nên (như vé và xu):
 *  - ghi cùng một mã hai lần chỉ tính một lần;
 *  - hai máy gộp sổ cái (hợp theo mã) không cộng đôi;
 *  - điểm THÁNG tính được từ chính mã khoản (có ngày), không cần bảng riêng.
 * Việc "một lần mỗi con dấu / địa điểm / quà" được giữ bằng cách dò khoản cùng
 * `loại:tham chiếu` ở bất kỳ ngày nào. Quà đã nhận ghi bằng khoản `pc:<mốc>`.
 */
import { ledgerAdd, ledgerSum, type Ledger } from './economy';
import { PASSPORT_POINTS, TIERS, type Tier } from './passport-rewards';

export const POINTS_PREFIX = 'pp:';
export const CLAIM_PREFIX = 'pc:';

const dayOf = (id: string): string => id.slice(POINTS_PREFIX.length, POINTS_PREFIX.length + 10);

export function pointId(day: string, kind: string, ref: string): string {
  return `${POINTS_PREFIX}${day}:${kind}:${ref}`;
}

/** Tổng điểm hộ chiếu từ trước tới giờ (không âm). */
export function pointsOf(ledger: Ledger): number {
  return Math.max(0, ledgerSum(ledger, POINTS_PREFIX));
}

/** Điểm của một tháng, `month` dạng `YYYY-MM`. */
export function monthPointsOf(ledger: Ledger, month: string): number {
  return Math.max(0, ledgerSum(ledger, `${POINTS_PREFIX}${month}-`));
}

export function monthOf(day: string): string {
  return day.slice(0, 7);
}

/** Có khoản nào cùng `loại:tham chiếu` (bất kể ngày) chưa. */
function hasOnce(ledger: Ledger, kind: string, ref: string): boolean {
  const tail = `:${kind}:${ref}`;
  for (const id of Object.keys(ledger)) if (id.startsWith(POINTS_PREFIX) && id.endsWith(tail)) return true;
  return false;
}

function addOnce(ledger: Ledger, day: string, kind: string, ref: string, pts: number): Ledger {
  if (pts <= 0 || hasOnce(ledger, kind, ref)) return ledger;
  return ledgerAdd(ledger, pointId(day, kind, ref), pts);
}

function prevDay(day: string): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** Số ngày liền nhau có đi du ngoạn, tính tới `day` (kể cả `day`). */
export function travelStreak(ledger: Ledger, day: string): number {
  const days = new Set<string>();
  for (const id of Object.keys(ledger)) if (id.startsWith(POINTS_PREFIX) && id.includes(':day:')) days.add(dayOf(id));
  let n = 0;
  for (let d = day; days.has(d); d = prevDay(d)) n += 1;
  return n;
}

/** Ngày đầu tiên trong ngày: điểm đi du ngoạn + thưởng chuỗi. Gọi sau mỗi lượt làm xong. */
export function awardDaily(ledger: Ledger, day: string): Ledger {
  const id = pointId(day, 'day', day);
  if (Object.prototype.hasOwnProperty.call(ledger, id)) return ledger;
  let next = ledgerAdd(ledger, id, PASSPORT_POINTS.dailyTravel);
  const streak = travelStreak(next, day);
  const bonus = Math.min(PASSPORT_POINTS.streakMax, Math.max(0, streak - 1) * PASSPORT_POINTS.streakPerDay);
  if (bonus > 0) next = ledgerAdd(next, pointId(day, 'streak', day), bonus);
  return next;
}

/** Điểm câu đúng: mỗi câu `perCorrect`, trần `correctDailyCap` điểm mỗi ngày. */
export function awardCorrect(ledger: Ledger, day: string, correct: number): Ledger {
  const per = PASSPORT_POINTS.perCorrect;
  const prefix = `${POINTS_PREFIX}${day}:ans:`;
  let have = 0;
  for (const id of Object.keys(ledger)) if (id.startsWith(prefix)) have += 1;
  const room = Math.max(0, Math.floor(PASSPORT_POINTS.correctDailyCap / per) - have);
  const n = Math.min(room, Math.max(0, Math.floor(correct)));
  let next = ledger;
  for (let k = 1; k <= n; k += 1) next = ledgerAdd(next, `${prefix}${have + k}`, per);
  return next;
}

export type VisitPointsInput = {
  day: string;
  poiId: string;
  bestBefore: number;
  bestAfter: number;
  correct: number;
  souvenir?: string;
  stamp?: string;
};

/** Mọi điểm của một lượt tham quan vừa xong. */
export function awardVisit(ledger: Ledger, i: VisitPointsInput): Ledger {
  let next = awardDaily(ledger, i.day);
  if (i.bestBefore < 2 && i.bestAfter >= 2) next = addOnce(next, i.day, 'star2', i.poiId, PASSPORT_POINTS.poiTwoStars);
  if (i.bestBefore < 3 && i.bestAfter >= 3) next = addOnce(next, i.day, 'star3', i.poiId, PASSPORT_POINTS.poiThreeStars);
  if (i.souvenir) next = addOnce(next, i.day, 'sv', i.souvenir, PASSPORT_POINTS.souvenir);
  if (i.stamp) next = addOnce(next, i.day, 'stamp', i.stamp, PASSPORT_POINTS.stamp);
  return awardCorrect(next, i.day, i.correct);
}

/** Một lượt hải quan / ôn từ: chỉ tính ngày đi và câu đúng. */
export function awardPractice(ledger: Ledger, day: string, correct: number): Ledger {
  if (!(correct > 0)) return ledger;
  return awardCorrect(awardDaily(ledger, day), day, correct);
}

export function isClaimed(ledger: Ledger, tierId: string): boolean {
  return Object.prototype.hasOwnProperty.call(ledger, `${CLAIM_PREFIX}${tierId}`);
}

export function markClaimed(ledger: Ledger, tierId: string): Ledger {
  return ledgerAdd(ledger, `${CLAIM_PREFIX}${tierId}`, 1);
}

export type TierState = 'claimed' | 'ready' | 'locked';

export function tierState(ledger: Ledger, tier: Tier, points = pointsOf(ledger)): TierState {
  if (isClaimed(ledger, tier.id)) return 'claimed';
  return points >= tier.points ? 'ready' : 'locked';
}

/** Mốc kế tiếp chưa đạt (null khi đã qua hết). */
export function nextTier(points: number, tiers: readonly Tier[] = TIERS): Tier | null {
  return tiers.find((t) => points < t.points) ?? null;
}

export function readyTiers(ledger: Ledger, tiers: readonly Tier[] = TIERS): Tier[] {
  const pts = pointsOf(ledger);
  return tiers.filter((t) => tierState(ledger, t, pts) === 'ready');
}
