import assert from 'node:assert/strict';
import { test } from 'node:test';

import { applyStarPass } from './star-pass';

const now = new Date('2026-09-24T10:00:00Z');
const day = 86_400_000;

test('đang Free: vé Pro mở Pro 7 ngày tính từ bây giờ', () => {
  const r = applyStarPass({ plan: 'free', expiresAt: null, source: 'local' }, { id: 'pro', days: 7 }, now);
  assert.deepEqual(r, { ok: true, plan: 'pro', expiresAt: new Date(now.getTime() + 7 * day).toISOString() });
});

test('đang có vé Pro còn hạn: vé mới cộng dồn vào hạn cũ', () => {
  const until = new Date(now.getTime() + 3 * day).toISOString();
  const r = applyStarPass({ plan: 'pro', expiresAt: until, source: 'local' }, { id: 'pro', days: 7 }, now);
  assert.ok(r.ok && r.expiresAt === new Date(now.getTime() + 10 * day).toISOString());
});

test('không bán vé thấp hơn gói đang dùng, không đè gói trả phí', () => {
  const pro = new Date(now.getTime() + 5 * day).toISOString();
  assert.deepEqual(applyStarPass({ plan: 'pro', expiresAt: pro, source: 'local' }, { id: 'plus', days: 7 }, now), { ok: false, reason: 'đang-có-gói-cao-hơn' });
  assert.deepEqual(applyStarPass({ plan: 'plus', expiresAt: pro, source: 'server' }, { id: 'pro', days: 7 }, now), { ok: false, reason: 'đang-có-gói-trả-phí' });
});

test('vé cũ đã hết hạn thì coi như Free', () => {
  const past = new Date(now.getTime() - day).toISOString();
  const r = applyStarPass({ plan: 'pro', expiresAt: past, source: 'local' }, { id: 'plus', days: 7 }, now);
  assert.ok(r.ok && r.plan === 'plus');
});
