import assert from 'node:assert/strict';
import test from 'node:test';

import { STUDY_ABROAD_DECORATIONS } from './study-abroad-dorm';
import { STUDY_ABROAD_MISSIONS } from './study-abroad-campaign';

test('đồ có giá: giá dương và mở bằng một nhiệm vụ có thật', () => {
  const missionIds = new Set(STUDY_ABROAD_MISSIONS.map((mission) => mission.id));
  const priced = STUDY_ABROAD_DECORATIONS.filter((item) => item.price !== undefined);
  assert.ok(priced.length >= 2, 'cần ít nhất hai món có giá');
  for (const item of priced) {
    assert.ok((item.price ?? 0) > 0, `${item.id} price`);
    assert.ok(item.unlockMission && missionIds.has(item.unlockMission), `${item.id} unlock`);
  }
});

test('mọi vật phẩm có id duy nhất', () => {
  const ids = STUDY_ABROAD_DECORATIONS.map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length);
});
