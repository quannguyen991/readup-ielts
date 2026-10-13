# Du ngoạn: quán và pha chế, giai đoạn S1 (Singapore) — Kế hoạch triển khai

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (làm trực tiếp trong phiên này) hoặc superpowers:subagent-driven-development để thực hiện từng task. Các bước dùng cú pháp checkbox (`- [ ]`) để theo dõi.

**Goal:** Người học mở một quán ở Singapore bằng vốn từ đồng du học, tự chọn món, pha theo đơn khách bằng 3 bước, trả lời câu đáp, và tự tạo món riêng từ nguyên liệu có sẵn. Doanh thu, hạn đơn và đồng bộ nhiều máy đều đúng.

**Architecture:** Luật thuần (thực đơn, kiểm món riêng, sổ quán, chấm đơn, gộp đồng bộ) nằm trong `src/services/startup/` và `src/data/startup-*.ts`, có test. Vốn mở quán trừ trong sổ đồng du học của `useStudyAbroadStore` (khoá `pay:shop:<thành phố>`). Quán và doanh thu nằm trong `useStartupStore` (sổ `shop:`). Màn hình là một trang trong nhánh Du học, gọi các luật thuần qua store.

**Tech Stack:** TypeScript, Zustand (persist), React Native / Expo Router, test bằng `node:test` chạy qua `tsx`.

**Spec:** [docs/superpowers/specs/2026-10-11-du-ngoan-quan-pha-che-design.md](../specs/2026-10-11-du-ngoan-quan-pha-che-design.md)

## Global Constraints

- Vốn mở quán: 150 đồng du học (đề xuất trong spec, đã duyệt).
- Mỗi thành phố có tối đa một quán; S1 chỉ có Singapore.
- Hạn đơn: 12 đơn được ghi doanh thu mỗi ngày.
- Món riêng tối đa 4 nguyên liệu; không gõ tự do, tên món chọn từ danh sách có sẵn.
- Đơn và đáp án do người viết và kiểm tay; không gọi AI lúc chạy.
- Tiền tố sổ: `shop:` cho quán; `pay:shop:` cho khoản vốn trong sổ đồng du học.
- Không mua bằng tiền thật.
- Mọi chuỗi hiển thị có cả `vi` và `en`.
- Store mới `useStartupStore` dùng persist `version: 1`. Không đổi version của store đã có.
- Không commit trong kế hoạch này, trừ khi bạn yêu cầu.
- Tạo file bằng công cụ Write, không ghi UTF-8 bằng PowerShell.
- Trước khi tạo file mới, chạy `git ls-files <đường dẫn>` để chắc chưa có file cùng tên.

## Quyết định của kế hoạch (không có trong spec)

- Mặt bằng: quán chọn trong màn quán, không vẽ thêm trên bản đồ. Lý do: S1 chưa có hình mặt bằng; vẽ là việc của giai đoạn map.
- Tên quán: chọn từ 6 tên có sẵn và 4 màu biển hiệu, không gõ tự do. Lý do: không có kiểm duyệt nội dung lúc chạy.
- Đơn sai: không ghi cả doanh thu lẫn chi phí. Spec mô tả "không doanh thu nhưng không trừ tiền ngoài chi phí đã dùng"; kế hoạch chọn không trừ gì để đơn sai không tốn tiền.
- Tiền thuê quán: chưa có ở S1 (spec §5 có `shop:rent`). Hoãn sang S2.
- Hạn 12 đơn theo ngày lịch (`todayKey`), không theo ngày học. Quán không thuộc chiến dịch nên không có ngày học.
- Giá món riêng = giá vốn nguyên liệu + 20. Cố định ở S1; "tự đặt giá" là việc của S3.
- Khi trừ vốn xong mà app dừng trước khi quán được ghi: lần mở sau sẽ thấy `pay:shop:<thành phố>` đã có và mở quán mà không trừ lại (`already`).

## Review Focus

1. Bấm mở quán hai lần, hoặc mở khi thiếu vốn: không trừ hai lần và không mở khi thiếu tiền. Pin bằng test `chargeCapital` (Task 3).
2. Phục vụ cùng một lượt hai lần: không bán hai lần. Pin bằng test `recordSale` trả `duplicate` (Task 3).
3. Đơn thứ 13 trong một ngày: bị từ chối và không ghi gì. Pin bằng test `recordSale` trả `full` (Task 3).
4. Món riêng không hợp lệ (quá 4 nguyên liệu, trùng nguyên liệu, không có nguyên liệu nền, trùng món trong thực đơn, tên ngoài danh sách): bị từ chối đúng lý do. Pin bằng test `validateCustomRecipe` (Task 2).
5. Hai máy mở quán khác tên cho cùng một thành phố: giữ bản mở sớm hơn, sổ không cộng đôi. Pin bằng test `mergeStartup` (Task 5).

---

## File Structure

| File | Trạng thái | Trách nhiệm |
|---|---|---|
| `src/data/startup-menu.ts` | Tạo | Nguyên liệu, 3 món cơ bản, tên món riêng, tên và màu quán, thành phố được mở quán |
| `src/data/startup-menu.test.ts` | Tạo | Test dữ liệu thực đơn |
| `src/services/startup/recipes.ts` | Tạo | Giá vốn, kiểm món riêng, tạo bước pha cho món riêng |
| `src/services/startup/recipes.test.ts` | Tạo | Test kiểm món riêng |
| `src/services/startup/economy.ts` | Tạo | Vốn mở quán, ghi bán có hạn và có khoá chống trùng, số dư quán |
| `src/services/startup/economy.test.ts` | Tạo | Test vốn và bán |
| `src/data/startup-orders.ts` | Tạo | Đơn khách S1 (3 đơn) |
| `src/services/startup/orders.ts` | Tạo | Chấm lượt phục vụ (món, bước pha, câu đáp) |
| `src/services/startup/orders.test.ts` | Tạo | Test dữ liệu đơn và chấm |
| `src/services/startup/sync.ts` | Tạo | Chuẩn hoá và gộp trạng thái quán khi đồng bộ |
| `src/services/startup/sync.test.ts` | Tạo | Test đồng bộ |
| `src/store/useStudyAbroadStore.ts` | Sửa | Thêm `chargeShopCapital(city)` |
| `src/store/useStartupStore.ts` | Tạo | Quán, sổ quán, món riêng; mở quán, phục vụ, tạo món riêng |
| `src/services/sync/stores.ts` | Sửa | Đăng ký store `startup` đồng bộ |
| `src/components/startup/Chip.tsx` | Tạo | Nút chọn nhỏ dùng chung |
| `src/components/startup/OpenShopForm.tsx` | Tạo | Chọn tên, màu, mở quán |
| `src/components/startup/CustomRecipeForm.tsx` | Tạo | Ghép món riêng từ nguyên liệu |
| `src/components/startup/ServeFlow.tsx` | Tạo | Phục vụ một đơn: chọn món, pha 3 bước, câu đáp, gửi |
| `app/quest/study-abroad/cafe.tsx` | Tạo | Màn quán |
| `app/quest/study-abroad/dorm.tsx` | Sửa | Thêm lối vào màn quán |

---

## Task 1: Dữ liệu thực đơn

**Files:**
- Create: `src/data/startup-menu.ts`
- Create: `src/data/startup-menu.test.ts`

**Interfaces:**
- Consumes: `type Bi` từ `@/i18n/useL`.
- Produces: `type Ingredient = { id: string; name: Bi; kind: 'base' | 'add'; cost: number }`; `type BrewStep = { label: Bi; options: readonly Bi[]; correct: number }`; `type Recipe = { id: string; name: Bi; price: number; ingredients: readonly string[]; steps: readonly BrewStep[]; custom: boolean }`; `INGREDIENTS: readonly Ingredient[]`; `BASE_RECIPES: readonly Recipe[]` (3 món, `custom: false`); `CUSTOM_NAMES: readonly Bi[]`; `SHOP_NAMES: readonly Bi[]`; `SHOP_COLORS: readonly string[]`; `SHOP_CITIES: readonly ['singapore']`.

- [ ] **Step 1: Viết test thất bại**

Tạo `src/data/startup-menu.test.ts`:

```ts
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
```

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `npx tsx --test src/data/startup-menu.test.ts`
Expected: FAIL với "Cannot find module './startup-menu'".

