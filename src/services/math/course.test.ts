import assert from 'node:assert/strict';
import { test } from 'node:test';

import { MATH_SKILL_DOMAIN, type MathSkill } from '@/lib/math/types';
import {
  SAT_MATH_COURSE_ASSESSMENTS,
  SAT_MATH_COURSE_UNITS,
  buildCourseAssessmentItems,
  coveredAssessmentSkills,
  getCourseAssessmentsForUnit,
  isCourseAssessmentComplete,
} from './course';

test('lộ trình có unit mở đầu và đủ 12 unit theo ba mức × bốn domain', () => {
  assert.equal(SAT_MATH_COURSE_UNITS.length, 13);
  assert.equal(SAT_MATH_COURSE_UNITS[0]?.id, 'about-sat');
  assert.deepEqual(
    SAT_MATH_COURSE_UNITS.slice(1).map((unit) => [unit.level, unit.domain]),
    [
      ['foundation', 'algebra'], ['foundation', 'problem_solving_data'], ['foundation', 'advanced_math'], ['foundation', 'geometry_trig'],
      ['medium', 'algebra'], ['medium', 'problem_solving_data'], ['medium', 'advanced_math'], ['medium', 'geometry_trig'],
      ['advanced', 'algebra'], ['advanced', 'problem_solving_data'], ['advanced', 'advanced_math'], ['advanced', 'geometry_trig'],
    ],
  );
});

test('mọi unit có skill map đủ 19 kỹ năng, lặp lại theo từng bậc nhưng không lẫn domain', () => {
  const expected = (Object.keys(MATH_SKILL_DOMAIN) as MathSkill[]).sort();
  for (const unit of SAT_MATH_COURSE_UNITS.slice(1)) {
    const skills = unit.skills as MathSkill[];
    assert.deepEqual(skills.slice().sort(), expected.filter((skill) => MATH_SKILL_DOMAIN[skill] === unit.domain));
  }
  for (const domain of ['algebra', 'advanced_math', 'problem_solving_data', 'geometry_trig'] as const) {
    for (const difficulty of ['easy', 'medium', 'hard'] as const) {
      assert.deepEqual(
        coveredAssessmentSkills(domain, difficulty).slice().sort(),
        expected.filter((skill) => MATH_SKILL_DOMAIN[skill] === domain),
        `${domain} thiếu template ${difficulty}`,
      );
    }
  }
});

test('mỗi unit có số quiz theo cụm và một unit test với id riêng', () => {
  assert.equal(SAT_MATH_COURSE_ASSESSMENTS.length, 42);
  assert.equal(new Set(SAT_MATH_COURSE_ASSESSMENTS.map((set) => set.id)).size, 42);
  for (const unit of SAT_MATH_COURSE_UNITS.slice(1)) {
    const assessments = getCourseAssessmentsForUnit(unit.id);
    assert.equal(assessments.filter((assessment) => assessment.assessment === 'quiz').length, unit.domain === 'algebra' || unit.domain === 'geometry_trig' ? 2 : 3);
    assert.equal(assessments.filter((assessment) => assessment.assessment === 'unit_test').length, 1);
    assert.deepEqual(
      assessments.filter((assessment) => assessment.assessment === 'quiz').map((assessment) => assessment.quizNumber),
      assessments.filter((assessment) => assessment.assessment === 'quiz').map((_, index) => index + 1),
    );
  }

  for (const set of SAT_MATH_COURSE_ASSESSMENTS) {
    const first = buildCourseAssessmentItems(set, 0);
    const second = buildCourseAssessmentItems(set, 0);
    assert.equal(first.length, set.count, set.id);
    assert.deepEqual(first, second, `${set.id} cần tái lập từ id và lượt`);
    assert.ok(first.every((item) => item.difficulty === set.targetDifficulty), `${set.id} có câu sai bậc`);
    assert.ok(first.every((item) => set.skills.includes(item.skill)), `${set.id} có skill ngoài unit`);

    if (set.assessment === 'unit_test') {
      assert.deepEqual(
        [...new Set(first.map((item) => item.skill))].sort(),
        set.skills.slice().sort(),
        `${set.id} bỏ sót ít nhất một kỹ năng trong unit test`,
      );
      for (const skill of set.skills) {
        assert.ok(first.filter((item) => item.skill === skill).length >= 3, `${set.id} cần ít nhất ba câu cho ${skill}`);
      }
    } else {
      assert.equal(first.length, 4, `${set.id} phải là quiz ngắn 4 câu`);
      assert.ok(set.skills.length > 0, `${set.id} cần đo kỹ năng cụ thể`);
      assert.ok(set.skills.every((skill) => MATH_SKILL_DOMAIN[skill] === set.domain), `${set.id} có kỹ năng ngoài domain`);
    }
  }
});

test('tiến độ không coi mở bài là mastery; unit test chỉ hoàn thành từ 70%', () => {
  const quiz = SAT_MATH_COURSE_ASSESSMENTS.find((assessment) => assessment.assessment === 'quiz')!;
  const unitTest = SAT_MATH_COURSE_ASSESSMENTS.find((assessment) => assessment.assessment === 'unit_test')!;
  assert.equal(isCourseAssessmentComplete(quiz), false);
  assert.equal(isCourseAssessmentComplete(quiz, { rounds: 1, lastRatio: 0.25 }), true);
  assert.equal(isCourseAssessmentComplete(unitTest, { rounds: 1, lastRatio: 0.74 }), false);
  assert.equal(isCourseAssessmentComplete(unitTest, { rounds: 1, lastRatio: 0.75 }), true);
});
