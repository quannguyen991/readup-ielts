import assert from 'node:assert/strict';
import { test } from 'node:test';

import { validateChartData } from './chart-data';
import type { AnalysisKey } from './types';

const KEY: AnalysisKey = {
  trends: ['A tăng'],
  extremes: ['A cao nhất'],
  crossings: [],
  grouping: [['A'], ['B']],
};

const line = {
  kind: 'line',
  title: 'Petrol prices',
  unit: 'cents',
  xLabels: ['2000', '2005'],
  series: [{ name: 'A', values: [45, 68] }],
  analysisKey: KEY,
};

test('biểu đồ đường hợp lệ thì qua', () => {
  const r = validateChartData(line);
  assert.equal(r.ok, true);
});

test('số điểm dữ liệu phải khớp số nhãn trục X', () => {
  const r = validateChartData({ ...line, series: [{ name: 'A', values: [45] }] });
  assert.equal(r.ok, false);
  assert.match(r.ok === false ? r.reason : '', /nhãn trục X/);
});

test('cần ít nhất hai mốc trên trục X, một mốc thì không có gì để mô tả', () => {
  const r = validateChartData({ ...line, xLabels: ['2000'], series: [{ name: 'A', values: [1] }] });
  assert.equal(r.ok, false);
});

test('lát của một hình tròn phải cộng lại xấp xỉ 100', () => {
  const r = validateChartData({
    kind: 'pie',
    title: 'Energy',
    unit: '%',
    pies: [{ caption: '1995', slices: [{ label: 'Coal', value: 52 }, { label: 'Gas', value: 20 }] }],
    analysisKey: KEY,
  });
  assert.equal(r.ok, false);
  assert.match(r.ok === false ? r.reason : '', /100/);
});

test('mọi hàng của bảng phải đủ số cột như tiêu đề', () => {
  const r = validateChartData({
    kind: 'table',
    title: 'Water',
    unit: 'litres',
    headers: ['Country', '2000', '2010'],
    rows: [
      ['Australia', 340, 300],
      ['China', 88],
    ],
    analysisKey: KEY,
  });
  assert.equal(r.ok, false);
});

test('sơ đồ quy trình cần ít nhất ba bước', () => {
  const r = validateChartData({
    kind: 'process',
    title: 'Coffee',
    steps: ['hái', 'sấy'],
    isCycle: false,
    analysisKey: KEY,
  });
  assert.equal(r.ok, false);
});

test('ô trên bản đồ phải nằm gọn trong khung 0–1', () => {
  // Phải đủ hai khung, nếu không test sẽ đỏ vì lý do khác (thiếu khung) và
  // không còn kiểm được điều nó định kiểm.
  const ok = { shape: 'green', label: 'Forest', x: 0.1, y: 0.1, w: 0.3, h: 0.3 };
  const r = validateChartData({
    kind: 'map',
    title: 'Island',
    panels: [
      { caption: '1990', items: [ok] },
      { caption: '2020', items: [{ ...ok, label: 'Hotel', x: 0.8, w: 0.5 }] },
    ],
    analysisKey: KEY,
  });
  assert.equal(r.ok, false);
  assert.match(r.ok === false ? r.reason : '', /ngoài khung/);
});

test('đề kết hợp phải có đúng hai hình và không được lồng tiếp mixed', () => {
  const bad = { kind: 'mixed', title: 'X', parts: [line], analysisKey: KEY };
  assert.equal(validateChartData(bad).ok, false);

  const nested = {
    kind: 'mixed',
    title: 'X',
    parts: [line, { ...line, kind: 'mixed' }],
    analysisKey: KEY,
  };
  assert.equal(validateChartData(nested).ok, false);
});

test('đề kết hợp hợp lệ thì qua', () => {
  const table = {
    kind: 'table',
    title: 'Rainfall',
    unit: 'mm',
    headers: ['City', 'Rainfall'],
    rows: [
      ['Oslo', 763],
      ['Lisbon', 726],
    ],
    analysisKey: KEY,
  };
  const r = validateChartData({ kind: 'mixed', title: 'Climate', parts: [line, table], analysisKey: KEY });
  assert.equal(r.ok, true);
});

test('analysisKey phải có đủ hai nhóm, vì hai nhóm là hai đoạn thân bài', () => {
  const r = validateChartData({ ...line, analysisKey: { ...KEY, grouping: [['A']] } });
  assert.equal(r.ok, false);
});

test('kind lạ thì trả lỗi chứ không ném ngoại lệ', () => {
  assert.equal(validateChartData({ ...line, kind: 'donut' }).ok, false);
  assert.equal(validateChartData(null).ok, false);
  assert.equal(validateChartData([]).ok, false);
});
