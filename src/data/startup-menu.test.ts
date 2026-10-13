import assert from 'node:assert/strict';
import test from 'node:test';

import { BASE_RECIPES, CUSTOM_NAMES, INGREDIENTS, SHOP_CITIES, SHOP_COLORS, SHOP_NAMES } from './startup-menu';

test('thực đơn cơ bản: đủ 3 món, mỗi món đúng 3 bước, đáp án đúng nằm trong khoảng, nguyên liệu có thật', () => {
  assert.equal(BASE_RECIPES.length, 3);
  for (const recipe of BASE_RECIPES) {
    assert.equal(recipe.steps.length, 3, `${recipe.id} số bước`);
    assert.equal(recipe.custom, false, `${recipe.id} không phải món riêng`);
    for (const step of recipe.steps) {
      assert.ok(step.options.length >= 2, `${recipe.id} số lựa chọn`);
      assert.ok(Number.isInteger(step.correct) && step.correct >= 0 && step.correct < step.options.length, `${recipe.id} chỉ số đúng`);
      assert.equal(new Set(step.options.map((option) => option.vi)).size, step.options.length, `${recipe.id} lựa chọn trùng`);
    }
    for (const id of recipe.ingredients) {
      assert.ok(INGREDIENTS.some((item) => item.id === id), `${recipe.id} nguyên liệu ${id} không tồn tại`);
    }
  }
});

test('giá bán lớn hơn giá vốn; mọi tên có cả tiếng Việt và tiếng Anh', () => {
  for (const recipe of BASE_RECIPES) {
    const cost = recipe.ingredients.reduce((sum, id) => sum + (INGREDIENTS.find((item) => item.id === id)?.cost ?? 0), 0);
    assert.ok(recipe.price > cost, `${recipe.id} bán dưới giá vốn`);
    assert.ok(recipe.name.vi && recipe.name.en, `${recipe.id} thiếu tên`);
  }
  for (const ingredient of INGREDIENTS) assert.ok(ingredient.name.vi && ingredient.name.en, `${ingredient.id} thiếu tên`);
  for (const name of [...CUSTOM_NAMES, ...SHOP_NAMES]) assert.ok(name.vi && name.en, 'thiếu tên trong danh sách');
});

test('danh sách chọn: có tên quán, màu quán và ít nhất một thành phố được mở quán', () => {
  assert.ok(SHOP_NAMES.length >= 2);
  assert.ok(SHOP_COLORS.length >= 2);
  assert.deepEqual([...SHOP_CITIES], ['singapore']);
});
