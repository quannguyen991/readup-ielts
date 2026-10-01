/**
 * Khung xem trước 3D của CHÍNH thành phố người học (trang /quest). Chỉ xem:
 * không kéo, không bấm vào ô — bấm cả khung là vào thành phố. Quay chậm (tắt
 * khi người dùng chọn giảm chuyển động). `sample` → hiện THÀNH PHỐ MẪU Kỷ 5
 * (cao ốc, cần cẩu đang làm) thay vì thành phố của người học.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { hubProgress } from '@/services/city/hub';
import { MATERIAL_KINDS } from '@/services/city/materials';
import { hubLayout, hubSites } from '@/services/city/hub-layout';
import { generateTerrain, REGIONS_PER_SIDE } from '@/services/city/terrain';
import { useCityStore } from '@/store/useCityStore';
import { CityCanvas, type SceneData } from '../scene/CityScene';
import { prefersReducedMotion } from '../ui/theme';
import { useSampleCity } from '../scene/useSampleCity';

const SAMPLE = { kind: 'plains' as const, seed: 4242 };
const ALL_REGIONS = Array.from({ length: REGIONS_PER_SIDE * REGIONS_PER_SIDE }, (_, i) => i);
const noop = () => {};

/** Điểm nhìn của khu cao ốc chung (giống màn Trung tâm Tương lai). */
const HUB_FOCUS: [number, number] = [0.5, -11.5];

export default function CityPreviewCanvas({ height, sample, hub }: { height: number; sample?: boolean; hub?: boolean }) {
  const [reduced] = useState(prefersReducedMotion);
  const t = useCityStore((s) => s.terrain) ?? SAMPLE;
  const works = useCityStore((s) => s.works);
  const roads = useCityStore((s) => s.roads);
  const zones = useCityStore((s) => s.zones);
  const regions = useCityStore((s) => s.regions);
  const sites = useCityStore((s) => s.sites);
  const era = useCityStore((s) => s.era);
  const chosen = useCityStore((s) => !!s.terrain);
  const demo = useSampleCity(reduced);
  // Khu cao ốc chung: cùng cảnh với màn Trung tâm Tương lai, tầng đã xây theo số liệu thật.
  // Khung xem trước cho thấy khu cao ốc ĐÃ XONG (đích đến của cả cộng đồng); số tầng thật hiện ở dòng tiến độ.
  const hubScene = useMemo<SceneData | null>(() => {
    if (!hub) return null;
    const layout = hubLayout();
    const full = Object.fromEntries(MATERIAL_KINDS.map((k) => [k, 1_000_000]));
    const sites = hubSites(layout, hubProgress(full));
    return { terrain: layout.terrain, works: {}, roads: layout.roads, zones: {}, regions: layout.regions, sites, era: 5 };
  }, [hub]);
  const terrain = useMemo(() => generateTerrain(t.kind, t.seed), [t.kind, t.seed]);
  const own = useMemo<SceneData>(
    () => (chosen ? { terrain, works, roads, zones, regions, sites, era } : { terrain, works: {}, roads: {}, zones: {}, regions: ALL_REGIONS, sites: [], era: 1 }),
    [chosen, terrain, works, roads, zones, regions, sites, era],
  );
  // Thành phố của mình: gần vào vùng trung tâm (nơi bắt đầu xây). Bản mẫu /
  // đất trống: lùi xa hơn để thấy cả khu cao ốc.
  const [zoom] = useState(() => Math.max(6, height / (hub ? 22 : sample ? 26 : chosen ? 22 : 36)));

  // Chỉ quay khi khung đang hiện trên màn và tab đang mở — cuộn khuất là dừng vẽ hẳn.
  const box = useRef<HTMLDivElement>(null);
  const [onScreen, setOnScreen] = useState(true);
  useEffect(() => {
    const el = box.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver((entries) => setOnScreen(entries.some((e) => e.isIntersecting)), { threshold: 0.05 });
    io.observe(el);
    const vis = () => setOnScreen((v) => (document.hidden ? false : v || el.getBoundingClientRect().top < window.innerHeight));
    document.addEventListener('visibilitychange', vis);
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', vis);
    };
  }, []);

  return (
    <div ref={box} style={{ position: 'absolute', inset: 0, minHeight: height, pointerEvents: 'none' }}>
      <CityCanvas
        data={hubScene ?? (sample ? demo.data : own)}
        interactive={false}
        showGrid={false}
        showZones={false}
        hover={null}
        preview={null}
        selectedSite={null}
        replay={!hub && sample ? demo.replay : {}}
        onReplayDone={!hub && sample ? demo.onReplayDone : noop}
        onHover={noop}
        onTileDown={noop}
        onTileDrag={noop}
        onTileClick={noop}
        paintMode={false}
        rot={0}
        zoom={zoom}
        // Khuất màn hình: tắt luôn nước gợn (cũng là một vòng vẽ lại định kỳ).
        reducedMotion={reduced || !onScreen}
        autoSpin={onScreen}
        focus={hub ? HUB_FOCUS : undefined}
      />
    </div>
  );
}