- [ ] **Step 3: Viết dữ liệu thực đơn**

Tạo `src/data/startup-menu.ts`:

```ts
import type { Bi } from '@/i18n/useL';

export type Ingredient = { id: string; name: Bi; kind: 'base' | 'add'; cost: number };
export type BrewStep = { label: Bi; options: readonly Bi[]; correct: number };
export type Recipe = {
  id: string;
  name: Bi;
  price: number;
  ingredients: readonly string[];
  steps: readonly BrewStep[];
  custom: boolean;
};

/** Nguyên liệu: nền là thứ phải có ít nhất một loại; phụ là thứ thêm vào. Giá vốn tính theo đơn vị một ly. */
export const INGREDIENTS: readonly Ingredient[] = [
  { id: 'ca-phe-phin', name: { vi: 'Cà phê phin', en: 'Phin coffee' }, kind: 'base', cost: 8 },
  { id: 'tra-den', name: { vi: 'Trà đen', en: 'Black tea' }, kind: 'base', cost: 4 },
  { id: 'sua-dac', name: { vi: 'Sữa đặc', en: 'Condensed milk' }, kind: 'add', cost: 3 },
  { id: 'sua-tuoi', name: { vi: 'Sữa tươi', en: 'Fresh milk' }, kind: 'add', cost: 3 },
  { id: 'duong', name: { vi: 'Đường', en: 'Sugar' }, kind: 'add', cost: 1 },
  { id: 'da', name: { vi: 'Đá viên', en: 'Ice cubes' }, kind: 'add', cost: 1 },
  { id: 'tran-chau', name: { vi: 'Trân châu', en: 'Pearls' }, kind: 'add', cost: 4 },
];

export const BASE_RECIPES: readonly Recipe[] = [
  {
    id: 'ca-phe-sua-da',
    name: { vi: 'Cà phê sữa đá', en: 'Iced milk coffee' },
    price: 25,
    ingredients: ['ca-phe-phin', 'sua-dac', 'da'],
    custom: false,
    steps: [
      { label: { vi: 'Nền', en: 'Base' }, options: [{ vi: 'Trà đen', en: 'Black tea' }, { vi: 'Cà phê phin', en: 'Phin coffee' }, { vi: 'Nước lọc', en: 'Plain water' }], correct: 1 },
      { label: { vi: 'Sữa', en: 'Milk' }, options: [{ vi: 'Không sữa', en: 'No milk' }, { vi: 'Sữa đặc', en: 'Condensed milk' }, { vi: 'Sữa tươi', en: 'Fresh milk' }], correct: 1 },
      { label: { vi: 'Đá', en: 'Ice' }, options: [{ vi: 'Nước nóng', en: 'Hot water' }, { vi: 'Không đá', en: 'No ice' }, { vi: 'Đá viên', en: 'Ice cubes' }], correct: 2 },
    ],
  },
  {
    id: 'tra-da',
    name: { vi: 'Trà đá', en: 'Iced tea' },
    price: 15,
    ingredients: ['tra-den', 'duong', 'da'],
    custom: false,
    steps: [
      { label: { vi: 'Nền', en: 'Base' }, options: [{ vi: 'Cà phê phin', en: 'Phin coffee' }, { vi: 'Trà đen', en: 'Black tea' }, { vi: 'Nước lọc', en: 'Plain water' }], correct: 1 },
      { label: { vi: 'Đường', en: 'Sugar' }, options: [{ vi: 'Không đường', en: 'No sugar' }, { vi: 'Đường', en: 'Sugar' }, { vi: 'Muối', en: 'Salt' }], correct: 1 },
      { label: { vi: 'Đá', en: 'Ice' }, options: [{ vi: 'Nước nóng', en: 'Hot water' }, { vi: 'Không đá', en: 'No ice' }, { vi: 'Đá viên', en: 'Ice cubes' }], correct: 2 },
    ],
  },
  {
    id: 'tra-sua-tran-chau',
    name: { vi: 'Trà sữa trân châu', en: 'Bubble milk tea' },
    price: 35,
    ingredients: ['tra-den', 'sua-tuoi', 'tran-chau'],
    custom: false,
    steps: [
      { label: { vi: 'Nền', en: 'Base' }, options: [{ vi: 'Nước lọc', en: 'Plain water' }, { vi: 'Trà đen', en: 'Black tea' }, { vi: 'Cà phê phin', en: 'Phin coffee' }], correct: 1 },
      { label: { vi: 'Sữa', en: 'Milk' }, options: [{ vi: 'Không sữa', en: 'No milk' }, { vi: 'Sữa đặc', en: 'Condensed milk' }, { vi: 'Sữa tươi', en: 'Fresh milk' }], correct: 2 },
      { label: { vi: 'Topping', en: 'Topping' }, options: [{ vi: 'Không topping', en: 'No topping' }, { vi: 'Trân châu', en: 'Pearls' }, { vi: 'Nước lọc', en: 'Plain water' }], correct: 1 },
    ],
  },
];

/** Tên có sẵn cho món riêng. Người chơi chọn từ đây, không gõ tự do. */
export const CUSTOM_NAMES: readonly Bi[] = [
  { vi: 'Cà phê Sài Gòn', en: 'Saigon coffee' },
  { vi: 'Trà đào mát', en: 'Cool peach tea' },
  { vi: 'Sữa tươi dừa', en: 'Fresh coconut milk' },
  { vi: 'Trà chanh đá', en: 'Iced lemon tea' },
  { vi: 'Trà sữa đặc biệt', en: 'Special milk tea' },
  { vi: 'Cà phê mới', en: 'New coffee' },
];

/** Tên quán có sẵn. Chọn từ đây, không gõ tự do. */
export const SHOP_NAMES: readonly Bi[] = [
  { vi: 'Quán Sài Gòn Nhỏ', en: 'Little Saigon Café' },
  { vi: 'Quán Trà Đá Bên Đường', en: 'Roadside Iced Tea' },
  { vi: 'Quán Cà Phê Góc Phố', en: 'Corner Coffee House' },
  { vi: 'Quán Sữa Tươi', en: 'Fresh Milk Bar' },
  { vi: 'Quán Trân Châu', en: 'Pearl Tea Shop' },
  { vi: 'Quán Xanh Lá', en: 'Green Leaf Café' },
];

export const SHOP_COLORS: readonly string[] = ['#B23A3A', '#2F8F6B', '#4C7BC0', '#D98A3D'];

/** Thành phố được mở quán. S1 chỉ có Singapore. */
export const SHOP_CITIES = ['singapore'] as const;
```

- [ ] **Step 4: Chạy test, xác nhận đạt**

Run: `npx tsx --test src/data/startup-menu.test.ts`
Expected: PASS (3 test).

---

## Task 2: Kiểm món riêng và tạo bước pha

**Files:**
- Create: `src/services/startup/recipes.ts`
- Create: `src/services/startup/recipes.test.ts`

**Interfaces:**
- Consumes: `BASE_RECIPES`, `CUSTOM_NAMES`, `INGREDIENTS`, `type BrewStep`, `type Recipe` từ `@/data/startup-menu`; `type Bi`.
- Produces:
  - `CUSTOM_RULES = { maxIngredients: 4, markup: 20 }`.
  - `recipeCost(ingredientIds: readonly string[]): number`.
  - `type CustomReason = 'bad-name' | 'empty' | 'too-many' | 'repeat-ingredient' | 'unknown-ingredient' | 'no-base' | 'same-as-menu'`.
  - `validateCustomRecipe(name: Bi, ingredients: readonly string[], existing: readonly Recipe[]): { ok: true } | { ok: false; reason: CustomReason }`.
  - `buildCustomSteps(ingredients: readonly string[]): BrewStep[]`.
  - `createCustomRecipe(input: { id: string; name: Bi; ingredients: readonly string[] }, existing: readonly Recipe[]): { ok: true; recipe: Recipe } | { ok: false; reason: CustomReason }`.

- [ ] **Step 1: Viết test thất bại**

Tạo `src/services/startup/recipes.test.ts`:

```ts
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
```

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `npx tsx --test src/services/startup/recipes.test.ts`
Expected: FAIL với "Cannot find module './recipes'".

- [ ] **Step 3: Viết kiểm món riêng**

Tạo `src/services/startup/recipes.ts`:

