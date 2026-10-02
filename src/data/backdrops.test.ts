import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  BACKDROPS,
  driftLayout,
  motionActive,
  twinkles,
  DEFAULT_PREFS,
  availableBackdrops,
  captionOf,
  chooseBackdrop,
  integerScale,
  lowEndHint,
  probeBackdrops,
  sanitizePrefs,
  scaledSize,
  withAlpha,
} from './backdrops';

test('manifest: id duy nhất, đủ 12 bức, mỗi bức cần file small.png', () => {
  assert.equal(BACKDROPS.length, 12);
  assert.equal(new Set(BACKDROPS.map((b) => b.id)).size, 12);
  for (const b of BACKDROPS) {
    assert.deepEqual(b.needs, [`/backdrops/${b.id}.small.png`]);
    assert.ok(b.vi && b.en && b.artist && /^\d+,\d+,\d+$/.test(b.scrim));
  }
});

test('probe bỏ mục thiếu file, giữ mục đủ', async () => {
  const have = new Set(['/backdrops/starry.small.png', '/backdrops/wave.small.png']);
  const ok = await probeBackdrops(async (u) => have.has(u));
  assert.deepEqual([...availableBackdrops(ok)].map((b) => b.id), ['starry', 'wave']);
  const boom = await probeBackdrops(async () => {
    throw new Error('mạng lỗi');
  });
  assert.equal(boom.size, 0);
});

test('chooseBackdrop: chưa có tranh → null; random theo rnd; id thiếu → starry rồi bức đầu', () => {
  assert.equal(chooseBackdrop('starry', []), null);
  const av = BACKDROPS.filter((b) => ['wave', 'kiss', 'starry'].includes(b.id));
  assert.equal(chooseBackdrop('random', av, 0)?.id, av[0]!.id);
  assert.equal(chooseBackdrop('random', av, 0.999)?.id, av[2]!.id);
  assert.equal(chooseBackdrop('kiss', av)?.id, 'kiss');
  assert.equal(chooseBackdrop('pearl', av)?.id, 'starry');
  assert.equal(chooseBackdrop('pearl', [av[0]!])?.id, av[0]!.id);
});

test('integerScale: nguyên, phủ kín khung', () => {
  for (const [w, h] of [[1400, 800], [1920, 1080], [375, 812], [2560, 1440]] as const) {
    const s = scaledSize(w, h);
    assert.ok(Number.isInteger(s.k));
    assert.ok(s.w >= w && s.h >= h);
  }
  assert.equal(integerScale(1400, 800), 4);
  assert.equal(integerScale(1672, 940), 4);
  assert.equal(integerScale(300, 200) < 1, true);
});

test('prefs: mặc định TẮT; dữ liệu hỏng quay về mặc định; id lạ → starry', () => {
  assert.deepEqual(sanitizePrefs(undefined), DEFAULT_PREFS);
  assert.deepEqual(sanitizePrefs('x'), DEFAULT_PREFS);
  assert.equal(DEFAULT_PREFS.on, false);
  assert.deepEqual(sanitizePrefs({ on: true, choice: 'wave', motion: true }), { on: true, choice: 'wave', motion: true });
  assert.deepEqual(sanitizePrefs({ on: true, choice: 'random', motion: true }), { on: true, choice: 'random', motion: true });
  assert.deepEqual(sanitizePrefs({ on: 'yes', choice: 'nope' }), { on: false, choice: 'starry', motion: true });
});

test('lowEndHint chỉ gợi ý khi máy yếu', () => {
  assert.equal(lowEndHint({ cores: 8, memory: 8 }), false);
  assert.equal(lowEndHint({ cores: 4 }), true);
  assert.equal(lowEndHint({ saveData: true }), true);
  assert.equal(lowEndHint({ reducedMotion: true }), true);
});

test('caption và withAlpha', () => {
  const b = BACKDROPS[0]!;
  assert.equal(captionOf(b, false), 'Đêm đầy sao · Vincent van Gogh');
  assert.equal(captionOf(b, true), 'The Starry Night · Vincent van Gogh');
  assert.equal(withAlpha('#FFFFFF', 0.93), '#FFFFFFed');
  assert.equal(withAlpha('#1D1C19', 1), '#1D1C19ff');
});

test('prefs: motion mặc định bật, chỉ false mới tắt', () => {
  assert.equal(sanitizePrefs({ on: true, motion: false }).motion, false);
  assert.equal(sanitizePrefs({ on: true, motion: 'x' }).motion, true);
});

test('motionActive: tắt khi máy yếu, giảm chuyển động, tab ẩn hoặc người dùng tắt', () => {
  const ok = { cores: 8, memory: 8 };
  assert.equal(motionActive(true, ok, true), true);
  assert.equal(motionActive(false, ok, true), false);
  assert.equal(motionActive(true, ok, false), false);
  assert.equal(motionActive(true, { cores: 4 }, true), false);
  assert.equal(motionActive(true, { ...ok, reducedMotion: true }, true), false);
});

test('driftLayout: k nguyên, ảnh phủ khung + biên trôi, vị trí nguyên px, bước 1px', () => {
  for (const [w, h] of [[1400, 850], [1920, 1080], [375, 812], [1024, 768]] as const) {
    const L = driftLayout(w, h, true);
    assert.ok(Number.isInteger(L.k) && Number.isInteger(L.left) && Number.isInteger(L.top) && Number.isInteger(L.d));
    assert.ok(L.w >= w + 2 * L.d && L.h >= h + 2 * L.d);
    assert.ok(L.d > 0 && L.d <= 24 && L.steps === L.d * 2);
    assert.ok(L.left + L.w + L.d >= w && L.left - L.d <= 0 && L.top - L.d <= 0 && L.top + L.h + L.d >= h);
  }
  const still = driftLayout(1400, 850, false);
  assert.equal(still.d, 0);
});

test('twinkles: xác định, tối đa 18, vuông >= 2px', () => {
  const t = twinkles(BACKDROPS[0]!.stars, 4);
  assert.ok(t.length > 0 && t.length <= 18);
  assert.deepEqual(t, twinkles(BACKDROPS[0]!.stars, 4));
  assert.ok(t.every((s) => s.size >= 2 && s.dur > 2 && s.x % 4 === 0));
  assert.deepEqual(twinkles(undefined, 4), []);
});
