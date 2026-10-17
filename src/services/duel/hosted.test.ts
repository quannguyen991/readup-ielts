import { test } from 'node:test';
import assert from 'node:assert/strict';

import { emptyShowState, isOver, rankingOf, resolveRound, SURVIVAL_LIVES, type ShowState } from './hosted';

function base(mode: 'show' | 'survival', roster: string[]): ShowState {
  const lives: Record<string, number> = {};
  for (const id of roster) lives[id] = mode === 'survival' ? SURVIVAL_LIVES : 0;
  return { ...emptyShowState(mode, 'deck'), roster, lives, index: 0, total: 10 };
}

test('chế độ chiếu lớp: đúng được điểm, sai và bỏ qua không được', () => {
  const s = base('show', ['a', 'b', 'c']);
  const r = resolveRound(s, [
    { id: 'a', index: 0, choice: 1, ms: 1000 },
    { id: 'b', index: 0, choice: 0, ms: 1000 },
  ], 1);
  assert.ok((r.scores.a ?? 0) > 0);
  assert.equal(r.scores.b, 0);
  assert.equal(r.scores.c, 0);
  assert.deepEqual(r.correct, ['a']);
  assert.deepEqual(r.counts, [1, 1, 0, 0]);
  assert.deepEqual(r.eliminated, []);
});

test('survival: sai thì mất một mạng, hết mạng thì bị loại', () => {
  const s = { ...base('survival', ['a', 'b', 'c']), lives: { a: 1, b: 3, c: 3 } };
  const r = resolveRound(s, [
    { id: 'a', index: 0, choice: 0, ms: 500 },
    { id: 'b', index: 0, choice: 2, ms: 500 },
    { id: 'c', index: 0, choice: 2, ms: 500 },
  ], 2);
  assert.equal(r.lives.a, 0);
  assert.deepEqual(r.eliminated, ['a']);
  assert.equal(r.lives.b, 3);
});

test('survival: cả lớp cùng sai thì không ai mất mạng', () => {
  const s = base('survival', ['a', 'b']);
  const r = resolveRound(s, [
    { id: 'a', index: 0, choice: 0, ms: 500 },
    { id: 'b', index: 0, choice: 1, ms: 500 },
  ], 3);
  assert.equal(r.lives.a, SURVIVAL_LIVES);
  assert.equal(r.lives.b, SURVIVAL_LIVES);
  assert.deepEqual(r.eliminated, []);
});

test('survival: người không trả lời (hết giờ) bị tính là sai', () => {
  const s = base('survival', ['a', 'b']);
  const r = resolveRound(s, [{ id: 'a', index: 0, choice: 1, ms: 400 }], 1);
  assert.equal(r.lives.a, SURVIVAL_LIVES);
  assert.equal(r.lives.b, SURVIVAL_LIVES - 1);
});

test('ván kết thúc khi hết câu, hoặc chỉ còn một người có mạng ở chế độ sinh tồn', () => {
  const alive = { ...base('survival', ['a', 'b', 'c']), lives: { a: 2, b: 0, c: 0 }, index: 3 };
  assert.equal(isOver(alive), true);
  const many = { ...base('survival', ['a', 'b', 'c']), lives: { a: 2, b: 1, c: 0 }, index: 3 };
  assert.equal(isOver(many), false);
  const last = { ...base('show', ['a', 'b']), index: 9, total: 10 };
  assert.equal(isOver(last), true);
});

test('xếp hạng sinh tồn: còn mạng đứng trên, rồi tới điểm', () => {
  const s = { ...base('survival', ['a', 'b', 'c']), lives: { a: 0, b: 1, c: 2 }, scores: { a: 900, b: 100, c: 50 } };
  assert.deepEqual(rankingOf(s), ['c', 'b', 'a']);
});

test('xếp hạng chiếu lớp: điểm cao đứng trên', () => {
  const s = { ...base('show', ['a', 'b', 'c']), scores: { a: 100, b: 300, c: 200 } };
  assert.deepEqual(rankingOf(s), ['b', 'c', 'a']);
});
