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

test('thanh bên hiện đủ mọi trang con IELTS', () => {
  const all = ieltsChildren(NAV_GROUPS).map((c) => c.key);
  const shown = ieltsChildren(visibleGroups(NAV_GROUPS, true)).map((c) => c.key);
  assert.deepEqual(shown, all);
});


