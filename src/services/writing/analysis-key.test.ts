import assert from 'node:assert/strict';
import { test } from 'node:test';

import { deriveAnalysisKey } from './analysis-key';
import type { LineOrBarChart } from '@/lib/writing/types';

function chart(series: Array<{ name: string; values: number[] }>): LineOrBarChart {
  return {
    kind: 'line',
    title: 'T',
    unit: 'u',
    xLabels: ['2000', '2010', '2020'],
    series,
    // deriveAnalysisKey không đọc trường này, nhưng kiểu bắt phải có.
    analysisKey: { trends: [], extremes: [], crossings: [], grouping: [[], []] },
  };
}

test('nhận ra chiều tăng, giảm và đứng yên', () => {
  const key = deriveAnalysisKey(
    chart([
      { name: 'Up', values: [10, 50, 90] },
      { name: 'Down', values: [90, 50, 10] },
      { name: 'Flat', values: [50, 51, 50] },
    ]),
  );
  const dir = (name: string) => key.trends.find((t) => t.subject === name)?.direction;
  assert.equal(dir('Up'), 'up');
  assert.equal(dir('Down'), 'down');
  assert.equal(dir('Flat'), 'stable');
});

test('đường lên rồi xuống được xếp là dao động, không phải tăng', () => {
  const key = deriveAnalysisKey(chart([{ name: 'Wave', values: [10, 90, 12] }, { name: 'B', values: [1, 2, 3] }]));
  assert.equal(key.trends[0]?.direction, 'fluctuating');
});

test('mức thay đổi tính theo tỷ lệ so với đầu kỳ', () => {
  const key = deriveAnalysisKey(
    chart([
      { name: 'Big', values: [10, 50, 100] },
      { name: 'Small', values: [100, 102, 105] },
    ]),
  );
  assert.equal(key.trends.find((t) => t.subject === 'Big')?.magnitude, 'large');
  assert.equal(key.trends.find((t) => t.subject === 'Small')?.magnitude, 'small');
});

test('from và to lấy đúng giá trị đầu và cuối kỳ', () => {
  const key = deriveAnalysisKey(
    chart([
      { name: 'A', values: [45, 95, 155] },
      { name: 'B', values: [90, 50, 10] },
    ]),
  );
  const a = key.trends.find((t) => t.subject === 'A');
  assert.equal(a?.from, 45);
  assert.equal(a?.to, 155);
});

test('cực trị ghi cả đầu kỳ và cuối kỳ', () => {
  const key = deriveAnalysisKey(
    chart([
      { name: 'A', values: [10, 50, 90] },
      { name: 'B', values: [90, 50, 10] },
    ]),
  );
  const at = (label: string, rank: 'highest' | 'lowest') =>
    key.extremes.find((e) => e.at === label && e.rank === rank)?.subject;
  assert.equal(at('2000', 'highest'), 'B');
  assert.equal(at('2000', 'lowest'), 'A');
  assert.equal(at('2020', 'highest'), 'A');
  assert.equal(at('2020', 'lowest'), 'B');
});

test('giữ hạng nhất suốt kỳ thì ghi throughout thay vì ghi hai lần', () => {
  const key = deriveAnalysisKey(
    chart([
      { name: 'Top', values: [90, 92, 95] },
      { name: 'Low', values: [10, 12, 15] },
    ]),
  );
  assert.ok(
    key.extremes.some((e) => e.subject === 'Top' && e.rank === 'highest' && e.at === 'throughout'),
  );
  assert.ok(
    key.extremes.some((e) => e.subject === 'Low' && e.rank === 'lowest' && e.at === 'throughout'),
  );
  assert.equal(key.extremes.filter((e) => e.subject === 'Top').length, 1);
});

test('tìm được chỗ hai đường cắt nhau', () => {
  const key = deriveAnalysisKey(
    chart([
      { name: 'A', values: [10, 50, 90] },
      { name: 'B', values: [90, 50, 10] },
    ]),
  );
  assert.equal(key.crossings.length, 1);
  const c = key.crossings[0];
  assert.ok(c);
  assert.deepEqual([c.subject, c.other].sort(), ['A', 'B']);
});

test('hai đường song song thì không có giao cắt nào', () => {
  const key = deriveAnalysisKey(
    chart([
      { name: 'A', values: [10, 20, 30] },
      { name: 'B', values: [50, 60, 70] },
    ]),
  );
  assert.equal(key.crossings.length, 0);
});

test('nhóm theo chiều xu hướng khi có cả tăng lẫn giảm', () => {
  const key = deriveAnalysisKey(
    chart([
      { name: 'U1', values: [10, 50, 90] },
      { name: 'U2', values: [20, 40, 80] },
      { name: 'D1', values: [90, 50, 10] },
    ]),
  );
  assert.deepEqual([...key.grouping[0]].sort(), ['U1', 'U2']);
  assert.deepEqual(key.grouping[1], ['D1']);
});

test('mọi chuỗi cùng chiều thì nhóm theo mức thay đổi, không để một nhóm rỗng', () => {
  const key = deriveAnalysisKey(
    chart([
      { name: 'Fast', values: [10, 60, 120] },
      { name: 'Slow', values: [100, 103, 106] },
      { name: 'Mid', values: [50, 70, 95] },
    ]),
  );
  assert.ok(key.grouping[0].length > 0);
  assert.ok(key.grouping[1].length > 0);
  assert.equal(key.grouping[0].length + key.grouping[1].length, 3);
});

test('đề một chuỗi thì ném lỗi ngay lúc sinh, không lặng lẽ ra nhóm rỗng', () => {
  // Đề một chuỗi không chia được hai đoạn thân bài. Bộ sinh không được phép tạo
  // ra đề như vậy, nên lộ ngay ở đây chứ không để validateChartData chặn ở tận
  // cuối, lúc đã khó lần ra chỗ hỏng.
  assert.throws(() => deriveAnalysisKey(chart([{ name: 'Only', values: [1, 2, 3] }])), /hai nhóm/);
});
