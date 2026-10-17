import assert from 'node:assert/strict';
import { test } from 'node:test';

import { IELTS_SKILL_OF, isIeltsFeature } from './ielts-focus';
import { NAV_GROUPS, visibleGroups, type NavGroup } from './nav-items';

const ieltsChildren = (groups: readonly NavGroup[]) =>
  groups.flatMap((g) => g.items).find((i) => i.key === 'ielts')?.children ?? [];

test('mọi trang con IELTS đều có kỹ năng, màn chọn không bỏ sót mục nào', () => {
  const keys = ieltsChildren(NAV_GROUPS).map((c) => c.key);
  assert.ok(keys.length > 0);
  for (const key of keys) assert.ok(key in IELTS_SKILL_OF, `${key} chưa gán kỹ năng`);
  assert.ok(keys.every(isIeltsFeature));
});

test('chưa chọn gì (null) thì thanh bên hiện đủ trang con IELTS', () => {
  const all = ieltsChildren(NAV_GROUPS).map((c) => c.key);
  const shown = ieltsChildren(visibleGroups(NAV_GROUPS, true, null)).map((c) => c.key);
  assert.deepEqual(shown, all);
});

test('đã chọn thì chỉ hiện các trang con đã chọn, giữ thứ tự gốc', () => {
  const shown = ieltsChildren(visibleGroups(NAV_GROUPS, true, ['listening', 'writing'])).map((c) => c.key);
  assert.deepEqual(shown, ['writing', 'listening']);
});

test('lọc IELTS không đụng các mục khác và không xoá chính mục IELTS', () => {
  const groups = visibleGroups(NAV_GROUPS, true, []);
  assert.equal(ieltsChildren(groups).length, 0);
  assert.ok(groups.flatMap((g) => g.items).some((i) => i.key === 'ielts'));
  const dashboard = groups.flatMap((g) => g.items).find((i) => i.key === 'dashboard');
  assert.ok((dashboard?.children ?? []).some((c) => c.key === 'plan'));
});
