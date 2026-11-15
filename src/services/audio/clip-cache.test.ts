import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createClipCache } from './clip-cache';

const mkDeps = (fail: Set<string> = new Set()) => {
  const calls: string[] = [];
  return {
    calls,
    deps: {
      fetch: async (u: string) => {
        calls.push(u);
        return { ok: !fail.has(u), blob: async () => new Blob([u]) };
      },
      createObjectURL: (b: Blob) => `blob:${b.size}`,
      revokeObjectURL: () => undefined,
    },
  };
};

test('prefetch xong thì get trả blob URL, không tải lại', async () => {
  const { deps, calls } = mkDeps();
  const c = createClipCache(deps);
  assert.equal(c.get('/a.mp3'), undefined);
  c.prefetch('/a.mp3');
  c.prefetch('/a.mp3');
  assert.ok((await c.load('/a.mp3'))!.startsWith('blob:'));
  assert.ok(c.get('/a.mp3'));
  c.prefetch('/a.mp3');
  assert.equal(calls.length, 1);
});

test('clip lỗi 404 chỉ thử một lần và trả null', async () => {
  const { deps, calls } = mkDeps(new Set(['/x.mp3']));
  const c = createClipCache(deps);
  assert.equal(await c.load('/x.mp3'), null);
  assert.equal(await c.load('/x.mp3'), null);
  c.prefetch('/x.mp3');
  assert.equal(calls.length, 1);
});

test('vượt dung lượng thì bỏ clip cũ nhất', async () => {
  const { deps } = mkDeps();
  const c = createClipCache({ ...deps, cap: 2 });
  await c.load('/1.mp3');
  await c.load('/2.mp3');
  c.get('/1.mp3'); // làm mới 1
  await c.load('/3.mp3');
  assert.equal(c.size(), 2);
  assert.ok(c.get('/1.mp3'));
  assert.equal(c.get('/2.mp3'), undefined);
});

test('giới hạn số yêu cầu song song', async () => {
  let active = 0;
  let peak = 0;
  const c = createClipCache({
    concurrency: 2,
    fetch: async () => {
      active++;
      peak = Math.max(peak, active);
      await new Promise((r) => setTimeout(r, 5));
      active--;
      return { ok: true, blob: async () => new Blob(['x']) };
    },
    createObjectURL: () => 'blob:x',
    revokeObjectURL: () => undefined,
  });
  await Promise.all(['/a', '/b', '/c', '/d', '/e'].map((u) => c.load(u)));
  assert.equal(peak, 2);
});
