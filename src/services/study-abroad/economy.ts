import { STUDY_ABROAD_MISSIONS } from '@/data/study-abroad-campaign';
import type { DormDecoration } from '@/data/study-abroad-dorm';
import { STUDY_DAYS } from '@/data/study-abroad-schedule';
import { ledgerAdd, ledgerSum, type Ledger } from '@/services/travel/economy';

/** Mọi con số của lớp tiền riêng ở một chỗ. Đổi ở đây, test canh theo đây. */
export const STUDY_PAY = {
  payPerCorrect: 10,
  questionsPerShift: 4,
  /** Đạt từ bấy nhiêu câu đúng trở lên thì ca được trả lương. */
  passAt: 3,
  shiftsPerDay: 2,
  rentPerWeek: 30,
  daysPerWeek: 7,
} as const;

/** Căn hộ Singapore: mở sau nhiệm vụ đầu tiên; tiền thuê tính từ lúc đó. */
export const SG_APARTMENT = { city: 'singapore', unlockMission: 'arrival' } as const;

export const PAY_PREFIX = 'pay:';
const SHIFT_PREFIX = 'pay:shift:';
const RENT_PREFIX = 'pay:rent:';
const BUY_PREFIX = 'pay:buy:';

export type BuyCheck = 'ok' | 'owned' | 'rent-unpaid' | 'poor';
export type ShiftReason = 'paid' | 'failed' | 'full' | 'duplicate';

const has = (ledger: Ledger, id: string) => Object.prototype.hasOwnProperty.call(ledger, id);

export function balanceOf(ledger: Ledger): number {
  return Math.max(0, ledgerSum(ledger, PAY_PREFIX));
}

/** Ngày học hiện tại = ngày chứa nhiệm vụ chưa làm đầu tiên; làm hết thì là ngày cuối. */
export function currentStudyDay(completed: readonly string[]): number {
  const next = STUDY_ABROAD_MISSIONS.find((mission) => !completed.includes(mission.id));
  if (!next) return STUDY_DAYS.length;
  return STUDY_DAYS.find((day) => day.missions.some((mission) => mission.id === next.id))?.day ?? 1;
}

export function shiftPay(correct: number): number {
  return correct >= STUDY_PAY.passAt ? correct * STUDY_PAY.payPerCorrect : 0;
}

/**
 * Khoá hạn ca. Trong chiến dịch hạn tính theo ngày học (số ngày học). Xong chiến dịch
 * không còn ngày học nào để mở thêm, nên hạn tính theo ngày lịch `today`: mỗi ngày lịch
 * lại có 2 ca được trả.
 */
export function shiftDayKey(completed: readonly string[], today: string): string {
  const campaignDone = STUDY_ABROAD_MISSIONS.every((mission) => completed.includes(mission.id));
  return campaignDone ? `post:${today}` : String(currentStudyDay(completed));
}

export function shiftsOnDay(ledger: Ledger, dayKey: string): number {
  const prefix = `${SHIFT_PREFIX}${dayKey}:`;
  return Object.keys(ledger).filter((id) => id.startsWith(prefix)).length;
}

/**
 * Ghi một ca đã làm. `attemptId` sinh MỘT lần khi bắt đầu ca, nên nộp lại cùng ca
 * trả về `duplicate` và không trả thêm. Ca trượt không ghi sổ, nên làm lại được.
 */
export function recordShift(ledger: Ledger, dayKey: string, attemptId: string, correct: number): { ledger: Ledger; paid: number; reason: ShiftReason } {
  const id = `${SHIFT_PREFIX}${dayKey}:${attemptId}`;
  if (has(ledger, id)) return { ledger, paid: 0, reason: 'duplicate' };
  const pay = shiftPay(correct);
  if (pay === 0) return { ledger, paid: 0, reason: 'failed' };
  if (shiftsOnDay(ledger, dayKey) >= STUDY_PAY.shiftsPerDay) return { ledger, paid: 0, reason: 'full' };
  return { ledger: ledgerAdd(ledger, id, pay), paid: pay, reason: 'paid' };
}

export function weekOf(day: number): number {
  return Math.floor((day - 1) / STUDY_PAY.daysPerWeek);
}

/** Các tuần còn nợ tiền thuê của căn hộ, từ tuần đầu đến tuần của ngày học hiện tại. */
export function rentOwed(ledger: Ledger, city: string, day: number): number[] {
  const owed: number[] = [];
  for (let week = 0; week <= weekOf(day); week++) {
    if (!has(ledger, `${RENT_PREFIX}${city}:${week}`)) owed.push(week);
  }
  return owed;
}

/**
 * Trừ tiền thuê các tuần còn nợ, tuần cũ trước. Thiếu tiền thì dừng và để nợ,
 * không bao giờ đẩy số dư xuống âm.
 */
export function settleRent(ledger: Ledger, city: string, day: number): Ledger {
  let next = ledger;
  for (const week of rentOwed(ledger, city, day)) {
    if (balanceOf(next) < STUDY_PAY.rentPerWeek) break;
    next = ledgerAdd(next, `${RENT_PREFIX}${city}:${week}`, -STUDY_PAY.rentPerWeek);
  }
  return next;
}

/** Thanh toán tiền thuê căn hộ trước mọi thao tác dựa vào số dư. Chưa mở căn hộ thì không tính gì. */
export function settleApartmentRent(ledger: Ledger, completed: readonly string[]): Ledger {
  if (!completed.includes(SG_APARTMENT.unlockMission)) return ledger;
  return settleRent(ledger, SG_APARTMENT.city, currentStudyDay(completed));
}

export function owns(ledger: Ledger, itemId: string): boolean {
  return has(ledger, `${BUY_PREFIX}${itemId}`);
}

export function checkBuy(ledger: Ledger, city: string, day: number, item: DormDecoration): BuyCheck {
  if (owns(ledger, item.id)) return 'owned';
  if (rentOwed(ledger, city, day).length > 0) return 'rent-unpaid';
  if (balanceOf(ledger) < (item.price ?? 0)) return 'poor';
  return 'ok';
}

export function buy(ledger: Ledger, item: DormDecoration): Ledger {
  return ledgerAdd(ledger, `${BUY_PREFIX}${item.id}`, -(item.price ?? 0));
}

/** Món được đặt khi đã mở bằng nhiệm vụ và, nếu có giá, đã mua. */
export function canEquip(item: DormDecoration, completed: readonly string[], ledger: Ledger): boolean {
  if (item.unlockMission && !completed.includes(item.unlockMission)) return false;
  if (item.price && !owns(ledger, item.id)) return false;
  return true;
}
