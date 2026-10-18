import assert from 'node:assert/strict';
import { test } from 'node:test';

import { NAV_GROUPS, NAV_ITEMS, NAV_LABEL_EN, activeNavKey, parentNavKey } from './nav-items';
import { satHubTargets } from './sat-hub';

/*
  Thanh bên gộp 27 mục phẳng thành mục chính + trang con. Rủi ro của việc gộp
  là một trang lặng lẽ mất lối vào. Danh sách dưới đây là mọi đích đến từng có
  trong điều hướng; bỏ đi trang nào phải là quyết định có chủ ý, sửa ở đây.
*/
const MUST_STAY_REACHABLE = [
  '/intro', '/dashboard', '/practice', '/write', '/mock-tests', '/math', '/sat-rw', '/sat/full-test',
  '/sentence', '/library', '/bilingual', '/vocabulary',
  '/vocabulary/quiz', '/vocabulary/topics', '/notes', '/bookmarks', '/plan', '/progress',
  '/leaderboard', '/shop', '/profile', '/teacher', '/quest', '/quest/hero', '/invite', '/upgrade', '/settings',
];

test('không trang nào mất lối vào sau khi gộp', () => {
  const hrefs = new Set(NAV_ITEMS.map((i) => i.href));
  for (const href of MUST_STAY_REACHABLE) assert.ok(hrefs.has(href), `${href} không còn trong điều hướng`);
});

test('thanh bên gộp thành ít mục lớn: Trang chủ + không quá 6 mục chính', () => {
  const top = NAV_GROUPS.flatMap((g) => g.items).length;
  assert.ok(top <= 7, `${top} mục chính`);
});

/*
  Nhóm SAT gọn còn bốn trang con (01/10/2026). Những trang rời thanh bên là
  quyết định CÓ CHỦ Ý, liệt kê ở đây; mỗi trang phải còn lối vào từ một hub SAT
  (dữ liệu của hub ở `sat-hub.ts`, chính các trang hub vẽ từ dữ liệu ấy).
*/
const SAT_MOVED_TO_HUBS = ['/math/learn', '/sat/lo-trinh', '/sat/kien-thuc', '/sat-rw/learn', '/math/diagnostic', '/math/mock', '/lo-trinh-hoc'];

test('trang SAT rời thanh bên vẫn có lối vào từ hub SAT', () => {
  const targets = satHubTargets();
  for (const href of SAT_MOVED_TO_HUBS) assert.ok(targets.has(href), `${href} không còn lối vào từ hub SAT`);
  // Và ba hub đều có trong thanh bên.
  const hrefs = new Set(NAV_ITEMS.map((i) => i.href));
  for (const hub of ['/sat', '/math', '/sat-rw']) assert.ok(hrefs.has(hub), `${hub} không còn trong thanh bên`);
});

test('nhóm SAT trên thanh bên chỉ còn khoảng bốn trang con', () => {
  const sat = NAV_ITEMS.find((i) => i.key === 'sat');
  assert.ok(sat?.children && sat.children.length <= 5, `${sat?.children?.length} trang con`);
  for (const child of sat.children) assert.ok(NAV_LABEL_EN[child.key], `${child.key} thiếu nhãn tiếng Anh`);
});

test('khoá không trùng nhau', () => {
  const keys = NAV_ITEMS.map((i) => i.key);
  assert.equal(new Set(keys).size, keys.length);
});

test('đang ở trang con thì mục cha được đánh dấu', () => {
  assert.equal(activeNavKey('/sat/full-test'), 'sat-full-test');
  assert.equal(parentNavKey(activeNavKey('/sat/full-test')), 'sat');
  assert.equal(activeNavKey('/sat'), 'sat-home');
  assert.equal(parentNavKey(activeNavKey('/sat/lo-trinh')), 'sat');
  assert.equal(parentNavKey(activeNavKey('/vocabulary/topics')), 'vocabulary');
  assert.equal(parentNavKey(activeNavKey('/vocabulary/topic/education/learn')), 'vocabulary');
  assert.equal(parentNavKey(activeNavKey('/math/drill/linear')), 'sat');
  assert.equal(parentNavKey(activeNavKey('/sentence/dictation')), 'ielts');
  assert.equal(parentNavKey(activeNavKey('/shop')), 'quest');
  assert.equal(parentNavKey(activeNavKey('/profile')), 'me');
});
