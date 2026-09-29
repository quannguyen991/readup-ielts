/**
 * KINH TẾ VẬT LIỆU của Thành Phố Tri Thức — logic thuần, không phụ thuộc
 * renderer hay thiết bị: học trên điện thoại vẫn cộng vật liệu, mở máy tính
 * thấy đủ (xem `useCityStore.earn`, gọi ở `useGameStore` chứ không ở màn 3D).
 *
 * Nguồn vật liệu (đặc tả 29/09/2026):
 * - Gỗ  ← câu từ vựng đúng ở lần thử đầu (`answer(ok, 'vocab')`).
 * - Đá  ← nộp bài Reading (`awardBatch(…, 'read')`), theo số câu đúng.
 * - Gạch ← câu luyện nghe đúng ở lần thử đầu (`answer(ok, 'listen')`).
 * - Thép ← bài thi thử đầy đủ hoặc bài Writing đã được chấm (có mã sự kiện).
 * - Kính ← mốc chuỗi ngày học 7 / 14 / 30.
 *
 * Mọi con số nằm trong `ECONOMY` dưới đây — cân chỉnh ở một chỗ, không rải
 * vào màn hình.
 *
 * Chống cộng trùng:
 * - Câu có `key`: chỉ LẦN GẶP ĐẦU TIÊN trong ngày (giờ VN) được xét; đúng mới
 *   có vật liệu. Gặp lại (mở lại, tải lại, làm lại) không thưởng thêm.
 * - Bài nộp / thi thử / Writing / mốc chuỗi: có mã sự kiện, lưu trong
 *   `awarded` — mã đã có thì bỏ qua.
 * - Câu tự chấm (lật thẻ, "tôi đọc giống mẫu"): 0 vật liệu, không tính ca.
 *
 * CA LÀM VIỆC: cứ `answersPerShift` câu được chấm hợp lệ → 1 ca; mỗi bài có thao
 * tác nộp và được chấm → 1 ca. Ca vào "kho ca" để đội thi công dùng — thời gian
 * trôi không tự sinh ca.
 */
import { EMPTY_MATERIALS, type MaterialKind, type Materials } from './materials';

export const ECONOMY = {
  /** Nguồn `answer()` → vật liệu. Nguồn không có ở đây: không ra vật liệu (vẫn tính ca). */
  answer: {
    vocab: { kind: 'wood', amount: 1 },
    listen: { kind: 'brick', amount: 1 },
    listening: { kind: 'brick', amount: 1 },
  } as Record<string, { kind: MaterialKind; amount: number }>,
  /** Nộp bài Reading: đá theo số câu đúng. */
  reading: { kind: 'stone' as MaterialKind, perCorrect: 1 },
  mockTest: { kind: 'steel' as MaterialKind, amount: 8 },
  writingGraded: { kind: 'steel' as MaterialKind, amount: 5 },
  /** Mốc chuỗi ngày → số kính. */
  streak: { 7: 4, 14: 6, 30: 12 } as Record<number, number>,
  /** Trần mỗi ngày (giờ VN) cho từng loại. */
  dailyCap: { wood: 60, stone: 40, brick: 60, steel: 24, glass: 22 } as Materials,
  shift: {
    /** Số câu được chấm hợp lệ để thành 1 ca. */
    answersPerShift: 10,
    /** Trần ca mỗi ngày — học bù nhiều hôm sau không thành cả tuần công. */
    maxPerDay: 12,
    /** Ca chưa dùng giữ tối đa bao nhiêu. */
    maxBank: 30,
  },
  /** Giữ mã sự kiện đã thưởng bao nhiêu ngày. */
  keepAwardedDays: 400,
} as const;

export type EconomyState = {
  inventory: Materials;
  /** Vật liệu đã nhận trong ngày (để tính trần). */
  daily: { day: string; earned: Materials; shifts: number } | null;
  /** Mã sự kiện đã thưởng → ngày thưởng. */
  awarded: Record<string, string>;
  /** Câu đã gặp hôm nay: key → đúng/sai ở lần đầu. */
  seen: { day: string; keys: Record<string, boolean> } | null;
  /** Số câu hợp lệ đang dồn tới ca kế. */
  shiftCounter: number;
  /** Ca đã có, chưa dùng. */
  shiftBank: number;
};