```ts
import { CUSTOM_NAMES, INGREDIENTS, type BrewStep, type Recipe } from '@/data/startup-menu';
import type { Bi } from '@/i18n/useL';

export const CUSTOM_RULES = { maxIngredients: 4, markup: 20 } as const;

export type CustomReason = 'bad-name' | 'empty' | 'too-many' | 'repeat-ingredient' | 'unknown-ingredient' | 'no-base' | 'same-as-menu';

export function recipeCost(ingredientIds: readonly string[]): number {
  return ingredientIds.reduce((sum, id) => sum + (INGREDIENTS.find((item) => item.id === id)?.cost ?? 0), 0);
}

function sameIngredients(a: readonly string[], b: readonly string[]): boolean {
  return [...a].sort().join('|') === [...b].sort().join('|');
}

export function validateCustomRecipe(name: Bi, ingredients: readonly string[], existing: readonly Recipe[]): { ok: true } | { ok: false; reason: CustomReason } {
  if (!CUSTOM_NAMES.some((item) => item.vi === name.vi)) return { ok: false, reason: 'bad-name' };
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
```

- [ ] **Step 4: Chạy test, xác nhận đạt**

Run: `npx tsx --test src/services/startup/recipes.test.ts`
Expected: PASS (4 test).

---

## Task 3: Sổ quán: vốn, bán có hạn, chống bán trùng

**Files:**
- Create: `src/services/startup/economy.ts`
- Create: `src/services/startup/economy.test.ts`

**Interfaces:**
- Consumes: `ledgerAdd`, `ledgerSum`, `type Ledger` từ `@/services/travel/economy`; `balanceOf` từ `@/services/study-abroad/economy`.
- Produces:
  - `SHOP_RULES = { capital: 150, ordersPerDay: 12 }`; `SHOP_PREFIX = 'shop:'`.
  - `capitalId(city: string): string` → `pay:shop:<city>`.
  - `type CapitalReason = 'ok' | 'already' | 'poor'`; `chargeCapital(studyLedger: Ledger, city: string): { ledger: Ledger; reason: CapitalReason }`.
  - `ordersToday(ledger: Ledger, day: string): number`.
  - `type SaleReason = 'paid' | 'full' | 'duplicate'`; `recordSale(ledger: Ledger, day: string, orderId: string, price: number, cost: number): { ledger: Ledger; paid: number; reason: SaleReason }`.
  - `shopBalance(ledger: Ledger): number`.

- [ ] **Step 1: Viết test thất bại**

Tạo `src/services/startup/economy.test.ts`:

```ts
import assert from 'node:assert/strict';
import test from 'node:test';

import { balanceOf } from '@/services/study-abroad/economy';
import type { Ledger } from '@/services/travel/economy';
import { chargeCapital, ordersToday, recordSale, shopBalance } from './economy';

const DAY = '2026-10-12';

test('mở quán: trừ vốn từ đồng du học một lần; thiếu tiền thì không trừ; đã trừ rồi thì báo already', () => {
  const poor = chargeCapital({ 'pay:shift:1:a': 100 }, 'singapore');
  assert.equal(poor.reason, 'poor');
  assert.deepEqual(poor.ledger, { 'pay:shift:1:a': 100 });

  const funded = chargeCapital({ 'pay:shift:1:a': 200 }, 'singapore');
  assert.equal(funded.reason, 'ok');
  assert.equal(balanceOf(funded.ledger), 50);

  const again = chargeCapital(funded.ledger, 'singapore');
  assert.equal(again.reason, 'already');
  assert.equal(balanceOf(again.ledger), 50);
});

test('bán: lãi = giá − chi phí; cùng mã đơn không bán hai lần', () => {
  const one = recordSale({}, DAY, 'o1', 25, 12);
  assert.equal(one.reason, 'paid');
  assert.equal(one.paid, 13);
  assert.equal(shopBalance(one.ledger), 13);

  const dup = recordSale(one.ledger, DAY, 'o1', 25, 12);
  assert.equal(dup.reason, 'duplicate');
  assert.equal(shopBalance(dup.ledger), 13);
});

test('đủ 12 đơn trong một ngày thì đơn thứ 13 bị từ chối; ngày khác vẫn bán được', () => {
  let ledger: Ledger = {};
  for (let i = 1; i <= 12; i++) ledger = recordSale(ledger, DAY, `o${i}`, 25, 12).ledger;
  assert.equal(ordersToday(ledger, DAY), 12);

  const full = recordSale(ledger, DAY, 'o13', 25, 12);
  assert.equal(full.reason, 'full');
  assert.deepEqual(full.ledger, ledger);

  assert.equal(recordSale(ledger, '2026-10-13', 'o13', 25, 12).reason, 'paid');
});
```

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `npx tsx --test src/services/startup/economy.test.ts`
Expected: FAIL với "Cannot find module './economy'".

- [ ] **Step 3: Viết sổ quán**

Tạo `src/services/startup/economy.ts`:

```ts
import { balanceOf } from '@/services/study-abroad/economy';
import { ledgerAdd, ledgerSum, type Ledger } from '@/services/travel/economy';

/** Mọi con số của quán ở một chỗ. */
export const SHOP_RULES = { capital: 150, ordersPerDay: 12 } as const;

export const SHOP_PREFIX = 'shop:';
const SALE = 'shop:sale:';
const COST = 'shop:cost:';

const has = (ledger: Ledger, id: string) => Object.prototype.hasOwnProperty.call(ledger, id);

/** Khoản vốn nằm trong sổ ĐỒNG DU HỌC. Khoá có tên thành phố nên mỗi thành phố chỉ trả vốn một lần. */
export function capitalId(city: string): string {
  return `pay:shop:${city}`;
}

export type CapitalReason = 'ok' | 'already' | 'poor';

export function chargeCapital(studyLedger: Ledger, city: string): { ledger: Ledger; reason: CapitalReason } {
  if (has(studyLedger, capitalId(city))) return { ledger: studyLedger, reason: 'already' };
  if (balanceOf(studyLedger) < SHOP_RULES.capital) return { ledger: studyLedger, reason: 'poor' };
  return { ledger: ledgerAdd(studyLedger, capitalId(city), -SHOP_RULES.capital), reason: 'ok' };
}

export function ordersToday(ledger: Ledger, day: string): number {
  const prefix = `${SALE}${day}:`;
  return Object.keys(ledger).filter((id) => id.startsWith(prefix)).length;
}

export type SaleReason = 'paid' | 'full' | 'duplicate';

/**
 * Ghi một đơn đã phục vụ đúng. `orderId` sinh một lần cho mỗi lần phục vụ, nên bấm hai lần
 * vẫn chỉ bán một lần. Đơn thứ 13 trong ngày bị từ chối và không ghi gì.
 */
export function recordSale(ledger: Ledger, day: string, orderId: string, price: number, cost: number): { ledger: Ledger; paid: number; reason: SaleReason } {
  const saleId = `${SALE}${day}:${orderId}`;
  if (has(ledger, saleId)) return { ledger, paid: 0, reason: 'duplicate' };
  if (ordersToday(ledger, day) >= SHOP_RULES.ordersPerDay) return { ledger, paid: 0, reason: 'full' };
  const next = ledgerAdd(ledgerAdd(ledger, saleId, price), `${COST}${day}:${orderId}`, -cost);
  return { ledger: next, paid: price - cost, reason: 'paid' };
}

export function shopBalance(ledger: Ledger): number {
  return Math.max(0, ledgerSum(ledger, SHOP_PREFIX));
}
```

- [ ] **Step 4: Chạy test, xác nhận đạt**

Run: `npx tsx --test src/services/startup/economy.test.ts`
Expected: PASS (3 test).

---

## Task 4: Đơn khách và chấm lượt phục vụ

**Files:**
- Create: `src/data/startup-orders.ts`
- Create: `src/services/startup/orders.ts`
- Create: `src/services/startup/orders.test.ts`

**Interfaces:**
- Consumes: `BASE_RECIPES`, `type BrewStep`, `type Recipe` từ `@/data/startup-menu`; `type Bi`.
- Produces:
  - `type ShopOrder = { id: string; npc: Bi; line: string; drinkId: string; replyOptions: readonly string[]; replyAnswer: number; hint: Bi; explanation: Bi }`; `SHOP_ORDERS: readonly ShopOrder[]` (3 đơn S1).
  - `type ServePick = { drinkId: string; brewChoices: readonly number[]; replyIndex: number }`.
  - `type ServeScore = { drinkOk: boolean; brewOk: boolean; replyOk: boolean; correct: boolean }`.
  - `brewCorrect(steps: readonly BrewStep[], choices: readonly number[]): boolean`.
  - `scoreServe(order: ShopOrder, recipe: Recipe, pick: ServePick): ServeScore`.
  - `findRecipe(id: string, recipes: readonly Recipe[]): Recipe | undefined`.

