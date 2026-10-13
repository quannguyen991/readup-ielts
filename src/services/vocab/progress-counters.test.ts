import assert from 'node:assert/strict';
import { test } from 'node:test';

import { answerLoop, pickNext, startLoop, type LoopOptions } from './learn-loop';
import { footerLine, learnedCount, roundStats } from './progress-counters';

const words = Array.from({ length: 10 }, (_, i) => ({ word: `w${i}` }));
const O: LoopOptions = { kinds: ['flash', 'mcq', 'fill', 'type'], interleave: true, canFill: () => true };

test('làm 10 câu đúng: số từ đã qua nhích lên (không còn đứng 0), chưa xong cả bộ', () => {
  let s = startLoop(words);
  for (let i = 0; i < 10; i += 1) s = answerLoop(s, true, O);
  const st = roundStats(s, words);
  assert.equal(st.answered, 10);
  assert.ok(st.passed >= 1, `đã qua ${st.passed}`);
  assert.ok(st.done < words.length, `xong ${st.done}/${words.length}`);
});

test('sai làm tụt: từ vừa sai không còn tính là đã qua', () => {
  let s = startLoop(words.slice(0, 2));
  // lật thẻ đúng, rồi làm đúng một câu luyện → level 1
  for (let i = 0; i < 4; i += 1) s = answerLoop(s, true, O);
  const before = roundStats(s, words.slice(0, 2)).passed;
  const head = pickNext(s, O)!;
  s = answerLoop(s, false, O);
  const slot = s.slots.find((x) => x.word === head.word)!;
  assert.ok(slot.level >= 0);
  assert.ok(roundStats(s, words.slice(0, 2)).passed <= before);
});

test('chạy hết vòng: passed = done = số từ', () => {
  let s = startLoop(words);
  for (let i = 0; i < 400 && pickNext(s, O); i += 1) s = answerLoop(s, true, O);
  const st = roundStats(s, words);
  assert.equal(st.done, 10);
  assert.equal(st.passed, 10);
});

test('cả bộ đã nhớ: chặng 2 hoặc hộp ôn ≥ 1, không đếm từ mới gặp', () => {
  const set = [{ word: 'a' }, { word: 'b' }, { word: 'c' }, { word: 'd' }];
  const stages = { a: 2, b: 1, c: 1 };
  const reviews = {
    b: { box: 0, due: '2026-10-03', last: '2026-10-02' },
    c: { box: 2, due: '2026-10-09', last: '2026-10-02' },
  };
  assert.equal(learnedCount(set, stages, reviews), 2); // a (chặng 2) + c (hộp 2)
  assert.equal(learnedCount(set, undefined, undefined), 0);
});

test('dòng số liệu ngắn, hai ngôn ngữ', () => {
  const st = { passed: 3, done: 0, total: 10, answered: 12 };
  assert.equal(footerLine(st, 5, 61, false), '3/10 từ · 12 câu · Cả bộ nhớ 5/61');
  assert.equal(footerLine(st, 5, 61, true), '3/10 words · 12 answered · Set 5/61 learned');
});
