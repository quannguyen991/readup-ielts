import test from 'node:test';
import assert from 'node:assert/strict';

import { SAT_RW_QUESTIONS } from '@/data/sat-rw-repository';
import { getSatRwSet } from './curriculum';
import { officialSkillPracticeHref, SAT_RW_OFFICIAL_SKILLS } from './official-course';

test('course alignment covers the 47 public SAT Reading & Writing practice targets', () => {
  assert.equal(SAT_RW_OFFICIAL_SKILLS.length, 47);
  assert.equal(new Set(SAT_RW_OFFICIAL_SKILLS.map((skill) => skill.id)).size, 47);
  assert.equal(SAT_RW_OFFICIAL_SKILLS.filter((skill) => skill.kind === 'tier').length, 33);
  assert.equal(SAT_RW_OFFICIAL_SKILLS.filter((skill) => skill.kind === 'challenge').length, 6);
  assert.equal(SAT_RW_OFFICIAL_SKILLS.filter((skill) => skill.kind === 'grammar').length, 8);
});

test('every tier skill points to a populated matching Band 9 practice set', () => {
  for (const skill of SAT_RW_OFFICIAL_SKILLS.filter((item) => item.kind === 'tier')) {
    const href = officialSkillPracticeHref(skill);
    const id = href.split('/').at(-1)!;
    const set = getSatRwSet(id);
    assert.ok(set, `${skill.id} points to missing set ${id}`);
    if (skill.id.startsWith('rhetorical-synthesis')) {
      assert.equal(set.kind, 'generated');
    } else {
      assert.ok(set.count > 0, `${skill.id} points to an empty question set`);
    }
  }
});

test('all new Reading questions are distinct original records with checked answer data', () => {
  const added = SAT_RW_QUESTIONS.filter((question) => question.id.startsWith('b9-rw-read-'));
  assert.equal(added.length, 12);
  assert.equal(new Set(added.map((question) => question.id)).size, added.length);
  for (const question of added) {
    assert.equal(question.options.length, 4, `${question.id}: expected four options`);
    assert.ok(question.answerIndex >= 0 && question.answerIndex < 4, `${question.id}: invalid answer`);
    assert.ok(question.solutionVi.length > 80, `${question.id}: explanation is too short`);
    assert.ok(question.whyWrong?.length === 4, `${question.id}: missing distractor explanations`);
    assert.ok(question.passage.length > 120, `${question.id}: passage is too short`);
  }
});

