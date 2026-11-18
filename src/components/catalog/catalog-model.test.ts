import assert from 'node:assert/strict';
import { test } from 'node:test';

import { foldVi, groupOfTopic, normalizeLevel, progressByLevel, recommendedStage } from './catalog-model';

test('chủ đề được xếp vào đúng một nhóm; chủ đề IELTS chỉ từ B1 trở lên', () => {
  assert.equal(groupOfTopic('Ẩm thực', 'A2'), 'life');
  assert.equal(groupOfTopic('Công việc', 'B1'), 'work');
  assert.equal(groupOfTopic('Nghề nghiệp', 'A2'), 'work');
  assert.equal(groupOfTopic('Môi trường', 'A2'), 'life');
  assert.equal(groupOfTopic('Môi trường', 'B2'), 'ielts');
  assert.equal(groupOfTopic('Lịch sử', 'C1'), 'academic');
  assert.equal(groupOfTopic('Kỹ năng học tập', 'B1'), 'academic');
});

test('chuẩn hoá mức: khoảng, độ khó chữ, chuỗi lạ', () => {
  assert.equal(normalizeLevel('B1 – B2'), 'B2');
  assert.equal(normalizeLevel('A2'), 'A2');
  assert.equal(normalizeLevel('easy'), 'A2');
  assert.equal(normalizeLevel('hard'), 'B2');
  assert.equal(normalizeLevel('???'), 'B1');
});

test('mức đề xuất = mức thấp nhất còn bài chưa làm', () => {
  const items = [
    { level: 'A2' as const, done: true },
    { level: 'A2' as const, done: true },
    { level: 'B1' as const, done: true },
    { level: 'B1' as const, done: false },
    { level: 'C1' as const, done: false },
  ];
  const p = progressByLevel(items);
  assert.deepEqual(p.map((x) => [x.key, x.done, x.total]), [['A2', 2, 2], ['B1', 1, 2], ['C1', 0, 1]]);
  assert.equal(recommendedStage(p), 'B1');
  assert.equal(recommendedStage(progressByLevel(items.map((i) => ({ ...i, done: true })))), 'C1');
  assert.equal(recommendedStage([]), null);
});

test('foldVi bỏ dấu tiếng Việt', () => {
  assert.equal(foldVi('Ẩm thực Đời sống'), 'am thuc doi song');
});