export const EMPTY_ECONOMY: EconomyState = {
  inventory: { ...EMPTY_MATERIALS },
  daily: null,
  awarded: {},
  seen: null,
  shiftCounter: 0,
  shiftBank: 0,
};

export type StudyEvent =
  | { type: 'answer'; source: string; correct: boolean; key?: string; selfGraded?: boolean }
  | { type: 'submission'; source: string; id: string; correct: number; total: number }
  | { type: 'mock_test'; id: string }
  | { type: 'writing_graded'; id: string }
  | { type: 'streak'; streakDays: number; streakStart: string };

export type EconomyResult = {
  state: EconomyState;
  /** Vật liệu thực nhận (sau trần). */
  gained: Partial<Materials>;
  /** Số ca mới. */
  shifts: number;
  /** Vì sao không nhận (để test và gỡ lỗi). */
  note?: 'self_graded' | 'wrong' | 'repeat' | 'duplicate' | 'capped' | 'no_material' | 'invalid';
};

function book(state: EconomyState, day: string) {
  return state.daily && state.daily.day === day ? state.daily : { day, earned: { ...EMPTY_MATERIALS }, shifts: 0 };
}

/** Cộng vật liệu có trần ngày. */
function grant(state: EconomyState, day: string, kind: MaterialKind, amount: number) {
  const d = book(state, day);
  const room = Math.max(0, ECONOMY.dailyCap[kind] - d.earned[kind]);
  const got = Math.min(room, Math.max(0, Math.floor(amount)));
  return {
    got,
    inventory: got > 0 ? { ...state.inventory, [kind]: state.inventory[kind] + got } : state.inventory,
    daily: { ...d, earned: { ...d.earned, [kind]: d.earned[kind] + got } },
  };
}

/** Thêm ca có trần ngày + trần kho. */
function addShifts(state: EconomyState, day: string, n: number, dailyBook = book(state, day)) {
  const room = Math.max(0, ECONOMY.shift.maxPerDay - dailyBook.shifts);
  const bankRoom = Math.max(0, ECONOMY.shift.maxBank - state.shiftBank);
  const got = Math.min(n, room, bankRoom);
  return { got, bank: state.shiftBank + got, daily: { ...dailyBook, shifts: dailyBook.shifts + got } };
}

/** Bỏ mã sự kiện quá cũ để dữ liệu không phình vô hạn. */
export function pruneAwarded(awarded: Record<string, string>, day: string): Record<string, string> {
  const limit = shiftDay(day, -ECONOMY.keepAwardedDays);
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(awarded)) if (v >= limit) out[k] = v;
  return out;
}

export function shiftDay(day: string, delta: number): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

/**
 * Xử lý một sự kiện học. `day` là khoá ngày giờ Việt Nam
 * (`vnToday(now).key` trong `services/gamification/golden.ts`).
 */
