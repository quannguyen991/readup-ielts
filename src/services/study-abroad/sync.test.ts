import assert from 'node:assert/strict';
import test from 'node:test';

import { mergeStudyAbroad, normalizeStudyAbroad } from './sync';

test('nhiệm vụ đã xong: hợp hai máy, không mất bên nào', () => {
  const m = mergeStudyAbroad({ completed: ['arrival', 'campus-id'] }, { completed: ['campus-id', 'food-order'] });
  assert.deepEqual([...m.completed].sort(), ['arrival', 'campus-id', 'food-order']);
});

test('lần đầu đăng nhập (máy chủ chưa có gì) giữ nguyên bản máy này', () => {
  const m = mergeStudyAbroad({ completed: ['arrival'], decorations: { wall: 'sg-campus-flag' } }, null);
  assert.deepEqual(m.completed, ['arrival']);
  assert.equal(m.decorations.wall, 'sg-campus-flag');
});

test('đồ trang trí: máy này đã đổi thì giữ, ô chưa đổi nhận của máy kia', () => {
  const m = mergeStudyAbroad(
    { completed: ['arrival'], decorations: { wall: 'sg-campus-flag' } },
    { completed: ['food-order'], decorations: { desk: 'hawker-mug', wall: 'group-photo' } },
  );
  assert.equal(m.decorations.wall, 'sg-campus-flag');
  assert.equal(m.decorations.desk, 'hawker-mug');
});

test('món chưa mở khoá bị bỏ, dữ liệu rác không làm nổ', () => {
  const m = mergeStudyAbroad({ completed: [] }, { completed: [], decorations: { wall: 'research-poster' } });
  assert.equal(m.decorations.wall, 'wall-starter');
  const n = normalizeStudyAbroad({ completed: [1, 'arrival', 'arrival'], decorations: { bed: 'nope' }, restedAt: 5 });
  assert.deepEqual(n.completed, ['arrival']);
  assert.equal(n.decorations.bed, 'bed-starter');
  assert.equal(n.restedAt, null);
});

test('sổ tiền riêng: hợp hai máy theo mã, không cộng đôi khoản chung', () => {
  const m = mergeStudyAbroad(
    { completed: ['arrival'], ledger: { 'pay:shift:1:a': 40 } },
    { completed: ['arrival'], ledger: { 'pay:shift:1:a': 40, 'pay:shift:1:b': 30 } },
  );
  assert.equal(m.ledger['pay:shift:1:a'], 40);
  assert.equal(m.ledger['pay:shift:1:b'], 30);
});

test('đồ có giá chỉ đặt được khi đã mua; dữ liệu cũ không có sổ vẫn đọc được', () => {
  const locked = normalizeStudyAbroad({ completed: ['arrival'], decorations: { corner: 'sg-orchid' } });
  assert.equal(locked.decorations.corner, 'corner-starter');

  const bought = normalizeStudyAbroad({ completed: ['arrival'], decorations: { corner: 'sg-orchid' }, ledger: { 'pay:buy:sg-orchid': -40 } });
  assert.equal(bought.decorations.corner, 'sg-orchid');

  const old = normalizeStudyAbroad({ completed: ['arrival'] });
  assert.deepEqual(old.ledger, {});
});