- [ ] **Step 1: Viết test thất bại**

Tạo `src/services/startup/orders.test.ts`:

```ts
import assert from 'node:assert/strict';
import test from 'node:test';

import { BASE_RECIPES } from '@/data/startup-menu';
import { SHOP_ORDERS } from '@/data/startup-orders';
import { brewCorrect, findRecipe, scoreServe } from './orders';

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
```

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `npx tsx --test src/services/startup/orders.test.ts`
Expected: FAIL với "Cannot find module '@/data/startup-orders'".

- [ ] **Step 3: Viết dữ liệu đơn và bộ chấm**

Tạo `src/data/startup-orders.ts`:

```ts
import type { Bi } from '@/i18n/useL';

/** Một đơn khách: khách nói một câu, gọi một món; sau khi đưa đồ, người bán đáp một câu. */
export type ShopOrder = {
  id: string;
  npc: Bi;
  line: string;
  drinkId: string;
  replyOptions: readonly string[];
  replyAnswer: number;
  hint: Bi;
  explanation: Bi;
};

export const SHOP_ORDERS: readonly ShopOrder[] = [
  {
    id: 'sg-order-coffee',
    npc: { vi: 'Aisha', en: 'Aisha' },
    line: 'Hi, one iced milk coffee, please.',
    drinkId: 'ca-phe-sua-da',
    replyOptions: ['Here you go. Enjoy your coffee!', 'I am going to the station.', 'The coffee is in the sea.', 'Ten dollars, no thanks.'],
    replyAnswer: 0,
    hint: { vi: 'Đưa đồ uống và chúc khách ngon miệng.', en: 'Hand over the drink and wish the customer well.' },
    explanation: { vi: '“Here you go” là lúc đưa đồ; “Enjoy your coffee” là lời chúc tự nhiên.', en: '“Here you go” hands the drink over; “Enjoy your coffee” is a natural wish.' },
  },
  {
    id: 'sg-order-tea',
    npc: { vi: 'Mei', en: 'Mei' },
    line: 'Could I get a cup of iced tea, please?',
    drinkId: 'tra-da',
    replyOptions: ['Sure, that is two dollars, please.', 'I went to the bowl yesterday.', 'Tea is a very long train.', 'Please wait for the bus.'],
    replyAnswer: 0,
    hint: { vi: 'Đồng ý nhận đơn, rồi báo giá.', en: 'Agree to the order, then state the price.' },
    explanation: { vi: '“Sure” nhận đơn; “that is two dollars” báo giá.', en: '“Sure” accepts the order; “that is two dollars” states the price.' },
  },
  {
    id: 'sg-order-bubble',
    npc: { vi: 'Luca', en: 'Luca' },
    line: 'I would like a bubble milk tea, please.',
    drinkId: 'tra-sua-tran-chau',
    replyOptions: ['Here you go. Would you like some ice?', 'The milk tea is in the station.', 'I do not like tea yesterday.', 'Pearls are a train.'],
    replyAnswer: 0,
    hint: { vi: 'Đưa đồ uống, rồi hỏi khách có cần thêm đá không.', en: 'Hand over the drink, then ask whether the customer wants ice.' },
    explanation: { vi: '“Here you go” đưa đồ; “Would you like some ice?” là câu hỏi lịch sự thêm.', en: '“Here you go” hands it over; “Would you like some ice?” is a polite follow-up.' },
  },
];
```

Tạo `src/services/startup/orders.ts`:

```ts
import type { BrewStep, Recipe } from '@/data/startup-menu';
import type { ShopOrder } from '@/data/startup-orders';

/** Một lượt phục vụ: món chọn, lựa chọn ở từng bước pha, và câu đáp sau khi đưa đồ. */
export type ServePick = { drinkId: string; brewChoices: readonly number[]; replyIndex: number };
export type ServeScore = { drinkOk: boolean; brewOk: boolean; replyOk: boolean; correct: boolean };

export function brewCorrect(steps: readonly BrewStep[], choices: readonly number[]): boolean {
  return steps.length === choices.length && steps.every((step, i) => choices[i] === step.correct);
}

export function scoreServe(order: ShopOrder, recipe: Recipe, pick: ServePick): ServeScore {
  const drinkOk = pick.drinkId === order.drinkId && recipe.id === order.drinkId;
  const brewOk = brewCorrect(recipe.steps, pick.brewChoices);
  const replyOk = pick.replyIndex === order.replyAnswer;
  return { drinkOk, brewOk, replyOk, correct: drinkOk && brewOk && replyOk };
}

export function findRecipe(id: string, recipes: readonly Recipe[]): Recipe | undefined {
  return recipes.find((recipe) => recipe.id === id);
}
```

- [ ] **Step 4: Chạy test, xác nhận đạt**

Run: `npx tsx --test src/services/startup/orders.test.ts`
Expected: PASS (3 test).

---

## Task 5: Đồng bộ trạng thái quán

**Files:**
- Create: `src/services/startup/sync.ts`
- Create: `src/services/startup/sync.test.ts`

**Interfaces:**
- Consumes: `mergeLedgers`, `type Ledger` từ `@/services/travel/economy`; `type Recipe`, `type Bi`.
- Produces:
  - `type Shop = { city: string; name: Bi; color: string; openedAt: string }`.
  - `type StartupPayload = { shops: Record<string, Shop>; ledger: Ledger; customRecipes: Recipe[] }`.
  - `normalizeStartup(raw: unknown): StartupPayload`.
  - `mergeStartup(local: unknown, remote: unknown | null): StartupPayload`.

- [ ] **Step 1: Viết test thất bại**

Tạo `src/services/startup/sync.test.ts`:

```ts
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
```

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `npx tsx --test src/services/startup/sync.test.ts`
Expected: FAIL với "Cannot find module './sync'".

- [ ] **Step 3: Viết chuẩn hoá và gộp**

Tạo `src/services/startup/sync.ts`:

```ts
import type { Bi } from '@/i18n/useL';
import type { Recipe } from '@/data/startup-menu';
import { mergeLedgers, type Ledger } from '@/services/travel/economy';

export type Shop = { city: string; name: Bi; color: string; openedAt: string };
export type StartupPayload = { shops: Record<string, Shop>; ledger: Ledger; customRecipes: Recipe[] };

const isBi = (x: unknown): x is Bi => !!x && typeof x === 'object' && typeof (x as Bi).vi === 'string' && typeof (x as Bi).en === 'string';

function normalizeShops(raw: unknown): Record<string, Shop> {
  if (!raw || typeof raw !== 'object') return {};
  const out: Record<string, Shop> = {};
  for (const [city, value] of Object.entries(raw)) {
    const s = value as Partial<Shop>;
    if (typeof s?.city !== 'string' || !isBi(s.name) || typeof s.color !== 'string' || typeof s.openedAt !== 'string') continue;
    out[city] = { city: s.city, name: s.name, color: s.color, openedAt: s.openedAt };
  }
  return out;
}

function normalizeLedger(raw: unknown): Ledger {
  if (!raw || typeof raw !== 'object') return {};
  const out: Ledger = {};
  for (const [id, amount] of Object.entries(raw)) {
    if (typeof amount === 'number' && Number.isFinite(amount)) out[id] = amount;
  }
  return out;
}

function normalizeRecipes(raw: unknown): Recipe[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((r): r is Recipe => {
    const x = r as Partial<Recipe>;
    return typeof x?.id === 'string' && isBi(x.name) && typeof x.price === 'number' && Array.isArray(x.ingredients) && Array.isArray(x.steps) && x.steps.length > 0 && x.custom === true;
  });
}

export function normalizeStartup(raw: unknown): StartupPayload {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<Record<keyof StartupPayload, unknown>>;
  return { shops: normalizeShops(r.shops), ledger: normalizeLedger(r.ledger), customRecipes: normalizeRecipes(r.customRecipes) };
}

/**
 * Gộp hai máy. Quán: mỗi thành phố giữ bản mở sớm hơn (theo `openedAt`). Sổ: hợp theo mã.
 * Món riêng: hợp theo mã món, bản trên máy này thắng nếu trùng.
 */
export function mergeStartup(local: unknown, remote: unknown | null): StartupPayload {
  const a = normalizeStartup(local);
  if (remote === null || remote === undefined) return a;
  const b = normalizeStartup(remote);
  const shops: Record<string, Shop> = { ...b.shops };
  for (const [city, shop] of Object.entries(a.shops)) {
    if (!shops[city] || shop.openedAt < shops[city]!.openedAt) shops[city] = shop;
  }
  const seen = new Set(a.customRecipes.map((recipe) => recipe.id));
  const customRecipes = [...a.customRecipes, ...b.customRecipes.filter((recipe) => !seen.has(recipe.id))];
  return { shops, ledger: mergeLedgers(a.ledger, b.ledger), customRecipes };
}
```

