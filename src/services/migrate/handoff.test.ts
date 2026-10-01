import test from 'node:test';
import assert from 'node:assert/strict';

import { DATA, DONE, READY, parseMessage, plan, snapshot } from './handoff';

test('chỉ nhận thư đúng dạng', () => {
  assert.deepEqual(parseMessage({ type: READY }), { type: READY });
  assert.deepEqual(parseMessage({ type: DONE, written: 3 }), { type: DONE, written: 3 });
  assert.deepEqual(parseMessage({ type: DATA, items: { a: '1', b: 2 } }), { type: DATA, items: { a: '1' } });
  assert.equal(parseMessage({ type: DATA, items: ['x'] }), null);
  assert.equal(parseMessage('hello'), null);
  assert.equal(parseMessage({ type: 'khac' }), null);
});

test('không ghi đè dữ liệu đã có ở tên miền mới', () => {
  assert.deepEqual(plan({ a: 'moi' }, { a: 'cu', b: 'cu' }), { b: 'cu' });
});

test('chụp toàn bộ localStorage', () => {
  const data: Record<string, string> = { x: '1', y: '2' };
  const keys = Object.keys(data);
  const fake = { length: keys.length, key: (i: number) => keys[i] ?? null, getItem: (k: string) => data[k] ?? null };
  assert.deepEqual(snapshot(fake), data);
});
