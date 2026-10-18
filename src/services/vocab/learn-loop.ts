/**
 * VÒNG PHÂN PHỐI của màn Học — lịch gặp lại từng từ trong một buổi. Hàm thuần: cùng trạng
 * thái (kể cả hạt giống `seed`) luôn ra cùng câu tiếp theo.
 *
 * Quy tắc (viết lại 18/10/2026 theo yêu cầu người học):
 *
 * - MỞ TỪ: từ mới được giới thiệu bằng LẬT THẺ trước (vd. `academic`), không tính điểm.
 *   Từ mới chỉ được mở khi KHÔNG có câu nào đến hạn, để khoảng cách hỏi lại không bị rút ngắn.
 * - BẬC CÂU HỎI: trắc nghiệm nghĩa → điền ABCD vào chỗ trống → gõ từ (dạng khó nhất sau cùng).
 *   Từ nào thiếu câu ví dụ có chỗ trống thì bỏ bậc điền, đi thẳng trắc nghiệm → gõ.
 * - ĐÚNG → lên một bậc và được HỎI LẠI sau `RIGHT_GAP` câu, bậc càng cao càng xa
 *   (8, 12, 16…). Làm đúng rồi vẫn quay lại cho tới khi đủ số lần đúng để xong từ.
 * - SAI → tụt một bậc và được HỎI LẠI sau 5 hoặc 6 câu. Sai lần thứ hai thì lùi thành
 *   7 hoặc 8 câu, lần thứ ba trở đi là 9 hoặc 10 câu.
 * - KHÔNG LẶP NGUYÊN CÂU: lần gặp lại của một từ đổi sang dạng khác với lần trước nếu
 *   còn dạng khác; các phương án luôn được xáo lại (learn.tsx đổi hạt giống theo số câu).
 * - Hai câu liền nhau không cùng một từ khi còn ít nhất ba từ chưa xong. Các câu đến hạn được
 *   xáo theo hạt giống của vòng, không theo thứ tự cố định.
 * - GIỚI HẠN: vòng 10 từ chỉ đủ người để cách nhau khi còn nhiều từ đang học. Khi chỉ còn
 *   vài từ chưa xong, không còn đủ từ khác để chèn vào, nên khoảng cách hỏi lại phải rút ngắn.
 *
 * Tuần tự (`interleave: false`): mỗi từ đi đúng bậc, không đổi dạng theo câu trước.
 */
import { activeKinds, type StageKind } from './topic-study';

/** Các dạng luyện (không tính lật thẻ), từ dễ tới khó. */
export const PRACTICE_ORDER: readonly StageKind[] = ['mcq', 'fill', 'type'];

/** Sai lần đầu thì hỏi lại sau bấy nhiêu câu (5 hoặc 6). */
export const WRONG_GAP = 5;
/**
 * Đúng thì hỏi lại sau `RIGHT_GAP` câu khi vừa lên bậc 1; mỗi bậc sau thêm `RIGHT_GAP_STEP`,
 * cộng thêm 0–2 câu xáo theo hạt giống để nhịp hỏi lại không cứng.
 */
export const RIGHT_GAP = 8;
export const RIGHT_GAP_STEP = 4;
/** Quá hạn bấy nhiêu câu thì được ưu tiên trước mọi câu khác. */
const OVERDUE = 3;

export type LoopOptions = {
  kinds: readonly StageKind[];
  interleave: boolean;
  /** Từ này có câu ví dụ khoét được chỗ trống không — không có thì bỏ dạng điền câu. */
  canFill: (word: string) => boolean;
};

export type Slot = {
  word: string;
  level: number;
  /** Đến hạn khi số câu đã trả lời đạt mức này. */
  due: number;
  seen: number;
  /** Số câu luyện làm đúng (không tính lật thẻ). */
  correct: number;
  lapses: number;
  lastKind: StageKind | null;
  lastOk: boolean | null;
  done: boolean;
};

export type LoopState = {
  /** Số câu đã trả lời trong vòng. */
  now: number;
  slots: Slot[];
  /** Từ chưa đưa vào vòng, theo thứ tự. */
  pending: string[];
  lastKind: StageKind | null;
  lastWord: string | null;
  /** Hạt giống xáo trộn của vòng: đổi hạt giống là đổi thứ tự câu đến hạn. */
  seed: number;
};

