import assert from 'node:assert/strict';
import { test } from 'node:test';

import { parseIgLinks } from './links';

test('lọc dòng hỏng, dòng tắt và link ngoài 9band.com; sắp theo order', () => {
  const links = parseIgLinks([
    { id: 'b', title: 'Writing', url: '/write', category: 'ielts', order: 2, active: true },
    { id: 'a', title: 'Reading', url: 'https://9band.com/ielts-source-practice', order: 1, active: true },
    { id: 'off', title: 'Tắt', url: '/sat', order: 0, active: false },
    { id: 'bad', title: 'Lạ', url: 'https://example.com/x', order: 0, active: true },
    { id: '', title: 'Không mã', url: '/sat' },
    'rác',
  ]);
  assert.deepEqual(links.map((l) => l.id), ['a', 'b']);
});

test('nhận cả dạng { items: [...] }, dòng thiếu order xếp sau cùng', () => {
  const links = parseIgLinks({ items: [{ id: 'x', title: 'X', url: '/math' }, { id: 'y', title: 'Y', url: '/sat', order: 5 }] });
  assert.deepEqual(links.map((l) => l.id), ['y', 'x']);
});

test('không phải JSON hợp lệ thì trả về rỗng', () => {
  assert.deepEqual(parseIgLinks(null), []);
  assert.deepEqual(parseIgLinks('chuỗi'), []);
});
