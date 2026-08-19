import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  generateBarChart,
  generateLineChart,
  generatePieChart,
  generateTableChart,
} from './chart-generator';
import { FIGURE_SPECS, type FigureSpec } from './figure-specs';
import { validateChartData } from '@/lib/writing/chart-data';
import type { Task1Chart } from '@/lib/writing/types';

/** Mỗi mô tả hình × 6 hạt = đủ mẫu để bắt lỗi chỉ xuất hiện với một số hạt. */
const SEEDS = ['s0', 's1', 's2', 's3', 's4', 's5'];

function casesFor(kind: Task1Chart): Array<{ topic: FigureSpec; seed: string }> {
  return FIGURE_SPECS.filter((s) => s.kind === kind).flatMap((topic) =>
    SEEDS.map((seed) => ({ topic, seed })),
  );
}

test('mỗi loại hình có ít nhất năm mô tả để kho đề không nhàm', () => {
  for (const kind of ['line', 'bar', 'pie', 'table'] as const) {
    assert.ok(FIGURE_SPECS.filter((s) => s.kind === kind).length >= 5, `thiếu mô tả cho ${kind}`);
  }
});

test('mọi giá trị sinh ra đều nằm trong biên của đơn vị', () => {
  // Truc "% ho gia dinh" chay toi 125% la con so khong ton tai, ma nguoi hoc
  // lai phai chep dung so lieu vao bai.
  for (const spec of FIGURE_SPECS) {
    const [lo, hi] = spec.range;
    const chart =
      spec.kind === 'bar'
        ? generateBarChart(spec, 's0')
        : spec.kind === 'table'
          ? generateTableChart(spec, 's0')
          : spec.kind === 'pie'
            ? null
            : generateLineChart(spec, 's0');
    if (!chart) continue;

    const values =
      chart.kind === 'table'
        ? chart.rows.flatMap((r) => r.slice(1).map(Number))
        : chart.series.flatMap((x) => x.values);
    for (const v of values) {
      assert.ok(v >= lo && v <= hi, `${spec.slug}: giá trị ${v} ngoài biên ${lo}-${hi}`);
    }
  }
});

test('mọi biểu đồ đường sinh ra đều qua được bộ kiểm định', () => {
  for (const { topic, seed } of casesFor('line')) {
    const r = validateChartData(generateLineChart(topic, seed));
    assert.equal(r.ok, true, `${topic.slug}/${seed}: ${r.ok === false ? r.reason : ''}`);
  }
});

test('mọi biểu đồ đường đều có ít nhất một cặp đường cắt nhau', () => {
  // Đề không có giao cắt thì mất hẳn ý overview mạnh nhất là đổi ngôi.
  for (const { topic, seed } of casesFor('line')) {
    const chart = generateLineChart(topic, seed);
    assert.ok(
      chart.analysisKey.crossings.length >= 1,
      `${topic.slug}/${seed} không có giao cắt nào`,
    );
  }
});

test('biểu đồ cột không có trục thời gian thì có cực trị rõ rệt', () => {
  for (const { topic, seed } of casesFor('bar')) {
    const chart = generateBarChart(topic, seed);
    const r = validateChartData(chart);
    assert.equal(r.ok, true, `${topic.slug}/${seed}: ${r.ok === false ? r.reason : ''}`);

    const all = chart.series.flatMap((s) => s.values);
    const max = Math.max(...all);
    const min = Math.min(...all);
    // Cao nhất phải hơn thấp nhất ít nhất gấp rưỡi thì mới đáng so sánh.
    assert.ok(max >= min * 1.5, `${topic.slug}/${seed}: chênh lệch quá nhạt`);
  }
});

test('biểu đồ tròn hai hình luôn có đổi ngôi giữa hai mốc', () => {
  for (const { topic, seed } of casesFor('pie')) {
    const chart = generatePieChart(topic, seed);
    const r = validateChartData(chart);
    assert.equal(r.ok, true, `${topic.slug}/${seed}: ${r.ok === false ? r.reason : ''}`);
    assert.equal(chart.pies.length, 2);

    const rank = (i: number) =>
      [...(chart.pies[i]?.slices ?? [])].sort((a, b) => b.value - a.value).map((s) => s.label);
    assert.notDeepEqual(rank(0), rank(1), `${topic.slug}/${seed}: thứ hạng không đổi`);
  }
});

test('mỗi hình tròn có tổng đúng 100', () => {
  for (const { topic, seed } of casesFor('pie')) {
    for (const pie of generatePieChart(topic, seed).pies) {
      const total = pie.slices.reduce((s, x) => s + x.value, 0);
      assert.equal(total, 100, `${topic.slug}/${seed}/${pie.caption} tổng ${total}`);
    }
  }
});

test('bảng đọc ngang và đọc dọc cho hai kết luận khác nhau', () => {
  for (const { topic, seed } of casesFor('table')) {
    const chart = generateTableChart(topic, seed);
    const r = validateChartData(chart);
    assert.equal(r.ok, true, `${topic.slug}/${seed}: ${r.ok === false ? r.reason : ''}`);

    // Đọc ngang: phải có hàng tăng và hàng giảm.
    const dirs = chart.rows.map((row) => {
      const nums = row.slice(1).map(Number);
      return Math.sign((nums[nums.length - 1] ?? 0) - (nums[0] ?? 0));
    });
    assert.ok(dirs.includes(1) && dirs.includes(-1), `${topic.slug}/${seed}: mọi hàng cùng chiều`);

    // Đọc dọc: hạng nhất ở cột đầu và cột cuối phải khác nhau.
    const top = (col: number) =>
      chart.rows.reduce((best, row) => (Number(row[col] ?? 0) > Number(best[col] ?? 0) ? row : best))[0];
    assert.notEqual(
      top(1),
      top(chart.headers.length - 1),
      `${topic.slug}/${seed}: hạng nhất không đổi`,
    );
  }
});

test('cùng một hạt luôn ra cùng một biểu đồ', () => {
  const topic = FIGURE_SPECS[0];
  assert.ok(topic);
  assert.deepEqual(generateLineChart(topic, 'x'), generateLineChart(topic, 'x'));
  assert.notDeepEqual(generateLineChart(topic, 'x'), generateLineChart(topic, 'y'));
});
