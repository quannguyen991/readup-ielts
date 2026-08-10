import { test } from 'node:test';
import assert from 'node:assert/strict';

import { normalizeArticle } from './pipeline';
import { countWords } from './tiers';
import type { RawArticle } from './types';

const COMMON = new Set(['the', 'and', 'of', 'a', 'to', 'in', 'is', 'that', 'it', 'for']);

const prose = (i: number): string =>
  `Section ${i} explains the subject in plain language for a general reader, with several clauses and enough words that the paragraph counts as genuine prose rather than a fragment of a table.`;

function raw(overrides: Partial<RawArticle> = {}): RawArticle {
  return {
    externalId: 'test-1',
    title: 'A Reasonable Article',
    sourceName: 'Wikipedia',
    sourceUrl: 'https://en.wikipedia.org/wiki/Test',
    topic: 'science',
    track: 'academic',
    licenseType: 'cc_by_sa',
    bodyText: Array.from({ length: 40 }, (_, i) => prose(i)).join('\n\n'),
    ...overrides,
  };
}

test('normalizeArticle: bài dài bị cắt về khổ tier, không giữ nguyên văn', () => {
  const original = raw();
  const originalWords = countWords(original.bodyText!);
  const result = normalizeArticle(original, COMMON);

  assert.equal(result.ok, true);
  if (!result.ok) return;

  const article = result.article;
  assert.ok(article.passageTier === 'p1' || article.passageTier === 'p2' || article.passageTier === 'p3');
  assert.ok(article.wordCount! < originalWords, 'phải cắt ngắn hơn bản gốc');
  assert.ok(article.wordCount! <= 1200, `còn ${article.wordCount} từ, vượt khổ p3`);
  // bodyText và paragraphs phải khớp nhau sau khi cắt.
  assert.equal(article.paragraphs.join('\n\n'), article.bodyText);
});

test('normalizeArticle: metadata chấm lại trên văn bản ĐÃ cắt', () => {
  const result = normalizeArticle(raw(), COMMON);
  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.article.wordCount, countWords(result.article.bodyText!));
});

test('normalizeArticle: bài Loại B không body thì tier là headline', () => {
  const result = normalizeArticle(
    raw({ bodyText: null, licenseType: 'headline_only', sourceName: 'BBC News' }),
    COMMON,
  );

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.article.passageTier, 'headline');
  assert.equal(result.article.bodyText, null);
  assert.deepEqual(result.article.paragraphs, []);
  assert.equal(result.article.wordCount, null);
});

test('normalizeArticle: headline_only có body vẫn bị bỏ body — bất biến bản quyền', () => {
  // raw() mặc định trả về 40 đoạn (~1240 từ), đủ để lọt gate và được gán
  // hẳn một passage tier nếu không bị chặn bởi licenseType — nhưng
  // headline_only tuyệt đối không được lưu toàn văn.
  const result = normalizeArticle(raw({ licenseType: 'headline_only', sourceName: 'BBC News' }), COMMON);

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.article.bodyText, null);
  assert.deepEqual(result.article.paragraphs, []);
  assert.equal(result.article.cefrLevel, null);
  assert.equal(result.article.bandRange, null);
  assert.equal(result.article.wordCount, null);
  assert.equal(result.article.estMinutes, null);
  assert.equal(result.article.readabilityScore, null);
  assert.equal(result.article.rareWordRatio, null);
});

test('normalizeArticle: nguồn tự khai tier thì tôn trọng lời khai', () => {
  const result = normalizeArticle(
    raw({ bodyText: null, licenseType: 'headline_only', passageTier: 'official_practice' }),
    COMMON,
  );

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.article.passageTier, 'official_practice');
});

test('normalizeArticle: bài bị gate loại thì trả lý do', () => {
  const result = normalizeArticle(raw({ title: 'List of test cases' }), COMMON);
  assert.deepEqual(result, { ok: false, reason: 'list_article' });
});

test('normalizeArticle: bài quá ngắn thì bị loại', () => {
  const result = normalizeArticle(
    raw({ bodyText: [prose(1), prose(2), prose(3), prose(4)].join('\n\n') }),
    COMMON,
  );

  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.reason, 'too_short');
});

test('normalizeArticle: id ổn định giữa các lần chạy', () => {
  const a = normalizeArticle(raw(), COMMON);
  const b = normalizeArticle(raw(), COMMON);
  assert.equal(a.ok && b.ok && a.article.id === b.article.id, true);
});
