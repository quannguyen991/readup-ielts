import assert from 'node:assert/strict';
import { test } from 'node:test';

import { examLayout, keyboardInset, scrollNeededForField } from './exam-layout';
import { nextGapNumber } from './gap-order';
import { DRAFT_TTL_MS, parseDraft, pruneDraft, serializeDraft } from './exam-draft';

test('examLayout: điện thoại dọc = một tấm, nằm ngang = hai tấm, rộng = có dải công cụ', () => {
  assert.deepEqual(examLayout(390, 844), { split: false, toolRail: false, compactHeight: false });
  assert.deepEqual(examLayout(844, 390), { split: true, toolRail: false, compactHeight: true });
  assert.deepEqual(examLayout(1400, 900), { split: true, toolRail: true, compactHeight: false });
  assert.equal(examLayout(699, 800).split, false);
  assert.equal(examLayout(700, 800).split, true);
});

test('keyboardInset: chỉ tính khi bị che đáng kể', () => {
  assert.equal(keyboardInset(800, null), 0);
  assert.equal(keyboardInset(800, { height: 790, offsetTop: 0 }), 0);
  assert.equal(keyboardInset(800, { height: 500, offsetTop: 0 }), 300);
  assert.equal(keyboardInset(800, { height: 480, offsetTop: 20 }), 300);
});

test('scrollNeededForField', () => {
  assert.equal(scrollNeededForField(300, 500), 0);
  assert.equal(scrollNeededForField(490, 500), 14);
});

test('draft: khứ hồi, hết hạn, rỗng, cắt tỉa', () => {
  const now = 1_000_000_000_000;
  const raw = serializeDraft({ answers: { a: 'B', b: '', c: 'x' }, marked: { a: true, b: false } }, now);
  const d = parseDraft(raw, now + 1000);
  assert.ok(d);
  assert.equal(d.answers.a, 'B');
  assert.deepEqual(d.marked, { a: true });
  assert.equal(parseDraft(raw, now + DRAFT_TTL_MS + 1), null);
  assert.equal(parseDraft(serializeDraft({ answers: { a: ' ' }, marked: {} }, now), now), null);
  assert.equal(parseDraft('{oops', now), null);
  assert.equal(parseDraft(null, now), null);
  const p = pruneDraft(d, new Set(['a']));
  assert.deepEqual(Object.keys(p.answers), ['a']);
});

test('nextGapNumber', () => {
  assert.equal(nextGapNumber([3, 1, 2], 1), 2);
  assert.equal(nextGapNumber([3, 1, 2], 3), null);
  assert.equal(nextGapNumber([5, 9], 1), 5);
});
