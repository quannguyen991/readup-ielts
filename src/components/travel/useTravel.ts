import { useMemo } from 'react';

import { useHydrated } from '@/components/layout/useHydrated';
import { mainPoisOfCity } from '@/data/travel/pois';
import { dueBySlug } from '@/services/vocab/review-schedule';
import { cityCompletion, CITY_ORDER, isCityUnlocked } from '@/services/travel/world';
import type { CityId } from '@/services/travel/types';
import { todayKey } from '@/store/persist';
import { useTopicStudyStore } from '@/store/useTopicStudyStore';
import { useTravelStore } from '@/store/useTravelStore';
import type { CityStatus } from './ui/WorldMapView';

/** Trạng thái từng thành phố cho bản đồ thế giới và hộ chiếu. */
export function useCityStatus(): Record<CityId, CityStatus> {
  const poi = useTravelStore((s) => s.poi);
  const visited = useTravelStore((s) => s.visited);
  return useMemo(() => {
    const out = {} as Record<CityId, CityStatus>;
    for (const c of CITY_ORDER) {
      const ids = mainPoisOfCity(c).map((p) => p.id);
      out[c] = {
        unlocked: isCityUnlocked({ poi }, c),
        visited: !!visited[c],
        stamp: !!visited[c]?.stamp,
        done: ids.filter((id) => (poi[id]?.best ?? 0) >= 2).length,
        total: ids.length,
      };
    }
    return out;
  }, [poi, visited]);
}

export function cityPercent(poi: Parameters<typeof cityCompletion>[0], city: CityId): number {
  return Math.round(cityCompletion(poi, city) * 100);
}

/** Dữ liệu học để chọn câu: từ đến hạn ôn, từ hay sai, chặng. */
export function useStudySnapshot() {
  const reviews = useTopicStudyStore((s) => s.reviews);
  const lapses = useTopicStudyStore((s) => s.lapses);
  const stages = useTopicStudyStore((s) => s.stages);
  return useMemo(() => ({ due: dueBySlug(reviews, todayKey()), lapses, stages: stages as Record<string, Record<string, number>> }), [reviews, lapses, stages]);
}

/** Bộ từ người học đã đụng tới (có từ ở chặng ≥ 1 hoặc có lịch ôn) — nguồn của bài hải quan. */
export function useStudiedDecks(): string[] {
  const stages = useTopicStudyStore((s) => s.stages);
  const reviews = useTopicStudyStore((s) => s.reviews);
  return useMemo(() => {
    const out = new Set<string>();
    for (const [deck, words] of Object.entries(stages)) if (Object.values(words ?? {}).some((v) => v > 0)) out.add(deck);
    for (const [deck, words] of Object.entries(reviews)) if (Object.keys(words ?? {}).length) out.add(deck);
    return [...out];
  }, [stages, reviews]);
}

/** false ở lượt vẽ đầu (khớp bản dựng máy chủ) — các trang phụ thuộc kho lưu trên máy chờ cờ này. */
export function useTravelReady(): boolean {
  return useHydrated();
}
