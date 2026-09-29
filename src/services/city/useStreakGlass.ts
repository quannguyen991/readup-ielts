import { useEffect } from 'react';

import { currentStreak, dateKey, shiftDays } from '@/services/gamification/points';
import { useCityStore } from '@/store/useCityStore';
import { useRewardStore } from '@/store/useRewardStore';
import { useStudyStore } from '@/store/useStudyStore';

/**
 * Kính của Thành Phố Tri Thức: mốc chuỗi ngày học 7 / 14 / 30.
 *
 * Chạy ở khung app (không ở màn 3D) nên học trên điện thoại vẫn nhận kính. Mã
 * mốc gồm NGÀY BẮT ĐẦU của chuỗi (`economy.ts`): mở lại màn hình không cộng
 * lại; đứt chuỗi rồi bắt đầu chuỗi mới thì mốc 7 lại được tính.
 */
export function useStreakGlass(): void {
  const daily = useStudyStore((s) => s.daily);
  const frozen = useRewardStore((s) => s.frozenDays);
  useEffect(() => {
    const today = new Date();
    const streak = currentStreak(daily, today, frozen);
    if (streak < 7) return;
    const todayActive = (daily[dateKey(today)]?.minutes ?? 0) > 0 || frozen.includes(dateKey(today));
    const lastDay = todayActive ? today : shiftDays(today, -1);
    const start = dateKey(shiftDays(lastDay, -(streak - 1)));
    useCityStore.getState().earn({ type: 'streak', streakDays: streak, streakStart: start });
  }, [daily, frozen]);
}
