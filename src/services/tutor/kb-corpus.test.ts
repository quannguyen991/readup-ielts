import assert from 'node:assert/strict';
import test from 'node:test';

import type { ArticleBody, SeedIndexEntry } from '@/services/ingest/seed-writer';

import { batches, buildFileSource, buildKbDoc, conLai } from './kb-corpus';

/**
 * Kiểm phép biến đổi seed -> tài liệu của kho tri thức.
 *
 * Chỗ đáng hỏng nhất là `fileSource`: chỉ mục đã nạp theo dạng "Tên bài [chủ đề]",
 * và `knowledge-base.parseReferences` đọc lại đúng chuỗi đó để hiện nguồn. Đổi
 * cách ghép mà không ai bắt được thì câu trả lời vẫn ra, chỉ là mất tên bài —
 * đúng kiểu hỏng im lặng.
 */

const meta = (over: Partial<SeedIndexEntry> = {}) =>
  ({ id: 'a1', title: 'Great Barrier Reef', topic: 'environment', ...over }) as SeedIndexEntry;

const than = (bodyText: string) => ({ bodyText, paragraphs: [] }) as ArticleBody;

test('ghép tên nguồn theo dạng "Tên bài [chủ đề]"', () => {
  assert.equal(buildFileSource('Great Barrier Reef', 'environment'), 'Great Barrier Reef [environment]');
});

test('không có chủ đề thì không để lại ngoặc rỗng', () => {
  assert.equal(buildFileSource('Bài lẻ', ''), 'Bài lẻ');
  assert.equal(buildFileSource('Bài lẻ', null), 'Bài lẻ');
  assert.equal(buildFileSource('Bài lẻ', undefined), 'Bài lẻ');
});

test('tên rỗng vẫn ra một chuỗi dùng được', () => {
  assert.equal(buildFileSource('   ', 'science'), 'untitled [science]');
});

test('dựng tài liệu: giữ nguyên văn thân bài, không kèm tiêu đề', () => {
  const doc = buildKbDoc(meta(), than('The reef is the largest coral system.'));
  assert.deepEqual(doc, {
    id: 'a1',
    fileSource: 'Great Barrier Reef [environment]',
    text: 'The reef is the largest coral system.',
  });
});

test('bài không có thân thì BỎ QUA, không nạp phần mô tả', () => {
  assert.equal(buildKbDoc(meta(), null), null);
  assert.equal(buildKbDoc(meta(), undefined), null);
  assert.equal(buildKbDoc(meta(), than('   ')), null);
});

test('cắt mẻ: chia hết và chia lẻ đều đúng', () => {
  assert.deepEqual(batches([1, 2, 3, 4], 2), [
    [1, 2],
    [3, 4],
  ]);
  assert.deepEqual(batches([1, 2, 3], 2), [[1, 2], [3]]);
  assert.deepEqual(batches([], 2), []);
});

test('cỡ mẻ vô lý không làm treo vòng lặp', () => {
  assert.deepEqual(batches([1, 2], 0), [[1], [2]]);
  assert.deepEqual(batches([1, 2], -5), [[1], [2]]);
});

test('bỏ bài đã nạp, so theo id chứ không theo tên', () => {
  const docs = [
    { id: 'a1', fileSource: 'Trùng tên', text: 'x' },
    { id: 'a2', fileSource: 'Trùng tên', text: 'y' },
  ];
  assert.deepEqual(conLai(docs, new Set(['a1'])), [{ id: 'a2', fileSource: 'Trùng tên', text: 'y' }]);
  assert.deepEqual(conLai(docs, new Set()), docs);
});
