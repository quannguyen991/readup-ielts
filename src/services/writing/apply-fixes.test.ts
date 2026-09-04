import test from 'node:test';
import assert from 'node:assert/strict';

import { applyFixes, countApplicableFixes } from './apply-fixes';
import type { WritingAnnotation } from '@/lib/writing/types';

const TEXT = 'it demonstrate a linear process which is consists of many stages.';

/**
 * Offset tính từ chính đoạn trích chứ không gõ tay: đếm ký tự bằng tay là chỗ
 * sai vặt của người viết test, và một offset lệch một ô sẽ trông y hệt một lỗi
 * thật của hàm đang kiểm.
 */
function at(quote: string, fix: string, over: Partial<WritingAnnotation> = {}): WritingAnnotation {
  const start = TEXT.indexOf(quote);
  return {
    start,
    end: start + quote.length,
    quote,
    category: 'grammar',
    severity: 'minor',
    whyVi: '',
    fix,
    ...over,
  };
}

test('không có lỗi nào thì bài giữ nguyên', () => {
  assert.equal(applyFixes(TEXT, []), TEXT);
});

test('thay đúng đoạn đã đánh dấu', () => {
  const out = applyFixes(TEXT, [at('it demonstrate', 'it demonstrates')]);
  assert.equal(out, 'it demonstrates a linear process which is consists of many stages.');
});

test('nhiều lỗi được vá theo đúng thứ tự, phần giữa giữ nguyên', () => {
  const out = applyFixes(TEXT, [
    at('it demonstrate', 'it demonstrates'),
    at('which is consists', 'which consists'),
  ]);
  assert.equal(out, 'it demonstrates a linear process which consists of many stages.');
});

test('annotation không có bản sửa thì bỏ qua', () => {
  assert.equal(applyFixes(TEXT, [at('it demonstrate', '  ')]), TEXT);
});

test('annotation chồng lấn nhau thì chỉ áp cái đầu tiên', () => {
  const overlapping = [at('it demonstrate', 'it demonstrates'), at('demonstrate', 'shows')];
  assert.equal(
    applyFixes(TEXT, overlapping),
    'it demonstrates a linear process which is consists of many stages.',
  );
  assert.equal(countApplicableFixes(TEXT, overlapping), 1);
});

test('offset vượt ngoài bài thì bỏ qua, không cắt cụt bài', () => {
  const out = applyFixes(TEXT, [at('stages.', 'phases.', { start: 60, end: 999 })]);
  assert.equal(out, TEXT);
});

test('đếm đúng số chỗ vá được', () => {
  assert.equal(
    countApplicableFixes(TEXT, [
      at('it demonstrate', 'it demonstrates'),
      at('which is consists', 'which consists'),
      at('many', ''),
    ]),
    2,
  );
});
