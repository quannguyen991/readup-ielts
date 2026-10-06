import assert from 'node:assert/strict';
import test from 'node:test';

import { STUDY_ABROAD_CHAPTERS, STUDY_ABROAD_MISSIONS } from './study-abroad-campaign';

test('study-abroad campaign has a complete, answerable five-city story arc', () => {
  assert.equal(STUDY_ABROAD_CHAPTERS.length, 5);
  assert.equal(STUDY_ABROAD_MISSIONS.length, 20);
  assert.equal(new Set(STUDY_ABROAD_MISSIONS.map((mission) => mission.id)).size, STUDY_ABROAD_MISSIONS.length);
  assert.equal(new Set(STUDY_ABROAD_MISSIONS.map((mission) => mission.answer)).size, 4);
  for (const mission of STUDY_ABROAD_MISSIONS) {
    assert.equal(mission.options.length, 4, `${mission.id} choices`);
    assert.ok(mission.answer >= 0 && mission.answer < mission.options.length, `${mission.id} answer index`);
    assert.ok(mission.options[mission.answer]?.length, `${mission.id} correct answer`);
  }
});
