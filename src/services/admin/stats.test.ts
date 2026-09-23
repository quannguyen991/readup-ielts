import assert from 'node:assert/strict';
import { test } from 'node:test';

import { summarizeUsers } from './stats';

const NOW = new Date('2026-09-23T12:00:00Z').getTime();
const daysAgo = (d: number) => new Date(NOW - d * 86_400_000).toISOString();

test('đếm tài khoản, đăng ký, đăng nhập và người học thật theo 7/30 ngày', () => {
  const stats = summarizeUsers(
    [
      { created_at: daysAgo(2), last_sign_in_at: daysAgo(1) },
      { created_at: daysAgo(20), last_sign_in_at: daysAgo(15) },
      { created_at: daysAgo(90), last_sign_in_at: null },
    ],
    [
      { plan: 'free', plan_expires_at: null, role: 'user' },
      { plan: 'pro', plan_expires_at: daysAgo(-10), role: 'user' },
      { plan: 'max', plan_expires_at: daysAgo(3), role: 'admin' },
    ],
    [
      { user_id: 'a', updated_at: daysAgo(1) },
      { user_id: 'a', updated_at: daysAgo(40) },
      { user_id: 'b', updated_at: daysAgo(25) },
    ],
    NOW,
  );
  assert.equal(stats.accounts, 3);
  assert.equal(stats.signups7, 1);
  assert.equal(stats.signups30, 2);
  assert.equal(stats.signedIn7, 1);
  assert.equal(stats.signedIn30, 2);
  assert.equal(stats.learners7, 1, 'người học tính theo lần đồng bộ GẦN NHẤT của mỗi tài khoản');
  assert.equal(stats.learners30, 2);
  assert.equal(stats.learnersEver, 2);
  assert.equal(stats.admins, 1);
  assert.deepEqual(stats.plans, { free: 1, 'pro · còn hạn': 1, 'max · hết hạn': 1 });
  // 2 và 20 ngày trước cùng rơi vào tháng 9; 90 ngày trước là tháng 6.
  assert.deepEqual(stats.signupsByMonth, [
    ['2026-06', 1],
    ['2026-09', 2],
  ]);
});
