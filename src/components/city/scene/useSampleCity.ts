/**
 * Dữ liệu cảnh của THÀNH PHỐ MẪU + hoạt cảnh lặp ở tòa đang xây (cần cẩu quay,
 * công nhân làm việc, tầng lên từng bước rồi lặp lại) — chỉ để xem.
 */
import { useCallback, useMemo, useState } from 'react';

import { catalogItem } from '@/data/city/catalog';
import { sampleCity } from '@/services/city/sample-city';
import type { Visual } from '@/services/city/procgen/parts';
import type { SceneData } from './CityScene';
import { replayFrames, toVisual } from './visual';

export function useSampleCity(reduced: boolean): { data: SceneData; replay: Record<string, Visual[]>; onReplayDone: (id: string) => void } {
  const city = useMemo(() => sampleCity(), []);
  const data = useMemo<SceneData>(() => ({ terrain: city.terrain, works: {}, roads: city.roads, zones: {}, regions: city.regions, sites: city.sites, era: city.era }), [city]);
  const [loop, setLoop] = useState(0);
  const replay = useMemo(() => {
    const site = city.sites.find((s) => s.id === city.buildingTowerId);
    if (!site || reduced) return {};
    const to = toVisual(site);
    const from: Visual = { ...to, floorsDone: Math.max(0, to.floorsDone - 2), floorStep: 0 };
    // `loop` đổi → dãy khung mới → SiteMesh phát lại từ đầu.
    return { [site.id]: replayFrames(from, to, catalogItem(site.type)!.stages, 9 + (loop % 2)) };
  }, [city, reduced, loop]);
  const onReplayDone = useCallback(() => setLoop((n) => n + 1), []);
  return { data, replay, onReplayDone };
}
