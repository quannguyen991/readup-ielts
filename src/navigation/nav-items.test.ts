import assert from 'node:assert/strict';
import { test } from 'node:test';

import { NAV_GROUPS, NAV_ITEMS, activeNavKey, parentNavKey } from './nav-items';

/*
  Thanh bên gộp 27 mục phẳng thành mục chính + trang con. Rủi ro của việc gộp
  là một trang lặng lẽ mất lối vào. Danh sách dưới đây là mọi đích đến từng có
  trong điều hướng; bỏ đi trang nào phải là quyết định có chủ ý, sửa ở đây.
*/
const MUST_STAY_REACHABLE = [
  '/intro', '/dashboard', '/practice', '/write', '/mock-tests', '/math', '/sat-rw', '/sat/full-test',
  '/sentence', '/sentence/sets', '/sentence/youtube', '/library', '/bilingual', '/vocabulary',
  '/vocabulary/quiz', '/vocabulary/topics', '/notes', '/bookmarks', '/plan', '/progress',
  '/leaderboard', '/shop', '/mastery', '/observatory', '/teacher', '/quest', '/invite', '/upgrade', '/settings',
];

test('không trang nào mất lối vào sau khi gộp', () => {
  const hrefs = new Set(NAV_ITEMS.map((i) => i.href));
  for (const href of MUST_STAY_REACHABLE) assert.ok(hrefs.has(href), `${href} không còn trong điều hướng`);
});

test('thanh bên đủ gọn để hiện đầy đủ tên: không quá 14 mục chính', () => {
  const top = NAV_GROUPS.flatMap((g) => g.items).length;
  assert.ok(top <= 14, `${top} mục chính`);
});

test('khoá không trùng nhau', () => {
  const keys = NAV_ITEMS.map((i) => i.key);
  assert.equal(new Set(keys).size, keys.length);
});

test('đang ở trang con thì mục cha được đánh dấu', () => {
  assert.equal(activeNavKey('/sat/full-test'), 'sat-full-test');
  assert.equal(parentNavKey(activeNavKey('/sat/full-test')), 'math');
  assert.equal(parentNavKey(activeNavKey('/vocabulary/topics')), 'vocabulary');
  assert.equal(parentNavKey(activeNavKey('/math/drill/linear')), 'math');
  assert.equal(parentNavKey(activeNavKey('/shop')), 'leaderboard');
});
