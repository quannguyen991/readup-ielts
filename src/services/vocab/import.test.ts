import assert from 'node:assert/strict';
import { test } from 'node:test';

import { baseForms, candidateToStudyWord, extractCandidates } from './import';
import { clozeOf } from './topic-study';

const TEXT = `Manchester United signed a young striker on Monday. The deal reflects the club's commitment to sustainable growth.
Rising temperatures are destroying natural habitats across the region. Conservation groups warned that several endangered species could vanish.
Experts say the habitats of migratory birds are especially vulnerable.`;

test('dạng gốc: bỏ đuôi chia thường gặp', () => {
  assert.ok(baseForms('habitats').includes('habitat'));
  assert.ok(baseForms('species').includes('specie') || baseForms('species').includes('species'));
  assert.ok(baseForms('destroying').includes('destroy'));
  assert.ok(baseForms('warned').includes('warn'));
  assert.ok(baseForms('studies').includes('study'));
});

test('lọc từ đáng học, bỏ từ thông dụng và tên riêng, gom dạng chia về một từ', () => {
  const list = extractCandidates(TEXT);
  const words = list.map((c) => c.word.toLowerCase());
  assert.ok(words.includes('habitat'), words.join(','));
  const habitat = list.find((c) => c.word.toLowerCase() === 'habitat')!;
  assert.equal(habitat.count, 2, '"habitats" xuất hiện hai lần, gom về một từ');
  assert.ok(habitat.meaningVi, 'tra được nghĩa từ bộ chủ đề');
  assert.match(habitat.example, /habitats/);
  // Từ thông dụng và tên riêng không vào danh sách.
  for (const w of ['the', 'young', 'monday', 'manchester', 'united', 'club']) assert.ok(!words.includes(w), `${w} không đáng học`);
  // Từ có nghĩa đứng trước từ chưa tra được.
  const firstUnknown = list.findIndex((c) => c.meaningVi === null);
  if (firstUnknown >= 0) assert.ok(list.slice(firstUnknown).every((c) => c.meaningVi === null));
});

test('thành từ học được: câu ví dụ khoét được chính từ đó', () => {
  const list = extractCandidates(TEXT);
  const endangered = list.find((c) => c.word.toLowerCase() === 'endangered');
  assert.ok(endangered);
  const sw = candidateToStudyWord(endangered);
  assert.ok(clozeOf(sw.example, sw.word), 'câu trong bài khoét được từ');
  assert.equal(candidateToStudyWord({ ...endangered, meaningVi: null }, ' tự điền ').meaningVi, 'tự điền');
});

test('bài rỗng hoặc toàn từ thông dụng thì không có gì', () => {
  assert.deepEqual(extractCandidates(''), []);
  assert.deepEqual(extractCandidates('This is a very good day and we like it.'), []);
});
