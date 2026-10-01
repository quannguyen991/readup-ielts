/**
 * THÀNH PHỐ TRI THỨC — bản web cho máy tính (nạp động từ `CityApp.web.tsx`).
 *
 * Chưa chọn đất → màn chọn địa hình. Đã chọn → cảnh 3D + giao diện: thanh trên
 * (vật liệu, "+"), thanh công cụ trái (chọn / xây / đường / xoá đường / phân
 * khu / xử lý đất / mở rộng), bảng phải (nhiệm vụ, công trường, đội, ca).
 *
 * Luật nằm ở `services/city/*`; file này chỉ nối thao tác của người dùng với
 * store và báo lại MỘT lý do cụ thể khi thao tác không hợp lệ.
 */
import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useShallow } from 'zustand/react/shallow';

import { CATALOG, catalogItem, ERA_INFO, ROADS, type Era, type RoadKind, type ZoneKind } from '@/data/city/catalog';
import { CREW_ORDER, CREWS, isDone } from '@/services/city/construction';
import type { MaterialKind, Materials } from '@/services/city/materials';
import { canPlace, canUnlockRegion, entranceTile, footprint, occupancy, type RoadCheck } from '@/services/city/placement';
import { generateTerrain, regionOf, START_REGIONS, type LandWork } from '@/services/city/terrain';
import { useCityStore, worldOf } from '@/store/useCityStore';
import { useCityViewStore } from '@/store/useCityViewStore';
import { CityCanvas, type CameraApi, type Preview, type SceneData } from './scene/CityScene';
import { sameVisual, stableFrames, toVisual } from './scene/visual';
import type { Visual } from '@/services/city/procgen/parts';
import { placeReasonText, useL, useLearnerLevel } from './ui/common';
import { EarnSheet, Modal } from './ui/EarnSheet';
import { OverviewPanel, SitePanel } from './ui/Panels';
import { TerrainPicker } from './ui/TerrainPicker';
import { prefersReducedMotion, useCityCss, CG } from './ui/theme';
import { BuildPalette, ExpandOptions, LandOptions, RoadOptions, ToolRail, ZoneOptions, type Tool } from './ui/Tools';
import { TopBar } from './ui/TopBar';
import { SampleView } from './ui/SampleView';
import { Credits } from './ui/Credits';
import { avatarColors, CatchGame, CollectionSheet, WalkPrompt } from './ui/Life';
import { VisitView } from './ui/VisitView';
import { MarketSheet } from './ui/Market';
import { usePresence } from './ui/common';
import { HomeRoom } from './home/HomeRoom';
import type { WalkProps } from './scene/WalkLayer';
import type { Activity, CatchKind } from '@/services/city/life';
import { skinOf, useRewardStore } from '@/store/useRewardStore';

type Sheet = { kind: 'earn'; focus?: MaterialKind } | { kind: 'market'; want?: Partial<Materials> } | { kind: 'credits' } | { kind: 'era'; era: number } | { kind: 'catch'; what: CatchKind } | { kind: 'bag' } | { kind: 'home' } | null;
type ToastState = { text: string; tone: 'ok' | 'bad' | 'info'; id: number } | null;

const rand = () => Math.floor(Math.random() * 1e9);

/** Trung tâm Tương lai: nạp động — người không mở thì không tải mã của nó. */
const HubView = React.lazy(() => import('./ui/HubView'));

function defaultZoom(): number {
  if (typeof window === 'undefined') return 30;
  return Math.max(16, Math.min(window.innerWidth - 200, window.innerHeight * 1.6) / 34);
}

