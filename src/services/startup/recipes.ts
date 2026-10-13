import { CUSTOM_NAMES, INGREDIENTS, type BrewStep, type Recipe } from '@/data/startup-menu';
import type { Bi } from '@/i18n/useL';

/** `maxCustom: 1` là giới hạn của S1 (spec §7). S3 mở nhiều món riêng hơn. */
export const CUSTOM_RULES = { maxIngredients: 4, markup: 20, maxCustom: 1 } as const;

export type CustomReason = 'bad-name' | 'limit' | 'empty' | 'too-many' | 'repeat-ingredient' | 'unknown-ingredient' | 'no-base' | 'same-as-menu';

export function recipeCost(ingredientIds: readonly string[]): number {
  return ingredientIds.reduce((sum, id) => sum + (INGREDIENTS.find((item) => item.id === id)?.cost ?? 0), 0);
}

function sameIngredients(a: readonly string[], b: readonly string[]): boolean {
  return [...a].sort().join('|') === [...b].sort().join('|');
}

export function validateCustomRecipe(name: Bi, ingredients: readonly string[], existing: readonly Recipe[]): { ok: true } | { ok: false; reason: CustomReason } {
  if (!CUSTOM_NAMES.some((item) => item.vi === name.vi)) return { ok: false, reason: 'bad-name' };
  if (existing.filter((recipe) => recipe.custom).length >= CUSTOM_RULES.maxCustom) return { ok: false, reason: 'limit' };
  if (ingredients.length === 0) return { ok: false, reason: 'empty' };
  if (ingredients.length > CUSTOM_RULES.maxIngredients) return { ok: false, reason: 'too-many' };
  if (new Set(ingredients).size !== ingredients.length) return { ok: false, reason: 'repeat-ingredient' };
  if (!ingredients.every((id) => INGREDIENTS.some((item) => item.id === id))) return { ok: false, reason: 'unknown-ingredient' };
  if (!ingredients.some((id) => INGREDIENTS.find((item) => item.id === id)?.kind === 'base')) return { ok: false, reason: 'no-base' };
  if (existing.some((recipe) => sameIngredients(recipe.ingredients, ingredients))) return { ok: false, reason: 'same-as-menu' };
  return { ok: true };
}

/**
 * Bước pha của món riêng: mỗi nguyên liệu là một bước. Đáp án đúng nằm ở vị trí `i % 3`,
 * hai lựa chọn còn lại là hai nguyên liệu liền sau trong danh sách.
 */
export function buildCustomSteps(ingredients: readonly string[]): BrewStep[] {
  return ingredients.map((id, i) => {
    const at = INGREDIENTS.findIndex((item) => item.id === id);
    const correct = i % 3;
    const options = [INGREDIENTS[(at + 1) % INGREDIENTS.length]!.name, INGREDIENTS[(at + 2) % INGREDIENTS.length]!.name];
    options.splice(correct, 0, INGREDIENTS[at]!.name);
    return { label: INGREDIENTS[at]!.name, options, correct };
  });
}

export function createCustomRecipe(
  input: { id: string; name: Bi; ingredients: readonly string[] },
  existing: readonly Recipe[],
): { ok: true; recipe: Recipe } | { ok: false; reason: CustomReason } {
  const check = validateCustomRecipe(input.name, input.ingredients, existing);
  if (!check.ok) return { ok: false, reason: check.reason };
  return {
    ok: true,
    recipe: {
      id: input.id,
      name: input.name,
      price: recipeCost(input.ingredients) + CUSTOM_RULES.markup,
      ingredients: [...input.ingredients],
      steps: buildCustomSteps(input.ingredients),
      custom: true,
    },
  };
}