/** `retry`: vừa sai, đang hỏi lại · `review`: đã làm đúng, gặp lại cho nhớ lâu. */
export type LoopTag = 'retry' | 'review' | null;
export type LoopItem = { word: string; kind: StageKind; tag: LoopTag };

export function startLoop(words: readonly { word: string }[], seed = 1): LoopState {
  return { now: 0, slots: [], pending: words.map((w) => w.word), lastKind: null, lastWord: null, seed };
}

/** Băm chuỗi ra số nguyên không âm (FNV-1a). Dùng cho mọi "ngẫu nhiên" của vòng, nên luôn lặp lại được. */
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

function mix(...parts: readonly (string | number)[]): number {
  return hash(parts.join('|'));
}

function practiceKinds(o: LoopOptions, word: string): StageKind[] {
  const on = activeKinds(o.kinds);
  return PRACTICE_ORDER.filter((k) => on.includes(k) && (k !== 'fill' || o.canFill(word)));
}

/** Số lần làm đúng để xong một từ: bằng số dạng luyện đang bật, ít nhất 2. */
export function doneLevel(o: LoopOptions, word: string): number {
  const n = practiceKinds(o, word).length;
  return n === 0 ? 2 : Math.max(2, n);
}

/** Số câu phải chờ trước khi hỏi lại một từ vừa sai lần thứ `lapses`. */
export function wrongGap(word: string, lapses: number, seed: number): number {
  const band = Math.min(Math.max(lapses, 1), 3) - 1;
  return WRONG_GAP + 2 * band + (mix(seed, word, lapses, 'gap') % 2);
}

/** Số câu phải chờ sau một lần đúng, khi từ vừa lên bậc `level` (≥ 1). */
export function rightGap(level: number, word: string, seed: number): number {
  return RIGHT_GAP + RIGHT_GAP_STEP * Math.max(0, level - 1) + (mix(seed, word, level, 'right') % 3);
}

function newSlot(word: string): Slot {
  return { word, level: 0, due: 0, seen: 0, correct: 0, lapses: 0, lastKind: null, lastOk: null, done: false };
}

/** Dạng câu cho lần gặp này của một từ. Hàm thuần theo `slot` và `state`. */
export function kindFor(slot: Slot, state: LoopState, o: LoopOptions): StageKind {
  const on = activeKinds(o.kinds);
  if (slot.seen === 0 && on.includes('flash')) return 'flash';
  const list = practiceKinds(o, slot.word);
  if (list.length === 0) return 'flash';
  const level = Math.min(slot.level, list.length - 1);
  const want = list[level]!;
  // Tuần tự: mỗi từ đi đúng bậc, không đổi dạng theo câu trước.
  if (!o.interleave) return want;
  // Không hỏi lại đúng dạng vừa hỏi nếu còn dạng khác: chọn dạng gần bậc hiện tại nhất.
  if (want !== slot.lastKind) return want;
  const others = list
    .filter((k) => k !== slot.lastKind)
    .sort((a, b) => Math.abs(list.indexOf(a) - level) - Math.abs(list.indexOf(b) - level));
  return others[0] ?? want;
}

function tagOf(slot: Slot): LoopTag {
  if (slot.lastOk === false) return 'retry';
  return slot.correct > 0 ? 'review' : null;
}

const byDue = (a: Slot, b: Slot) => a.due - b.due || b.lapses - a.lapses;

