/**
 * VÒNG PHÂN PHỐI của màn Học — lịch gặp lại từng từ trong một buổi. Hàm thuần.
 *
 * Mỗi từ trong vòng có một MỨC (0 → mức xong). Mỗi lần gặp là một câu:
 *
 * - LẬT THẺ chỉ là lần gặp đầu (nếu đang bật): tự đánh giá thì không tính là
 *   bằng chứng, nên không lên mức — "đã biết" gặp lại sau 2 câu, "chưa nhớ" sau 1.
 * - ĐÚNG → lên một mức và GẶP LẠI sau 2 × mức câu (2, rồi 4…): làm đúng rồi cũng
 *   quay lại, cách xa dần, cho tới khi đủ mức.
 * - SAI → tụt một mức, gặp lại SỚM (sau 2 câu) bằng dạng DỄ HƠN.
 * - Lần cuối để xong một từ luôn là dạng KHÓ NHẤT đang bật (thường là gõ từ):
 *   nhận ra được chưa có nghĩa là viết được.
 *
 * XEN KẼ (mặc định): trong phạm vi dạng hợp với mức của từ, câu sau luôn cố khác
 * dạng câu trước; từ mới đưa vào dần xen giữa các lần gặp lại, không dồn một dãy
 * thẻ lật ở đầu. TUẦN TỰ: mỗi từ đi đúng thứ tự trắc nghiệm → điền câu → gõ từ.
 */
import { activeKinds, type StageKind } from './topic-study';

/** Các dạng luyện (không tính lật thẻ), từ dễ tới khó. */
export const PRACTICE_ORDER: readonly StageKind[] = ['mcq', 'fill', 'type'];

/** Sai thì gặp lại sau bấy nhiêu câu. */
export const GAP_WRONG = 2;
/** Đúng và vừa lên mức `level` thì gặp lại sau `GAP_STEP × level` câu. */
export const GAP_STEP = 2;

export type LoopOptions = {
  kinds: readonly StageKind[];
  interleave: boolean;
  /** Từ này có câu ví dụ khoét được chỗ trống không — không có thì bỏ dạng điền câu. */
  canFill: (word: string) => boolean;
};

export type Slot = {
  word: string;
  level: number;
  /** Đến hạn ở câu thứ mấy của vòng. */
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
};

/** `retry`: vừa sai, đang hỏi lại · `review`: đã làm đúng, gặp lại cho nhớ lâu. */
export type LoopTag = 'retry' | 'review' | null;
export type LoopItem = { word: string; kind: StageKind; tag: LoopTag };

export function startLoop(words: readonly { word: string }[]): LoopState {
  return { now: 0, slots: [], pending: words.map((w) => w.word), lastKind: null, lastWord: null };
}

function practiceKinds(o: LoopOptions, word: string): StageKind[] {
  const on = activeKinds(o.kinds);
  return PRACTICE_ORDER.filter((k) => on.includes(k) && (k !== 'fill' || o.canFill(word)));
}

/** Số lần làm đúng (giãn cách) để xong một từ: bằng số dạng luyện đang bật, ít nhất 2. */
export function doneLevel(o: LoopOptions, word: string): number {
  const n = practiceKinds(o, word).length;
  return n === 0 ? 2 : Math.max(2, n);
}

function newSlot(word: string): Slot {
  return { word, level: 0, due: 0, seen: 0, correct: 0, lapses: 0, lastKind: null, lastOk: null, done: false };
}

/** Băm ngắn để xoay vòng dạng câu theo từ — cùng trạng thái luôn ra cùng câu. */
function spin(word: string): number {
  let h = 0;
  for (let i = 0; i < word.length; i += 1) h = (h * 31 + word.charCodeAt(i)) >>> 0;
  return h;
}

/** Dạng câu cho lần gặp này của một từ. */
export function kindFor(slot: Slot, state: LoopState, o: LoopOptions): StageKind {
  const on = activeKinds(o.kinds);
  if (slot.seen === 0 && on.includes('flash')) return 'flash';
  const list = practiceKinds(o, slot.word);
  if (list.length === 0) return 'flash';
  const done = doneLevel(o, slot.word);
  if (!o.interleave) return list[Math.min(slot.level, list.length - 1)]!;

  const hardest = list[list.length - 1]!;
  let pool: StageKind[];
  if (slot.lastOk === false || slot.level === 0) pool = list.slice(0, 2);
  else if (slot.level >= done - 1) pool = [hardest];
  else pool = list;

  const fresh = pool.filter((k) => k !== state.lastKind && k !== slot.lastKind);
  const varied = fresh.length > 0 ? fresh : pool.filter((k) => k !== state.lastKind);
  const choices = varied.length > 0 ? varied : pool;
  return choices[(spin(slot.word) + slot.seen + state.now) % choices.length]!;
}

function tagOf(slot: Slot): LoopTag {
  if (slot.lastOk === false) return 'retry';
  return slot.correct > 0 ? 'review' : null;
}

/** Câu sẽ hỏi tiếp theo; null khi vòng đã xong. Hàm thuần — gọi mỗi lần render đều ra cùng một câu. */
export function pickNext(state: LoopState, o: LoopOptions): LoopItem | null {
  const active = state.slots.filter((s) => !s.done);
  const fresh = state.pending[0];
  const byDue = (a: Slot, b: Slot) => a.due - b.due || b.lapses - a.lapses;
  const item = (s: Slot): LoopItem => ({ word: s.word, kind: kindFor(s, state, o), tag: tagOf(s) });

  const due = active
    .filter((s) => s.due <= state.now && (s.word !== state.lastWord || (active.length === 1 && !fresh)))
    .sort(byDue);
  if (due.length > 0) {
    // Trong các câu đến hạn, ưu tiên câu khác dạng câu vừa làm.
    const items = due.map(item);
    return items.find((i) => i.kind !== state.lastKind) ?? items[0]!;
  }

  if (fresh) {
    const intro = item(newSlot(fresh));
    // Vừa lật thẻ xong thì kéo một từ đang học lên trước, không lật thêm thẻ liền.
    if (intro.kind === 'flash' && state.lastKind === 'flash') {
      const pull = active.filter((s) => s.word !== state.lastWord).sort(byDue)[0];
      if (pull) return item(pull);
    }
    return intro;
  }

  // Chưa câu nào đến hạn và hết từ mới: hỏi câu gần hạn nhất, tránh lặp từ vừa hỏi.
  const rest = active.filter((s) => s.word !== state.lastWord).sort(byDue);
  const pick = rest[0] ?? active[0];
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
    next = { ...slot, level, seen: slot.seen + 1, correct: slot.correct + 1, lastKind: head.kind, lastOk: true, done, due: done ? Number.POSITIVE_INFINITY : now + GAP_STEP * level };
  } else {
    next = { ...slot, level: Math.max(0, slot.level - 1), seen: slot.seen + 1, lapses: slot.lapses + 1, lastKind: head.kind, lastOk: false, due: now + GAP_WRONG };
  }

  const slots = existing ? state.slots.map((s) => (s.word === head.word ? next : s)) : [...state.slots, next];
  return { now, slots, pending, lastKind: head.kind, lastWord: head.word };
}

/** Phần đã đi của một từ (0–1) cho thanh đoạn: lật thẻ xong nhích một chút, mỗi mức một phần. */
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
