import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createLazyWriter } from './lazy-persist-core';

function harness() {
  let t = 0;
  const timers: { at: number; fn: () => void; id: number }[] = [];
  let id = 0;
  const writes: [string, unknown][] = [];
  const w = createLazyWriter({
    write: (n, v) => void writes.push([n, v]),
    now: () => t,
    setTimer: (fn, ms) => {
      const x = { at: t + ms, fn, id: ++id };
      timers.push(x);
      return x.id;
    },
    clearTimer: (i) => {
      const k = timers.findIndex((x) => x.id === i);
      if (k >= 0) timers.splice(k, 1);
    },
  });
  const advance = (ms: number) => {
    t += ms;
    for (const x of timers.filter((q) => q.at <= t)) {
      timers.splice(timers.indexOf(x), 1);
      x.fn();
    }
  };
  return { w, writes, advance };
}

test('gom nhiều lần ghi: chỉ ghi một lần, bản mới nhất', () => {
  const { w, writes, advance } = harness();
  for (let i = 0; i < 20; i++) {
    w.set('k', { n: i });
    advance(50);
  }
  assert.equal(writes.length, 0, 'chưa ghi khi còn đang gõ liên tục (dưới trần chờ)');
  advance(600);
  assert.deepEqual(writes, [['k', { n: 19 }]]);
});

test('đọc luôn thấy bản đang chờ ghi', () => {
  const { w } = harness();
  w.set('k', 1);
  assert.equal(w.get('k'), 1);
  assert.ok(w.has('k'));
});

test('flush (tab ẩn / thoát) ghi NGAY, không chờ hẹn giờ', () => {
  const { w, writes } = harness();
  w.set('a', 1);
  w.set('b', 2);
  w.flush();
  assert.deepEqual(writes, [['a', 1], ['b', 2]]);
  assert.equal(w.size, 0);
});

test('trần chờ: ghi liên tục không bao giờ hoãn quá maxWait', () => {
  const { w, writes, advance } = harness();
  for (let i = 0; i < 60; i++) {
    w.set('k', i);
    advance(100);
  }
  assert.ok(writes.length >= 2, `đã ghi ${writes.length} lần trong 6 giây`);
});