export default function CityGame() {
  useCityCss();
  // Chỉ bản dev + ?perf=1: mở store cho kịch bản kiểm thử tự động.
  useEffect(() => {
    if (__DEV__ && typeof window !== 'undefined' && window.location.search.includes('perf=1')) {
      Object.assign(window as object, { __cityStore: useCityStore, __cityView: useCityViewStore });
    }
  }, []);
  const [reduced] = useState(prefersReducedMotion);
  const terrain = useCityStore((s) => s.terrain);
  const chooseTerrain = useCityStore((s) => s.chooseTerrain);
  // Thành phố mẫu (chỉ xem): mở từ màn chọn đất, nút trên thanh trên, hoặc
  // `/quest/city?mau=1` (nút "Xem thành phố mẫu" ở trang Quest).
  // `?hub=1`: mở thẳng Trung tâm Tương lai (khối giới thiệu ở trang /quest).
  const { mau, hub: hubParam } = useLocalSearchParams<{ mau?: string; hub?: string }>();
  const [opened, setOpened] = useState(false);
  // Thăm khu của người khác: `true` = danh sách, chuỗi = mở thẳng một khu (từ Trung tâm).
  const [visiting, setVisiting] = useState<boolean | string>(false);
  const [hub, setHub] = useState(() => hubParam === '1');
  const openVisit = useCallback(() => setVisiting(true), []);
  const openHub = useCallback(() => setHub(true), []);
  const closeHub = useCallback(() => setHub(false), []);
  const visitFromHub = useCallback((id: string) => setVisiting(id), []);
  const [closed, setClosed] = useState(false);
  const sample = opened || (mau === '1' && !closed);
  const openSample = useCallback(() => setOpened(true), []);
  const closeSample = useCallback(() => {
    setOpened(false);
    setClosed(true);
  }, []);
  return (
    <div style={{ position: 'relative', flex: 1, width: '100%', height: '100%', minHeight: 560 }}>
      {visiting ? (
        <VisitView reduced={reduced} initial={typeof visiting === 'string' ? visiting : undefined} onBack={() => setVisiting(false)} />
      ) : hub ? (
        <Suspense
          fallback={
            <div className="cg-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="cg-muted">Đang mở Trung tâm Tương lai…</span>
            </div>
          }
        >
          <HubView reduced={reduced} onBack={closeHub} onVisit={visitFromHub} />
        </Suspense>
      ) : sample ? (
        <SampleView reduced={reduced} hasCity={!!terrain} onBack={closeSample} />
      ) : terrain ? (
        <CityView reduced={reduced} onSample={openSample} onVisit={openVisit} onHub={openHub} />
      ) : (
        <TerrainPicker reducedMotion={reduced} onConfirm={(k, seed) => chooseTerrain(k, seed)} onSample={openSample} />
      )}
    </div>
  );
}

