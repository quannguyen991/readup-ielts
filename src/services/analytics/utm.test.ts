import assert from 'node:assert/strict';
import { test } from 'node:test';

import { parseUtm, readStoredUtm, rememberFirstUtm, UTM_STORAGE_KEY } from './utm';

function memoryStorage(): Pick<Storage, 'getItem' | 'setItem'> & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
}

test('đọc đủ bốn tham số utm và bỏ tham số khác', () => {
  assert.deepEqual(parseUtm('?utm_source=instagram&utm_medium=bio&utm_campaign=writing-26-10&utm_content=reel1&fbclid=x'), {
    utm_source: 'instagram',
    utm_medium: 'bio',
    utm_campaign: 'writing-26-10',
    utm_content: 'reel1',
  });
});

test('lần vào đầu giữ nguồn; lần sau bằng link khác không ghi đè', () => {
  const storage = memoryStorage();
  rememberFirstUtm('?utm_source=instagram&utm_campaign=a', storage);
  const later = rememberFirstUtm('?utm_source=facebook&utm_campaign=b', storage);
  assert.equal(later.utm_source, 'instagram');
  assert.equal(readStoredUtm(storage).utm_campaign, 'a');
  assert.ok(storage.data.has(UTM_STORAGE_KEY));
});

test('không có storage (native, SSR) thì không lỗi', () => {
  assert.deepEqual(rememberFirstUtm('?utm_source=x', null), { utm_source: 'x' });
  assert.deepEqual(readStoredUtm(null), {});
});
