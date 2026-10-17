import assert from 'node:assert/strict';
import { test } from 'node:test';

import { LEVEL_LESSONS, type GrammarLevel } from './grammar-course';
import {
  PASS_PERCENT,
  TEST_SIZE,
  buildLevelTest,
  gradeLevelTest,
  hashSeed,
  mergeLevelTests,
  type LevelTestItem,
  type LevelTestRecord,
} from './level-test';

const LEVELS: GrammarLevel[] = ['A1', 'A2', 'B1', 'B2', 'C'];

test('đề kiểm tra: đủ số câu (hoặc hết câu của cấp), câu nào cũng thuộc đúng cấp và đáp án hợp lệ', () => {
  for (const level of LEVELS) {
    const total = LEVEL_LESSONS[level].reduce((n, l) => n + l.questions.length, 0);
    const items = buildLevelTest(level, 'seed-1');
    assert.equal(items.length, Math.min(TEST_SIZE, total), `cấp ${level}`);
    const ids = new Set(LEVEL_LESSONS[level].map((l) => l.id));
    for (const it of items) {
      assert.ok(ids.has(it.lessonId), `${it.lessonId} không thuộc ${level}`);
      assert.ok(it.answer >= 0 && it.answer < it.options.length, `đáp án ngoài khoảng ở ${it.lessonId}`);
    }
  }
});

test('đề kiểm tra: phủ nhiều bài nhất có thể (vòng tròn qua các bài, không dồn vào vài bài)', () => {
  for (const level of LEVELS) {
    const lessons = LEVEL_LESSONS[level].length;
    const items = buildLevelTest(level, 'seed-2');
    const covered = new Set(items.map((i) => i.lessonId)).size;
    assert.equal(covered, Math.min(TEST_SIZE, lessons), `cấp ${level} phủ ${covered} bài`);
  }
});

test('đề kiểm tra: cùng hạt giống thì cùng đề, khác hạt giống thì đề đổi thứ tự', () => {
  const a = buildLevelTest('A1', 'ngày-1');
  const b = buildLevelTest('A1', 'ngày-1');
  assert.deepEqual(a, b, 'cùng hạt giống phải cho cùng đề');
  const c = buildLevelTest('A1', 'ngày-2');
  assert.notDeepEqual(
    a.map((i) => i.q),
    c.map((i) => i.q),
    'khác hạt giống nên đổi thứ tự câu',
  );
});

test('hạt giống: băm ổn định và ra số không âm', () => {
  assert.equal(hashSeed('A1|x'), hashSeed('A1|x'));
  assert.notEqual(hashSeed('A1|x'), hashSeed('A1|y'));
  assert.ok(hashSeed('bất kỳ') >= 0);
});

const SYNTH: LevelTestItem[] = Array.from({ length: 10 }, (_, i) => ({
  lessonId: `L${i % 3}`,
  q: `câu ${i}`,
  options: ['đúng', 'sai A', 'sai B'],
  answer: 0,
}));

test('chấm điểm: 8/10 đạt ngưỡng 80%, 7/10 không đạt', () => {
  const eight = [...Array(8).fill(0), 1, 1];
  const g8 = gradeLevelTest(SYNTH, eight);
  assert.equal(g8.correct, 8);
  assert.equal(g8.percent, 80);
  assert.equal(g8.passed, true);
  assert.equal(PASS_PERCENT, 80);

  const g7 = gradeLevelTest(SYNTH, [...Array(7).fill(0), 1, 1, 1]);
  assert.equal(g7.percent, 70);
  assert.equal(g7.passed, false);
});

test('chấm điểm: câu bỏ trống tính là sai; bài sai được liệt kê một lần, theo thứ tự xuất hiện', () => {
  // Câu 8 (L2) và câu 9 (L0) sai, câu bỏ trống coi như sai.
  const picks: (number | null)[] = [0, 0, 0, 0, 0, 0, 0, 0, 1, null];
  const g = gradeLevelTest(SYNTH, picks);
  assert.equal(g.correct, 8);
  assert.deepEqual(g.weakLessonIds, ['L2', 'L0']);

  // Mọi câu của L1 đều sai thì L1 chỉ xuất hiện một lần.
  const allWrong = gradeLevelTest(SYNTH, Array(10).fill(1));
  assert.equal(allWrong.percent, 0);
  assert.equal(allWrong.passed, false);
  assert.deepEqual(allWrong.weakLessonIds, ['L0', 'L1', 'L2']);
});

test('chấm điểm: làm đúng hết thì không có bài nào cần ôn', () => {
  const g = gradeLevelTest(SYNTH, Array(10).fill(0));
  assert.equal(g.percent, 100);
  assert.equal(g.passed, true);
  assert.deepEqual(g.weakLessonIds, []);
});

test('gộp kết quả hai máy: cấp nào giữ điểm cao hơn, số lần làm lấy số lớn hơn', () => {
  const local: LevelTestRecord = {
    A1: { percent: 60, at: '2026-10-01T00:00:00.000Z', attempts: 3 },
    B1: { percent: 90, at: '2026-10-03T00:00:00.000Z', attempts: 1 },
  };
  const remote: LevelTestRecord = {
    A1: { percent: 80, at: '2026-10-02T00:00:00.000Z', attempts: 2 },
    A2: { percent: 40, at: '2026-10-04T00:00:00.000Z', attempts: 1 },
  };
  const m = mergeLevelTests(local, remote);
  assert.deepEqual(m.A1, { percent: 80, at: '2026-10-02T00:00:00.000Z', attempts: 3 }, 'remote cao hơn thì thắng, lấy attempts lớn nhất');
  assert.deepEqual(m.B1, { percent: 90, at: '2026-10-03T00:00:00.000Z', attempts: 1 }, 'cấp chỉ có ở máy này được giữ');
  assert.deepEqual(m.A2, { percent: 40, at: '2026-10-04T00:00:00.000Z', attempts: 1 }, 'cấp chỉ có ở remote được thêm vào');
  assert.equal(local.A1!.percent, 60, 'không sửa đối tượng đầu vào');
});

test('gộp kết quả: điểm bằng nhau thì lấy lần làm sau cùng', () => {
  const local: LevelTestRecord = { C: { percent: 70, at: '2026-10-06T00:00:00.000Z', attempts: 1 } };
  const later: LevelTestRecord = { C: { percent: 70, at: '2026-10-07T00:00:00.000Z', attempts: 4 } };
  const earlier: LevelTestRecord = { C: { percent: 70, at: '2026-10-05T00:00:00.000Z', attempts: 2 } };
  assert.deepEqual(mergeLevelTests(local, later).C, { percent: 70, at: '2026-10-07T00:00:00.000Z', attempts: 4 });
  assert.deepEqual(mergeLevelTests(local, earlier).C, { percent: 70, at: '2026-10-06T00:00:00.000Z', attempts: 2 });
});