/** Câu sẽ hỏi tiếp theo; null khi vòng đã xong. Hàm thuần — gọi mỗi lần render đều ra cùng một câu. */
export function pickNext(state: LoopState, o: LoopOptions): LoopItem | null {
  const active = state.slots.filter((s) => !s.done);
  const fresh = state.pending[0];
  const item = (s: Slot): LoopItem => ({ word: s.word, kind: kindFor(s, state, o), tag: tagOf(s) });

  // 1) Câu đến hạn. Từ vừa hỏi không hỏi liền, trừ khi chỉ còn nó.
  const onlyLast = active.length === 1 && !fresh;
  const due = active.filter((s) => s.due <= state.now && (s.word !== state.lastWord || onlyLast));
  if (due.length > 0) {
    const late = due.filter((s) => s.due <= state.now - OVERDUE).sort(byDue);
    let pool = late.length > 0 ? late : due;
    const differentKind = pool.filter((s) => kindFor(s, state, o) !== state.lastKind);
    if (differentKind.length > 0) pool = differentKind;
    // Quá hạn thì làm trước theo thứ tự hạn; còn lại xáo ngẫu nhiên theo hạt giống.
    const chosen = late.length > 0 ? pool[0]! : pool[mix(state.seed, state.now, 'due') % pool.length]!;
    return item(chosen);
  }

  // 2) Mở từ mới. Vừa lật thẻ xong thì kéo một câu sắp đến hạn lên trước (không lật thêm thẻ liền).
  if (fresh) {
    const intro = item(newSlot(fresh));
    if (intro.kind === 'flash' && state.lastKind === 'flash') {
      const soon = active.filter((s) => s.word !== state.lastWord && s.due <= state.now + 2).sort(byDue)[0];
      if (soon) return item(soon);
    }
    return intro;
  }

  // 3) Chưa câu nào đến hạn: hỏi câu gần hạn nhất, tránh lặp từ vừa hỏi.
  const rest = active.filter((s) => s.word !== state.lastWord).sort(byDue);
  const pick = rest[0] ?? [...active].sort(byDue)[0];
  return pick ? item(pick) : null;
}

/** Trạng thái hiện tại của một từ trong vòng (từ chưa đưa vào thì là ô trống). */
export function slotOf(state: LoopState, word: string): Slot {
  return state.slots.find((s) => s.word === word) ?? newSlot(word);
}

/** Câu trả lời này (đúng) có làm xong từ không — để ghi "đã nhớ" đúng lúc. */
export function finishesWord(state: LoopState, head: LoopItem, correct: boolean, o: LoopOptions): boolean {
  if (!correct || head.kind === 'flash') return false;
  return slotOf(state, head.word).level + 1 >= doneLevel(o, head.word);
}

/** Chấm câu hiện tại (= `pickNext`) và xếp lịch gặp lại. */
export function answerLoop(state: LoopState, correct: boolean, o: LoopOptions): LoopState {
  const head = pickNext(state, o);
  if (!head) return state;
  const existing = state.slots.find((s) => s.word === head.word);
  const slot = existing ?? newSlot(head.word);
  const pending = !existing && state.pending[0] === head.word ? state.pending.slice(1) : state.pending;
  const now = state.now + 1;

  let next: Slot;
  if (head.kind === 'flash') {
    next = { ...slot, seen: slot.seen + 1, lastKind: 'flash', due: now + (correct ? 2 : 1) };
  } else if (correct) {
    const level = slot.level + 1;
    const done = level >= doneLevel(o, head.word);
    next = {
      ...slot,
      level,
      seen: slot.seen + 1,
      correct: slot.correct + 1,
      lastKind: head.kind,
      lastOk: true,
      done,
      due: done ? Number.POSITIVE_INFINITY : now + rightGap(level, head.word, state.seed),
    };
  } else {
    const lapses = slot.lapses + 1;
    next = {
      ...slot,
      level: Math.max(0, slot.level - 1),
      seen: slot.seen + 1,
      lapses,
      lastKind: head.kind,
      lastOk: false,
      due: now + wrongGap(head.word, lapses, state.seed),
    };
  }

  const slots = existing ? state.slots.map((s) => (s.word === head.word ? next : s)) : [...state.slots, next];
  return { ...state, now, slots, pending, lastKind: head.kind, lastWord: head.word };
}

/** Phần đã đi của một từ (0–1) cho thanh đoạn: lật thẻ xong nhích một chút, mỗi bậc một phần. */
export function loopFraction(state: LoopState, word: string, o: LoopOptions): number {
  const s = state.slots.find((x) => x.word === word);
  if (!s) return 0;
  if (s.done) return 1;
  const f = s.level / doneLevel(o, word);
  return s.seen > 0 ? Math.max(0.12, f) : f;
}

export function loopDone(state: LoopState): boolean {
  return state.pending.length === 0 && state.slots.every((s) => s.done);
}
