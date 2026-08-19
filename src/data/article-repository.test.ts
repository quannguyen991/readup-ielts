import { test } from 'node:test';
import assert from 'node:assert/strict';

import { chunkOf, pickBody } from './article-repository';
import type { ArticleBody } from '@/services/ingest/seed-writer';

const chunk: Record<string, ArticleBody> = {
  'id-1': { bodyText: 'first body', paragraphs: ['first body'] },
};

test('pickBody: tra được body theo id trong chunk', () => {
  assert.deepEqual(pickBody(chunk, 'id-1'), { bodyText: 'first body', paragraphs: ['first body'] });
});

test('pickBody: id không có trong chunk thì trả null, không throw', () => {
  assert.equal(pickBody(chunk, 'id-999'), null);
});

test('pickBody: chunk hỏng kiểu thì trả null', () => {
  assert.equal(pickBody(null, 'id-1'), null);
  assert.equal(pickBody('not an object' as unknown as Record<string, ArticleBody>, 'id-1'), null);
});

test('pickBody: body thiếu trường thì trả null, không trả nửa vời', () => {
  const broken = { 'id-1': { bodyText: 'x' } } as unknown as Record<string, ArticleBody>;
  assert.equal(pickBody(broken, 'id-1'), null);
});

test('chunkOf: bài không có chunk thì trả null', () => {
  assert.equal(chunkOf(null), null);
});

test('chunkOf: chunk không tồn tại thì trả null thay vì throw', () => {
  assert.equal(chunkOf(9_999), null);
});
