import assert from 'node:assert/strict';
import { test } from 'node:test';

import { DICTATION_VI } from './dictation-vi';
import { DICTATION_SENTENCES } from './sentence-drills';

test('nghĩa tiếng Việt: đủ 100 mục', () => {
  assert.equal(Object.keys(DICTATION_VI).length, 100);
});

test('mỗi câu chép chính tả có đúng một bản dịch, không thừa khoá lạc', () => {
  for (const item of DICTATION_SENTENCES) {
    assert.ok(
      Object.prototype.hasOwnProperty.call(DICTATION_VI, item.id),
      `thiếu bản dịch cho: ${item.id}`,
    );
  }
  const ids = new Set(DICTATION_SENTENCES.map((i) => i.id));
  for (const key of Object.keys(DICTATION_VI)) {
    assert.ok(ids.has(key), `khoá thừa, không có câu tương ứng: ${key}`);
  }
});

test('không bản dịch nào rỗng hay chỉ có khoảng trắng', () => {
  for (const [id, vi] of Object.entries(DICTATION_VI)) {
    assert.ok(vi.trim().length > 0, `bản dịch rỗng: ${id}`);
  }
});

test('không bản dịch nào bị bỏ nguyên tiếng Anh', () => {
  // Kiểm tra rẻ tiền nhưng bắt đúng lỗi hay gặp: chép nhầm câu tiếng Anh sang
  // ô tiếng Việt, hoặc để trống rồi dán tạm bản gốc vào cho đủ khoá.
  const VIETNAMESE_DIACRITIC = /[àáâãèéêìíòóôõùúýăđĩũơưạ-ỹ]/i;
  for (const item of DICTATION_SENTENCES) {
    const vi = DICTATION_VI[item.id] ?? '';
    assert.notEqual(vi.trim(), item.text.trim(), `bản dịch trùng y hệt câu gốc: ${item.id}`);
    assert.match(vi, VIETNAMESE_DIACRITIC, `không thấy dấu tiếng Việt, nghi chưa dịch: ${item.id}`);
  }
});
