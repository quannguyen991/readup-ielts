import assert from 'node:assert/strict';
import { test } from 'node:test';

import { MASCOTS, NO_PERKS, perksOf, STAR_BONUS } from './mascots';

test('mỗi linh vật giúp đúng một kiểu, không đeo thì không có quyền gì', () => {
  assert.deepEqual(perksOf(null), NO_PERKS);
  assert.equal(perksOf('owl').freeHints, 3);
  assert.equal(perksOf('fox').firstMissShield, true);
  assert.equal(perksOf('cat').healEvery, 10);
  assert.equal(perksOf('dragon').damageMult, 1.2);
  for (const m of Object.values(MASCOTS)) {
    const changed = Object.entries(m.perks).filter(([k, v]) => v !== NO_PERKS[k as keyof typeof NO_PERKS]);
    assert.equal(changed.length, 1, `${m.id} chỉ nên có một quyền`);
  }
});

test('sao thưởng: boss nhiều hơn quái thường', () => {
  assert.ok(STAR_BONUS.boss > STAR_BONUS.defeat);
});
