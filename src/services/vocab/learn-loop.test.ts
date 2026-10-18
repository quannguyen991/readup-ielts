import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  answerLoop,
  doneLevel,
  finishesWord,
  kindFor,
  loopDone,
  loopFraction,
  pickNext,
  slotOf,
  startLoop,
  SPACING,
  type LoopItem,
  type LoopOptions,
  type LoopState,
} from './learn-loop';

const words = ['a', 'b', 'c', 'd', 'e', 'f'].map((word) => ({ word }));
const ALL: LoopOptions = { kinds: ['flash', 'mcq', 'fill', 'type'], interleave: true, canFill: () => true };

/** Chạy cả vòng; `answer` quyết định đúng/sai từng câu. Trả về dãy câu đã hỏi. */
function run(
  o: LoopOptions,
  answer: (item: LoopItem, i: number) => boolean = () => true,
  list = words,
  seed = 1,
) {
  let s: LoopState = startLoop(list, seed);
  const asked: LoopItem[] = [];
  /** Số từ còn chưa xong ngay trước mỗi câu (kể cả từ chưa đưa vào). */
  const open: number[] = [];
  for (let i = 0; i < 500; i += 1) {
    const item = pickNext(s, o);
    if (!item) break;
    asked.push(item);
    open.push(s.pending.length + s.slots.filter((x) => !x.done).length);
    s = answerLoop(s, answer(item, i), o);
  }
  return { s, asked, open };
}

test('không sai câu nào: vòng vẫn xong, mỗi từ gặp lật thẻ + đủ số lần làm đúng', () => {
  const { s, asked } = run(ALL);
  assert.ok(loopDone(s));
  for (const { word } of words) {
    const mine = asked.filter((x) => x.word === word);
    assert.equal(mine[0]!.kind, 'flash', `${word}: lần gặp đầu là lật thẻ`);
    assert.equal(mine.length, 1 + doneLevel(ALL, word), `${word}: đúng rồi vẫn gặp lại tới đủ mức`);
    assert.equal(mine.at(-1)!.kind, 'type', `${word}: lần cuối là dạng khó nhất`);
  }
});

test('bậc câu hỏi: trắc nghiệm nghĩa → điền ABCD → gõ từ', () => {
  const o: LoopOptions = { ...ALL, interleave: false };
  const { asked } = run(o);
  for (const { word } of words) {
    const seq = asked.filter((x) => x.word === word).map((x) => x.kind);
    assert.deepEqual(seq, ['flash', 'mcq', 'fill', 'type'], word);
  }
});

test('không có câu điền chỗ trống khi từ không có câu ví dụ khoét được: đi thẳng trắc nghiệm → gõ', () => {
  const o: LoopOptions = { ...ALL, interleave: false, canFill: () => false };
  const { asked } = run(o, () => true, words.slice(0, 2));
  assert.deepEqual(asked.filter((x) => x.word === 'a').map((x) => x.kind), ['flash', 'mcq', 'type']);
});

test('từ mới mở bằng lật thẻ theo đúng thứ tự bộ, bắt đầu từ từ đầu tiên (như `academic`)', () => {
  const { asked } = run(ALL);
  assert.equal(asked[0]!.word, 'a');
  assert.equal(asked[0]!.kind, 'flash');
  const intros = asked.filter((x) => x.kind === 'flash').map((x) => x.word);
  assert.deepEqual(intros, ['a', 'b', 'c', 'd', 'e', 'f']);
});

test('từ mới không chen lên trước câu đang đến hạn; câu đến hạn thì được hỏi ngay khi tới lượt', () => {
  let s = startLoop(words, 3);
  const o: LoopOptions = { ...ALL, interleave: false };
  const first = pickNext(s, o)!;
  assert.deepEqual([first.word, first.kind], ['a', 'flash']);
  s = answerLoop(s, false, o); // lật thẻ "chưa nhớ" → hỏi lại sau 1 câu
  const second = pickNext(s, o)!;
  assert.deepEqual([second.word, second.kind], ['b', 'flash'], 'chưa đến hạn thì mở từ mới');
  s = answerLoop(s, true, o);
  const third = pickNext(s, o)!;
  assert.deepEqual([third.word, third.kind], ['a', 'mcq'], 'tới hạn thì hỏi lại từ vừa chưa nhớ');
});

