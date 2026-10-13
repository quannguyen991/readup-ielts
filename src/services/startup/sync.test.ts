import assert from 'node:assert/strict';
import test from 'node:test';

import { BASE_RECIPES } from '@/data/startup-menu';
import { mergeStartup, normalizeStartup } from './sync';

const SHOP_EARLY = { city: 'singapore', name: { vi: 'Quán Sài Gòn Nhỏ', en: 'Little Saigon Café' }, color: '#B23A3A', openedAt: '2026-10-11T08:00:00.000Z' };
const SHOP_LATE = { city: 'singapore', name: { vi: 'Quán Xanh Lá', en: 'Green Leaf Café' }, color: '#2F8F6B', openedAt: '2026-10-11T09:00:00.000Z' };

test('hai máy mở cùng một thành phố với tên khác nhau: giữ bản mở sớm hơn', () => {
  const m = mergeStartup({ shops: { singapore: SHOP_LATE }, ledger: {}, customRecipes: [] }, { shops: { singapore: SHOP_EARLY }, ledger: {}, customRecipes: [] });
  assert.equal(m.shops.singapore!.name.vi, 'Quán Sài Gòn Nhỏ');
});

test('sổ quán hợp theo mã, không cộng đôi; món riêng hợp theo mã món', () => {
  const custom = {
    id: 'custom-1',
    name: { vi: 'Cà phê mới', en: 'New coffee' },
    price: 32,
    ingredients: ['ca-phe-phin', 'duong'],
    steps: [{ label: { vi: 'Nền', en: 'Base' }, options: [{ vi: 'Cà phê phin', en: 'Phin coffee' }, { vi: 'Trà đen', en: 'Black tea' }], correct: 0 }],
    custom: true,
  };
  const m = mergeStartup(
    { shops: {}, ledger: { 'shop:sale:2026-10-11:o1': 25, 'shop:cost:2026-10-11:o1': -12 }, customRecipes: [custom] },
    { shops: {}, ledger: { 'shop:sale:2026-10-11:o1': 25, 'shop:cost:2026-10-11:o1': -12, 'shop:sale:2026-10-11:o2': 15 }, customRecipes: [custom] },
  );
  assert.equal(m.ledger['shop:sale:2026-10-11:o1'], 25);
  assert.equal(m.ledger['shop:sale:2026-10-11:o2'], 15);
  assert.equal(m.customRecipes.length, 1);
});

test('dữ liệu rác bị bỏ: quán thiếu tên, món riêng thiếu bước pha; không làm sập', () => {
  const n = normalizeStartup({
    shops: { singapore: { city: 'singapore', color: '#000' }, london: SHOP_LATE },
    ledger: { ok: 5, bad: 'x' },
    customRecipes: [{ id: 'custom-2', name: { vi: 'Trà đào mát', en: 'Cool peach tea' }, price: 30, ingredients: ['tra-den'], custom: true }],
  });
  assert.equal(n.shops.singapore, undefined);
  assert.ok(n.shops.london);
  assert.deepEqual(n.ledger, { ok: 5 });
  assert.equal(n.customRecipes.length, 0);
  assert.equal(BASE_RECIPES.length, 3);
});
