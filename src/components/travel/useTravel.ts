import { useMemo } from 'react';

import { useHydrated } from '@/components/layout/useHydrated';
import { mainPoisOfCity } from '@/data/travel/pois';
import { defaultExamFor, defaultLevelFor, levelsOf } from '@/data/learning-path';
import { usePathData } from '@/components/learning-path/usePathData';
import { nodeStatus } from '@/services/learning-path/progress';
import { PATH_RESOLVERS } from '@/services/learning-path/resolvers';
import { pathVocabDecks, resolveFocusDecks, type FocusSource } from '@/services/travel/decks';
import { useLearningPathStore } from '@/store/useLearningPathStore';
import { useRoadmapStore } from '@/store/useRoadmapStore';
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

/**
 * Bộ từ theo LỘ TRÌNH của người học: trình độ đã chọn ở màn Lộ trình học, hoặc suy từ lộ trình cá nhân
 * (mục tiêu / điểm hiện tại họ khai). Chưa biết trình độ thì trả `level: null` và không có bộ nào —
 * KHÔNG đoán một mức mặc định.
 */
export function usePathDecks(): { decks: string[]; levelLabel: string | null } {
  const hydrated = useHydrated();
  const input = useRoadmapStore((s) => s.input);
  const storedExam = useLearningPathStore((s) => s.exam);
  const storedLevels = useLearningPathStore((s) => s.levels);
  const data = usePathData();
  return useMemo(() => {
    if (!hydrated) return { decks: [], levelLabel: null };
    const exam = storedExam ?? defaultExamFor(input);
    const levels = levelsOf(exam);
    const level = levels.find((l) => l.id === storedLevels[exam]) ?? (input?.[exam] ? defaultLevelFor(exam, input) : null);
    if (!level) return { decks: [], levelLabel: null };
    const isDone = (id: string) => {
      const node = level.parts.flatMap((p) => p.nodes).find((n) => n.id === id);
      return !!node && nodeStatus(node, data, PATH_RESOLVERS).state === 'done';
    };
    return { decks: pathVocabDecks(level, isDone), levelLabel: level.label };
  }, [hydrated, input, storedExam, storedLevels, data]);
}

/** Bộ từ đang dùng cho câu hỏi: tự chọn, rồi theo lộ trình, rồi (rỗng) bộ mặc định của địa điểm. */
export function useFocusDecks(): { decks: string[]; source: FocusSource; chosen: string[]; path: string[]; levelLabel: string | null } {
  const chosen = useTravelStore((s) => s.decks);
  const path = usePathDecks();
  return useMemo(() => {
    const r = resolveFocusDecks({ chosen, path: path.decks });
    return { ...r, chosen: chosen ?? [], path: path.decks, levelLabel: path.levelLabel };
  }, [chosen, path]);
}
