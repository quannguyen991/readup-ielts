import assert from 'node:assert/strict';
import { test } from 'node:test';

import { combineTotal, MATH_WEIGHTS, predictSection } from './score';

const t = (correct: number, total: number) => ({ correct, total });

test('chưa đủ 10 câu thì không dự đoán', () => {
  assert.equal(predictSection({ algebra: t(5, 9) }, MATH_WEIGHTS), null);
});

test('khoảng chứa điểm giữa, hẹp dần khi làm nhiều câu hơn', () => {
  const few = predictSection({ algebra: t(8, 10), advanced_math: t(6, 10), problem_solving_data: t(3, 5), geometry_trig: t(2, 5) }, MATH_WEIGHTS)!;
  const many = predictSection(
    { algebra: t(80, 100), advanced_math: t(60, 100), problem_solving_data: t(30, 50), geometry_trig: t(20, 50) },
    MATH_WEIGHTS,
  )!;
  for (const p of [few, many]) {
    assert.ok(p.low <= p.mid && p.mid <= p.high);
    assert.ok(p.low >= 200 && p.high <= 800);
  }
  assert.ok(many.halfWidth < few.halfWidth, 'nhiều dữ liệu hơn → khoảng hẹp hơn');
  assert.ok(Math.abs(many.mid - few.mid) <= 60, 'cùng tỉ lệ đúng → điểm giữa gần nhau');
});

test('mảng chưa làm câu nào làm khoảng rộng ra và được chỉ ra', () => {
  const p = predictSection({ algebra: t(40, 50), advanced_math: t(40, 50), problem_solving_data: t(20, 25), geometry_trig: t(0, 0) }, MATH_WEIGHTS)!;
  assert.equal(p.widestDomain, 'geometry_trig');
  assert.ok(p.needMore !== null && p.needMore > 0);
});

test('cần thêm bao nhiêu câu: làm đúng số đó thì khoảng đạt mục tiêu', () => {
  const tallies = { algebra: t(30, 40), advanced_math: t(25, 40), problem_solving_data: t(10, 15), geometry_trig: t(8, 15) };
  const p = predictSection(tallies, MATH_WEIGHTS, 30)!;
  assert.ok(p.needMore! > 0);
  // Mô phỏng làm thêm needMore câu theo tỉ trọng, cùng tỉ lệ đúng.
  const k = p.needMore!;
  const grown = Object.fromEntries(
    Object.entries(tallies).map(([d, v]) => {
      const add = k * MATH_WEIGHTS[d as keyof typeof MATH_WEIGHTS];
      return [d, t(v.correct + (add * v.correct) / v.total, v.total + add)];
    }),
  );
  assert.ok(predictSection(grown, MATH_WEIGHTS, 30)!.halfWidth <= 32);
});

test('tổng hai phần nằm trong 400–1600 và bằng tổng hai điểm giữa', () => {
  const m = predictSection({ algebra: t(40, 50), advanced_math: t(35, 50), problem_solving_data: t(15, 20), geometry_trig: t(12, 20) }, MATH_WEIGHTS)!;
  const v = predictSection({ algebra: t(30, 50), advanced_math: t(30, 50), problem_solving_data: t(10, 20), geometry_trig: t(10, 20) }, MATH_WEIGHTS)!;
  const total = combineTotal(m, v);
  assert.ok(total.low >= 400 && total.high <= 1600);
  assert.ok(Math.abs(total.mid - (m.mid + v.mid)) <= 10);
});
