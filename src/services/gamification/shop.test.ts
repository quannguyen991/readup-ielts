import { test } from 'node:test';
import assert from 'node:assert/strict';

import { SHOP_ITEMS, balanceOf, buy, findItem, formatStars, mergeReward, starBalance, type RewardPayload } from './shop';
import { ITEMS } from '@/services/game/rules';
import { MASCOTS } from '@/services/game/mascots';
import { HERO_SKINS } from '@/components/game/sprites';

const empty = { owned: {}, spent: 0 };

test('không đủ sao thì không đổi được, và không trừ gì', () => {
  const r = buy(empty, 'avatar-dragon', 10);
  assert.deepEqual(r, { ok: false, reason: 'không-đủ-sao' });
});

test('đổi avatar một lần, lần hai bị chặn', () => {
  const first = buy(empty, 'avatar-owl', 500);
  assert.ok(first.ok && first.spent === 100 && first.owned['avatar-owl'] === 1);
  const again = buy({ owned: first.ok ? first.owned : {}, spent: 100 }, 'avatar-owl', 500);
  assert.deepEqual(again, { ok: false, reason: 'đã-sở-hữu' });
});

test('thẻ giữ chuỗi và vé gói đổi được nhiều lần', () => {
  const one = buy(empty, 'freeze-1', 500);
  assert.ok(one.ok);
  const two = buy({ owned: one.ok ? one.owned : {}, spent: 50 }, 'freeze-1', 450);
  assert.ok(two.ok && two.owned['freeze-1'] === 2 && two.spent === 100);
  const pass = buy(empty, 'pass-pro-7', 5000);
  assert.ok(pass.ok);
  assert.ok(buy({ owned: pass.ok ? pass.owned : {}, spent: 1400 }, 'pass-pro-7', 3600).ok);
});

test('số sao: học + thưởng − đã đổi, không bao giờ âm', () => {
  assert.equal(balanceOf(120, 200), 0);
  assert.equal(balanceOf(300, 120), 180);
  assert.equal(starBalance(300, 40, 120), 220);
  assert.equal(starBalance(10, 0, 500), 0);
  assert.equal(formatStars(1234), (1234).toLocaleString('vi-VN'));
  assert.equal(formatStars(12345), '12,3k');
});

test('danh mục hợp lệ: mỗi loại mang đúng dữ liệu của nó', () => {
  const ids = new Set<string>();
  for (const item of SHOP_ITEMS) {
    assert.ok(!ids.has(item.id), `trùng mã ${item.id}`);
    ids.add(item.id);
    assert.ok(item.price > 0);
    if (item.kind === 'powerup') assert.ok(item.grants && item.grants in ITEMS, `${item.id} trao thứ lạ`);
    else assert.equal(item.grants, undefined, `${item.id} không phải đồ chiến đấu mà lại trao vật phẩm`);
    if (item.kind === 'plan') {
      assert.ok(item.plan && ['plus', 'pro'].includes(item.plan.id) && item.plan.days > 0 && item.plan.days <= 30, `${item.id}: vé phải có hạn`);
      assert.ok(item.repeatable);
    }
    if (item.kind === 'mascot') assert.ok(item.mascot && item.mascot in MASCOTS);
    if (item.kind === 'skin') assert.ok(item.skin && item.skin in HERO_SKINS && item.skin !== 'knight');
    if (item.kind === 'avatarAnim') assert.ok(item.avatarLook);
    if (item.kind === 'cover') assert.ok(item.cover);
  }
  // Vẫn không bán nội dung lẻ.
  assert.equal(findItem('bai-doc-vip'), undefined);
  assert.equal(findItem(null), undefined);
});

test('vé Pro đắt hơn vé Plus, và không ai đổi nổi vé Pro trong một ngày học tối đa', () => {
  const plus = findItem('pass-plus-7')!;
  const pro = findItem('pass-pro-7')!;
  assert.ok(pro.price > plus.price);
  assert.ok(pro.price > 60 * 3, 'trần 60 điểm/ngày: vé Pro phải cần nhiều ngày học');
});

test('gộp hai máy: không để số dư phình, đồ đeo theo máy đổi sau', () => {
  const a: RewardPayload = { owned: { 'skin-ninja': 1, 'freeze-1': 2 }, spent: 500, frozenDays: ['2026-09-01'], avatar: 'anim-star', cover: null, skin: 'skin-ninja', mascot: null, wornAt: '2026-09-20T10:00:00Z' };
  const b: RewardPayload = { owned: { 'freeze-1': 3, 'mascot-owl': 1 }, spent: 700, frozenDays: ['2026-09-05'], avatar: null, cover: 'cover-stars', skin: null, mascot: 'mascot-owl', wornAt: '2026-09-22T10:00:00Z' };
  const m = mergeReward(a, b)!;
  assert.deepEqual(m.owned, { 'freeze-1': 3, 'mascot-owl': 1, 'skin-ninja': 1 });
  assert.equal(m.spent, 700);
  assert.deepEqual(m.frozenDays, ['2026-09-01', '2026-09-05']);
  assert.equal(m.cover, 'cover-stars');
  assert.equal(m.mascot, 'mascot-owl');
  assert.equal(mergeReward(null, b), b);
});

test('gộp hai máy: thưởng hạng tháng chỉ tính một lần mỗi tháng', () => {
  const base = { owned: {}, spent: 0, frozenDays: [], avatar: null, cover: null, skin: null, mascot: null, wornAt: '' };
  const m = mergeReward({ ...base, prizes: { '2026-08': 300 } }, { ...base, prizes: { '2026-08': 300, '2026-07': 50 } })!;
  assert.deepEqual(m.prizes, { '2026-08': 300, '2026-07': 50 });
});