- [ ] **Step 4: Chạy test, xác nhận đạt**

Run: `npx tsx --test src/services/startup/sync.test.ts`
Expected: PASS (3 test).

---

## Task 6: Store quán và nối vào store Du học

**Files:**
- Modify: `src/store/useStudyAbroadStore.ts` (thêm action `chargeShopCapital`)
- Create: `src/store/useStartupStore.ts`
- Modify: `src/services/sync/stores.ts` (đăng ký store `startup`)

**Interfaces:**
- Consumes: `chargeCapital`, `recordSale`, `shopBalance`, `type CapitalReason`, `type SaleReason` từ `@/services/startup/economy`; `createCustomRecipe`, `recipeCost`, `type CustomReason` từ `@/services/startup/recipes`; `findRecipe`, `scoreServe`, `type ServePick` từ `@/services/startup/orders`; `SHOP_ORDERS`, `type ShopOrder` từ `@/data/startup-orders`; `BASE_RECIPES`, `CUSTOM_NAMES`, `SHOP_CITIES`, `SHOP_COLORS`, `SHOP_NAMES`, `type Recipe` từ `@/data/startup-menu`; `mergeStartup`, `normalizeStartup`, `type Shop`, `type StartupPayload` từ `@/services/startup/sync`; `todayKey`, `uid`, `STORAGE_PREFIX`, `storage` từ `./persist`.
- Produces:
  - Study store: `chargeShopCapital(city: string): CapitalReason`.
  - `useStartupStore` với: `shops`, `ledger`, `customRecipes`, `openShop(city: string, nameIndex: number, colorIndex: number): OpenOutcome`, `serve(city: string, order: ShopOrder, pick: ServePick, attemptId: string): ServeOutcome`, `addCustomRecipe(nameIndex: number, ingredients: readonly string[]): CustomOutcome`, `reset()`.
  - `type OpenOutcome = 'ok' | 'already' | 'poor' | 'invalid'`; `type ServeOutcome = { correct: boolean; paid: number; reason: 'paid' | 'full' | 'duplicate' | 'wrong' | 'no-shop' }`; `type CustomOutcome = { ok: true; recipe: Recipe } | { ok: false; reason: CustomReason }`.

Store không có test riêng (persist và localStorage). Logic đã được test ở Task 2–5. Kiểm bằng typecheck ở Task 8.

- [ ] **Step 1: Thêm action vào store Du học**

Đọc `src/store/useStudyAbroadStore.ts`. Thêm import:

```ts
import { chargeCapital, type CapitalReason } from '@/services/startup/economy';
```

Thêm vào type `StudyAbroadState` (sau `workShift`):

```ts
  chargeShopCapital: (city: string) => CapitalReason;
```

Thêm vào object trong `persist((set, get) => ({ ... }))` (sau `workShift`):

```ts
      chargeShopCapital: (city) => {
        const result = chargeCapital(get().ledger, city);
        if (result.reason === 'ok') set({ ledger: result.ledger });
        return result.reason;
      },
```

- [ ] **Step 2: Tạo store quán**

Tạo `src/store/useStartupStore.ts`:

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_PREFIX, storage, todayKey, uid } from './persist';
import { useStudyAbroadStore } from './useStudyAbroadStore';
import { BASE_RECIPES, CUSTOM_NAMES, SHOP_CITIES, SHOP_COLORS, SHOP_NAMES, type Recipe } from '@/data/startup-menu';
import type { ShopOrder } from '@/data/startup-orders';
import { recordSale, shopBalance, type CapitalReason, type SaleReason } from '@/services/startup/economy';
import { createCustomRecipe, recipeCost, type CustomReason } from '@/services/startup/recipes';
import { findRecipe, scoreServe, type ServePick } from '@/services/startup/orders';
import { type Shop } from '@/services/startup/sync';
import type { Ledger } from '@/services/travel/economy';

export type OpenOutcome = 'ok' | 'already' | 'poor' | 'invalid';
export type ServeOutcome = { correct: boolean; paid: number; reason: SaleReason | 'wrong' | 'no-shop' };
export type CustomOutcome = { ok: true; recipe: Recipe } | { ok: false; reason: CustomReason };

type StartupState = {
  shops: Record<string, Shop>;
  ledger: Ledger;
  customRecipes: Recipe[];
  openShop: (city: string, nameIndex: number, colorIndex: number) => OpenOutcome;
  serve: (city: string, order: ShopOrder, pick: ServePick, attemptId: string) => ServeOutcome;
  addCustomRecipe: (nameIndex: number, ingredients: readonly string[]) => CustomOutcome;
  reset: () => void;
};

export const useStartupStore = create<StartupState>()(
  persist(
    (set, get) => ({
      shops: {},
      ledger: {},
      customRecipes: [],
      openShop: (city, nameIndex, colorIndex) => {
        const state = get();
        if (state.shops[city]) return 'already';
        const name = SHOP_NAMES[nameIndex];
        const color = SHOP_COLORS[colorIndex];
        if (!name || !color || !(SHOP_CITIES as readonly string[]).includes(city)) return 'invalid';
        // Vốn trừ trong sổ đồng du học TRƯỚC; lần mở sau nếu đã trừ rồi (`already`) thì mở mà không trừ lại.
        const charge: CapitalReason = useStudyAbroadStore.getState().chargeShopCapital(city);
        if (charge === 'poor') return 'poor';
        set({ shops: { ...state.shops, [city]: { city, name, color, openedAt: new Date().toISOString() } } });
        return 'ok';
      },
      serve: (city, order, pick, attemptId) => {
        const state = get();
        if (!state.shops[city]) return { correct: false, paid: 0, reason: 'no-shop' };
        const recipe = findRecipe(pick.drinkId, [...BASE_RECIPES, ...state.customRecipes]);
        if (!recipe || !scoreServe(order, recipe, pick).correct) return { correct: false, paid: 0, reason: 'wrong' };
        const sale = recordSale(state.ledger, todayKey(), attemptId, recipe.price, recipeCost(recipe.ingredients));
        set({ ledger: sale.ledger });
        return { correct: true, paid: sale.paid, reason: sale.reason };
      },
      addCustomRecipe: (nameIndex, ingredients) => {
        const state = get();
        const name = CUSTOM_NAMES[nameIndex];
        if (!name) return { ok: false, reason: 'bad-name' };
        const outcome = createCustomRecipe({ id: `custom-${uid()}`, name, ingredients }, [...BASE_RECIPES, ...state.customRecipes]);
        if (!outcome.ok) return outcome;
        set({ customRecipes: [...state.customRecipes, outcome.recipe] });
        return outcome;
      },
      reset: () => set({ shops: {}, ledger: {}, customRecipes: [] }),
    }),
    {
      name: `${STORAGE_PREFIX}startup`,
      storage: storage<StartupState>(),
      version: 1,
      partialize: (state) => ({ shops: state.shops, ledger: state.ledger, customRecipes: state.customRecipes }) as StartupState,
      merge: (persisted, current) => {
        const saved = persisted as Partial<StartupState>;
        return {
          ...current,
          ...saved,
          shops: { ...(saved.shops ?? {}) },
          ledger: { ...(saved.ledger ?? {}) },
          customRecipes: [...(saved.customRecipes ?? [])],
          openShop: current.openShop,
          serve: current.serve,
          addCustomRecipe: current.addCustomRecipe,
          reset: current.reset,
        };
      },
    },
  ),
);

