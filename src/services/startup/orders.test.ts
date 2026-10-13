import assert from 'node:assert/strict';
import test from 'node:test';

import { BASE_RECIPES } from '@/data/startup-menu';
import { SHOP_ORDERS } from '@/data/startup-orders';
import { brewCorrect, findRecipe, ordersForCustomRecipes, scoreServe } from './orders';

const ORDER = SHOP_ORDERS[0]!;
const COFFEE = BASE_RECIPES.find((recipe) => recipe.id === ORDER.drinkId)!;
const RIGHT_BREW = COFFEE.steps.map((step) => step.correct);

test('dữ liệu đơn: món có trong thực đơn, đáp án trong khoảng, lựa chọn không trùng, có gợi ý và giải thích', () => {
  assert.equal(SHOP_ORDERS.length, 3);
  for (const order of SHOP_ORDERS) {
    assert.ok(BASE_RECIPES.some((recipe) => recipe.id === order.drinkId), `${order.id} món không có trong thực đơn`);
    assert.ok(Number.isInteger(order.replyAnswer) && order.replyAnswer >= 0 && order.replyAnswer < order.replyOptions.length, `${order.id} chỉ số đáp án`);
    assert.equal(new Set(order.replyOptions).size, order.replyOptions.length, `${order.id} lựa chọn trùng`);
    assert.ok(order.hint.vi && order.hint.en && order.explanation.vi && order.explanation.en, `${order.id} thiếu gợi ý hoặc giải thích`);
  }
});

test('chấm lượt phục vụ: đúng cả ba phần mới được tính đúng; sai từng phần được báo đúng phần đó', () => {
  const right = { drinkId: ORDER.drinkId, brewChoices: RIGHT_BREW, replyIndex: ORDER.replyAnswer };
  assert.deepEqual(scoreServe(ORDER, COFFEE, right), { drinkOk: true, brewOk: true, replyOk: true, correct: true });

  const wrongDrink = scoreServe(ORDER, COFFEE, { ...right, drinkId: 'tra-da' });
  assert.equal(wrongDrink.drinkOk, false);
  assert.equal(wrongDrink.correct, false);

  const wrongBrew = scoreServe(ORDER, COFFEE, { ...right, brewChoices: [0, 0, 0] });
  assert.equal(wrongBrew.brewOk, false);
  assert.equal(wrongBrew.correct, false);

  const wrongReply = scoreServe(ORDER, COFFEE, { ...right, replyIndex: (ORDER.replyAnswer + 1) % ORDER.replyOptions.length });
  assert.equal(wrongReply.replyOk, false);
  assert.equal(wrongReply.correct, false);
});

test('brewCorrect: số lựa chọn khác số bước thì sai; findRecipe tìm đúng món', () => {
  assert.equal(brewCorrect(COFFEE.steps, [RIGHT_BREW[0]!]), false);
  assert.equal(brewCorrect(COFFEE.steps, RIGHT_BREW), true);
  assert.equal(findRecipe('tra-da', BASE_RECIPES)?.id, 'tra-da');
  assert.equal(findRecipe('không-có', BASE_RECIPES), undefined);
});

test('món riêng có đơn riêng: mỗi món riêng một đơn gọi đúng tên món, đáp án hợp lệ, mã đơn không trùng', () => {
  const custom = {
    id: 'custom-1',
    name: { vi: 'Cà phê Sài Gòn', en: 'Saigon coffee' },
    price: 29,
    ingredients: ['ca-phe-phin', 'duong'],
    steps: [{ label: { vi: 'Bước 1', en: 'Step 1' }, options: [{ vi: 'Cà phê phin', en: 'Phin coffee' }, { vi: 'Đường', en: 'Sugar' }, { vi: 'Đá viên', en: 'Ice cubes' }], correct: 0 }],
    custom: true,
  };
  const orders = ordersForCustomRecipes([...BASE_RECIPES, custom]);
  assert.equal(orders.length, 1);
  assert.equal(orders[0]!.drinkId, 'custom-1');
  assert.ok(orders[0]!.line.includes('Saigon coffee'));
  assert.ok(orders[0]!.replyAnswer >= 0 && orders[0]!.replyAnswer < orders[0]!.replyOptions.length);
  assert.equal(new Set(orders.map((order) => order.id)).size, orders.length);
});
