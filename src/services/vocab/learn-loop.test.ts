import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  answerLoop,
  doneLevel,
  finishesWord,
  GAP_WRONG,
  loopDone,
  loopFraction,
  pickNext,
  slotOf,
  startLoop,
  type LoopItem,
  type LoopOptions,
  type LoopState,
} from './learn-loop';

const words = ['a', 'b', 'c', 'd', 'e', 'f'].map((word) => ({ word }));
const ALL: LoopOptions = { kinds: ['flash', 'mcq', 'type'], interleave: true, canFill: () => true };

/** Chạy cả vòng; `answer` quyết định đúng/sai từng câu. Trả về dãy câu đã hỏi. */
function run(o: LoopOptions, answer: (item: LoopItem, i: number) => boolean = () => true, list = words) {
  let s: LoopState = startLoop(list);
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

test('không sai câu nào: vòng vẫn xong, mỗi từ gặp lật thẻ + đủ số lần làm đúng giãn cách', () => {
  const { s, asked } = run(ALL);
  assert.ok(loopDone(s));
  for (const { word } of words) {
    const mine = asked.filter((x) => x.word === word);
    assert.equal(mine[0]!.kind, 'flash', `${word}: lần gặp đầu là lật thẻ`);
    assert.equal(mine.length, 1 + doneLevel(ALL, word), `${word}: đúng rồi vẫn gặp lại tới đủ mức`);
    assert.equal(mine.at(-1)!.kind, 'type', `${word}: lần cuối là dạng khó nhất`);
  }
});

test('đúng rồi cũng gặp lại, và càng lúc càng cách xa', () => {
  const { asked } = run(ALL);
  const at = asked.map((x, i) => (x.word === 'a' ? i : -1)).filter((i) => i >= 0);
  const gaps = at.slice(1).map((v, i) => v - at[i]!);
  assert.ok(gaps.length >= 2);
  // Sau lật thẻ, mỗi lần làm đúng thì lần gặp sau xa hơn lần trước.
  assert.ok(gaps[1]! > gaps[0]!, `khoảng cách giãn dần: ${gaps.join(', ')}`);
});

test('sai thì gặp lại sớm, bằng dạng dễ hơn, và tụt mức', () => {
  let s = startLoop(words.slice(0, 4));
  const o: LoopOptions = { ...ALL, kinds: ['mcq', 'type'] };
  // Làm đúng từ đầu tiên một lần để nó lên mức 1 (sắp tới câu gõ từ)…
  const first = pickNext(s, o)!;
  for (let guard = 0; slotOf(s, first.word).level < 1 && guard < 50; guard += 1) s = answerLoop(s, true, o);
  // …rồi đợi tới lượt nó và trả lời sai.
  for (let guard = 0; pickNext(s, o)!.word !== first.word && guard < 50; guard += 1) s = answerLoop(s, true, o);
  assert.equal(pickNext(s, o)!.kind, 'type');
  const wrongAt = s.now;
  s = answerLoop(s, false, o);
  assert.equal(slotOf(s, first.word).level, 0, 'sai thì tụt một mức');
  let back = -1;
  for (let guard = 0; guard < 20; guard += 1) {
    const item = pickNext(s, o)!;
    if (item.word === first.word) {
      back = s.now;
      assert.equal(item.tag, 'retry');
      assert.notEqual(item.kind, 'type', 'hỏi lại bằng dạng dễ hơn');
      break;
    }
    s = answerLoop(s, true, o);
  }
  assert.ok(back > 0 && back - wrongAt <= GAP_WRONG + 2, `gặp lại sớm: sau ${back - wrongAt} câu`);
});

test('xen kẽ: không hai câu liền nhau cùng một từ, và các dạng trộn lẫn chứ không thành từng dãy', () => {
  const { asked, open } = run(ALL, (_, i) => i % 5 !== 3);
  // Chỉ được hỏi lại đúng từ vừa hỏi khi đó là từ cuối cùng chưa xong.
  for (let i = 1; i < asked.length; i += 1) if (open[i]! > 1) assert.notEqual(asked[i]!.word, asked[i - 1]!.word, `câu ${i} lặp từ`);
  // Không có dãy 3 thẻ lật liền nhau.
  const kinds = asked.map((x) => x.kind).join(',');
  assert.ok(!kinds.includes('flash,flash,flash'), kinds);
  // Đủ các dạng đều xuất hiện.
  for (const k of ['flash', 'mcq', 'type'] as const) assert.ok(kinds.includes(k), `thiếu dạng ${k}`);
});

test('tuần tự: mỗi từ đi đúng thứ tự trắc nghiệm → gõ từ', () => {
  const o: LoopOptions = { ...ALL, interleave: false };
  const { asked } = run(o);
  for (const { word } of words) {
    const seq = asked.filter((x) => x.word === word).map((x) => x.kind);
    assert.deepEqual(seq, ['flash', 'mcq', 'type'], word);
  }
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
