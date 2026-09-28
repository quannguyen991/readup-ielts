import { test } from 'node:test';
import assert from 'node:assert/strict';

import { fetchAllPages, PAGE_SIZE } from './fetch-all';

/** Giả lập Supabase: bảng `total` dòng, mỗi lần trả tối đa 1.000 dòng như máy chủ thật. */
function fakeTable(total: number) {
  const calls: [number, number][] = [];
  const page = async (from: number, to: number) => {
    calls.push([from, to]);
    const end = Math.min(total, to + 1, from + PAGE_SIZE);
    return { data: Array.from({ length: Math.max(0, end - from) }, (_, i) => from + i), error: null };
  };
  return { page, calls };
}

test('đọc quá 1.000 dòng: lấy đủ, không dừng ở trang đầu', async () => {
  const t = fakeTable(2_537);
  const r = await fetchAllPages(t.page);
  assert.equal(r.rows.length, 2_537);
  assert.equal(new Set(r.rows).size, 2_537);
  assert.deepEqual(t.calls[0], [0, 999]);
  assert.equal(t.calls.length, 3);
  assert.equal(r.truncated, false);
});

test('đúng bội số 1.000: gọi thêm một trang rỗng rồi dừng', async () => {
  const t = fakeTable(2_000);
  const r = await fetchAllPages(t.page);
  assert.equal(r.rows.length, 2_000);
  assert.equal(t.calls.length, 3);
});

test('chạm trần maxRows thì báo truncated', async () => {
  const r = await fetchAllPages(fakeTable(5_000).page, 3_000);
  assert.equal(r.rows.length, 3_000);
  assert.equal(r.truncated, true);
});

test('lỗi giữa chừng thì trả lỗi', async () => {
  const r = await fetchAllPages(async () => ({ data: null, error: { message: 'x', code: 'PGRST205' } }));
  assert.equal(r.error?.code, 'PGRST205');
});
