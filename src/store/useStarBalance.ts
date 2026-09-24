import { useMemo } from 'react';

import { useGameStore } from './useGameStore';
import { useRewardStore } from './useRewardStore';
import { useStudyStore } from './useStudyStore';
import { lifetimePoints } from '@/services/gamification/points';
import { prizeTotal } from '@/services/gamification/monthly';
import { starBalance } from '@/services/gamification/shop';

/**
 * Số sao đang có: sao từ việc học (thời gian + số câu, có trần mỗi ngày) + sao
 * thưởng trận đấu + thưởng hạng tháng − đã đổi. Luôn TÍNH LẠI từ nguồn, không
 * lưu thành một con số riêng.
 */
export function useStarBalance(): number {
  return useStarLedger().balance;
}

/** Từng nguồn sao, để trang Hồ sơ nói rõ sao từ đâu ra. */
export function useStarLedger(): { study: number; battle: number; prizes: number; spent: number; balance: number } {
  const daily = useStudyStore((s) => s.daily);
  const frozenDays = useRewardStore((s) => s.frozenDays);
  const spent = useRewardStore((s) => s.spent);
  const prizeMap = useRewardStore((s) => s.prizes);
  const battle = useGameStore((s) => s.bonusStars ?? 0);
  const study = useMemo(() => Math.round(lifetimePoints(daily, frozenDays)), [daily, frozenDays]);
  const prizes = prizeTotal(prizeMap);
  return { study, battle, prizes, spent, balance: starBalance(study, battle + prizes, spent) };
}
