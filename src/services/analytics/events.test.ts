import test from 'node:test';
import assert from 'node:assert/strict';

import { stripQuery, toGa, toMeta, type AppEvent } from './events';

const CHECKOUT: AppEvent = {
  name: 'begin_checkout',
  plan: 'max',
  cycle: 'monthly',
  valueVnd: 400_000,
  orderId: 'ord-1',
};
const PURCHASE: AppEvent = { ...CHECKOUT, name: 'purchase' };
const ALL: AppEvent[] = [
  {
    name: 'page_view',
    path: '/checkout?plan=max&group=abc',
    url: 'https://readup-ielts.vercel.app/checkout?plan=max&group=abc',
  },
  { name: 'sign_up' },
  { name: 'view_pricing' },
  CHECKOUT,
  PURCHASE,
];

test('tên sự kiện đúng tên chuẩn của Meta — sai một chữ là Meta lặng lẽ không đếm', () => {
  assert.deepEqual(
    ALL.map((e) => toMeta(e).event),
    ['PageView', 'CompleteRegistration', 'ViewContent', 'InitiateCheckout', 'Purchase'],
  );
});

test('tên sự kiện đúng tên chuẩn của GA4', () => {
  assert.deepEqual(
    ALL.map((e) => toGa(e).event),
    ['page_view', 'sign_up', 'view_item_list', 'begin_checkout', 'purchase'],
  );
});

test('đơn hàng mang giá trị VND, và mã theo đơn để Meta tự bỏ bản gửi trùng', () => {
  const meta = toMeta(PURCHASE);
  assert.equal(meta.params?.value, 400_000);
  assert.equal(meta.params?.currency, 'VND');
  assert.equal(meta.eventId, 'purchase-ord-1');
  assert.notEqual(toMeta(CHECKOUT).eventId, meta.eventId, 'tạo đơn và trả tiền là hai sự kiện khác nhau');
  assert.equal(toGa(PURCHASE).params.transaction_id, 'ord-1');
});

test('không sự kiện nào mang email', () => {
  for (const e of ALL) assert.ok(!JSON.stringify([toMeta(e), toGa(e)]).includes('@'));
});

test('đường dẫn gửi đi không kèm query — mã mời và mã nhóm ở lại trong app', () => {
  const ga = toGa(ALL[0]!);
  assert.equal(ga.params.page_path, '/checkout');
  assert.equal(ga.params.page_location, 'https://readup-ielts.vercel.app/checkout');
  assert.equal(stripQuery('/intro#top'), '/intro');
  assert.equal(stripQuery('/intro'), '/intro');
});
