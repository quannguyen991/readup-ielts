import assert from 'node:assert/strict';
import { test } from 'node:test';

import { anchorAnnotations } from './annotate';

const TEXT = 'The allocation of government funds toward infrastructure is a topic of debate. ' +
  'Many people believe that toward is wrong here.';

function raw(quote: string, extra: Partial<{ fix: string }> = {}) {
  return {
    quote,
    category: 'grammar' as const,
    severity: 'minor' as const,
    whyVi: 'Lý do.',
    fix: extra.fix ?? 'to',
  };
}

test('khớp chính xác thì neo đúng vị trí', () => {
  const [a] = anchorAnnotations(TEXT, [raw('toward infrastructure')]);
  assert.ok(a);
  assert.equal(TEXT.slice(a.start, a.end), 'toward infrastructure');
});

test('hai annotation trên cùng một chuỗi lặp lại thì neo vào hai chỗ khác nhau', () => {
  const out = anchorAnnotations(TEXT, [raw('toward'), raw('toward')]);
  assert.equal(out.length, 2);
  assert.notEqual(out[0]?.start, out[1]?.start);
  assert.ok((out[0]?.start ?? 0) < (out[1]?.start ?? 0));
});

test('không khớp hoa thường vẫn neo được', () => {
  const [a] = anchorAnnotations(TEXT, [raw('THE ALLOCATION')]);
  assert.ok(a);
  assert.equal(a.start, 0);
  assert.equal(TEXT.slice(a.start, a.end).toLowerCase(), 'the allocation');
});

test('lệch khoảng trắng vẫn neo được', () => {
  const [a] = anchorAnnotations(TEXT, [raw('government   funds')]);
  assert.ok(a);
  assert.equal(TEXT.slice(a.start, a.end), 'government funds');
});

test('không tìm thấy thì BỎ annotation, không đoán vị trí', () => {
  // Tô sai chỗ khiến người học sửa nhầm một câu vốn đúng — tệ hơn là mất một
  // gợi ý.
  const out = anchorAnnotations(TEXT, [raw('câu này không có trong bài')]);
  assert.equal(out.length, 0);
});

test('annotation chồng lấn nhau thì chỉ giữ cái đầu', () => {
  const out = anchorAnnotations(TEXT, [raw('government funds toward'), raw('funds toward')]);
  assert.equal(out.length, 1);
  assert.equal(TEXT.slice(out[0]?.start ?? 0, out[0]?.end ?? 0), 'government funds toward');
});

test('kết quả xếp theo vị trí trong bài, không theo thứ tự model trả về', () => {
  const out = anchorAnnotations(TEXT, [raw('wrong here'), raw('The allocation')]);
  assert.equal(out.length, 2);
  assert.ok((out[0]?.start ?? 0) < (out[1]?.start ?? 0));
  assert.equal(out[0]?.quote, 'The allocation');
});

test('quote rỗng hoặc chỉ khoảng trắng thì bỏ', () => {
  assert.equal(anchorAnnotations(TEXT, [raw(''), raw('   ')]).length, 0);
});

test('giữ nguyên các trường còn lại của annotation', () => {
  const [a] = anchorAnnotations(TEXT, [raw('toward infrastructure', { fix: 'to' })]);
  assert.ok(a);
  assert.equal(a.category, 'grammar');
  assert.equal(a.severity, 'minor');
  assert.equal(a.whyVi, 'Lý do.');
  assert.equal(a.fix, 'to');
});

test('bài rỗng thì trả mảng rỗng, không ném lỗi', () => {
  assert.deepEqual(anchorAnnotations('', [raw('gì đó')]), []);
});