/** Số dư quán để hiển thị. Đọc ở đây để màn hình không tự tính lại luật. */
export const selectShopBalance = (state: { ledger: Ledger }) => shopBalance(state.ledger);
```

Ghi chú cho người thực hiện: `SaleReason` có `paid`, `full`, `duplicate`; `ServeOutcome.reason` mở rộng thêm `wrong` và `no-shop`.

- [ ] **Step 3: Đăng ký đồng bộ**

Trong `src/services/sync/stores.ts`:

Thêm import (cùng nhóm với các import hiện có):

```ts
import { mergeStartup, normalizeStartup } from '@/services/startup/sync';
import { useStartupStore } from '@/store/useStartupStore';
```

Thêm định nghĩa store ngay sau `studyAbroadStore` (quanh dòng 310):

```ts
/** Quán khởi nghiệp: quán đã mở, sổ quán, món riêng. Vốn nằm ở sổ đồng du học (store Du học). */
const startupStore: SyncedStore = {
  key: 'startup',
  read: () => {
    const s = useStartupStore.getState();
    return { shops: s.shops, ledger: s.ledger, customRecipes: s.customRecipes };
  },
  write: (payload) => {
    if (payload) {
      const n = normalizeStartup(payload);
      useStartupStore.setState({ shops: n.shops, ledger: n.ledger, customRecipes: n.customRecipes });
    }
  },
  merge: (local, remote) => mergeStartup(local, remote),
};
```

Trong `registerAllSyncedStores()`, thêm dòng sau `registerSyncedStore(studyAbroadStore);`:

```ts
  registerSyncedStore(startupStore);
```

- [ ] **Step 4: Kiểm typecheck**

Run: `npx tsc --noEmit 2>&1 | grep -E "startup|useStudyAbroadStore|services/sync/stores"`
Expected: không có dòng nào. Nếu có lỗi trong các file này, sửa rồi chạy lại.

---

## Task 7: Màn quán và lối vào

**Files:**
- Create: `src/components/startup/Chip.tsx`
- Create: `src/components/startup/OpenShopForm.tsx`
- Create: `src/components/startup/CustomRecipeForm.tsx`
- Create: `src/components/startup/ServeFlow.tsx`
- Create: `app/quest/study-abroad/cafe.tsx`
- Modify: `app/quest/study-abroad/dorm.tsx` (thêm nút vào màn quán)

**Interfaces:**
- Consumes: `GameButton`, `PixelPanel`, `TravelPage`, `T` từ components kit; `bi`, `useL`; `useStartupStore`, `OpenOutcome`, `ServeOutcome`, `CustomOutcome`; `useStudyAbroadStore`; `balanceOf` từ `@/services/study-abroad/economy`; `shopBalance`, `ordersToday`, `SHOP_RULES` từ `@/services/startup/economy`; `BASE_RECIPES`, `INGREDIENTS`, `SHOP_CITIES`, `SHOP_NAMES`, `SHOP_COLORS`, `CUSTOM_NAMES`, `type Recipe`; `SHOP_ORDERS`, `type ShopOrder`; `type ServePick`; `uid`, `todayKey` từ `@/store/persist`; `router`.
- Produces: route `/quest/study-abroad/cafe`; các component dùng chung trong `src/components/startup/`.

Các component chỉ hiển thị và gọi store. Không có luật nào nằm trong component.

- [ ] **Step 1: Nút chọn dùng chung**

Tạo `src/components/startup/Chip.tsx`:

```tsx
import React from 'react';
import { Pressable, Text } from 'react-native';

import { T } from '@/components/travel/ui/kit';

