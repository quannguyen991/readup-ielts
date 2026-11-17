import test from 'node:test';
import assert from 'node:assert/strict';

import { hubSpeakingEntries } from './hub-entries';
import { searchEntries } from './match';

const catalog = hubSpeakingEntries();
const top = (q: string, n = 5) => searchEntries(q, catalog, { limit: n }).map((h) => h.entry.id);

test('có đủ trang, 64 chủ đề, 40 đề thi thử, 100 đề giao tiếp và gia sư', () => {
  assert.equal(new Set(catalog.map((e) => e.id)).size, catalog.length);
  assert.equal(catalog.filter((e) => e.id.startsWith('hub-topic:')).length, 64);
  assert.equal(catalog.filter((e) => e.id.startsWith('hub-mock:')).length, 40);
  assert.equal(catalog.filter((e) => e.id.startsWith('hub-gt:')).length, 100);
  assert.ok(catalog.filter((e) => e.id.startsWith('hub-tutor:')).length >= 25);
  assert.ok(catalog.every((e) => e.skill === 'speaking' && e.href.startsWith('/')));
});

test('tìm trang theo tên và theo từ khoá', () => {
  assert.equal(top('luyện theo part', 3)[0], 'hub-page:parts');
  assert.ok(top('đề thi thử speaking', 5).includes('hub-page:mock'));
  assert.ok(top('gia sư', 8).some((id) => id === 'hub-page:tutor'));
});

test('gõ câu hỏi Part 1 ra đúng chủ đề', () => {
  assert.ok(top('Did you enjoy your childhood', 5).includes('hub-topic:childhood'));
});

test('tìm đề giao tiếp theo tình huống', () => {
  assert.ok(top('phàn nàn', 10).some((id) => id.startsWith('hub-gt:gt-phan-nan')));
});
