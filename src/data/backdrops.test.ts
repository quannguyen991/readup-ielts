import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { test } from 'node:test';

import {
  BACKDROPS,
  DEFAULT_PREFS,
  availableBackdrops,
  captionOf,
  chooseBackdrop,
  lowEndHint,
  motionActive,
  probeBackdrops,
  sanitizePrefs,
  scrimAlpha,
  withAlpha,
} from './backdrops';

test('manifest: id duy nhất, đủ 12 bức, cần ảnh gốc + ảnh nhỏ, tiêu điểm hợp lệ', () => {
  assert.equal(BACKDROPS.length, 12);
  assert.equal(new Set(BACKDROPS.map((b) => b.id)).size, 12);
  for (const b of BACKDROPS) {
    assert.deepEqual(b.needs, [`/backdrops/art/${b.id}.jpg`, `/backdrops/art/${b.id}.thumb.jpg`]);
    assert.ok(b.vi && b.en && b.artist && /^\d+,\d+,\d+$/.test(b.scrim));
    assert.ok(/^center( \d+%)?$/.test(b.pos), b.id);
    assert.ok(b.scrimA >= 0.3 && b.scrimA <= 0.7, b.id);
  }
});

test('file ảnh thật có đủ trong public/backdrops/art', () => {
  for (const b of BACKDROPS) for (const u of b.needs) assert.ok(existsSync(`public${u}`), u);
});

test('probe bỏ mục thiếu BẤT KỲ file nào, giữ mục đủ', async () => {
  const have = new Set(['/backdrops/art/starry.jpg', '/backdrops/art/starry.thumb.jpg', '/backdrops/art/wave.jpg']);
  const ok = await probeBackdrops(async (u) => have.has(u));
  assert.deepEqual(availableBackdrops(ok).map((b) => b.id), ['starry']);
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

test('scrimAlpha: điện thoại đậm hơn, không vượt 0,85', () => {
  for (const b of BACKDROPS) {
    assert.ok(scrimAlpha(b, true) > scrimAlpha(b, false));
    assert.ok(scrimAlpha(b, true) <= 0.85);
  }
});

test('prefs: mặc định TẮT cả hai nơi; dữ liệu hỏng quay về mặc định; id lạ → starry', () => {
  assert.deepEqual(sanitizePrefs(undefined), DEFAULT_PREFS);
  assert.deepEqual(sanitizePrefs('x'), DEFAULT_PREFS);
  assert.equal(DEFAULT_PREFS.on, false);
  assert.equal(DEFAULT_PREFS.studyOn, false);
  assert.deepEqual(sanitizePrefs({ on: true, studyOn: true, choice: 'wave', motion: false }), { on: true, studyOn: true, choice: 'wave', motion: false });
  assert.equal(sanitizePrefs({ choice: 'random' }).choice, 'random');
  assert.deepEqual(sanitizePrefs({ on: 'yes', studyOn: 1, choice: 'nope' }), { on: false, studyOn: false, choice: 'starry', motion: true });
  assert.equal(sanitizePrefs({ motion: 'x' }).motion, true);
});

test('motionActive / lowEndHint: tắt khi máy yếu, giảm chuyển động hoặc người dùng tắt', () => {
  const ok = { cores: 8, memory: 8 };
  assert.equal(lowEndHint(ok), false);
  assert.equal(motionActive(true, ok), true);
  assert.equal(motionActive(false, ok), false);
  assert.equal(motionActive(true, { cores: 4 }), false);
  assert.equal(motionActive(true, { ...ok, reducedMotion: true }), false);
  assert.equal(motionActive(true, { ...ok, saveData: true }), false);
});

test('caption và withAlpha', () => {
  const b = BACKDROPS[0]!;
  assert.equal(captionOf(b, false), 'Đêm đầy sao · Vincent van Gogh');
  assert.equal(captionOf(b, true), 'The Starry Night · Vincent van Gogh');
  assert.equal(withAlpha('#FFFFFF', 0.93), '#FFFFFFed');
});
