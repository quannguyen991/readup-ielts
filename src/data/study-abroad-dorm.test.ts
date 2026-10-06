import assert from 'node:assert/strict';
import test from 'node:test';

import { STUDY_ABROAD_MISSIONS } from './study-abroad-campaign';
import { DEFAULT_DORM_DECORATIONS, DORM_SLOTS, STUDY_ABROAD_DECORATIONS } from './study-abroad-dorm';

test('every dorm slot has a starter item and a valid default selection', () => {
  const ids = new Set(STUDY_ABROAD_DECORATIONS.map((item) => item.id));
  assert.equal(ids.size, STUDY_ABROAD_DECORATIONS.length, 'decoration IDs must be unique');

  for (const slot of DORM_SLOTS) {
    assert.ok(STUDY_ABROAD_DECORATIONS.some((item) => item.slot === slot.id && !item.unlockMission));
    const selected = STUDY_ABROAD_DECORATIONS.find((item) => item.id === DEFAULT_DORM_DECORATIONS[slot.id]);
    assert.equal(selected?.slot, slot.id);
  }
});

test('each campaign mission unlocks a dorm reward', () => {
  const missionIds = new Set(STUDY_ABROAD_MISSIONS.map((mission) => mission.id));
  const unlocks = STUDY_ABROAD_DECORATIONS.filter((item) => item.unlockMission).map((item) => item.unlockMission!);
  assert.deepEqual(new Set(unlocks), missionIds);
});