export function resolveEconomy(state: EconomyState, event: StudyEvent, day: string): EconomyResult {
  switch (event.type) {
    case 'answer': {
      if (event.selfGraded) return { state, gained: {}, shifts: 0, note: 'self_graded' };
      // Lần thử đầu: câu có key chỉ được xét ở lần gặp đầu trong ngày.
      const seen = state.seen && state.seen.day === day ? state.seen : { day, keys: {} };
      let firstTry = true;
      let nextSeen = seen;
      if (event.key) {
        const k = `${event.source}:${event.key}`;
        if (k in seen.keys) firstTry = false;
        else nextSeen = { day, keys: { ...seen.keys, [k]: event.correct } };
      }
      // Câu chấm hợp lệ nào cũng dồn vào ca.
      let counter = state.shiftCounter + 1;
      let newShifts = 0;
      let daily = book(state, day);
      let bank = state.shiftBank;
      if (counter >= ECONOMY.shift.answersPerShift) {
        counter -= ECONOMY.shift.answersPerShift;
        const s = addShifts(state, day, 1, daily);
        newShifts = s.got;
        bank = s.bank;
        daily = s.daily;
      }
      let next: EconomyState = { ...state, seen: nextSeen, shiftCounter: counter, shiftBank: bank, daily };
      const rule = ECONOMY.answer[event.source];
      if (!event.correct) return { state: next, gained: {}, shifts: newShifts, note: 'wrong' };
      if (!firstTry) return { state: next, gained: {}, shifts: newShifts, note: 'repeat' };
      if (!rule) return { state: next, gained: {}, shifts: newShifts, note: 'no_material' };
      const g = grant(next, day, rule.kind, rule.amount);
      next = { ...next, inventory: g.inventory, daily: g.daily };
      return { state: next, gained: g.got > 0 ? { [rule.kind]: g.got } : {}, shifts: newShifts, note: g.got > 0 ? undefined : 'capped' };
    }

    case 'submission': {
      if (!event.id || event.total <= 0) return { state, gained: {}, shifts: 0, note: 'invalid' };
      const id = `submit:${event.source}:${event.id}`;
      if (state.awarded[id]) return { state, gained: {}, shifts: 0, note: 'duplicate' };
      let next: EconomyState = { ...state, awarded: { ...pruneAwarded(state.awarded, day), [id]: day } };
      const s = addShifts(next, day, 1);
      next = { ...next, shiftBank: s.bank, daily: s.daily };
      const gained: Partial<Materials> = {};
      if (event.source === 'read' || event.source === 'reading') {
        const g = grant(next, day, ECONOMY.reading.kind, Math.max(0, event.correct) * ECONOMY.reading.perCorrect);
        next = { ...next, inventory: g.inventory, daily: g.daily };
        if (g.got > 0) gained[ECONOMY.reading.kind] = g.got;
      }
      return { state: next, gained, shifts: s.got };
    }

    case 'mock_test':
    case 'writing_graded': {
      if (!event.id) return { state, gained: {}, shifts: 0, note: 'invalid' };
      const id = `${event.type}:${event.id}`;
      if (state.awarded[id]) return { state, gained: {}, shifts: 0, note: 'duplicate' };
      const rule = event.type === 'mock_test' ? ECONOMY.mockTest : ECONOMY.writingGraded;
      let next: EconomyState = { ...state, awarded: { ...pruneAwarded(state.awarded, day), [id]: day } };
      const s = addShifts(next, day, 1);
      next = { ...next, shiftBank: s.bank, daily: s.daily };
      const g = grant(next, day, rule.kind, rule.amount);
      next = { ...next, inventory: g.inventory, daily: g.daily };
      return { state: next, gained: g.got > 0 ? { [rule.kind]: g.got } : {}, shifts: s.got, note: g.got > 0 ? undefined : 'capped' };
    }

    case 'streak': {
      let next = state;
      const gained: Partial<Materials> = {};
      for (const [m, amount] of Object.entries(ECONOMY.streak)) {
        const mark = Number(m);
        if (event.streakDays < mark || !event.streakStart) continue;
        // Mỗi mốc của MỘT chuỗi chỉ thưởng một lần; chuỗi mới (ngày bắt đầu khác) thì tính lại.
        const id = `streak:${mark}:${event.streakStart}`;
        if (next.awarded[id]) continue;
        next = { ...next, awarded: { ...pruneAwarded(next.awarded, day), [id]: day } };
        const g = grant(next, day, 'glass', amount);
        next = { ...next, inventory: g.inventory, daily: g.daily };
        if (g.got > 0) gained.glass = (gained.glass ?? 0) + g.got;
      }
      return { state: next, gained, shifts: 0, note: Object.keys(gained).length ? undefined : 'duplicate' };
    }
  }
}

/** Đã nhận / trần trong ngày của một loại — cho màn "Học để nhận". */
export function dailyProgress(state: EconomyState, day: string, kind: MaterialKind): { got: number; cap: number } {
  const d = state.daily && state.daily.day === day ? state.daily.earned[kind] : 0;
  return { got: d, cap: ECONOMY.dailyCap[kind] };
}

/** Ngày bắt đầu của chuỗi đang có, để làm mã mốc chuỗi. */
export function streakStartDay(today: string, streakDays: number): string {
  return shiftDay(today, -(Math.max(1, streakDays) - 1));
}
