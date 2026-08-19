import { test } from 'node:test';
import assert from 'node:assert/strict';

import { assignTier, countWords, gateLimitsFor, refineTier, truncateToTier } from './tiers';

/** n từ, mỗi từ là "alpha" — countWords đếm được đúng n. */
const para = (n: number): string => Array.from({ length: n }, () => 'alpha').join(' ');

/** Câu 50 từ, bắt đầu bằng chữ hoa để splitSentences tách được. */
const sentence50 = `Alpha ${para(49)}.`;

/** Câu 20 từ — khổ SAT ngắn cần đơn vị nhỏ hơn để cắt cho vừa. */
const sentence20 = `Alpha ${para(19)}.`;

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

test('truncateToTier: một đoạn dài quá trần của tier IELTS cũng bị cắt', () => {
  // Wikipedia có những mục dài liền một khối. 1424 từ nằm dưới target*1.5 của
  // p3 (1575) nên luật cũ để nguyên, trong khi khổ p3 chốt ở 1250.
  const oneHugeParagraph = [Array.from({ length: 30 }, () => sentence50).join(' ')];
  const kept = truncateToTier(oneHugeParagraph, 'p3');

  assert.equal(kept.length, 1);
  assert.ok(countWords(kept[0]!) <= 1250, `còn ${countWords(kept[0]!)} từ, vượt trần 1250 của p3`);
});

test('assignTier: KHÔNG bao giờ tự suy ra tier SAT', () => {
  // Nguồn SAT luôn tự khai tier. Nếu assignTier tự gán, bài IELTS 100 từ sẽ
  // lẻn vào kho SAT.
  for (const words of [30, 120, 600, 720, 3000]) {
    const tier = assignTier(words, 'B2');
    assert.ok(
      tier === null || !tier.startsWith('sat_'),
      `${words} từ ra ${tier}, không được là tier SAT`,
    );
  }
});

test('truncateToTier: sat_short không vượt trần 150 từ', () => {
  // Một đoạn 160 từ nằm dưới target*1.5 (195) nên luật cũ sẽ để nguyên,
  // trong khi khổ SAT ngắn chốt cứng ở 150.
  const oneLongParagraph = [Array.from({ length: 8 }, () => sentence20).join(' ')];
  const kept = truncateToTier(oneLongParagraph, 'sat_short');

  assert.equal(kept.length, 1);
  assert.ok(countWords(kept[0]!) <= 150, `còn ${countWords(kept[0]!)} từ, vượt trần 150`);
});

test('truncateToTier: sat_short cắt tại ranh giới đoạn khi có nhiều đoạn', () => {
  const kept = truncateToTier([para(90), para(90), para(90)], 'sat_short');
  const total = kept.reduce((sum, p) => sum + countWords(p), 0);

  assert.equal(kept.length, 1, 'đoạn thứ hai sẽ vượt khổ 130 nên phải dừng');
  assert.ok(total <= 150);
});

test('truncateToTier: sat_long giữ khổ 500–750 từ', () => {
  const kept = truncateToTier(Array.from({ length: 20 }, () => para(120)), 'sat_long');
  const total = kept.reduce((sum, p) => sum + countWords(p), 0);

  assert.ok(total >= 500, `mới ${total} từ, dưới min 500 của sat_long`);
  assert.ok(total <= 750, `${total} từ, vượt trần 750 của sat_long`);
});

test('refineTier: hạ tier khi bản đã cắt ngắn hơn sàn của tier', () => {
  // Bài "Cultural expressions": gán p3 theo tổng số từ, cắt theo câu còn 893.
  assert.equal(refineTier('p3', 893), 'p2');
  assert.equal(refineTier('p3', 700), 'p1');
  assert.equal(refineTier('p2', 400), 'short_academic');
});

test('refineTier: đủ khổ thì giữ nguyên tier', () => {
  assert.equal(refineTier('p3', 1000), 'p3');
  assert.equal(refineTier('p1', 650), 'p1');
});

test('refineTier: không đụng vào tier ngoài nhóm passage IELTS', () => {
  for (const tier of ['sat_short', 'sat_long', 'short_academic', 'headline'] as const) {
    assert.equal(refineTier(tier, 10), tier);
  }
});

test('gateLimitsFor: nới ngưỡng cho passage SAT, giữ nguyên cho IELTS', () => {
  assert.deepEqual(gateLimitsFor('sat_short'), { minParagraphs: 1, minWords: 25 });
  assert.deepEqual(gateLimitsFor('sat_long'), { minParagraphs: 2, minWords: 500 });
  assert.deepEqual(gateLimitsFor('p2'), { minParagraphs: 4, minWords: 150 });
  assert.deepEqual(gateLimitsFor('short_academic'), { minParagraphs: 4, minWords: 150 });
});
