import type { BrewStep, Recipe } from '@/data/startup-menu';
import type { ShopOrder } from '@/data/startup-orders';

const CUSTOM_REPLY_OPTIONS: readonly string[] = ['Here you go. Enjoy!', 'I am going to the station.', 'The drink is in the sea.', 'Ten dollars, no thanks.'];

/**
 * Mỗi món riêng có một đơn khách riêng, để món người chơi tự tạo cũng được gọi.
 * Câu đáp dùng bộ chung: đưa đồ là đáp án đúng.
 */
export function ordersForCustomRecipes(recipes: readonly Recipe[]): ShopOrder[] {
  return recipes
    .filter((recipe) => recipe.custom)
    .map((recipe) => ({
      id: `custom-order-${recipe.id}`,
      npc: { vi: 'Khách quen', en: 'Regular' },
      line: `Hi, one ${recipe.name.en}, please.`,
      drinkId: recipe.id,
      replyOptions: CUSTOM_REPLY_OPTIONS,
      replyAnswer: 0,
      hint: { vi: 'Đưa đồ uống và chúc khách ngon miệng.', en: 'Hand over the drink and wish the customer well.' },
      explanation: { vi: '“Here you go” là lúc đưa đồ.', en: '“Here you go” hands the drink over.' },
    }));
}

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
