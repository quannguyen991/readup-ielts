import { test } from 'node:test';
import assert from 'node:assert/strict';

import { assignTier, countWords, truncateToTier } from './tiers';

/** n từ, mỗi từ là "alpha" — countWords đếm được đúng n. */
const para = (n: number): string => Array.from({ length: n }, () => 'alpha').join(' ');

/** Câu 50 từ, bắt đầu bằng chữ hoa để splitSentences tách được. */
const sentence50 = `Alpha ${para(49)}.`;

test('assignTier: dưới 150 từ thì loại bỏ', () => {
  assert.equal(assignTier(149, 'B1'), null);
  assert.equal(assignTier(0, null), null);
});

test('assignTier: ngắn hơn mọi passage thành short_academic', () => {
  assert.equal(assignTier(150, 'B2'), 'short_academic');
  assert.equal(assignTier(649, 'C1'), 'short_academic');
});

test('assignTier: không có khoảng hở giữa short_academic và p1', () => {
  assert.equal(assignTier(649, 'B1'), 'short_academic');
  assert.equal(assignTier(650, 'B1'), 'p1');
});

test('assignTier: CEFR chọn tier trong số ứng viên', () => {
  assert.equal(assignTier(1200, 'B1'), 'p1');
  assert.equal(assignTier(1200, 'B2'), 'p2');
  assert.equal(assignTier(1200, 'C2'), 'p3');
});

test('assignTier: CEFR không khớp ứng viên nào thì lấy tier lớn nhất khả thi', () => {
  // 700 từ chỉ đủ p1. C2 không nằm trong dải p1 nhưng vẫn ra p1 vì đó là
  // tier lớn nhất khả thi — độ khó thật vẫn lưu riêng ở cefrLevel.
  assert.equal(assignTier(700, 'C2'), 'p1');
});

test('assignTier: không biết CEFR thì lấy tier lớn nhất khả thi', () => {
  assert.equal(assignTier(1200, null), 'p3');
  assert.equal(assignTier(820, null), 'p2');
  assert.equal(assignTier(700, null), 'p1');
});

test('truncateToTier: cắt tại ranh giới đoạn, không vượt khổ', () => {
  const paragraphs = Array.from({ length: 20 }, () => para(100));
  const kept = truncateToTier(paragraphs, 'p1');
  const total = kept.reduce((sum, p) => sum + countWords(p), 0);

  assert.ok(kept.length < 20, 'phải bỏ bớt đoạn');
  assert.ok(total <= 750, `tổng ${total} không được vượt target 750`);
  assert.ok(total >= 650, `tổng ${total} phải đạt min của p1`);
});

test('truncateToTier: luôn giữ ít nhất một đoạn', () => {
  assert.equal(truncateToTier([para(5000)], 'p1').length, 1);
});

test('truncateToTier: một đoạn dài quá khổ thì cắt tiếp theo câu', () => {
  const huge = Array.from({ length: 40 }, () => sentence50).join(' ');
  const kept = truncateToTier([huge], 'p1');

  assert.equal(kept.length, 1);
  assert.ok(countWords(kept[0]!) <= 800, `còn ${countWords(kept[0]!)} từ, phải ≈≤750`);
});

test('truncateToTier: tier không phải passage thì giữ nguyên', () => {
  const paragraphs = [para(100), para(100)];
  assert.deepEqual(truncateToTier(paragraphs, 'short_academic'), paragraphs);
  assert.deepEqual(truncateToTier(paragraphs, 'headline'), paragraphs);
});
