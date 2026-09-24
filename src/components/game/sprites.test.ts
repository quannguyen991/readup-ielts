import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ENEMIES } from '@/services/game/rules';
import { ENEMY_SPRITE, paletteFor, SPRITES, spriteRuns, type SpriteName } from './sprites';

test('mọi sprite đúng 16×16 và chỉ dùng chữ có trong bảng màu', () => {
  for (const [name, rows] of Object.entries(SPRITES) as [SpriteName, string[]][]) {
    assert.equal(rows.length, 16, `${name}: ${rows.length} dòng`);
    const palette = paletteFor(name, '#38BDF8');
    rows.forEach((row, y) => {
      assert.equal(row.length, 16, `${name} dòng ${y}: dài ${row.length}`);
      for (const ch of row) assert.ok(ch === '.' || palette[ch], `${name} dòng ${y}: chữ lạ “${ch}”`);
    });
  }
});

test('gộp ô liền màu: số ô tô màu không đổi', () => {
  const palette = paletteFor('slime', '#38BDF8');
  const runs = spriteRuns(SPRITES.slime, palette);
  const cells = SPRITES.slime.join('').replace(/\./g, '').length;
  assert.equal(runs.reduce((n, r) => n + r.w, 0), cells);
  assert.ok(runs.length < cells, 'gộp được ít nhất vài ô');
});

test('quái nào cũng có sprite', () => {
  for (const e of ENEMIES) assert.ok(ENEMY_SPRITE[e.id], `${e.id} chưa có sprite`);
});
