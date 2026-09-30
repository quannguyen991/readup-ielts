import test from 'node:test';
import assert from 'node:assert/strict';

import { validateMath } from '@/lib/math/expr';
import { getTemplate } from '@/services/math/templates';
import { ROAD_CHAPTERS, buildBookSet, buildLevelQuiz } from './index';
import { mergeRoadmapProgress } from './progress';

test('27 chương, đánh số liên tục, mã không trùng, giai đoạn không lùi', () => {
  assert.equal(ROAD_CHAPTERS.length, 27);
  ROAD_CHAPTERS.forEach((c, i) => assert.equal(c.n, i + 1));
  assert.equal(new Set(ROAD_CHAPTERS.map((c) => c.id)).size, 27);
  for (let i = 1; i < ROAD_CHAPTERS.length; i++) assert.ok(ROAD_CHAPTERS[i]!.phase >= ROAD_CHAPTERS[i - 1]!.phase, ROAD_CHAPTERS[i]!.id);
});

test('mỗi chương đủ song ngữ: lý thuyết, ví dụ, bẫy đều có cả VI lẫn EN', () => {
  for (const c of ROAD_CHAPTERS) {
    assert.ok(c.title.vi && c.title.en, c.id);
    assert.ok(c.theory.length >= 1 && c.examples.length >= 1 && c.traps.length >= 1 && c.subtopics.length >= 1, c.id);
    for (const t of c.theory) assert.ok(t.title.vi && t.title.en && t.body.vi && t.body.en, `${c.id}: ${t.title.en}`);
    for (const e of c.examples) {
      assert.ok(e.problem && e.answer && e.steps.length > 0, c.id);
      for (const s of e.steps) assert.ok(s.vi && s.en, c.id);
    }
  }
});

test('markup toán của công thức và đề ví dụ hợp lệ', () => {
  for (const c of ROAD_CHAPTERS) {
    for (const t of c.theory) if (t.formula) assert.deepEqual(validateMath(t.formula), [], `${c.id}: ${t.formula}`);
    for (const e of c.examples) assert.deepEqual(validateMath(e.problem), [], `${c.id}: ${e.problem}`);
  }
});

test('mỗi mức của mỗi chương có template thật, và quiz sinh đủ 10 câu khác nhau', () => {
  for (const c of ROAD_CHAPTERS)
    for (const lv of ['easy', 'medium', 'hard'] as const) {
      assert.ok(c.templates[lv].length >= 1, `${c.id}/${lv} không có template`);
      for (const s of c.templates[lv]) assert.ok(getTemplate(s), `${c.id}/${lv}: thiếu template "${s}"`);
      const quiz = buildLevelQuiz(c, lv, 0);
      assert.equal(quiz.length, 10, `${c.id}/${lv}`);
      assert.equal(new Set(quiz.map((q) => q.id)).size, 10);
      // Lượt sau là câu mới.
      assert.notDeepEqual(buildLevelQuiz(c, lv, 1).map((q) => q.stem), quiz.map((q) => q.stem));
    }
});

test('mỗi chương có bộ bài bám sách: đủ bài, template thật, số mới mỗi lượt, trang sách hợp lệ', () => {
  for (const c of ROAD_CHAPTERS) {
    const set = c.bookSet ?? [];
    assert.ok(set.length >= 3, `${c.id}: bộ bài theo sách chỉ có ${set.length} bài`);
    for (const b of set) assert.ok(getTemplate(b.slug), `${c.id}: bộ sách thiếu template "${b.slug}"`);
    assert.ok(c.bookPages && c.bookPages[0] <= c.bookPages[1], `${c.id}: thiếu trang sách`);
    const r0 = buildBookSet(c, 0);
    assert.equal(r0.length, set.length, c.id);
    assert.equal(new Set(r0.map((q) => q.id)).size, set.length, `${c.id}: trùng câu`);
    assert.notDeepEqual(buildBookSet(c, 1).map((q) => q.stem), r0.map((q) => q.stem), c.id);
  }
  // Trang sách tăng dần theo chương, không chồng lên nhau.
  for (let i = 1; i < ROAD_CHAPTERS.length; i++) assert.ok(ROAD_CHAPTERS[i]!.bookPages![0] > ROAD_CHAPTERS[i - 1]!.bookPages![1], ROAD_CHAPTERS[i]!.id);
});

test('gộp tiến độ hai máy: lấy tỉ lệ cao hơn, số lượt lớn hơn', () => {
  const a = { percent: { easy: { correct: 6, total: 10, rounds: 3, at: '2026-10-01' } } };
  const b = { percent: { easy: { correct: 9, total: 10, rounds: 1, at: '2026-10-02' }, book: { correct: 20, total: 24, rounds: 1, at: '2026-10-02' } } };
  const m = mergeRoadmapProgress(a, b);
  assert.equal(m.percent!.easy!.correct, 9);
  assert.equal(m.percent!.easy!.rounds, 3);
  assert.equal(m.percent!.book!.correct, 20);
});
