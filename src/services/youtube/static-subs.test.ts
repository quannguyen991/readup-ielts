import assert from 'node:assert/strict';
import { test } from 'node:test';

import { fetchStaticSubs, parseStaticSubs } from './static-subs';

const good = { videoId: 'abcdefghijk', source: 'manual', sentences: [{ start: 0, end: 2, text: 'Hello there.' }, { start: 2, end: 4, text: 'How are you?' }, { start: 4, end: 6, text: 'Fine.' }] };

test('đọc tệp phụ đề hợp lệ, nhận ra bản tự động', () => {
  assert.equal(parseStaticSubs(good)?.sentences.length, 3);
  assert.equal(parseStaticSubs(good)?.auto, false);
  assert.equal(parseStaticSubs({ ...good, source: 'auto' })?.auto, true);
});

test('dữ liệu hỏng hoặc quá ngắn thì null', () => {
  assert.equal(parseStaticSubs(null), null);
  assert.equal(parseStaticSubs({ sentences: 'x' }), null);
  assert.equal(parseStaticSubs({ sentences: [{ start: 0, end: 1, text: 'a' }] }), null);
  assert.equal(parseStaticSubs({ sentences: [{ start: 'x', end: 1, text: 'a' }, { start: 0, end: 1, text: ' ' }, { start: 0, end: 1, text: 'b' }] }), null);
});

test('fetchStaticSubs: 404, lỗi mạng và id lạ đều trả null', async () => {
  assert.equal(await fetchStaticSubs('abcdefghijk', async () => ({ ok: false, json: async () => ({}) })), null);
  assert.equal(await fetchStaticSubs('abcdefghijk', async () => { throw new Error('net'); }), null);
  assert.equal(await fetchStaticSubs('../x', async () => ({ ok: true, json: async () => good })), null);
  const r = await fetchStaticSubs('abcdefghijk', async (url) => {
    assert.equal(url, '/video-subs/abcdefghijk.json');
    return { ok: true, json: async () => good };
  });
  assert.equal(r?.sentences.length, 3);
});

test('bản dịch chỉ nhận khi khớp số câu', () => {
  assert.deepEqual(parseStaticSubs({ ...good, vi: ['Xin chào.', 'Bạn khoẻ không?', 'Khoẻ.'] })?.vi, ['Xin chào.', 'Bạn khoẻ không?', 'Khoẻ.']);
  assert.equal(parseStaticSubs({ ...good, vi: ['Xin chào.'] })?.vi, undefined);
  assert.equal(parseStaticSubs({ ...good, vi: ['a', '', 'c'] })?.vi, undefined);
  assert.equal(parseStaticSubs(good)?.vi, undefined);
});
