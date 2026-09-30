import test from 'node:test';
import assert from 'node:assert/strict';

import { cityGoals } from './goals';
import { sampleCity } from './sample-city';

test('thành phố trống: mọi mục tiêu ở bậc đầu, chưa xong', () => {
  const g = cityGoals({ era: 1, regions: 4, sites: [], species: 0, speciesTotal: 20, furniture: 0 });
  for (const x of g) {
    assert.equal(x.tier, 0, x.id);
    assert.equal(x.done, false, x.id);
  }
  assert.ok(g.filter((x) => x.id !== 'era' && x.id !== 'land').every((x) => x.value === 0));
  assert.equal(g.find((x) => x.id === 'era')!.target, 2);
});

test('thành phố mẫu Kỷ 5: kỷ xong hết bậc, cao ốc đã qua bậc đầu', () => {
  const c = sampleCity();
  const g = cityGoals({ era: 5, regions: c.regions.length, sites: c.sites, species: 20, speciesTotal: 20, furniture: 0 });
  const era = g.find((x) => x.id === 'era')!;
  assert.equal(era.done, true);
  assert.equal(era.tier, era.tiers);
  assert.ok(g.find((x) => x.id === 'towers')!.tier >= 1);
  assert.equal(g.find((x) => x.id === 'collection')!.done, true);
  for (const x of g) assert.ok(x.value <= x.target);
});
