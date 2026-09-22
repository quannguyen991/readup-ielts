import test from 'node:test';
import assert from 'node:assert/strict';

import { parseReferences } from './knowledge-base';

/**
 * Kiểm bóc nguồn từ `references` của LightRAG.
 *
 * Chỗ đáng hỏng: shape `references` đổi theo phiên bản LightRAG. Ta nạp kho với
 * `file_sources` = tên bài, nên tên bài phải ra từ `file_path`; các khoá khác chỉ
 * là dự phòng. Và một shape lạ KHÔNG được làm hỏng cả lượt — phải trả mảng rỗng.
 */

test('lấy tên bài từ file_path', () => {
  const out = parseReferences([{ file_path: 'The Great Barrier Reef [science]' }]);
  assert.deepEqual(out, [{ title: 'The Great Barrier Reef [science]' }]);
});

test('dự phòng title rồi reference_id khi thiếu file_path', () => {
  const out = parseReferences([{ title: 'Bài A' }, { reference_id: 'doc-123' }]);
  assert.deepEqual(out, [{ title: 'Bài A' }, { title: 'doc-123' }]);
});

test('bỏ trùng, giữ thứ tự xuất hiện đầu', () => {
  const out = parseReferences([
    { file_path: 'Bài A' },
    { file_path: 'Bài B' },
    { file_path: 'Bài A' },
  ]);
  assert.deepEqual(out, [{ title: 'Bài A' }, { title: 'Bài B' }]);
});

test('đầu vào không phải mảng thì trả rỗng', () => {
  assert.deepEqual(parseReferences(undefined), []);
  assert.deepEqual(parseReferences(null), []);
  assert.deepEqual(parseReferences('lung tung'), []);
});

test('phần tử rác bị bỏ qua, không ném lỗi', () => {
  const out = parseReferences([null, 42, {}, { file_path: '' }, { file_path: 'Bài C' }]);
  assert.deepEqual(out, [{ title: 'Bài C' }]);
});
