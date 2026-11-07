/**
 * Thưởng mốc chuỗi câu đúng liên tiếp trong vòng học (5, 10, 15, 20…) — LUẬT THUẦN.
 *
 * Mỗi mốc cho sao tăng dần, và mốc chẵn (10, 20, 30…) có thêm một món trong kho đồ chiến đấu.
 * Mốc càng cao càng đáng: 5 → 5 sao, 10 → 15, 15 → 30, 20 → 50, từ 25 trở đi mỗi mốc cộng thêm 20.
 * Hàm này không chạm store; nơi nhận thưởng gọi `streakReward` của `useGameStore`.
 */
import type { ItemKind } from '@/services/game/rules';

export const STREAK_TIER_STEP = 5;

/** Món thưởng xoay vòng qua các mốc chẵn. */
const TIER_ITEMS: readonly ItemKind[] = ['potion', 'hint', 'shield', 'double'];

/** Số thứ tự mốc: 5 là mốc 1, 10 là mốc 2… Mốc không phải bội của 5 trả về 0. */
function tierIndex(n: number): number {
  return n > 0 && n % STREAK_TIER_STEP === 0 ? n / STREAK_TIER_STEP : 0;
}

/** Sao thưởng của một mốc chuỗi. Không phải mốc thì 0. */
export function streakTierStars(n: number): number {
  const k = tierIndex(n);
  if (k === 0) return 0;
  if (k <= 4) return [5, 15, 30, 50][k - 1]!;
  return 50 + (k - 4) * 20;
}

/** Món kho đồ thưởng kèm mốc (chỉ mốc chẵn). Không có thì null. */
export function streakTierItem(n: number): ItemKind | null {
  const k = tierIndex(n);
  if (k === 0 || k % 2 !== 0) return null;
  return TIER_ITEMS[(k / 2 - 1) % TIER_ITEMS.length] ?? null;
}
