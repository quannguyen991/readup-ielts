import assert from 'node:assert/strict';
import test from 'node:test';

import { getPoiContent } from '@/data/travel/pois';
import { STUDY_PAY } from '@/services/study-abroad/economy';
import { STUDY_ABROAD_MISSIONS } from './study-abroad-campaign';
import { STUDY_JOBS } from './study-abroad-jobs';

test('việc làm: địa điểm có thật trong đúng thành phố, nhiệm vụ mở có thật', () => {
  const missionIds = new Set(STUDY_ABROAD_MISSIONS.map((mission) => mission.id));
  assert.ok(STUDY_JOBS.length >= 1);
  for (const job of STUDY_JOBS) {
    const poi = getPoiContent(job.poi);
    assert.ok(poi, `${job.id} POI ${job.poi} không tồn tại`);
    assert.equal(poi.city, job.city, `${job.id} sai thành phố`);
    assert.ok(missionIds.has(job.unlockMission), `${job.id} nhiệm vụ mở không tồn tại`);
    assert.ok(job.title.vi && job.title.en, `${job.id} thiếu tên việc`);
    assert.ok(job.place.vi && job.place.en, `${job.id} thiếu tên địa điểm`);
  }
});

test('ca làm: đủ số tình huống, đáp án là số nguyên trong khoảng, các đáp án không trùng nhau', () => {
  for (const job of STUDY_JOBS) {
    assert.equal(job.questions.length, STUDY_PAY.questionsPerShift, `${job.id} số tình huống`);
    assert.equal(new Set(job.questions.map((question) => question.id)).size, job.questions.length, `${job.id} mã tình huống trùng nhau`);
    for (const question of job.questions) {
      assert.equal(question.options.length, 4, `${question.id} số đáp án`);
      assert.ok(Number.isInteger(question.answer) && question.answer >= 0 && question.answer < question.options.length, `${question.id} chỉ số đáp án`);
      assert.equal(new Set(question.options).size, question.options.length, `${question.id} đáp án trùng nhau`);
      assert.ok(question.explanation.vi && question.explanation.en, `${question.id} thiếu giải thích`);
      assert.ok(question.hint.vi && question.hint.en, `${question.id} thiếu gợi ý`);
    }
  }
});