export function Chip({ label, selected, onPress, color }: { label: string; selected: boolean; onPress: () => void; color?: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{ minHeight: 44, paddingVertical: 8, paddingHorizontal: 11, borderRadius: 999, borderWidth: 1.5, justifyContent: 'center', borderColor: selected ? (color ?? T.goldDark) : T.line, backgroundColor: selected ? '#F7EDDA' : '#FFFFFF' }}
    >
      <Text className="font-semi" style={{ color: T.ink, fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}
```

- [ ] **Step 2: Form mở quán**

Tạo `src/components/startup/OpenShopForm.tsx`:

```tsx
import React, { useState } from 'react';
import { Text, View } from 'react-native';

import { GameButton, PixelPanel, T } from '@/components/travel/ui/kit';
import { SHOP_COLORS, SHOP_NAMES } from '@/data/startup-menu';
import { bi, useL } from '@/i18n/useL';
import { SHOP_RULES } from '@/services/startup/economy';
import type { OpenOutcome } from '@/store/useStartupStore';
import { Chip } from './Chip';

export function OpenShopForm({ onOpen }: { onOpen: (nameIndex: number, colorIndex: number) => OpenOutcome }) {
  const { L, locale } = useL();
  const [nameIndex, setNameIndex] = useState(0);
  const [colorIndex, setColorIndex] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);

  const press = () => {
    const outcome = onOpen(nameIndex, colorIndex);
    if (outcome === 'ok') setNotice(L('Quán đã mở. Chúc bạn buôn may bán đắt!', 'The shop is open. Good luck!'));
    else if (outcome === 'poor') setNotice(L(`Chưa đủ ${SHOP_RULES.capital} đồng du học để mở quán.`, `You need ${SHOP_RULES.capital} study funds to open.`));
    else if (outcome === 'already') setNotice(L('Quán này đã mở.', 'This shop is already open.'));
    else setNotice(L('Không mở được quán.', 'The shop could not open.'));
  };

  return (
    <PixelPanel tone="paper" style={{ marginTop: 14 }} inner={{ padding: 14, gap: 10 }}>
      <Text className="font-heavy" style={{ color: T.ink, fontSize: 16 }}>{L('Mở quán ở Singapore', 'Open a shop in Singapore')}</Text>
      <Text className="font-sans" style={{ color: T.muted, fontSize: 13, lineHeight: 19 }}>
        {L(`Vốn ${SHOP_RULES.capital} đồng du học. Sau khi mở, quán tự thu chi bằng doanh thu của mình.`, `Capital ${SHOP_RULES.capital} study funds. After that the shop runs on its own sales.`)}
      </Text>
      <Text className="font-semi" style={{ color: T.ink, fontSize: 13 }}>{L('Tên quán', 'Shop name')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {SHOP_NAMES.map((name, i) => (
          <Chip key={`name-${i}`} label={bi(name, locale)} selected={nameIndex === i} onPress={() => setNameIndex(i)} />
        ))}
      </View>
      <Text className="font-semi" style={{ color: T.ink, fontSize: 13 }}>{L('Màu biển hiệu', 'Sign colour')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {SHOP_COLORS.map((color, i) => (
          <Chip key={`color-${i}`} label={`${i + 1}`} selected={colorIndex === i} color={color} onPress={() => setColorIndex(i)} />
        ))}
      </View>
      <GameButton label={L(`Mở quán — ${SHOP_RULES.capital} đồng du học`, `Open shop — ${SHOP_RULES.capital} study funds`)} tone="gold" onPress={press} />
      {notice ? <Text className="font-semi" style={{ color: T.goldDark, fontSize: 13, lineHeight: 19 }}>{notice}</Text> : null}
    </PixelPanel>
  );
}
```

- [ ] **Step 3: Form món riêng**

Tạo `src/components/startup/CustomRecipeForm.tsx`:

```tsx
import React, { useState } from 'react';
import { Text, View } from 'react-native';

import { GameButton, PixelPanel, T } from '@/components/travel/ui/kit';
import { CUSTOM_NAMES, INGREDIENTS } from '@/data/startup-menu';
import { bi, useL } from '@/i18n/useL';
import { CUSTOM_RULES } from '@/services/startup/recipes';
import type { CustomOutcome } from '@/store/useStartupStore';
import { Chip } from './Chip';

export function CustomRecipeForm({ onCreate }: { onCreate: (nameIndex: number, ingredients: readonly string[]) => CustomOutcome }) {
  const { L, locale } = useL();
  const [nameIndex, setNameIndex] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  const toggle = (id: string) => setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < CUSTOM_RULES.maxIngredients ? [...prev, id] : prev));

  const press = () => {
    const outcome = onCreate(nameIndex, picked);
    if (outcome.ok) {
      setNotice(L('Đã thêm món mới vào thực đơn.', 'New drink added to the menu.'));
      setPicked([]);
      return;
    }
    const texts: Record<string, [string, string]> = {
      'bad-name': ['Chọn tên món trong danh sách.', 'Pick a name from the list.'],
      empty: ['Chọn ít nhất một nguyên liệu.', 'Pick at least one ingredient.'],
      'too-many': [`Tối đa ${CUSTOM_RULES.maxIngredients} nguyên liệu.`, `At most ${CUSTOM_RULES.maxIngredients} ingredients.`],
      'repeat-ingredient': ['Mỗi nguyên liệu chỉ chọn một lần.', 'Each ingredient only once.'],
      'unknown-ingredient': ['Có nguyên liệu không có trong kho.', 'An ingredient is not in stock.'],
      'no-base': ['Cần ít nhất một nguyên liệu nền (cà phê hoặc trà).', 'Add at least one base (coffee or tea).'],
      'same-as-menu': ['Món này đã có trong thực đơn.', 'This drink is already on the menu.'],
    };
    const [vi, en] = texts[outcome.reason] ?? ['Không tạo được món.', 'Could not create the drink.'];
    setNotice(L(vi, en));
  };

  return (
    <PixelPanel tone="paper" style={{ marginTop: 14 }} inner={{ padding: 14, gap: 10 }}>
      <Text className="font-heavy" style={{ color: T.ink, fontSize: 16 }}>{L('Tạo món riêng', 'Create your own drink')}</Text>
      <Text className="font-sans" style={{ color: T.muted, fontSize: 13, lineHeight: 19 }}>
        {L(`Tối đa ${CUSTOM_RULES.maxIngredients} nguyên liệu, phải có một nguyên liệu nền. Giá bán = giá vốn + ${CUSTOM_RULES.markup}.`, `Up to ${CUSTOM_RULES.maxIngredients} ingredients, at least one base. Price = cost + ${CUSTOM_RULES.markup}.`)}
      </Text>
      <Text className="font-semi" style={{ color: T.ink, fontSize: 13 }}>{L('Tên món', 'Drink name')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {CUSTOM_NAMES.map((name, i) => (
          <Chip key={`cname-${i}`} label={bi(name, locale)} selected={nameIndex === i} onPress={() => setNameIndex(i)} />
        ))}
      </View>
      <Text className="font-semi" style={{ color: T.ink, fontSize: 13 }}>{L('Nguyên liệu', 'Ingredients')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {INGREDIENTS.map((item) => (
          <Chip key={item.id} label={bi(item.name, locale)} selected={picked.includes(item.id)} onPress={() => toggle(item.id)} />
        ))}
      </View>
      <GameButton label={L('Tạo món', 'Create drink')} tone="gold" onPress={press} disabled={picked.length === 0} />
      {notice ? <Text className="font-semi" style={{ color: T.goldDark, fontSize: 13, lineHeight: 19 }}>{notice}</Text> : null}
    </PixelPanel>
  );
}
```

- [ ] **Step 4: Luồng phục vụ một đơn**

Tạo `src/components/startup/ServeFlow.tsx`:

```tsx
import React, { useState } from 'react';
import { Text, View } from 'react-native';

import { GameButton, PixelPanel, T } from '@/components/travel/ui/kit';
import type { Recipe } from '@/data/startup-menu';
import type { ShopOrder } from '@/data/startup-orders';
import { bi, useL } from '@/i18n/useL';
import type { ServePick } from '@/services/startup/orders';
import type { ServeOutcome } from '@/store/useStartupStore';
import { uid } from '@/store/persist';
import { Chip } from './Chip';

export function ServeFlow({ order, recipes, onServe }: { order: ShopOrder; recipes: readonly Recipe[]; onServe: (pick: ServePick, attemptId: string) => ServeOutcome }) {
  const { L, locale } = useL();
  // Mỗi lần phục vụ có một mã riêng; bấm hai lần trước khi màn cập nhật vẫn trùng mã nên không bán hai lần.
  const [attemptId, setAttemptId] = useState(() => uid());
  const [drinkId, setDrinkId] = useState<string | null>(null);
  const [brewChoices, setBrewChoices] = useState<number[]>([]);
  const [replyIndex, setReplyIndex] = useState<number | null>(null);
  const [result, setResult] = useState<ServeOutcome | null>(null);

  const recipe = recipes.find((item) => item.id === drinkId) ?? null;
  const ready = !!recipe && brewChoices.length === recipe.steps.length && brewChoices.every((c) => c >= 0) && replyIndex !== null;

  const pickDrink = (id: string) => {
    const next = recipes.find((item) => item.id === id);
    setDrinkId(id);
    setBrewChoices(next ? next.steps.map(() => -1) : []);
    setResult(null);
  };

  const pickBrew = (step: number, option: number) => setBrewChoices((prev) => prev.map((value, i) => (i === step ? option : value)));

  const submit = () => {
    if (!ready || !drinkId || replyIndex === null) return;
    const outcome = onServe({ drinkId, brewChoices, replyIndex }, attemptId);
    setResult(outcome);
    setAttemptId(uid());
  };

  const message = (o: ServeOutcome) => {
    if (o.reason === 'paid') return L(`Khách hài lòng. Lãi +${o.paid} đồng.`, `The customer is happy. Profit +${o.paid}.`);
    if (o.reason === 'full') return L('Hôm nay đã đủ 12 đơn. Ngày mai quán nhận đơn mới.', 'You have 12 orders today. New orders tomorrow.');
    if (o.reason === 'duplicate') return L('Lượt này đã được ghi.', 'This serve is already recorded.');
    if (o.reason === 'no-shop') return L('Chưa có quán.', 'No shop yet.');
    return L('Khách chưa hài lòng. Đơn sai không có doanh thu.', 'The customer is not happy. A wrong order earns nothing.');
  };

  return (
    <PixelPanel tone="paper" style={{ marginTop: 14 }} inner={{ padding: 14, gap: 10 }}>
      <Text className="font-semi" style={{ color: T.muted, fontSize: 12 }}>{bi(order.npc, locale)}</Text>
      <Text className="font-heavy" style={{ color: T.ink, fontSize: 16, lineHeight: 22 }}>{`"${order.line}"`}</Text>
      <Text className="font-semi" style={{ color: T.ink, fontSize: 13 }}>{L('1. Chọn món', '1. Pick the drink')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {recipes.map((item) => (
          <Chip key={item.id} label={bi(item.name, locale)} selected={drinkId === item.id} onPress={() => pickDrink(item.id)} />
        ))}
      </View>
      {recipe ? (
        <>
          <Text className="font-semi" style={{ color: T.ink, fontSize: 13 }}>{L('2. Pha theo từng bước', '2. Brew step by step')}</Text>
          {recipe.steps.map((step, s) => (
            <View key={`step-${s}`} style={{ gap: 6 }}>
              <Text className="font-semi" style={{ color: T.muted, fontSize: 12 }}>{bi(step.label, locale)}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {step.options.map((option, o) => (
                  <Chip key={`opt-${s}-${o}`} label={bi(option, locale)} selected={brewChoices[s] === o} onPress={() => pickBrew(s, o)} />
                ))}
              </View>
            </View>
          ))}
        </>
      ) : null}
      <Text className="font-semi" style={{ color: T.ink, fontSize: 13 }}>{L('3. Đưa đồ và đáp khách', '3. Serve and reply')}</Text>
      <View style={{ gap: 8 }}>
        {order.replyOptions.map((option, i) => (
          <Chip key={`reply-${i}`} label={option} selected={replyIndex === i} onPress={() => setReplyIndex(i)} />
        ))}
      </View>
      <GameButton label={L('Đưa khách', 'Serve')} tone="gold" onPress={submit} disabled={!ready} />
      {result ? <Text className="font-semi" style={{ color: result.correct ? T.good : T.bad, fontSize: 13, lineHeight: 19 }}>{message(result)}</Text> : null}
    </PixelPanel>
  );
}
```

- [ ] **Step 5: Màn quán**

Tạo `app/quest/study-abroad/cafe.tsx`:

```tsx
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';

import { TravelPage } from '@/components/travel/ui/TravelPage';
import { GameButton, PixelPanel, T } from '@/components/travel/ui/kit';
import { OpenShopForm } from '@/components/startup/OpenShopForm';
import { CustomRecipeForm } from '@/components/startup/CustomRecipeForm';
import { ServeFlow } from '@/components/startup/ServeFlow';
import { BASE_RECIPES, SHOP_CITIES } from '@/data/startup-menu';
import { SHOP_ORDERS } from '@/data/startup-orders';
import { bi, useL } from '@/i18n/useL';
import { balanceOf } from '@/services/study-abroad/economy';
import { ordersToday, shopBalance, SHOP_RULES } from '@/services/startup/economy';
import { todayKey } from '@/store/persist';
import { useStartupStore } from '@/store/useStartupStore';
import { useStudyAbroadStore } from '@/store/useStudyAbroadStore';

const CITY = SHOP_CITIES[0];

export default function StudyAbroadCafeScreen() {
  const { L, locale } = useL();
  const shop = useStartupStore((state) => state.shops[CITY]);
  const shopLedger = useStartupStore((state) => state.ledger);
  const customRecipes = useStartupStore((state) => state.customRecipes);
  const openShop = useStartupStore((state) => state.openShop);
  const serve = useStartupStore((state) => state.serve);
  const addCustomRecipe = useStartupStore((state) => state.addCustomRecipe);
  const studyLedger = useStudyAbroadStore((state) => state.ledger);
  const [orderIndex, setOrderIndex] = useState(0);

  const order = SHOP_ORDERS[orderIndex % SHOP_ORDERS.length]!;
  const recipes = [...BASE_RECIPES, ...customRecipes];
  const today = todayKey();

  return (
    <TravelPage title={L('Quán của bạn', 'Your shop')} back="/quest/study-abroad/dorm" backLabel={L('Phòng ký túc xá', 'Dorm room')}>
      <PixelPanel tone="navy" inner={{ padding: 16, gap: 8 }}>
        <Text className="font-heavy" style={{ color: T.goldLight, fontSize: 21 }}>{shop ? bi(shop.name, locale) : L('Chưa có quán', 'No shop yet')}</Text>
        <Text className="font-semi" style={{ color: T.goldLight, fontSize: 13 }}>
          {L(`Số dư đồng du học: ${balanceOf(studyLedger)} · Lãi quán: ${shopBalance(shopLedger)}`, `Study funds: ${balanceOf(studyLedger)} · Shop profit: ${shopBalance(shopLedger)}`)}
        </Text>
        {shop ? <Text className="font-semi" style={{ color: T.cream, fontSize: 13 }}>{L(`Đơn hôm nay: ${ordersToday(shopLedger, today)}/${SHOP_RULES.ordersPerDay}`, `Orders today: ${ordersToday(shopLedger, today)}/${SHOP_RULES.ordersPerDay}`)}</Text> : null}
      </PixelPanel>

      {!shop ? (
        <OpenShopForm onOpen={(nameIndex, colorIndex) => openShop(CITY, nameIndex, colorIndex)} />
      ) : (
        <>
          <View style={{ marginTop: 14, gap: 8 }}>
            <Text className="font-heavy" style={{ color: T.ink, fontSize: 16 }}>{L('Khách đang chờ', 'Customer waiting')}</Text>
            <GameButton label={L('Khách tiếp theo', 'Next customer')} tone="paper" onPress={() => setOrderIndex((i) => i + 1)} />
          </View>
          <ServeFlow key={order.id + orderIndex} order={order} recipes={recipes} onServe={(pick, attemptId) => serve(CITY, order, pick, attemptId)} />

          <PixelPanel tone="paper" style={{ marginTop: 14 }} inner={{ padding: 14, gap: 8 }}>
            <Text className="font-heavy" style={{ color: T.ink, fontSize: 16 }}>{L('Thực đơn', 'Menu')}</Text>
            {recipes.map((item) => (
              <Text key={item.id} className="font-sans" style={{ color: T.ink, fontSize: 13, lineHeight: 19 }}>
                {`${bi(item.name, locale)} — ${item.price} ${L('đồng', 'funds')}${item.custom ? L(' (món riêng)', ' (own recipe)') : ''}`}
              </Text>
            ))}
          </PixelPanel>

          <CustomRecipeForm onCreate={addCustomRecipe} />
        </>
      )}

      <View style={{ marginTop: 14 }}>
        <GameButton label={L('Về phòng ký túc xá', 'Back to dorm')} tone="gold" onPress={() => router.push('/quest/study-abroad/dorm' as never)} />
      </View>
      <View style={{ height: 24 }} />
    </TravelPage>
  );
}
```

- [ ] **Step 6: Lối vào từ phòng ký túc xá**

Đọc `app/quest/study-abroad/dorm.tsx`, tìm dòng có `label={L('Việc làm thêm', 'Part-time work')}`. Ngay sau dòng đó, thêm:

```tsx
              <GameButton label={L('Quán của bạn', 'Your shop')} tone="paper" onPress={() => router.push('/quest/study-abroad/cafe' as never)} />
```

- [ ] **Step 7: Kiểm typecheck giao diện**

Run: `npx tsc --noEmit 2>&1 | grep -E "startup|study-abroad|cafe"`
Expected: không có dòng lỗi nào. Nếu có, sửa trong các file vừa tạo rồi chạy lại.

---

## Task 8: Kiểm chứng

**Files:** không sửa file.

- [ ] **Step 1: Chạy test của quán và nhóm Du học**

Run: `npx tsx --test src/data/startup-menu.test.ts src/services/startup/*.test.ts src/services/study-abroad/*.test.ts src/data/study-abroad*.test.ts`
Expected: PASS toàn bộ (tổng đã có từ Task 1–5 cộng test Du học cũ).

- [ ] **Step 2: Typecheck, lọc theo file liên quan**

Run: `npx tsc --noEmit 2>&1 | grep -E "startup|study-abroad|useStudyAbroadStore|useStartupStore|services/sync/stores|travel/economy|cafe"`
Expected: không có dòng lỗi nào.

- [ ] **Step 3: Kiểm trên trình duyệt**

Mở app bằng cấu hình `readup-web-alt` (cổng 8097, đã dùng ở phiên trước). Lưu ý: màn Du học có cổng đăng nhập; nếu vẫn bị chặn, ghi rõ trong báo cáo và không đăng nhập thay người dùng.

1. Vào `/quest/study-abroad/cafe`. Kiểm: màn hiện "Mở quán ở Singapore" khi chưa có quán.
2. Mở quán khi chưa đủ 150 đồng du học. Kiểm: báo "Chưa đủ".
3. Sau khi có đủ vốn, mở quán. Kiểm: số dư đồng du học giảm 150; màn chuyển sang phục vụ.
4. Phục vụ một đơn đúng. Kiểm: lãi quán tăng đúng bằng giá trừ giá vốn.
5. Bấm "Đưa khách" hai lần liên tiếp. Kiểm: lãi chỉ tăng một lần.
6. Tạo món riêng hợp lệ và món quá 4 nguyên liệu. Kiểm: món hợp lệ vào thực đơn; món kia báo lỗi đúng lý do.
7. Chụp `/quest/study-abroad/cafe` ở chiều rộng điện thoại (375 px). Kiểm: không tràn ngang; nút đủ lớn để bấm.

- [ ] **Step 4: Báo kết quả**

Báo đúng những gì đã chạy và kết quả, kể cả bước nào không chạy được. Không tuyên bố hoàn thành nếu chưa có kết quả test và kết quả kiểm trình duyệt.

---

## Self-Review (ghi lại khi lập kế hoạch)

- **Phủ spec:** S1 gồm mở quán (Task 3, 6, 7), thực đơn (Task 1), đơn khách (Task 4), pha 3 bước (Task 4, 7), câu đáp (Task 4, 7), doanh thu và hạn 12 đơn (Task 3), món riêng (Task 2, 7), đặt tên và màu quán (Task 6, 7), đồng bộ (Task 5, 6). Chưa có: đặt giá tự do và nâng cấp quầy (S3); tiền thuê quán (S2); London (S2).
- **Placeholder:** không có "TBD" hay "sau này". Các chuỗi đều có vi và en.
- **Nhất quán kiểu:** `ServeOutcome.reason` gồm `SaleReason` cộng `wrong`, `no-shop`; `CustomOutcome` khớp `createCustomRecipe`; `OpenOutcome` khớp store.
- **Review Focus:** mỗi dòng có test ở Task 2, 3 hoặc 5.
