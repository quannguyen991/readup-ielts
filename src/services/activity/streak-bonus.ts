/**
 * Cộng sao thưởng mốc chuỗi ngày — phần chạy thật, nối với hai kho.
 *
 * Luật (mốc, số sao) ở `gamification/streak-rewards.ts`. File này chỉ làm việc nối dây: khi
 * nhật ký học hoặc thẻ giữ chuỗi đổi (kể cả khi đồng bộ từ máy khác về), kiểm tra chuỗi hiện
 * tại và ghi sao cho mốc nào vừa đạt. Ghi một lần là đủ, nên mở lại app không cộng lần hai.
 */
import { currentStreak } from '@/services/gamification/points';
import { streakPrizeKey, unclaimedMilestones } from '@/services/gamification/streak-rewards';
import { useRewardStore } from '@/store/useRewardStore';
import { useStudyStore } from '@/store/useStudyStore';

/** Ghi sao cho mọi mốc đã đạt mà chưa được ghi. Trả về tổng sao vừa cộng (0 nếu không có gì mới). */
export function claimStreakBonuses(now: Date = new Date()): number {
  const { daily } = useStudyStore.getState();
  const { frozenDays, prizes } = useRewardStore.getState();
  const streak = currentStreak(daily, now, frozenDays);
  const fresh = unclaimedMilestones(streak, prizes);
  if (fresh.length === 0) return 0;

  useRewardStore.setState((s) => {
    const next = { ...s.prizes };
    for (const m of fresh) next[streakPrizeKey(m.days)] = m.stars;
    return { prizes: next };
  });
  return fresh.reduce((sum, m) => sum + m.stars, 0);
}

/** Chạy một lần lúc mở app; trả về hàm huỷ đăng ký. */
export function startStreakBonus(): () => void {
  claimStreakBonuses();
  const unsubStudy = useStudyStore.subscribe((s, prev) => {
    if (s.daily !== prev.daily) claimStreakBonuses();
  });
  const unsubReward = useRewardStore.subscribe((s, prev) => {
    if (s.frozenDays !== prev.frozenDays) claimStreakBonuses();
  });
  return () => {
    unsubStudy();
    unsubReward();
  };
}
