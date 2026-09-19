import { test } from 'node:test';
import assert from 'node:assert/strict';

import { SHOP_ITEMS, balanceOf, buy, findItem } from './shop';

const empty = { owned: {}, spent: 0 };

test('không đủ xu thì không mua được, và không trừ gì', () => {
  const r = buy(empty, 'avatar-dragon', 10);
  assert.deepEqual(r, { ok: false, reason: 'không-đủ-xu' });
});

test('mua avatar một lần, lần hai bị chặn', () => {
  const first = buy(empty, 'avatar-owl', 500);
  assert.ok(first.ok && first.spent === 100 && first.owned['avatar-owl'] === 1);
  const again = buy({ owned: first.ok ? first.owned : {}, spent: 100 }, 'avatar-owl', 500);
  assert.deepEqual(again, { ok: false, reason: 'đã-sở-hữu' });
});

test('thẻ giữ chuỗi mua được nhiều lần', () => {
  const one = buy(empty, 'freeze-1', 500);
  assert.ok(one.ok);
  const two = buy({ owned: one.ok ? one.owned : {}, spent: 50 }, 'freeze-1', 450);
  assert.ok(two.ok && two.owned['freeze-1'] === 2 && two.spent === 100);
});

test('số dư không bao giờ âm', () => {
  assert.equal(balanceOf(120, 200), 0);
  assert.equal(balanceOf(300, 120), 180);
});

test('cửa hàng KHÔNG bán nội dung học', () => {
  for (const item of SHOP_ITEMS) {
    assert.ok(['freeze', 'avatar', 'theme'].includes(item.kind), `${item.id} là loại lạ`);
    assert.ok(item.price > 0);
  }
  assert.equal(findItem('bai-doc-vip'), undefined);
});
