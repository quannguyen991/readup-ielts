import assert from 'node:assert/strict';
import test from 'node:test';

import { STUDY_ABROAD_MISSIONS } from './study-abroad-campaign';
import { buildStudyDays, STUDY_DAYS } from './study-abroad-schedule';

test('study days cover every mission once, in order, at most two per day', () => {
  const flat = STUDY_DAYS.flatMap((day) => day.missions.map((mission) => mission.id));
  assert.deepEqual(flat, STUDY_ABROAD_MISSIONS.map((mission) => mission.id));
  for (const [index, day] of STUDY_DAYS.entries()) {
    assert.equal(day.day, index + 1);
    assert.ok(day.missions.length >= 1 && day.missions.length <= 2, `day ${day.day} size`);
    for (const mission of day.missions) assert.equal(mission.chapter, day.chapter, `day ${day.day} chapter`);
  }
});

test('buildStudyDays splits a chapter into ceil(n / 2) days', () => {
  const days = buildStudyDays(STUDY_ABROAD_MISSIONS);
  const perChapter = [1, 2, 3, 4, 5].map((chapter) => days.filter((day) => day.chapter === chapter).length);
  const expected = [1, 2, 3, 4, 5].map((chapter) => Math.ceil(STUDY_ABROAD_MISSIONS.filter((m) => m.chapter === chapter).length / 2));
  assert.deepEqual(perChapter, expected);
});
