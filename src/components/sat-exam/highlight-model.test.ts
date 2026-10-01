import assert from 'node:assert/strict';
import { test } from 'node:test';

import { addMark, givenRange, segmentsOf, type Mark } from './highlight-model';

const mk = (id: string, start: number, end: number, block = 0): Mark => ({
  id, block, start, end, color: 'yellow', underline: false, note: '',
});

test('vệt mới cắt đôi vệt cũ chồng lên', () => {
  const out = addMark([mk('a', 0, 20)], { ...mk('b', 5, 10), color: 'pink' });
  assert.deepEqual(
    out.map((m) => [m.id, m.start, m.end]),
    [['a', 0, 5], ['b', 5, 10], ['a~', 10, 20]],
  );
});

test('vệt ở khối khác không bị đụng', () => {
  const out = addMark([mk('a', 0, 20, 1)], mk('b', 0, 20, 0));
  assert.equal(out.length, 2);
});

test('mẩu chữ ghép lại đúng nguyên văn và mang đúng vệt', () => {
  const text = 'The quick brown fox jumps.';
  const segs = segmentsOf(text, [mk('a', 4, 9)], givenRange(text, 'brown fox'));
  assert.equal(segs.map((s) => s.text).join(''), text);
  assert.equal(segs.find((s) => s.text === 'quick')?.mark?.id, 'a');
  assert.ok(segs.find((s) => s.text === 'brown fox')?.given);
});
