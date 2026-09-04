import test from 'node:test';
import assert from 'node:assert/strict';

import { buildReveal } from './word-reveal';

const MODEL = 'She teaches math at a primary school.';

test('chưa gõ gì thì mọi từ đều bị che, ô đầu tiên đang mở', () => {
  const state = buildReveal(MODEL, '');
  assert.equal(state.total, 7);
  assert.equal(state.solvedCount, 0);
  assert.equal(state.done, false);
  assert.equal(state.mismatch, false);
  assert.equal(state.tokens[0]?.status, 'active');
  assert.equal(state.tokens[1]?.status, 'locked');
});

test('số sao đếm theo số chữ cái, dấu câu cuối vẫn hiện', () => {
  const state = buildReveal(MODEL, '');
  assert.deepEqual(
    state.tokens.map((t) => t.masked),
    ['S**', 't******', 'm***', 'a*', 'a', 'p******', 's*****.'],
  );
});

test('gõ trọn một từ là mở ngay, không cần bấm dấu cách', () => {
  const state = buildReveal(MODEL, 'she');
  assert.equal(state.solvedCount, 1);
  assert.equal(state.mismatch, false);
  assert.equal(state.tokens[0]?.status, 'solved');
  assert.equal(state.tokens[1]?.status, 'active');
});

test('gõ dở một từ vẫn đúng tiền tố thì chưa mở nhưng cũng không báo sai', () => {
  const state = buildReveal(MODEL, 'she teach');
  assert.equal(state.solvedCount, 1);
  assert.equal(state.mismatch, false);
});

test('gõ sai chữ đầu của từ kế tiếp thì báo lệch ngay', () => {
  const state = buildReveal(MODEL, 'she s');
  assert.equal(state.solvedCount, 1);
  assert.equal(state.mismatch, true);
});

test('sai một từ thì chặn lại, những từ sau không được mở dù gõ đúng', () => {
  const state = buildReveal(MODEL, 'she learns math ');
  assert.equal(state.solvedCount, 1);
  assert.equal(state.mismatch, true);
  assert.equal(state.tokens[2]?.status, 'locked');
});

test('không phân biệt hoa thường và dấu câu', () => {
  const state = buildReveal(MODEL, 'SHE, TEACHES! math ');
  assert.equal(state.solvedCount, 3);
  assert.equal(state.mismatch, false);
});

test('gõ đủ cả câu thì hoàn thành', () => {
  const state = buildReveal(MODEL, 'She teaches math at a primary school.');
  assert.equal(state.solvedCount, 7);
  assert.equal(state.done, true);
  assert.equal(state.mismatch, false);
  assert.ok(state.tokens.every((t) => t.status === 'solved'));
});

test('gõ thừa từ sau khi đã xong thì báo lệch', () => {
  const state = buildReveal(MODEL, 'She teaches math at a primary school. Yesterday');
  assert.equal(state.mismatch, true);
});

test('nháy cong và nháy thẳng là một', () => {
  const state = buildReveal("I've been there.", "I’ve been there.");
  assert.equal(state.done, true);
});
