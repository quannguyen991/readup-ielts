import { test } from 'node:test';
import assert from 'node:assert/strict';

import { cleanExtract } from './wikipedia';

/** Câu n từ, kết bằng dấu chấm — đủ dài để cleanExtract coi là đoạn văn. */
const sentence = (n: number, first = 'Alpha'): string =>
  `${first} ${Array.from({ length: Math.max(0, n - 2) }, () => 'beta').join(' ')} gamma.`;

/**
 * Extract của MediaWiki: các đoạn trong cùng mục cách nhau MỘT dòng, tên mục
 * đứng sau hai dòng trống.
 */
const extract = [
  `${sentence(20, 'Intro')}\n${sentence(20, 'Second')}`,
  `Overview\n${sentence(20, 'Overview')}\n${sentence(20, 'More')}`,
  `References\n${sentence(20, 'Citation')}`,
].join('\n\n\n');

test('cleanExtract: mỗi đoạn trong một mục là một đoạn riêng', () => {
  const paragraphs = cleanExtract(extract).split('\n\n');

  assert.equal(paragraphs.length, 4);
  assert.match(paragraphs[0]!, /^Intro /);
  assert.match(paragraphs[1]!, /^Second /);
});

test('cleanExtract: bỏ tên mục, không dán vào đầu đoạn', () => {
  const paragraphs = cleanExtract(extract).split('\n\n');

  assert.match(paragraphs[2]!, /^Overview beta/, 'tên mục phải bị bỏ hẳn');
  for (const p of paragraphs) {
    assert.equal(p.startsWith('Overview '), p.startsWith('Overview beta'));
  }
});

test('cleanExtract: dừng hẳn ở mục References', () => {
  assert.equal(cleanExtract(extract).includes('Citation'), false);
});

test('cleanExtract: bỏ dòng quá ngắn (chú thích ảnh, dòng lạc)', () => {
  const text = `Caption line\n${sentence(20, 'Real')}`;
  const paragraphs = cleanExtract(text).split('\n\n');

  assert.equal(paragraphs.length, 1);
  assert.match(paragraphs[0]!, /^Real /);
});

test('cleanExtract: tên mục kết bằng dấu chấm hỏi vẫn là câu, không bị bỏ', () => {
  // Nhiều bài có đoạn mở đầu là câu hỏi tu từ; bỏ nhầm là mất nội dung.
  const text = `Why does the sky look blue to the human eye at midday in clear weather?\n${sentence(20, 'Because')}`;
  assert.match(cleanExtract(text), /^Why does the sky/);
});
