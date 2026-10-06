import assert from 'node:assert/strict';
import test from 'node:test';

import { WELCOME_DAYS, welcomeEligibility, welcomeExpiry } from './welcome';

const now = new Date('2026-10-06T10:00:00Z');

test('tài khoản mới, còn Free, chưa từng có gói → được tặng', () => {
  assert.equal(welcomeEligibility({ userCreatedAt: '2026-10-06T09:00:00Z', plan: 'free', planStartedAt: null, now }), 'ok');
  assert.equal(welcomeEligibility({ userCreatedAt: '2026-10-04T10:30:00Z', plan: 'free', planStartedAt: null, now }), 'ok');
});

test('tài khoản cũ không được tặng', () => {
  assert.equal(welcomeEligibility({ userCreatedAt: '2026-09-20T09:00:00Z', plan: 'free', planStartedAt: null, now }), 'not_new');
  assert.equal(welcomeEligibility({ userCreatedAt: null, plan: 'free', planStartedAt: null, now }), 'not_new');
});

test('đã có gói hoặc từng có gói (đã nhận quà / đã mua) thì không tặng lần nữa', () => {
  assert.equal(welcomeEligibility({ userCreatedAt: '2026-10-06T09:00:00Z', plan: 'pro', planStartedAt: '2026-10-06T09:05:00Z', now }), 'already');
  assert.equal(welcomeEligibility({ userCreatedAt: '2026-10-06T09:00:00Z', plan: 'free', planStartedAt: '2026-10-01T09:05:00Z', now }), 'already');
});

test('hạn quà là đúng WELCOME_DAYS ngày kể từ lúc cấp', () => {
  const exp = new Date(welcomeExpiry(now)).getTime();
  assert.equal(Math.round((exp - now.getTime()) / (24 * 3600 * 1000)), WELCOME_DAYS);
});