function CityView({ reduced, onSample, onVisit, onHub }: { reduced: boolean; onSample: () => void; onVisit: () => void; onHub: () => void }) {
  const { t, L } = useL();
  const level = useLearnerLevel();
  // Chỉ lấy phần cảnh cần — kiếm vật liệu / ca (đổi kho, bộ đếm) không làm cả màn render lại.
  const city = useCityStore(
    useShallow((s) => ({ terrain: s.terrain!, works: s.works, roads: s.roads, zones: s.zones, regions: s.regions, sites: s.sites, era: s.era })),
  );
  const kind = city.terrain.kind;
  const seed = city.terrain.seed;
  const terrain = useMemo(() => generateTerrain(kind, seed), [kind, seed]);
  const data = useMemo<SceneData>(
    () => ({ terrain, works: city.works, roads: city.roads, zones: city.zones, regions: city.regions, sites: city.sites, era: city.era }),
    [terrain, city.works, city.roads, city.zones, city.regions, city.sites, city.era],
  );
  const world = useMemo(() => worldOf({ ...useCityStore.getState(), ...city }), [city]);

  const [tool, setToolState] = useState<Tool>('select');
  const [buildType, setBuildType] = useState<string | null>(null);
  const [buildRot, setBuildRot] = useState<0 | 1 | 2 | 3>(0);
  const [buildSeed, setBuildSeed] = useState(rand);
  const [roadKind, setRoadKind] = useState<RoadKind>(() => (city.era >= ROADS.asphalt.era ? 'asphalt' : city.era >= ROADS.stone.era ? 'stone' : 'dirt'));
  const [zoneKind, setZoneKind] = useState<ZoneKind | null>('residential');
  const [landKind, setLandKind] = useState<LandWork>('terrace');
  const [hover, setHover] = useState<[number, number] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [camRot, setCamRot] = useState(() => useCityViewStore.getState().camera?.rot ?? 0);
  const [zoom] = useState(() => useCityViewStore.getState().camera?.zoom ?? defaultZoom());
  const [toast, setToast] = useState<ToastState>(null);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [confetti, setConfetti] = useState(0);
  const cameraApi = useRef<CameraApi | null>(null);
  const onCameraApi = useCallback((api: CameraApi | null) => {
    cameraApi.current = api;
  }, []);
  const strokeFailed = useRef(false);

  // ------------------------------------------------------------ đi dạo (kiểu Play Together)
  const skinId = useRewardStore((s) => s.skin);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [walkGoal, setWalkGoal] = useState<WalkProps['goal']>(null);
  const walking = tool === 'walk';
  const walkNear = useMemo<[number, number]>(() => {
    if (!city.sites.length) return [20, 20];
    let x = 0;
    let y = 0;
    for (const s of city.sites) {
      x += s.x;
      y += s.y;
    }
    return [x / city.sites.length, y / city.sites.length];
  }, [city.sites]);
  const walk = useMemo<WalkProps | null>(
    () => (walking ? { colors: avatarColors(skinOf(skinId)), goal: walkGoal, paused: !!sheet, onActivity: setActivity, near: walkNear, start: lastWalkPos, onRest: rememberWalkPos } : null),
    [walking, skinId, walkGoal, sheet, walkNear],
  );
  const doActivity = useCallback(() => {
    if (!activity) return;
    if (activity.kind === 'enter') router.push(activity.route as never);
    else if (activity.kind === 'home') setSheet({ kind: 'home' });
    else setSheet({ kind: 'catch', what: activity.kind });
  }, [activity]);

  const say = useCallback((text: string, tone: 'ok' | 'bad' | 'info' = 'info') => setToast({ text, tone, id: Date.now() }), []);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), toast.tone === 'bad' ? 4200 : 3000);
    return () => clearTimeout(id);
  }, [toast]);

  const setTool = useCallback((x: Tool) => {
    setToolState(x);
    // Bật Dạo phố: phóng gần để thấy nhân vật, thu bảng bên phải cho rộng chỗ.
    if (x === 'walk') {
      cameraApi.current?.zoomTo(58);
      setPanelOpen(false);
    }
    if (x !== 'build') setBuildType(null);
    if (x !== 'select') setSelected(null);
  }, []);

  // Móng đông cứng theo giờ thật → định kỳ kiểm lại để ca trong kho được dùng tiếp.
  useEffect(() => {
    useCityStore.getState().settleAll();
    const id = setInterval(() => useCityStore.getState().settleAll(), 30_000);
    return () => clearInterval(id);
  }, []);

  // ------------------------------------------------------------ phát lại tiến độ
  // Máy này đã THẤY mỗi công trường ở tiến độ nào; tiến độ mới hơn (ca làm từ
  // bài học trên điện thoại chẳng hạn) được phát lại: tường lên từng hàng, tầng
  // lên từng bước, công nhân làm việc — rồi nghỉ.
  const seen = useCityViewStore((s) => s.seen);
  useEffect(() => {
    const view = useCityViewStore.getState();
    for (const s of city.sites) {
      const v = toVisual(s);
      const prev = view.seen[s.id];
      // Lần đầu thấy (không có gì để phát lại) hoặc người dùng chọn giảm chuyển động.
      if ((!prev || reduced) && !sameVisual(prev, v)) view.markSeen(s.id, v);
    }
    for (const id of Object.keys(view.seen)) if (!city.sites.some((s) => s.id === id)) view.forget(id);
  }, [city.sites, reduced]);

  const replay = useMemo(() => {
    const out: Record<string, Visual[]> = {};
    if (reduced) return out;
    for (const s of city.sites) {
      const prev = seen[s.id];
      if (!prev) continue;
      const v = toVisual(s);
      if (sameVisual(prev, v)) continue;
      out[s.id] = stableFrames(s.id, prev, v, catalogItem(s.type)!.stages);
    }
    return out;
  }, [city.sites, seen, reduced]);

  const onReplayDone = useCallback((siteId: string) => {
    const site = useCityStore.getState().sites.find((s) => s.id === siteId);
    if (!site) return;
    useCityViewStore.getState().markSeen(siteId, toVisual(site));
    if (isDone(site)) setConfetti(Date.now());
  }, []);

  // ------------------------------------------------------------ xem trước khi đặt
  const preview = useMemo<Preview | null>(() => {
    if (tool !== 'build' || !buildType || !hover || !world) return null;
    const it = catalogItem(buildType);
    if (!it) return null;
    const [w, d] = footprint(it.size, buildRot);
    const x = hover[0] - Math.floor((w - 1) / 2);
    const y = hover[1] - Math.floor((d - 1) / 2);
    const check = canPlace(world, buildType, x, y, buildRot);
    const entrance = it.place.road !== 'none' || it.place.on === 'waterfront' ? entranceTile(x, y, it.size, buildRot) : null;
    return { type: buildType, x, y, rot: buildRot, seed: buildSeed, check, entrance };
  }, [tool, buildType, hover, world, buildRot, buildSeed]);

  // Kho vật liệu chỉ cần khi đang mở rộng đất (tô vùng mở được / chưa đủ).
  const expandInv = useCityStore((s) => (tool === 'expand' ? s.inventory : null));
  const regionHints = useMemo(() => {
    if (tool !== 'expand' || !world || !expandInv) return undefined;
    const out: Record<number, 'can' | 'cannot'> = {};
    for (let id = 0; id < 16; id++) {
      if (world.regions.includes(id)) continue;
      const r = canUnlockRegion(world, id, expandInv, START_REGIONS.length);
      if (!r.ok && r.reason === 'not_adjacent') continue;
      out[id] = r.ok ? 'can' : 'cannot';
    }
    return out;
  }, [tool, world, expandInv]);

  // ------------------------------------------------------------ thao tác trên ô
  const onTileClick = useCallback(
    (tile: [number, number]) => {
      const st = useCityStore.getState();
      if (tool === 'walk') {
        setWalkGoal({ tile, id: Date.now() });
        return;
      }
      if (tool === 'select') {
        const id = occupancy(st.sites).get(`${tile[0]},${tile[1]}`) ?? null;
        setSelected(id);
        if (id) setPanelOpen(true);
        return;
      }
      if (tool === 'build') {
        if (!preview) return;
        const r = st.place(preview.type, preview.x, preview.y, preview.rot, preview.seed);
        if (r.ok) {
          say(t('city.toast.placed', { name: L(catalogItem(preview.type)!) }), 'ok');
          setBuildSeed(rand());
          if (r.siteId) {
            setSelected(r.siteId);
            setPanelOpen(true);
          }
          // Công trình chỉ được một cái → tự bỏ chọn.
          const it = catalogItem(preview.type)!;
          if (it.max !== undefined && st.sites.filter((s) => s.type === it.id).length + 1 >= it.max) setBuildType(null);
        } else {
          say(placeReasonText(t, L, r.reason, preview.type, r.zone), 'bad');
        }
        return;
      }
      if (tool === 'land') {
        const r = st.landWork(tile[0], tile[1], landKind);
        if (r.ok) say(t('city.toast.landDone'), 'ok');
        else say(t(`city.work.${r.reason}` as const), 'bad');
        return;
      }
      if (tool === 'expand') {
        const r = st.unlockRegion(regionOf(tile[0], tile[1]));
        if (r.ok) say(t('city.toast.expanded'), 'ok');
        else say(t(`city.region.${r.reason}` as const), 'bad');
      }
    },
    [tool, preview, landKind, say, t, L],
  );

  const paint = useCallback(
    (tile: [number, number], first: boolean) => {
      const st = useCityStore.getState();
      if (first) strokeFailed.current = false;
      if (tool === 'road') {
        const r: RoadCheck = st.road(tile[0], tile[1], roadKind);
        if (!r.ok && r.reason !== 'road_on_tile' && !strokeFailed.current) {
          strokeFailed.current = true;
          say(r.reason === 'materials' ? t('city.reason.materials') : placeReasonText(t, L, r.reason), 'bad');
        }
      } else if (tool === 'erase') {
        st.removeRoad(tile[0], tile[1]);
      } else if (tool === 'zone') {
        st.zone([tile], zoneKind);
      }
    },
    [tool, roadKind, zoneKind, say, t, L],
  );
  const onTileDown = useCallback((tile: [number, number]) => paint(tile, true), [paint]);
  const onTileDrag = useCallback((tile: [number, number]) => paint(tile, false), [paint]);
  // Gộp các lần đổi ô trong cùng một khung hình (chuột lướt nhanh qua vài ô) thành một lần render.
  const hoverNext = useRef<[number, number] | null>(null);
  const hoverRaf = useRef(0);
  const onHover = useCallback((tile: [number, number] | null) => {
    hoverNext.current = tile;
    if (hoverRaf.current) return;
    hoverRaf.current = requestAnimationFrame(() => {
      hoverRaf.current = 0;
      const next = hoverNext.current;
      setHover((h) => (h === next || (h && next && h[0] === next[0] && h[1] === next[1]) ? h : next));
    });
  }, []);
  useEffect(() => () => cancelAnimationFrame(hoverRaf.current), []);

  const rotateCam = useCallback((dir: 1 | -1) => setCamRot((r) => (r + dir + 4) % 4), []);
  useEffect(() => {
    const cam = useCityViewStore.getState().camera;
    useCityViewStore.getState().setCamera({ rot: camRot, zoom: cam?.zoom ?? zoom });
  }, [camRot, zoom]);
  const onCameraChange = useCallback((z: number) => {
    const cam = useCityViewStore.getState().camera;
    useCityViewStore.getState().setCamera({ rot: cam?.rot ?? 0, zoom: z });
  }, []);

  // ------------------------------------------------------------ bàn phím
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
      if (sheet || e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key.toLowerCase();
      const toolKeys: Record<string, Tool> = { v: 'select', p: 'walk', b: 'build', g: 'road', x: 'erase', z: 'zone', l: 'land', m: 'expand' };
      const api = cameraApi.current;
      if (toolKeys[k]) return setTool(toolKeys[k]!);
      if (k === 'r' && tool === 'build') return setBuildRot((r) => ((r + 1) % 4) as 0 | 1 | 2 | 3);
      if (k === 'q') return rotateCam(-1);
      if (k === 'e') return rotateCam(1);
      if (k === 'h') return api?.home();
      if (k === '+' || k === '=') return api?.zoomBy(1.2);
      if (k === '-' || k === '_') return api?.zoomBy(1 / 1.2);
      if (tool === 'walk') {
        // WASD / mũi tên do nhân vật nhận (WalkLayer); Space làm việc ở chỗ đứng.
        if (k === ' ' || k === 'enter') {
          e.preventDefault();
          doActivity();
        }
        if (k === 'escape') setTool('select');
        return;
      }
      const pan: Record<string, [number, number]> = { arrowup: [0, 1], w: [0, 1], arrowdown: [0, -1], s: [0, -1], arrowleft: [-1, 0], a: [-1, 0], arrowright: [1, 0], d: [1, 0] };
      if (pan[k]) {
        e.preventDefault();
        api?.pan(pan[k]![0], pan[k]![1]);
        return;
      }
      if (k === 'escape') {
        if (buildType) setBuildType(null);
        else if (selected) setSelected(null);
        else setTool('select');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sheet, tool, buildType, selected, setTool, rotateCam, doActivity]);

  const eraUp = useCallback(() => {
    const before = useCityStore.getState().era;
    if (useCityStore.getState().advanceEra(level)) {
      setConfetti(Date.now());
      setSheet({ kind: 'era', era: before + 1 });
    }
  }, [level]);
  // Hàm ổn định cho các khối giao diện đã memo — đổi hàm mỗi lần render là phá memo.
  const openEarn = useCallback((k?: MaterialKind) => setSheet({ kind: 'earn', focus: k }), []);
  const openMarket = useCallback((want?: Partial<Materials>) => setSheet({ kind: 'market', want }), []);
  const openCredits = useCallback(() => setSheet({ kind: 'credits' }), []);
  const closeSheet = useCallback(() => setSheet(null), []);
  const zoomBy = useCallback((f: number) => cameraApi.current?.zoomBy(f), []);
  const goHome = useCallback(() => cameraApi.current?.home(), []);
  const closeSite = useCallback(() => setSelected(null), []);
  const selectSite = useCallback(
    (id: string) => {
      setTool('select');
      setSelected(id);
    },
    [setTool],
  );
  const panel = usePresence(panelOpen, reduced ? 0 : 160);

  const paintMode = tool === 'road' || tool === 'erase' || tool === 'zone';
  const hint = hintFor(tool, buildType, t);

  return (
    <div className="cg-root" onContextMenu={(e) => e.preventDefault()}>
      <CityCanvas
        data={data}
        interactive={!sheet}
        showGrid={tool !== 'select' && tool !== 'walk'}
        showZones={tool === 'zone' || tool === 'build'}
        regionHints={regionHints}
        hover={tool === 'select' || tool === 'build' ? null : hover}
        preview={preview}
        selectedSite={selected}
        replay={replay}
        onReplayDone={onReplayDone}
        onHover={onHover}
        onTileDown={onTileDown}
        onTileDrag={onTileDrag}
        onTileClick={onTileClick}
        paintMode={paintMode}
        trackHover={tool !== 'select' && tool !== 'walk'}
        walk={walk}
        rot={camRot}
        zoom={zoom}
        onCameraApi={onCameraApi}
        onCameraChange={onCameraChange}
        reducedMotion={reduced}
      />

      <TopBar onEarn={openEarn} onMarket={openMarket} onCredits={openCredits} onSample={onSample} />
      <ToolRail tool={tool} onTool={setTool} onRotate={rotateCam} onZoom={zoomBy} onHome={goHome} />

      {tool === 'build' ? <BuildPalette picked={buildType} onPick={setBuildType} rot={buildRot} /> : null}
      {tool === 'road' ? <RoadOptions kind={roadKind} onKind={setRoadKind} /> : null}
      {tool === 'zone' ? <ZoneOptions zone={zoneKind} onZone={setZoneKind} /> : null}
      {tool === 'land' ? <LandOptions work={landKind} onWork={setLandKind} /> : null}
      {tool === 'expand' ? <ExpandOptions /> : null}

      {panel.mounted ? (
        <aside className={`cg-panel ${panel.leaving ? 'cg-slide-out' : 'cg-slide'}`} style={{ position: 'absolute', right: 16, top: 96, bottom: 16, width: 360, padding: 16, display: 'flex', flexDirection: 'column', gap: 10, zIndex: 11 }}>
          {selected ? null : (
            <div className="cg-row" style={{ justifyContent: 'space-between' }}>
              <strong className="cg-x" style={{ fontSize: 17 }}>{t('city.panel.show')}</strong>
              <button className="cg-btn ghost small" onClick={() => setPanelOpen(false)} aria-label={t('city.panel.hide')} title={t('city.panel.hide')}>
                ⟩
              </button>
            </div>
          )}
          {selected ? (
            <SitePanel key={selected} siteId={selected} onClose={closeSite} onEarn={openEarn} onMarket={openMarket} toast={say} />
          ) : (
            <OverviewPanel onSelect={selectSite} onEarn={openEarn} onEraUp={eraUp} />
          )}
        </aside>
      ) : null}
      {panelOpen ? null : (
        <button className="cg-btn" style={{ position: 'absolute', right: 16, top: 96, zIndex: 11 }} onClick={() => setPanelOpen(true)} aria-label={t('city.panel.show')}>
          ⟨ {t('city.panel.show')}
        </button>
      )}

      {walking && !sheet ? <WalkPrompt activity={activity} onAct={doActivity} /> : null}
      <div className="cg-panel" style={{ position: 'absolute', left: 16, bottom: 16, padding: 6, display: 'flex', gap: 4, zIndex: 12 }}>
        <button className={`cg-btn small${walking ? ' primary' : ''}`} onClick={() => setTool(walking ? 'select' : 'walk')}>
          🚶 {L({ vi: 'Dạo phố', en: 'Stroll' })}
        </button>
        <button className="cg-btn small" onClick={() => setSheet({ kind: 'home' })}>
          🏠 {L({ vi: 'Nhà của tôi', en: 'My home' })}
        </button>
        <button className="cg-btn small" onClick={() => setSheet({ kind: 'bag' })}>
          🎒 {L({ vi: 'Bộ sưu tập', en: 'Collection' })}
        </button>
        <button className="cg-btn small" onClick={onVisit}>
          👥 {L({ vi: 'Thăm bạn', en: 'Visit friends' })}
        </button>
        <button className="cg-btn small primary" onClick={onHub}>
          🏗️ {L({ vi: 'Trung tâm Tương lai', en: 'Future Centre' })}
        </button>
      </div>

      {hint ? (
        <div className="cg-chip" style={{ position: 'absolute', left: '50%', bottom: 70, transform: 'translateX(-50%)', fontSize: 14, zIndex: 9, boxShadow: '0 6px 18px rgba(16,33,63,.14)' }}>
          {hint}
        </div>
      ) : null}

      {toast ? (
        <div key={toast.id} className={`cg-toast ${toast.tone}`} role={toast.tone === 'bad' ? 'alert' : 'status'} style={{ bottom: hint ? 116 : 70 }}>
          <span aria-hidden>{toast.tone === 'bad' ? '⛔' : toast.tone === 'ok' ? '✅' : 'ℹ️'}</span>
          <span>{toast.text}</span>
        </div>
      ) : null}

      {confetti ? <Confetti key={confetti} /> : null}

      {sheet?.kind === 'earn' ? <EarnSheet focus={sheet.focus} onClose={closeSheet} onMarket={openMarket} /> : null}
      {sheet?.kind === 'market' ? <MarketSheet want={sheet.want} onClose={closeSheet} onEarn={openEarn} toast={say} /> : null}
      {sheet?.kind === 'credits' ? <Credits onClose={closeSheet} /> : null}
      {sheet?.kind === 'era' ? <EraSheet era={sheet.era} onClose={closeSheet} /> : null}
      {sheet?.kind === 'catch' ? <CatchGame kind={sheet.what} onClose={closeSheet} /> : null}
      {sheet?.kind === 'bag' ? <CollectionSheet onClose={closeSheet} /> : null}
      {sheet?.kind === 'home' ? <HomeRoom onClose={closeSheet} /> : null}
    </div>
  );
}

