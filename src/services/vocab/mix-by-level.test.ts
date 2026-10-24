import assert from 'node:assert/strict';
import { test } from 'node:test';

import { mixByLevel } from './topic-study';

const at = (word: string, lv: string) => ({ word, lv });

test('xen kẽ các cấp và giữ thứ tự cũ trong từng cấp', () => {
  const words = [at('a1x', 'A1'), at('a1y', 'A1'), at('b1x', 'B1'), at('c2x', 'C2')];
  assert.deepEqual(mixByLevel(words, (w) => w.lv).map((w) => w.word), ['a1x', 'b1x', 'c2x', 'a1y']);
});

test('bộ một cấp thì dãy không đổi', () => {
  const words = [at('x', 'B2'), at('y', 'B2'), at('z', 'B2')];
  assert.deepEqual(mixByLevel(words, (w) => w.lv).map((w) => w.word), ['x', 'y', 'z']);
});

test('không mất từ nào', () => {
  const words = Array.from({ length: 23 }, (_, i) => at(`w${i}`, ['A1', 'B1', 'B2', 'C1', 'C2'][i % 5]!));
  const out = mixByLevel(words, (w) => w.lv);
  assert.equal(out.length, 23);
  assert.deepEqual(new Set(out.map((w) => w.word)), new Set(words.map((w) => w.word)));
});
