import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import { SIDEBAR_ITEMS, activeSidebarKey } from './sidebar-items';

test('khoá thanh bên không trùng nhau', () => {
  const keys = SIDEBAR_ITEMS.map((i) => i.key);
  assert.equal(new Set(keys).size, keys.length);
});

test('mọi mục thanh bên trỏ tới một trang có thật', () => {
  const app = join(__dirname, '..', '..', 'app');
  for (const { href } of SIDEBAR_ITEMS) {
    const rel = href.replace(/^\//, '');
    const ok = ['.tsx', '/index.tsx'].some((ext) => existsSync(join(app, rel + ext)));
    assert.ok(ok, `${href} không có file route`);
  }
});

test('thanh bên giữ hai mục lớn IELTS và SAT cùng các tính năng chính', () => {
  const keys = new Set(SIDEBAR_ITEMS.map((i) => i.key));
  for (const k of ['ielts', 'sat', 'type', 'vocab', 'grammar', 'read', 'pronounce', 'dictshadow', 'dictionary', 'path', 'friends', 'feature']) {
    assert.ok(keys.has(k), `thiếu mục ${k}`);
  }
});

test('mục nào sáng theo đường dẫn', () => {
  assert.equal(activeSidebarKey('/intro'), 'home');
  assert.equal(activeSidebarKey('/dashboard'), 'today');
  assert.equal(activeSidebarKey('/practice'), 'ielts');
  assert.equal(activeSidebarKey('/mock-tests'), 'ielts');
  assert.equal(activeSidebarKey('/hub/tutor'), 'ielts');
  assert.equal(activeSidebarKey('/sat/full-test'), 'sat');
  assert.equal(activeSidebarKey('/math'), 'sat');
  assert.equal(activeSidebarKey('/vocabulary/theo-muc'), 'vocab');
  assert.equal(activeSidebarKey('/sentence'), 'type');
  assert.equal(activeSidebarKey('/sentence/translate'), 'type');
  assert.equal(activeSidebarKey('/sentence/dictation'), 'dictshadow');
  assert.equal(activeSidebarKey('/shadow/abc'), 'dictshadow');
  assert.equal(activeSidebarKey('/hub/learn'), 'pronounce');
  assert.equal(activeSidebarKey('/tu-dien'), 'dictionary');
  assert.equal(activeSidebarKey('/progress'), 'friends');
  assert.equal(activeSidebarKey('/leaderboard'), 'friends');
  assert.equal(activeSidebarKey('/duel'), 'quest');
  assert.equal(activeSidebarKey('/lo-trinh-hoc'), 'path');
});