test('lần gặp lại đổi sang dạng khác nếu còn dạng khác (không hỏi nguyên câu vừa sai)', () => {
  const o: LoopOptions = { ...ALL, kinds: ['mcq', 'fill', 'type'] };
  let s = startLoop(words.slice(0, 2), 5);
  // Từ đầu tiên của vòng đi qua lật thẻ, rồi tới câu trắc nghiệm đầu tiên.
  for (let guard = 0; guard < 20; guard += 1) {
    const item = pickNext(s, o)!;
    if (item.kind === 'mcq') break;
    s = answerLoop(s, true, o);
  }
  const head = pickNext(s, o)!;
  assert.equal(head.kind, 'mcq');
  s = answerLoop(s, false, o);
  const slot = slotOf(s, head.word);
  assert.equal(slot.level, 0, 'sai ở bậc đầu thì vẫn ở bậc đầu');
  assert.notEqual(kindFor(slot, s, o), 'mcq', 'lần hỏi lại không lặp đúng dạng vừa sai');
});

test('xen kẽ: không hai câu liền nhau cùng một từ, và các dạng trộn lẫn chứ không thành từng dãy', () => {
  const { asked, open } = run(ALL, (_, i) => i % 5 !== 3);
  // Chỉ được hỏi lại đúng từ vừa hỏi khi đó là từ cuối cùng chưa xong.
  for (let i = 1; i < asked.length; i += 1) if (open[i]! > 1) assert.notEqual(asked[i]!.word, asked[i - 1]!.word, `câu ${i} lặp từ`);
  // Không có dãy 3 thẻ lật liền nhau.
  const kinds = asked.map((x) => x.kind).join(',');
  assert.ok(!kinds.includes('flash,flash,flash'), kinds);
  // Đủ các dạng đều xuất hiện.
  for (const k of ['flash', 'mcq', 'fill', 'type'] as const) assert.ok(kinds.includes(k), `thiếu dạng ${k}`);
});

test('xáo trộn: hai hạt giống cho hai thứ tự câu khác nhau', () => {
  const a = run(ALL, () => true, words, 1).asked.map((x) => `${x.word}:${x.kind}`).join(' ');
  const b = run(ALL, () => true, words, 2).asked.map((x) => `${x.word}:${x.kind}`).join(' ');
  assert.notEqual(a, b);
});

test('chỉ bật một dạng: vẫn phải làm đúng hai lần giãn cách mới xong', () => {
  const o: LoopOptions = { ...ALL, kinds: ['mcq'] };
  const { asked, s } = run(o, () => true, words.slice(0, 3));
  assert.ok(loopDone(s));
  assert.equal(asked.length, 6);
  assert.ok(asked.every((x) => x.kind === 'mcq'));
});

test('đánh dấu xong đúng lúc, thanh tiến độ nhích theo mức', () => {
  const o: LoopOptions = { ...ALL, kinds: ['mcq', 'type'] };
  let s = startLoop(words.slice(0, 2));
  assert.equal(loopFraction(s, 'a', o), 0);
  const seen: number[] = [];
  for (let guard = 0; guard < 30 && !loopDone(s); guard += 1) {
    const item = pickNext(s, o)!;
    const fin = finishesWord(s, item, true, o);
    s = answerLoop(s, true, o);
    if (item.word === 'a') seen.push(loopFraction(s, 'a', o));
    if (fin) assert.equal(slotOf(s, item.word).done, true);
  }
  assert.deepEqual(seen, [0.5, 1]);
  assert.equal(pickNext(s, o), null);
});

test('mọi lần hỏi lại (đúng hay sai) cách đúng 5 câu', () => {
  const o: LoopOptions = { ...ALL, kinds: ['mcq', 'type'] };
  const s = startLoop(words.slice(0, 4), 7);
  const first = pickNext(s, o)!;
  const wrong = answerLoop(s, false, o);
  assert.equal(slotOf(wrong, first.word).due - wrong.now, SPACING);
  const right = answerLoop(s, true, o);
  assert.equal(slotOf(right, first.word).due - right.now, SPACING);
  assert.equal(SPACING, 5);
});

