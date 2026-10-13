import assert from 'node:assert/strict';
import test from 'node:test';

import { BASE_RECIPES, CUSTOM_NAMES } from '@/data/startup-menu';
import { createCustomRecipe, recipeCost, validateCustomRecipe } from './recipes';

const NAME = CUSTOM_NAMES[0]!;

test('giá vốn: cộng giá các nguyên liệu', () => {
  assert.equal(recipeCost(['ca-phe-phin', 'sua-dac', 'da']), 12);
});

test('món riêng bị từ chối đúng lý do', () => {
  assert.deepEqual(validateCustomRecipe({ vi: 'Tên lạ', en: 'Odd' }, ['ca-phe-phin'], BASE_RECIPES), { ok: false, reason: 'bad-name' });
  assert.deepEqual(validateCustomRecipe(NAME, [], BASE_RECIPES), { ok: false, reason: 'empty' });
  assert.deepEqual(validateCustomRecipe(NAME, ['ca-phe-phin', 'sua-dac', 'sua-tuoi', 'duong', 'da'], BASE_RECIPES), { ok: false, reason: 'too-many' });
  assert.deepEqual(validateCustomRecipe(NAME, ['ca-phe-phin', 'ca-phe-phin'], BASE_RECIPES), { ok: false, reason: 'repeat-ingredient' });
  assert.deepEqual(validateCustomRecipe(NAME, ['ghost-item'], BASE_RECIPES), { ok: false, reason: 'unknown-ingredient' });
  assert.deepEqual(validateCustomRecipe(NAME, ['duong', 'da'], BASE_RECIPES), { ok: false, reason: 'no-base' });
  assert.deepEqual(validateCustomRecipe(NAME, ['da', 'sua-dac', 'ca-phe-phin'], BASE_RECIPES), { ok: false, reason: 'same-as-menu' });
});

test('S1: chỉ được có một món riêng; món thứ hai bị từ chối với lý do limit', () => {
  const first = createCustomRecipe({ id: 'custom-1', name: NAME, ingredients: ['ca-phe-phin', 'duong'] }, BASE_RECIPES);
  assert.equal(first.ok, true);
  if (!first.ok) return;
  assert.deepEqual(validateCustomRecipe(CUSTOM_NAMES[1]!, ['tra-den', 'da'], [...BASE_RECIPES, first.recipe]), { ok: false, reason: 'limit' });
});

test('món riêng hợp lệ được nhận, không phụ thuộc thứ tự chọn nguyên liệu', () => {
  assert.deepEqual(validateCustomRecipe(NAME, ['ca-phe-phin', 'duong'], BASE_RECIPES), { ok: true });
});

test('món riêng hợp lệ: giá = giá vốn + 20; mỗi bước có 3 lựa chọn, đáp án đúng là chính nguyên liệu', () => {
  const outcome = createCustomRecipe({ id: 'custom-1', name: NAME, ingredients: ['ca-phe-phin', 'duong'] }, BASE_RECIPES);
  assert.equal(outcome.ok, true);
  if (!outcome.ok) return;
  assert.equal(outcome.recipe.price, recipeCost(['ca-phe-phin', 'duong']) + 20);
  assert.equal(outcome.recipe.custom, true);
  assert.equal(outcome.recipe.steps.length, 2);
  for (const step of outcome.recipe.steps) {
    assert.equal(step.options.length, 3);
    assert.equal(step.options[step.correct]!.vi, step.label.vi);
    assert.equal(new Set(step.options.map((option) => option.vi)).size, 3);
  }
});