/** Chỗ nhân vật đứng lần cuối (trong phiên) — bật lại Dạo phố thì đứng đúng chỗ cũ. */
let lastWalkPos: [number, number] | null = null;
function rememberWalkPos(p: [number, number]) {
  lastWalkPos = p;
}

function hintFor(tool: Tool, buildType: string | null, t: ReturnType<typeof useL>['t']): string | null {
  if (tool === 'walk') return t('city.hint.walk');
  if (tool === 'build') return buildType ? t('city.hint.buildPlace') : t('city.hint.buildPick');
  if (tool === 'road') return t('city.hint.road');
  if (tool === 'erase') return t('city.hint.erase');
  if (tool === 'zone') return t('city.hint.zone');
  if (tool === 'land') return t('city.hint.land');
  if (tool === 'expand') return t('city.hint.expand');
  return t('city.hint.select');
}

function EraSheet({ era, onClose }: { era: number; onClose: () => void }) {
  const { t, L } = useL();
  const e = era as Era;
  const items = CATALOG.filter((c) => c.era === e);
  const crews = CREW_ORDER.filter((c) => CREWS[c].era === e).map((c) => CREWS[c]);
  return (
    <Modal title={t('city.era.welcome', { era: e, name: L(ERA_INFO[e]) })} onClose={onClose}>
      <p className="cg-muted" style={{ margin: '0 0 12px' }}>{t('city.era.unlocked')}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 8 }}>
        {items.map((it) => (
          <div key={it.id} className="cg-card" style={{ cursor: 'default', alignItems: 'center' }}>
            <span aria-hidden style={{ fontSize: 24 }}>{it.glyph}</span>
            <span className="cg-b" style={{ fontSize: 15 }}>{L(it)}</span>
          </div>
        ))}
        {crews.map((c) => (
          <div key={c.vi} className="cg-card" style={{ cursor: 'default', alignItems: 'center', background: CG.brandSoft }}>
            <span aria-hidden style={{ fontSize: 24 }}>{c.glyph}</span>
            <span className="cg-b" style={{ fontSize: 15 }}>{L(c)}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
        <button className="cg-btn primary" onClick={onClose}>
          {t('city.era.go')}
        </button>
      </div>
    </Modal>
  );
}

const CONFETTI_COLORS = ['#F2A33A', '#4A7FE8', '#3AA65D', '#E0533D', '#8A63D2', '#F7C531'];

/** Pháo giấy ngắn khi hoàn thành công trình / lên kỷ (CSS; tắt khi giảm chuyển động). */
function Confetti() {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const id = setTimeout(() => setOn(false), 1900);
    return () => clearTimeout(id);
  }, []);
  const bits = useMemo(
    () =>
      Array.from({ length: 46 }, (_, i) => ({
        left: `${(i * 37) % 100}%`,
        delay: `${(i % 9) * 0.05}s`,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        rot: (i * 47) % 360,
      })),
    [],
  );
  if (!on) return null;
  return (
    <div className="cg-confetti" aria-hidden>
      {bits.map((b, i) => (
        <i key={i} style={{ left: b.left, animationDelay: b.delay, background: b.color, transform: `rotate(${b.rot}deg)` }} />
      ))}
    </div>
  );
}
