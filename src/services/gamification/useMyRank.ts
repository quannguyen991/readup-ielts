import { useEffect, useState } from 'react';

import { monthPoints } from '@/services/gamification/points';
import { useAuthStore } from '@/store/useAuthStore';
import { useRewardStore } from '@/store/useRewardStore';
import { useStudyStore } from '@/store/useStudyStore';

/**
 * Hạng của người dùng trên bảng xếp hạng tháng (cùng nguồn `/api/leaderboard` với trang Xếp hạng).
 *
 * Bảng chỉ trả TOP 20, nên ba trạng thái khác nhau và không được trộn:
 *  - `rank > 0`        : đang trong top 20, đây là hạng thật;
 *  - `inBoard: false`  : đã tải bảng, bạn không nằm trong top 20 (điểm tháng có thể vẫn > 0);
 *  - `ready: false`    : chưa đăng nhập hoặc chưa tải xong, chưa biết gì về hạng.
 * Điểm tháng tính trên máy từ nhật ký học (cùng luật với máy chủ), không lấy từ bảng.
 */
export type MyRank = { ready: boolean; signedIn: boolean; rank: number; inBoard: boolean; monthPoints: number };

type Cache = { at: number; ids: string[] };
let cache: Cache | null = null;
const TTL_MS = 60_000;

async function loadIds(): Promise<string[]> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.ids;
  const res = await fetch('/api/leaderboard');
  if (!res.ok) throw new Error(String(res.status));
  const data = (await res.json()) as { board?: { id: string }[] };
  const ids = (data.board ?? []).map((r) => r.id);
  cache = { at: Date.now(), ids };
  return ids;
}

export function useMyRank(): MyRank {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const daily = useStudyStore((s) => s.daily);
  const frozen = useRewardStore((s) => s.frozenDays);
  const [ids, setIds] = useState<string[] | null>(null);

  useEffect(() => {
    if (!userId) {
      setIds(null);
      return;
    }
    let alive = true;
    loadIds()
      .then((list) => alive && setIds(list))
      .catch(() => alive && setIds(null));
    return () => {
      alive = false;
    };
  }, [userId]);

  const month = monthPoints(daily, new Date(), frozen);
  if (!userId) return { ready: false, signedIn: false, rank: 0, inBoard: false, monthPoints: month };
  if (!ids) return { ready: false, signedIn: true, rank: 0, inBoard: false, monthPoints: month };
  const index = ids.indexOf(userId.slice(0, 8));
  return { ready: true, signedIn: true, rank: index + 1, inBoard: index >= 0, monthPoints: month };
}
