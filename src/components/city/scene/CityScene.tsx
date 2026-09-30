/**
 * Cảnh 3D của Thành Phố Tri Thức (@react-three/fiber, `frameloop="demand"`).
 *
 * Chỉ vẽ lại khi có thay đổi: dữ liệu store đổi, camera di chuyển, hoặc có hoạt
 * cảnh đang chạy (công nhân làm việc, cần cẩu quay, nước gợn — nước chỉ gợi
 * vẽ lại ~8 lần/giây và tắt hẳn khi người dùng chọn giảm chuyển động).
 *
 * Hình học: địa hình là lưới cao độ MỊN (`surface.ts`, không phải cột khối);
 * địa hình / nước / đường mỗi loại một lưới; công trình đã xong GỘP
 * thành một lưới; mỗi công trường một lưới; cây, công nhân vẽ bằng
 * InstancedMesh. Mục tiêu < 150 lệnh vẽ với 80 công trình (đo bằng
 * `renderer.info`, xem `?perf=1`).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { MapControls } from 'three/examples/jsm/controls/MapControls.js';

import { catalogItem, isTower, ZONE_INFO, type ZoneKind } from '@/data/city/catalog';
import { PALETTE } from '@/data/city/palette';
import { CREWS, isDone, type Site } from '@/services/city/construction';
import { footprint, footprintTiles, key, type PlaceCheck, type RoadTile } from '@/services/city/placement';
import { generateBuilding } from '@/services/city/procgen/buildings';
import { Builder, DONE, rng, visibleParts, type ProcBuilding, type Visual } from '@/services/city/procgen/parts';
import { craneHeight, workLevel } from '@/services/city/procgen/towers';
import { regionBounds, regionOf, tileAt, type LandWork, type Terrain } from '@/services/city/terrain';
import { groundMaterial, partsGeometry, toonMaterial, Writer } from './geometry';
import { buildField, SUB, vx, type Field, type Pin } from './surface';
import { decorInstances, loadDecor } from './decor';
import { toVisual } from './visual';
import type { DecorModel } from '@/data/city/decor-map';
import { WalkLayer, type WalkProps } from './WalkLayer';
import { natureInstances, natureTemplates, roadGeometry, terrainGeometry, tileOf, topY, waterGeometry, waterMaterial, type NatureKind } from './world';

export type SceneData = {
  terrain: Terrain;
  works: Record<string, LandWork>;
  roads: Record<string, RoadTile>;
  zones: Record<string, ZoneKind>;
  regions: readonly number[];
  sites: readonly Site[];
  /** Kỷ hiện tại — model trang trí chỉ nạp khi kỷ đã mở. */
  era?: number;
};

/** Dữ liệu cảnh + lưới cao độ mịn đã tính (dùng chung cho mọi lớp). */
export type SceneWorld = SceneData & { field: Field };

export type Preview = { type: string; x: number; y: number; rot: 0 | 1 | 2 | 3; seed: number; check: PlaceCheck; entrance: [number, number] | null };

export type SceneProps = {
  data: SceneData;
  interactive: boolean;
  /** Công cụ đang cần lưới / lớp phân khu. */
  showGrid: boolean;
  showZones: boolean;
  /** Vùng đất chưa mở tô sáng khi đang mở rộng. */
  regionHints?: Record<number, 'can' | 'cannot'>;
  hover: [number, number] | null;
  preview: Preview | null;
  selectedSite: string | null;
  /** Khung hình phát lại tiến độ của từng công trường (công nhân làm việc). */
  replay: Record<string, Visual[]>;
  onReplayDone: (siteId: string) => void;
  onHover: (tile: [number, number] | null) => void;
  onTileDown: (tile: [number, number]) => void;
  onTileDrag: (tile: [number, number]) => void;
  onTileClick: (tile: [number, number]) => void;
  paintMode: boolean;
  rot: number;
  /** Công cụ đang cần biết ô dưới chuột (xây, làm đường...). Chế độ xem thì không — đỡ raycast mỗi lần di chuột. */
  trackHover?: boolean;
  /** Zoom lúc mở (chỉ đọc một lần — sau đó người dùng tự zoom). */
  zoom: number;
  /** Nhận bộ lệnh camera cho bàn phím / nút bấm ngoài canvas (null khi gỡ). */
  onCameraApi?: (api: CameraApi | null) => void;
  /** Điểm nhìn khi mở / bấm "về giữa" (toạ độ thế giới x, z). Mặc định: khu cao ốc, rồi trung tâm công trình. */
  focus?: [number, number];
  onCameraChange?: (zoom: number) => void;
  reducedMotion: boolean;
  autoSpin?: boolean;
  /** Chế độ đi dạo: có nhân vật, camera bám theo. */
  walk?: WalkProps | null;
};

export type CameraApi = {
  /** Dời tâm nhìn theo hướng màn hình (dx phải, dy lên), đơn vị ô. */
  pan: (dx: number, dy: number) => void;
  zoomBy: (factor: number) => void;
  /** Zoom tới một mức cụ thể (đi dạo: phóng gần để thấy nhân vật). */
  zoomTo: (zoom: number) => void;
  /** Quay về tâm bản đồ. */
  home: () => void;
};

/** Ma trận đặt công trình: tâm khu đất, cao độ nền, xoay 90° × rot. */
export function siteMatrix(t: Terrain, works: Record<string, LandWork>, site: { type: string; x: number; y: number; rot: number }): THREE.Matrix4 {
  const item = catalogItem(site.type)!;
  const [w, d] = footprint(item.size, site.rot);
  const cx = site.x + w / 2 - t.size / 2;
  const cz = site.y + d / 2 - t.size / 2;
  let y = topY(t, works, site.x, site.y);
  if (item.place.on === 'waterfront') {
    // Bến thuyền: sàn ngang mặt đất bờ.
    y = Math.max(y, 0.5 - 0.05);
  }
  return new THREE.Matrix4().makeRotationY((site.rot * Math.PI) / 2).setPosition(cx, y, cz);
}

function buildingOf(site: { type: string; seed: number }): ProcBuilding {
  return generateBuilding(site.type, site.seed, catalogItem(site.type)?.era ?? 1);
}

/** Mật độ điểm ảnh tối đa khi đứng yên (màn Retina / laptop 150% vẫn đủ nét). */
const MAX_DPR = 1.5;

/**
 * Điểm nhìn mặc định: tâm khu CAO ỐC (người dùng muốn mở thành phố là thấy nhà
 * cao tầng trước); chưa có cao ốc thì tâm các công trình; chưa có gì thì giữa bản đồ.
 */
export function cityFocus(data: SceneData): [number, number] {
  const half = data.terrain.size / 2;
  const center = (list: readonly Site[]): [number, number] | null => {
    if (!list.length) return null;
    let x = 0;
    let z = 0;
    for (const s of list) {
      const [w, d] = footprint(catalogItem(s.type)!.size, s.rot);
      x += s.x + w / 2 - half;
      z += s.y + d / 2 - half;
    }
    return [x / list.length, z / list.length];
  };
  return center(data.sites.filter((s) => isTower(catalogItem(s.type)))) ?? center(data.sites) ?? [0, 0];
}

// ------------------------------------------------------------------ bóng đổ theo yêu cầu

/**
 * Bản đồ bóng KHÔNG vẽ lại mỗi khung (ánh sáng và công trình đứng yên; kéo
 * camera hay nước gợn không đổi bóng). Chỉ vẽ lại khi hình đổi: `markShadows()`.
 */
let shadowDirty = true;
export function markShadows(): void {
  shadowDirty = true;
}

function ShadowController() {
  useFrame(({ gl }) => {
    gl.shadowMap.autoUpdate = false;
    if (shadowDirty) {
      gl.shadowMap.needsUpdate = true;
      shadowDirty = false;
    }
  });
  return null;
}

/** Đánh dấu bóng cần vẽ lại khi `dep` đổi. */
function useShadowDirty(dep: unknown) {
  const { invalidate } = useThree();
  useEffect(() => {
    markShadows();
    invalidate();
  }, [dep, invalidate]);
}

// ------------------------------------------------------------------ camera

/**
 * Camera trực giao nghiêng 35°, xoay 45° + bậc 90°. Điều khiển bằng
 * `MapControls` của chính three (không kéo cả thư viện drei vào bundle):
 * kéo để dời, lăn để zoom, không xoay tự do; tâm nhìn giới hạn trong bản đồ.
 * Camera là camera mặc định của Canvas (`orthographic`), R3F tự chỉnh khung
 * khi đổi kích thước.
 */
function CameraRig({ size, rot, interactive, autoSpin, reducedMotion, paintMode, onApi, onChange, focus, followRef }: { size: number; rot: number; interactive: boolean; autoSpin?: boolean; reducedMotion: boolean; paintMode: boolean; onApi?: (api: CameraApi | null) => void; onChange?: (zoom: number) => void; focus: [number, number]; followRef?: React.MutableRefObject<[number, number] | null> }) {
  const focusRef = useRef(focus);
  useEffect(() => {
    focusRef.current = focus;
  }, [focus]);
  const get = useThree((s) => s.get);
  const controls = useRef<MapControls | null>(null);
  const az = useRef(Math.PI / 4 + (rot * Math.PI) / 2);
  const targetAz = Math.PI / 4 + (rot * Math.PI) / 2;
  const elev = (35 * Math.PI) / 180;
  const dist = 60;
  const lim = size / 2 - 2;

  const place = (a: number) => {
    const k = controls.current;
    if (!k) return;
    const c = k.object;
    const t = k.target;
    c.position.set(t.x + Math.sin(a) * Math.cos(elev) * dist, t.y + Math.sin(elev) * dist, t.z + Math.cos(a) * Math.cos(elev) * dist);
    c.lookAt(t);
    k.update();
  };

  const clampTarget = () => {
    const k = controls.current;
    if (!k) return;
    const c = k.object;
    const t = k.target;
    const nx = THREE.MathUtils.clamp(t.x, -lim, lim);
    const nz = THREE.MathUtils.clamp(t.z, -lim, lim);
    if (nx !== t.x || nz !== t.z) {
      c.position.x += nx - t.x;
      c.position.z += nz - t.z;
      t.x = nx;
      t.z = nz;
    }
  };

  // Tạo bộ điều khiển một lần.
  useEffect(() => {
    const { camera, gl, invalidate } = get();
    const k = new MapControls(camera, gl.domElement);
    k.enableRotate = false;
    k.enableDamping = false;
    k.screenSpacePanning = false;
    // Khung xem trước nhỏ có thể cần zoom dưới 9 để thấy trọn bản đồ.
    k.minZoom = Math.min(9, (camera as THREE.OrthographicCamera).zoom);
    k.maxZoom = 90;
    k.zoomSpeed = 0.9;
    k.target.set(focusRef.current[0], 0.5, focusRef.current[1]);
    controls.current = k;
    place(az.current);
    let timer: ReturnType<typeof setTimeout> | null = null;
    const onCtl = () => {
      clampTarget();
      invalidate();
      if (onChange) {
        if (timer) clearTimeout(timer);
        const z = (k.object as THREE.OrthographicCamera).zoom;
        timer = setTimeout(() => onChange(z), 400);
      }
    };
    k.addEventListener('change', onCtl);
    // Đang kéo / zoom: vẽ ở mật độ điểm ảnh 1× cho mượt; thả tay 250 ms thì vẽ lại nét cao.
    const { setDpr } = get();
    const full = Math.min(MAX_DPR, typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1);
    let rest: ReturnType<typeof setTimeout> | null = null;
    const onStart = () => {
      if (rest) clearTimeout(rest);
      if (full > 1) setDpr(1);
    };
    const onEnd = () => {
      if (rest) clearTimeout(rest);
      rest = setTimeout(() => {
        if (full > 1) setDpr(full);
        get().invalidate();
      }, 250);
    };
    k.addEventListener('start', onStart);
    k.addEventListener('end', onEnd);
    invalidate();
    return () => {
      k.removeEventListener('change', onCtl);
      k.removeEventListener('start', onStart);
      k.removeEventListener('end', onEnd);
      if (timer) clearTimeout(timer);
      if (rest) clearTimeout(rest);
      k.dispose();
      controls.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [get]);

  // Bật/tắt, và chuột trái: vẽ (đường / phân khu) hay kéo bản đồ.
  useEffect(() => {
    const k = controls.current;
    if (!k) return;
    k.enabled = interactive;
    k.mouseButtons = { LEFT: paintMode ? (-1 as THREE.MOUSE) : THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
  }, [interactive, paintMode]);

  useEffect(() => {
    get().invalidate();
  }, [rot, get]);

  // Quay chậm (màn chọn đất, khung xem trước ở /quest): ~24 khung/giây là đủ
  // mượt cho tốc độ này, không bắt GPU vẽ hết tốc trên trang tổng quan.
  useEffect(() => {
    if (!autoSpin || reducedMotion) return;
    const id = setInterval(() => {
      az.current += 0.0035;
      place(az.current);
      get().invalidate();
    }, 42);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSpin, reducedMotion, get]);

  useFrame((_, dt) => {
    if (autoSpin) return;
    // Bám theo nhân vật đi dạo: dời tâm nhìn (và camera) về phía nhân vật.
    const f = followRef?.current;
    const k = controls.current;
    if (f && k) {
      const ex = f[0] - k.target.x;
      const ez = f[1] - k.target.z;
      if (Math.abs(ex) > 0.002 || Math.abs(ez) > 0.002) {
        const s = reducedMotion ? 1 : Math.min(1, dt * 6);
        k.target.x += ex * s;
        k.target.z += ez * s;
        k.object.position.x += ex * s;
        k.object.position.z += ez * s;
        k.update();
        get().invalidate();
      }
    }
    let diff = targetAz - az.current;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    if (Math.abs(diff) > 0.001) {
      az.current += reducedMotion ? diff : diff * Math.min(1, dt * 8);
      place(az.current);
      get().invalidate();
    }
  });

  // Lệnh từ bàn phím / nút ngoài canvas.
  useEffect(() => {
    if (!onApi) return;
    onApi({
      pan: (dx, dy) => {
        const k = controls.current;
        if (!k) return;
        const c = k.object as THREE.OrthographicCamera;
        const a = az.current;
        const step = 30 / Math.max(8, c.zoom);
        const mx = (Math.cos(a) * dx - Math.sin(a) * dy) * step;
        const mz = (-Math.sin(a) * dx - Math.cos(a) * dy) * step;
        k.target.x += mx;
        k.target.z += mz;
        c.position.x += mx;
        c.position.z += mz;
        clampTarget();
        k.update();
        get().invalidate();
      },
      zoomBy: (f) => {
        const k = controls.current;
        if (!k) return;
        const c = k.object as THREE.OrthographicCamera;
        c.zoom = THREE.MathUtils.clamp(c.zoom * f, 9, 90);
        c.updateProjectionMatrix();
        k.update();
        onChange?.(c.zoom);
        get().invalidate();
      },
      zoomTo: (z) => {
        const k = controls.current;
        if (!k) return;
        const c = k.object as THREE.OrthographicCamera;
        c.zoom = THREE.MathUtils.clamp(z, 9, 90);
        c.updateProjectionMatrix();
        k.update();
        onChange?.(c.zoom);
        get().invalidate();
      },
      home: () => {
        const k = controls.current;
        if (!k) return;
        k.target.set(focusRef.current[0], 0.5, focusRef.current[1]);
        place(az.current);
        get().invalidate();
      },
    });
    return () => onApi(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onApi, get, onChange]);

  return null;
}

// ------------------------------------------------------------------ nền

function Terrain3D({ data }: { data: SceneWorld }) {
  const geo = useMemo(() => terrainGeometry(data.terrain, data.works, data.regions, data.field), [data.terrain, data.works, data.regions, data.field]);
  const mat = useMemo(() => groundMaterial(), []);
  useEffect(() => () => geo.dispose(), [geo]);
  useShadowDirty(geo);
  return <mesh geometry={geo} material={mat} receiveShadow castShadow name="terrain" />;
}

function Water({ data, reducedMotion }: { data: SceneWorld; reducedMotion: boolean }) {
  const geo = useMemo(() => waterGeometry(data.terrain, data.field), [data.terrain, data.field]);
  const mat = useMemo(() => waterMaterial(), []);
  const { invalidate } = useThree();
  useEffect(() => () => geo.dispose(), [geo]);
  // Nước gợn nhẹ: vẽ lại ~6 lần/giây (đủ thấy gợn, không bắt GPU chạy liên tục), tắt khi giảm chuyển động.
  useEffect(() => {
    if (reducedMotion) return;
    const id = setInterval(() => {
      mat.uniforms.time!.value = performance.now() / 1000;
      invalidate();
    }, 160);
    return () => clearInterval(id);
  }, [mat, invalidate, reducedMotion]);
  return <mesh geometry={geo} material={mat} name="water" />;
}

function Roads({ data }: { data: SceneWorld }) {
  const geo = useMemo(() => roadGeometry(data.terrain, data.works, data.roads, data.field), [data.terrain, data.works, data.roads, data.field]);
  const mat = useMemo(() => toonMaterial(), []);
  useEffect(() => () => geo.dispose(), [geo]);
  useShadowDirty(geo);
  return <mesh geometry={geo} material={mat} receiveShadow name="roads" />;
}

let templates: Record<NatureKind, THREE.BufferGeometry[]> | null = null;

function Nature({ data }: { data: SceneWorld }) {
  templates ??= natureTemplates();
  const mat = useMemo(() => toonMaterial(), []);
  // Ô có đường, hoặc công trường đã qua bước dọn nền → không còn cây.
  const hidden = useMemo(() => {
    const h = new Set<string>(Object.keys(data.roads));
    for (const s of data.sites) {
      const item = catalogItem(s.type);
      if (!item) continue;
      const v = toVisual(s);
      if (v.stage >= 1 || !item.stages.includes(1)) for (const [x, y] of footprintTiles(s.x, s.y, item.size, s.rot)) h.add(key(x, y));
    }
    return h;
  }, [data.roads, data.sites]);
  const list = useMemo(() => natureInstances(data.terrain, data.works, hidden, data.field), [data.terrain, data.works, hidden, data.field]);
  const groups = useMemo(() => {
    const g: Record<string, typeof list> = {};
    for (const n of list) (g[`${n.kind}:${n.variant}`] ??= []).push(n);
    return g;
  }, [list]);
  return (
    <>
      {Object.entries(groups).map(([k, items]) => {
        const [kind, variant] = k.split(':') as [NatureKind, string];
        return <NatureBatch key={k} geo={templates![kind][Number(variant)]!} items={items} mat={mat} />;
      })}
    </>
  );
}

function NatureBatch({ geo, items, mat }: { geo: THREE.BufferGeometry; items: { x: number; y: number; z: number; ry: number; s: number }[]; mat: THREE.Material }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    const m = ref.current;
    if (!m) return;
    const o = new THREE.Object3D();
    items.forEach((it, i) => {
      o.position.set(it.x, it.y, it.z);
      o.rotation.set(0, it.ry, 0);
      o.scale.setScalar(it.s);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
    m.computeBoundingSphere();
    markShadows();
  }, [items]);
  return <instancedMesh ref={ref} args={[geo, mat, items.length]} castShadow receiveShadow />;
}

// ------------------------------------------------------------------ công trình

function SiteMesh({ data, site, frames, onDone, selected }: { data: SceneData; site: Site; frames?: Visual[]; onDone: (siteId: string) => void; selected: boolean }) {
  const pb = useMemo(() => buildingOf(site), [site]);
  // Chỉ số khung gắn với chính dãy khung: dãy mới → tự về 0, không cần hiệu ứng đặt lại.
  const [play, setPlay] = useState<{ frames?: Visual[]; i: number }>({ frames, i: 0 });
  const i = play.frames === frames ? play.i : 0;
  const { invalidate } = useThree();
  // Ổn định theo giá trị: `toVisual` trả object mới mỗi lần gọi — để thẳng trong
  // thân hàm là mỗi lần cảnh render lại (chuột lướt qua một ô) phải dựng lại cả
  // tòa nhà và vẽ lại bóng đổ. Đó là nguồn giật chính khi rê chuột.
  const visual = useMemo(() => (frames && frames.length ? frames[Math.min(i, frames.length - 1)]! : toVisual(site)), [frames, i, site]);
  useEffect(() => {
    if (!frames || frames.length === 0) return;
    if (i >= frames.length - 1) {
      const t = setTimeout(() => onDone(site.id), 1800);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setPlay({ frames, i: i + 1 });
      invalidate();
    }, 650);
    return () => clearTimeout(t);
  }, [frames, i, onDone, invalidate, site.id]);
  const base = useMemo(() => siteMatrix(data.terrain, data.works, site), [data.terrain, data.works, site]);
  const geo = useMemo(() => partsGeometry(visibleParts(pb, visual), visual, base).toGeometry(), [pb, visual, base]);
  const mat = useMemo(() => toonMaterial(), []);
  useEffect(() => () => geo.dispose(), [geo]);
  useShadowDirty(geo);
  const working = !!frames && frames.length > 0;
  return (
    <>
      <mesh geometry={geo} material={mat} castShadow receiveShadow name={`site:${site.id}`} />
      {pb.tower && visual.craneUp && visual.stage >= 4 && visual.stage < 8 ? <CraneModel pb={pb} base={base} floorsDone={visual.stage > 4 ? pb.tower.floors : visual.floorsDone} working={working} /> : null}
      <Workers site={site} pb={pb} base={base} visual={visual} working={working} />
      {working && site.crew ? <Dust pb={pb} base={base} visual={visual} /> : null}
      {selected ? <Outline data={data} site={site} height={pb.height} /> : null}
    </>
  );
}

/** Mọi công trình đã hoàn thành gộp thành một lưới (1–2 lệnh vẽ cho cả thành phố). */
/**
 * Công trình đã hoàn thành, GỘP THEO VÙNG ĐẤT (lưới 4×4 vùng): mỗi vùng một
 * lưới. Zoom gần thì vùng ngoài màn hình bị loại khỏi lệnh vẽ (frustum culling);
 * xong một công trình chỉ dựng lại đúng vùng của nó. Tối đa 16 lệnh vẽ.
 */
function StaticCity({ data, selected, skip }: { data: SceneData; selected: string | null; skip: Set<string> }) {
  const done = useMemo(() => data.sites.filter((s) => isDone(s) && !skip.has(s.id)), [data.sites, skip]);
  const byRegion = useMemo(() => {
    const m = new Map<number, Site[]>();
    for (const s of done) {
      const r = regionOf(s.x, s.y);
      if (!m.has(r)) m.set(r, []);
      m.get(r)!.push(s);
    }
    return [...m.entries()].sort((a, b) => a[0] - b[0]);
  }, [done]);
  const sel = done.find((s) => s.id === selected);
  return (
    <>
      {byRegion.map(([r, list]) => (
        <CityChunk key={r} data={data} sites={list} sig={list.map((s) => `${s.id}:${s.stageIdx}`).join('|')} />
      ))}
      {sel ? <Outline data={data} site={sel} height={buildingOf(sel).height} /> : null}
    </>
  );
}

function CityChunk({ data, sites, sig }: { data: SceneData; sites: Site[]; sig: string }) {
  // Dựng lại theo chữ ký (id + công đoạn) của vùng, không theo danh tính mảng — vùng khác đổi thì vùng này đứng yên.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const geo = useMemo(() => {
    const w = new Writer();
    for (const s of sites) partsGeometry(visibleParts(buildingOf(s), DONE), DONE, siteMatrix(data.terrain, data.works, s), w);
    return w.empty ? null : w.toGeometry();
  }, [sig, data.terrain, data.works]);
  const mat = useMemo(() => toonMaterial(), []);
  useEffect(() => () => geo?.dispose(), [geo]);
  useShadowDirty(geo);
  return geo ? <mesh geometry={geo} material={mat} castShadow receiveShadow name="city" /> : null;
}

function Outline({ data, site, height }: { data: SceneData; site: Site; height: number }) {
  const item = catalogItem(site.type)!;
  const [w, d] = footprint(item.size, site.rot);
  const geo = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(w + 0.08, Math.max(0.3, height) + 0.1, d + 0.08)), [w, d, height]);
  const y = topY(data.terrain, data.works, site.x, site.y);
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <lineSegments geometry={geo} position={[site.x + w / 2 - data.terrain.size / 2, y + (Math.max(0.3, height) + 0.1) / 2, site.y + d / 2 - data.terrain.size / 2]}>
      <lineBasicMaterial color="#F7C531" />
    </lineSegments>
  );
}

// ------------------------------------------------------------------ model trang trí tải về

/** Đèn, thùng, ghế... từ Poly Haven (CC0) gắn vào điểm neo công trình; mỗi model một InstancedMesh. */
export function DecorLayer({ sites, era, place }: { sites: readonly Site[]; era: number; place: (s: Site) => THREE.Matrix4 }) {
  const inst = useMemo(() => decorInstances(sites, era, place), [sites, era, place]);
  return (
    <>
      {(Object.keys(inst) as DecorModel[]).map((m) => (
        <DecorModelMesh key={`${m}:${inst[m]!.length}`} model={m} mats={inst[m]!} />
      ))}
    </>
  );
}

function DecorModelMesh({ model, mats }: { model: DecorModel; mats: THREE.Matrix4[] }) {
  const [geo, setGeo] = useState<THREE.BufferGeometry | null>(null);
  const { invalidate } = useThree();
  const ref = useRef<THREE.InstancedMesh>(null);
  const mat = useMemo(() => toonMaterial(), []);
  useEffect(() => {
    let alive = true;
    loadDecor(model)
      .then((g) => {
        if (alive) setGeo(g);
      })
      .catch(() => {
        // Thiếu file model thì bỏ qua phần trang trí — công trình vẫn đầy đủ.
      });
    return () => {
      alive = false;
    };
  }, [model]);
  useEffect(() => {
    const m = ref.current;
    if (!m) return;
    mats.forEach((x, i) => m.setMatrixAt(i, x));
    m.instanceMatrix.needsUpdate = true;
    m.computeBoundingSphere();
    markShadows();
    invalidate();
  }, [mats, geo, invalidate]);
  if (!geo) return null;
  return <instancedMesh ref={ref} args={[geo, mat, mats.length]} castShadow receiveShadow />;
}

// ------------------------------------------------------------------ cần cẩu

function craneGeometry(height: number, jib: number): { mast: THREE.BufferGeometry; arm: THREE.BufferGeometry; hook: THREE.BufferGeometry } {
  const C = PALETTE.crane;
  const b = new Builder();
  b.box(0, 0, 0, 0.36, 0.08, 0.36, C.weight);
  const seg = 0.28;
  const n = Math.max(2, Math.ceil(height / seg));
  const hh = n * seg;
  for (const [x, z] of [
    [-0.09, -0.09],
    [0.09, -0.09],
    [-0.09, 0.09],
    [0.09, 0.09],
  ] as const)
    b.box(x, 0.08, z, 0.03, hh, 0.03, C.mast);
  for (let i = 0; i < n; i++) {
    const y = 0.08 + i * seg;
    b.box(0, y + seg / 2, 0.09, 0.2, 0.02, 0.02, C.mast, { rz: i % 2 ? 0.9 : -0.9 });
    b.box(0.09, y + seg / 2, 0, 0.02, 0.02, 0.2, C.mast, { rx: i % 2 ? 0.9 : -0.9 });
    b.box(0, y + seg / 2, -0.09, 0.2, 0.02, 0.02, C.mast, { rz: i % 2 ? -0.9 : 0.9 });
    b.box(-0.09, y + seg / 2, 0, 0.02, 0.02, 0.2, C.mast, { rx: i % 2 ? -0.9 : 0.9 });
  }
  const mast = partsGeometry(b.parts, DONE).toGeometry();
  const a = new Builder();
  const top = 0.08 + hh;
  a.box(0, top, 0, 0.22, 0.16, 0.22, C.cab);
  a.box(jib / 2, top + 0.16, 0, jib, 0.07, 0.08, C.jib);
  a.box(-0.45, top + 0.16, 0, 0.9, 0.07, 0.08, C.jib);
  a.box(-0.8, top + 0.02, 0, 0.22, 0.2, 0.16, C.weight);
  a.box(0, top + 0.23, 0, 0.04, 0.35, 0.04, C.mast);
  a.box(jib * 0.45, top + 0.36, 0, jib * 0.9, 0.012, 0.012, C.cable, { rz: -0.14 });
  const arm = partsGeometry(a.parts, DONE).toGeometry();
  const h = new Builder();
  h.box(0, 0, 0, 0.012, 1, 0.012, C.cable);
  h.box(0, -0.06, 0, 0.07, 0.06, 0.05, C.hook);
  h.box(0, -0.16, 0, 0.18, 0.08, 0.12, PALETTE.steel.navy);
  const hook = partsGeometry(h.parts, DONE).toGeometry();
  return { mast, arm, hook };
}

export function CraneModel({ pb, base, floorsDone, working }: { pb: ProcBuilding; base: THREE.Matrix4; floorsDone: number; working: boolean }) {
  const t = pb.tower!;
  const height = craneHeight(pb, floorsDone);
  const { mast, arm, hook } = useMemo(() => craneGeometry(height, t.crane.jib), [height, t.crane.jib]);
  const mat = useMemo(() => toonMaterial(), []);
  const armRef = useRef<THREE.Group>(null);
  const hookRef = useRef<THREE.Group>(null);
  const { invalidate } = useThree();
  const pos = useMemo(() => new THREE.Vector3(t.crane.x, 0, t.crane.z).applyMatrix4(base), [base, t.crane.x, t.crane.z]);
  const baseRot = useMemo(() => new THREE.Euler().setFromRotationMatrix(base).y, [base]);
  const top = 0.08 + Math.max(2, Math.ceil(height / 0.28)) * 0.28;
  useEffect(() => () => [mast, arm, hook].forEach((g) => g.dispose()), [mast, arm, hook]);
  useShadowDirty(mast);
  // Tay cần quay + móc nâng chỉ khi có ca thi công.
  useFrame(({ clock }) => {
    if (!armRef.current || !hookRef.current) return;
    const k = working ? clock.elapsedTime : 0;
    armRef.current.rotation.y = t.crane.ry + (working ? Math.sin(k * 0.6) * 0.5 : 0);
    const reach = t.crane.jib * (working ? 0.55 + 0.25 * Math.sin(k * 0.9) : 0.6);
    hookRef.current.position.set(reach, top + 0.12 - (working ? 0.6 + 0.4 * Math.sin(k * 1.3) : 0.5), 0);
    hookRef.current.scale.y = 1;
    if (working) {
      markShadows();
      invalidate();
    }
  });
  return (
    <group position={pos} rotation={[0, baseRot, 0]}>
      <mesh geometry={mast} material={mat} castShadow />
      <group ref={armRef} rotation={[0, t.crane.ry, 0]}>
        <mesh geometry={arm} material={mat} castShadow />
        <group ref={hookRef} position={[t.crane.jib * 0.6, top - 0.4, 0]}>
          <mesh geometry={hook} material={mat} position={[0, 0, 0]} />
        </group>
      </group>
    </group>
  );
}

// ------------------------------------------------------------------ công nhân

// Đối tượng nháp dùng chung (đặt ma trận instance; chạy tuần tự nên không đụng nhau).
const SCRATCH_O = new THREE.Object3D();
const SCRATCH_V = new THREE.Vector3();

let workerGeo: THREE.BufferGeometry | null = null;
let boxGeo: THREE.BufferGeometry | null = null;
function workerTemplate(): THREE.BufferGeometry {
  if (workerGeo) return workerGeo;
  const W = PALETTE.worker;
  const b = new Builder();
  b.box(-0.022, 0, 0, 0.03, 0.07, 0.035, W.pants);
  b.box(0.022, 0, 0, 0.03, 0.07, 0.035, W.pants);
  b.box(0, 0.07, 0, 0.08, 0.08, 0.05, W.vest);
  b.box(-0.05, 0.08, 0, 0.022, 0.065, 0.03, W.shirt);
  b.box(0.05, 0.08, 0, 0.022, 0.065, 0.03, W.shirt);
  b.sphere(0, 0.15, 0, 0.032, W.skin[0]);
  b.cyl(0, 0.19, 0, 0.038, 0.03, W.hat, { taper: 0.55, seg: 8 });
  b.box(0, 0.19, 0.02, 0.06, 0.008, 0.04, W.hat);
  workerGeo = partsGeometry(b.parts, DONE).toGeometry();
  return workerGeo;
}
function carryTemplate(): THREE.BufferGeometry {
  if (boxGeo) return boxGeo;
  const b = new Builder();
  b.box(0, 0, 0, 0.07, 0.05, 0.06, PALETTE.wood.light);
  boxGeo = partsGeometry(b.parts, DONE).toGeometry();
  return boxGeo;
}

/**
 * Công nhân mũ vàng: CHỈ làm việc khi có ca thi công (đang phát lại tiến độ):
 * đi giữa điểm tập kết vật liệu và chỗ làm, mang thùng nhẹ, cúi gõ búa. Không
 * có ca → đứng nghỉ ở góc công trường. Cao ốc: đứng trên sàn đã có.
 */
function Workers({ site, pb, base, visual, working }: { site: Site; pb: ProcBuilding; base: THREE.Matrix4; visual: Visual; working: boolean }) {
  const count = site.crew ? CREWS[site.crew].workers : 0;
  const ref = useRef<THREE.InstancedMesh>(null);
  const carry = useRef<THREE.InstancedMesh>(null);
  const mat = useMemo(() => toonMaterial(), []);
  const { invalidate } = useThree();
  const [W, D] = pb.size;
  const spots = useMemo((): [number, number, number][] => {
    if (pb.tower && visual.stage === 4 && visual.craneUp) {
      const y = workLevel(pb.tower, visual.floorsDone, visual.floorStep);
      const [fw, fd] = pb.tower.footprint;
      const inset = Math.min(fw, fd) * 0.22;
      return [
        [-inset, y, inset],
        [inset, y, -inset * 0.5],
        [0, y, inset * 0.8],
        [W / 2 - 0.3, 0.02, D / 2 - 0.25],
      ];
    }
    const s = pb.workSpots[visual.stage] ?? pb.workSpots[Math.min(visual.stage, 8)] ?? [];
    const out = s.length ? [...s] : [[0, 0, D / 2 - 0.2] as [number, number, number]];
    return out;
  }, [pb, visual, W, D]);
  const rest: [number, number, number] = [W / 2 - 0.2, 0.02, D / 2 - 0.2];
  const depot: [number, number, number] = [-W / 2 + 0.25, 0.02, D / 2 - 0.25];
  const o = SCRATCH_O;
  const tmp = SCRATCH_V;

  const place = (time: number) => {
    const m = ref.current;
    const c = carry.current;
    if (!m || !c) return;
    for (let i = 0; i < count; i++) {
      const spot = spots[i % spots.length]!;
      let p: [number, number, number];
      let bob = 0;
      let lean = 0;
      let carrying = false;
      if (working) {
        const cycle = (time * 0.35 + i * 0.37) % 1;
        const onGround = spot[1] < 0.2;
        if (onGround && i % 2 === 1 && cycle < 0.6) {
          // Đi đi về về giữa đống vật liệu và chỗ làm, mang thùng.
          const u = cycle < 0.3 ? cycle / 0.3 : 1 - (cycle - 0.3) / 0.3;
          p = [depot[0] + (spot[0] - depot[0]) * u, spot[1], depot[2] + (spot[2] - depot[2]) * u];
          bob = Math.abs(Math.sin(time * 9 + i)) * 0.02;
          carrying = cycle < 0.3;
        } else {
          p = spot;
          lean = Math.max(0, Math.sin(time * 7 + i * 1.3)) * 0.35; // gõ búa
        }
      } else {
        p = [rest[0] - (i % 2) * 0.16, rest[1], rest[2] - Math.floor(i / 2) * 0.16];
      }
      tmp.set(p[0], p[1] + bob, p[2]).applyMatrix4(base);
      o.position.copy(tmp);
      o.rotation.set(lean, Math.atan2(-p[0], -p[2]) + new THREE.Euler().setFromRotationMatrix(base).y, 0);
      o.scale.setScalar(1);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      if (carrying) {
        o.position.y += 0.2;
        o.updateMatrix();
        c.setMatrixAt(i, o.matrix);
      } else {
        o.scale.setScalar(0);
        o.updateMatrix();
        c.setMatrixAt(i, o.matrix);
      }
    }
    m.instanceMatrix.needsUpdate = true;
    c.instanceMatrix.needsUpdate = true;
    m.computeBoundingSphere();
  };

  useEffect(() => {
    place(0);
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spots, working, base, count]);
  useFrame(({ clock }) => {
    if (!working) return;
    place(clock.elapsedTime);
    invalidate();
  });
  if (count === 0) return null;
  return (
    <>
      <instancedMesh ref={ref} args={[workerTemplate(), mat, count]} />
      <instancedMesh ref={carry} args={[carryTemplate(), mat, count]} />
    </>
  );
}

// ------------------------------------------------------------------ bụi công trường

let dustGeo: THREE.BufferGeometry | null = null;
function dustTemplate(): THREE.BufferGeometry {
  if (dustGeo) return dustGeo;
  const b = new Builder();
  b.sphere(0, 0, 0, 1, '#E9DCC0');
  dustGeo = partsGeometry(b.parts, DONE).toGeometry();
  return dustGeo;
}

/** Bụi nhẹ bốc lên ở chỗ làm — chỉ khi có ca thi công đang phát lại. */
function Dust({ pb, base, visual }: { pb: ProcBuilding; base: THREE.Matrix4; visual: Visual }) {
  const N = 8;
  const ref = useRef<THREE.InstancedMesh>(null);
  const mat = useMemo(() => toonMaterial(), []);
  const { invalidate } = useThree();
  const spots = pb.workSpots[visual.stage] ?? [[0, 0, 0] as [number, number, number]];
  useFrame(({ clock }) => {
    const m = ref.current;
    if (!m) return;
    for (let i = 0; i < N; i++) {
      const k = (clock.elapsedTime * 0.7 + i / N) % 1;
      const sp = spots[i % spots.length] ?? [0, 0, 0];
      const ox = Math.sin(i * 12.9898) * 0.18;
      const oz = Math.cos(i * 78.233) * 0.18;
      SCRATCH_V.set(sp[0] + ox + k * 0.08, sp[1] + 0.04 + k * 0.32, sp[2] + oz).applyMatrix4(base);
      SCRATCH_O.position.copy(SCRATCH_V);
      SCRATCH_O.rotation.set(0, 0, 0);
      SCRATCH_O.scale.setScalar(Math.sin(Math.PI * k) * 0.06 + 0.005);
      SCRATCH_O.updateMatrix();
      m.setMatrixAt(i, SCRATCH_O.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
    invalidate();
  });
  return <instancedMesh ref={ref} args={[dustTemplate(), mat, N]} frustumCulled={false} />;
}

// ------------------------------------------------------------------ lớp phủ

/** Cao độ phủ tại đỉnh lưới (i, j): mặt đất, hoặc mặt nước nếu cao hơn. */
function overlayY(f: Field, i: number, j: number): number {
  const k = j * f.n + i;
  const l = f.lvl[k]!;
  return Number.isNaN(l) ? f.h[k]! : Math.max(f.h[k]!, l);
}

/** Tô các ô — tấm phủ bám theo mặt đất (chia theo lưới cao độ). */
function TileQuads({ data, tiles, color, opacity, lift = 0.03, inset = 0.04 }: { data: SceneWorld; tiles: [number, number][]; color: string; opacity: number; lift?: number; inset?: number }) {
  const geo = useMemo(() => {
    const f = data.field;
    const pos: number[] = [];
    for (const [x, y] of tiles) {
      if (!tileAt(data.terrain, x, y)) continue;
      for (let sj = 0; sj < SUB; sj++) {
        for (let si = 0; si < SUB; si++) {
          const i = x * SUB + si;
          const j = y * SUB + sj;
          const x0 = vx(f, i) + (si === 0 ? inset : 0);
          const x1 = vx(f, i + 1) - (si === SUB - 1 ? inset : 0);
          const z0 = vx(f, j) + (sj === 0 ? inset : 0);
          const z1 = vx(f, j + 1) - (sj === SUB - 1 ? inset : 0);
          const a = overlayY(f, i, j) + lift;
          const b = overlayY(f, i + 1, j) + lift;
          const c = overlayY(f, i + 1, j + 1) + lift;
          const d = overlayY(f, i, j + 1) + lift;
          pos.push(x0, a, z0, x0, d, z1, x1, c, z1, x0, a, z0, x1, c, z1, x1, b, z0);
        }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    return g;
  }, [data.terrain, data.field, tiles, lift, inset]);
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <mesh geometry={geo} renderOrder={5}>
      <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
}

/** Viền khu đất (xem trước khi đặt): đường khép kín bám mặt đất, luôn nổi trên cùng. */
function TileOutline({ data, x, y, w, d, color }: { data: SceneWorld; x: number; y: number; w: number; d: number; color: string }) {
  const geo = useMemo(() => {
    const f = data.field;
    const pts: number[] = [];
    const i0 = Math.max(0, x * SUB);
    const j0 = Math.max(0, y * SUB);
    const i1 = Math.min(f.n - 1, (x + w) * SUB);
    const j1 = Math.min(f.n - 1, (y + d) * SUB);
    const seg = (ia: number, ja: number, ib: number, jb: number) => {
      pts.push(vx(f, ia), overlayY(f, ia, ja) + 0.07, vx(f, ja), vx(f, ib), overlayY(f, ib, jb) + 0.07, vx(f, jb));
    };
    for (let i = i0; i < i1; i++) {
      seg(i, j0, i + 1, j0);
      seg(i, j1, i + 1, j1);
    }
    for (let j = j0; j < j1; j++) {
      seg(i0, j, i0, j + 1);
      seg(i1, j, i1, j + 1);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, [data.field, x, y, w, d]);
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <lineSegments geometry={geo} renderOrder={7}>
      <lineBasicMaterial color={color} transparent opacity={0.95} depthWrite={false} depthTest={false} />
    </lineSegments>
  );
}

function Grid({ data }: { data: SceneWorld }) {
  const geo = useMemo(() => {
    const f = data.field;
    const pos: number[] = [];
    const seg = (ia: number, ja: number, ib: number, jb: number) => {
      pos.push(vx(f, ia), overlayY(f, ia, ja) + 0.025, vx(f, ja), vx(f, ib), overlayY(f, ib, jb) + 0.025, vx(f, jb));
    };
    for (const r of new Set(data.regions)) {
      const b = regionBounds(r);
      for (let y = b.y0; y <= b.y1 + 1; y++) {
        for (let x = b.x0; x <= b.x1; x++) for (let k = 0; k < SUB; k++) seg(x * SUB + k, y * SUB, x * SUB + k + 1, y * SUB);
      }
      for (let x = b.x0; x <= b.x1 + 1; x++) {
        for (let y = b.y0; y <= b.y1; y++) for (let k = 0; k < SUB; k++) seg(x * SUB, y * SUB + k, x * SUB, y * SUB + k + 1);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    return g;
  }, [data.field, data.regions]);
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <lineSegments geometry={geo} renderOrder={4}>
      <lineBasicMaterial color="#FFFFFF" transparent opacity={0.3} depthWrite={false} />
    </lineSegments>
  );
}

function ZoneLayer({ data }: { data: SceneWorld }) {
  const byZone = useMemo(() => {
    const m: Partial<Record<ZoneKind, [number, number][]>> = {};
    for (const [k, z] of Object.entries(data.zones)) {
      const [x, y] = k.split(',').map(Number) as [number, number];
      (m[z] ??= []).push([x, y]);
    }
    return m;
  }, [data.zones]);
  return (
    <>
      {(Object.keys(byZone) as ZoneKind[]).map((z) => (
        <TileQuads key={z} data={data} tiles={byZone[z]!} color={ZONE_INFO[z].color} opacity={0.42} inset={0.02} />
      ))}
    </>
  );
}

function RegionLayer({ data, hints }: { data: SceneWorld; hints: Record<number, 'can' | 'cannot'> }) {
  const lists = useMemo(() => {
    const can: [number, number][] = [];
    const cannot: [number, number][] = [];
    for (const [id, h] of Object.entries(hints)) {
      const b = regionBounds(Number(id));
      for (let y = b.y0; y <= b.y1; y++) for (let x = b.x0; x <= b.x1; x++) (h === 'can' ? can : cannot).push([x, y]);
    }
    return { can, cannot };
  }, [hints]);
  return (
    <>
      <TileQuads data={data} tiles={lists.can} color="#7CF0A8" opacity={0.35} inset={0} />
      <TileQuads data={data} tiles={lists.cannot} color="#6B7280" opacity={0.28} inset={0} />
    </>
  );
}

function PreviewLayer({ data, preview }: { data: SceneWorld; preview: Preview }) {
  const pb = useMemo(() => buildingOf({ type: preview.type, seed: preview.seed }), [preview.type, preview.seed]);
  const base = useMemo(() => siteMatrix(data.terrain, data.works, preview), [data.terrain, data.works, preview]);
  // Hình bóng dựng MỘT lần cho mỗi (loại, seed) tại gốc toạ độ; rê chuột chỉ đổi ma trận.
  const ghost = useMemo(() => partsGeometry(visibleParts(pb, DONE), DONE).toGeometry(), [pb]);
  const mat = useMemo(() => toonMaterial({ transparent: true, opacity: 0.55 }), []);
  useEffect(() => () => ghost.dispose(), [ghost]);
  const ok = preview.check.ok;
  const bad = preview.check.ok ? [] : preview.check.bad;
  const good = preview.check.tiles.filter(([x, y]) => !bad.some(([bx, by]) => bx === x && by === y));
  const item = catalogItem(preview.type)!;
  const [w, d] = footprint(item.size, preview.rot);
  return (
    <>
      <mesh geometry={ghost} material={mat} renderOrder={6} matrix={base} matrixAutoUpdate={false} />
      <TileQuads data={data} tiles={good} color={ok ? '#7CF0A8' : '#FFC86B'} opacity={0.55} lift={0.05} inset={0.02} />
      {bad.length ? <TileQuads data={data} tiles={bad} color="#FF5A4A" opacity={0.62} lift={0.06} inset={0.02} /> : null}
      {preview.entrance ? <TileQuads data={data} tiles={[preview.entrance]} color="#FFD23F" opacity={0.8} lift={0.06} inset={0.12} /> : null}
      <TileOutline data={data} x={preview.x} y={preview.y} w={w} d={d} color={ok ? '#12804A' : '#C8402F'} />
    </>
  );
}

// ------------------------------------------------------------------ lưới chọn ô

/**
 * Lưới ẨN dùng để bắt chuột: mỗi ô 2 tam giác theo cao độ góc ô (mặt đất hoặc
 * mặt nước) — 3.200 tam giác thay vì raycast cả địa hình chi tiết + nước (hơn
 * 60.000). Không vẽ (material.visible = false) nhưng vẫn nhận tia chọn.
 */
function PickMesh({ data, handlers }: { data: SceneWorld; handlers: Record<string, unknown> }) {
  const geo = useMemo(() => {
    const f = data.field;
    const n = data.terrain.size;
    const pos: number[] = [];
    const y = (i: number, j: number) => overlayY(f, i * SUB, j * SUB);
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        const x0 = vx(f, i * SUB);
        const x1 = vx(f, (i + 1) * SUB);
        const z0 = vx(f, j * SUB);
        const z1 = vx(f, (j + 1) * SUB);
        const a = y(i, j);
        const b = y(i + 1, j);
        const c = y(i + 1, j + 1);
        const d = y(i, j + 1);
        pos.push(x0, a, z0, x0, d, z1, x1, c, z1, x0, a, z0, x1, c, z1, x1, b, z0);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.computeBoundingSphere();
    return g;
  }, [data.field, data.terrain.size]);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide }), []);
  useEffect(() => () => geo.dispose(), [geo]);
  return <mesh geometry={geo} material={mat} {...handlers} />;
}

// ------------------------------------------------------------------ gốc

/** Khu đất đã đặt công trình → san nền (bến thuyền đứng trên nước thì không). */
function pinsOf(data: SceneData): Pin[] {
  const out: Pin[] = [];
  for (const s of data.sites) {
    const it = catalogItem(s.type);
    if (!it || it.place.on === 'waterfront') continue;
    const [w, d] = footprint(it.size, s.rot);
    out.push({ x: s.x, y: s.y, w, d, h: topY(data.terrain, data.works, s.x, s.y) });
  }
  return out;
}

function Scene(props: SceneProps) {
  const pinKey = JSON.stringify(pinsOf(props.data));
  const field = useMemo(() => buildField(props.data.terrain, props.data.works, JSON.parse(pinKey) as Pin[]), [props.data.terrain, props.data.works, pinKey]);
  const data = useMemo<SceneWorld>(() => ({ ...props.data, field }), [props.data, field]);
  const placeSite = useCallback((s: Site) => siteMatrix(props.data.terrain, props.data.works, s), [props.data.terrain, props.data.works]);
  const { invalidate } = useThree();
  const followRef = useRef<[number, number] | null>(null);
  const down = useRef<{ x: number; y: number } | null>(null);
  const painting = useRef(false);
  const last = useRef<string>('');

  useEffect(() => {
    invalidate();
  });

  // ?perf=1 → mở renderer / cảnh / camera cho đo đạc (renderer.info: lệnh vẽ, tam giác).
  const three = useThree();
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('perf=1')) {
      const tileToScreen = (x: number, y: number) => {
        const v = new THREE.Vector3(x - data.terrain.size / 2 + 0.5, topY(data.terrain, data.works, x, y), y - data.terrain.size / 2 + 0.5).project(three.camera);
        const r = three.gl.domElement.getBoundingClientRect();
        return [Math.round(r.left + ((v.x + 1) / 2) * r.width), Math.round(r.top + ((1 - v.y) / 2) * r.height)];
      };
      const worldToScreen = (x: number, y: number, z: number) => {
        const v = new THREE.Vector3(x, y, z).project(three.camera);
        const r = three.gl.domElement.getBoundingClientRect();
        return [Math.round(r.left + ((v.x + 1) / 2) * r.width), Math.round(r.top + ((1 - v.y) / 2) * r.height)];
      };
      (window as unknown as { __city?: unknown }).__city = { gl: three.gl, scene: three.scene, camera: () => three.camera, invalidate: three.invalidate, tileToScreen, worldToScreen };
    }
  }, [three, data]);

  useEffect(() => {
    const up = () => {
      painting.current = false;
    };
    window.addEventListener('pointerup', up);
    return () => window.removeEventListener('pointerup', up);
  }, []);

  const tileFrom = (e: ThreeEvent<PointerEvent | MouseEvent>): [number, number] | null => {
    const p = e.point.clone().addScaledVector(e.ray.direction, 0.02);
    const [x, y] = tileOf(data.terrain, p.x, p.z);
    return tileAt(data.terrain, x, y) ? [x, y] : null;
  };

  const handlers = props.interactive
    ? {
        ...(props.trackHover === false ? {} : { onPointerMove: (e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          const t = tileFrom(e);
          props.onHover(t);
          if (t && painting.current && props.paintMode) {
            const k = `${t[0]},${t[1]}`;
            if (k !== last.current) {
              last.current = k;
              props.onTileDrag(t);
            }
          }
        }, onPointerOut: () => props.onHover(null) }),
        onPointerDown: (e: ThreeEvent<PointerEvent>) => {
          if (e.button !== 0) return;
          e.stopPropagation();
          down.current = { x: e.clientX, y: e.clientY };
          const t = tileFrom(e);
          if (t && props.paintMode) {
            painting.current = true;
            last.current = `${t[0]},${t[1]}`;
            props.onTileDown(t);
          }
        },
        onClick: (e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          const d = down.current;
          if (d && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 5) return;
          if (props.paintMode) return;
          // Bấm trúng thân công trình (kể cả tầng cao của cao ốc, nằm trước mặt đất) → ô của công trình đó.
          const site = siteUnderRay(e.ray, e.distance);
          if (site) {
            props.onTileClick([site.x, site.y]);
            return;
          }
          const t = tileFrom(e);
          if (t) props.onTileClick(t);
        },
      }
    : {};

  /*
    Chọn công trình bằng HỘP BAO của từng khu đất (vài chục hộp) thay vì để
    R3F dò tia qua cả khối nhà gộp (hàng trăm nghìn tam giác) mỗi lần nhấn / thả
    chuột — cú dò đó làm giật đầu và cuối mỗi lần kéo bản đồ.
  */
  const boxes = useMemo(
    () =>
      data.sites.map((site) => {
        const it = catalogItem(site.type)!;
        const [w, d] = footprint(it.size, site.rot);
        const x0 = site.x - data.terrain.size / 2;
        const z0 = site.y - data.terrain.size / 2;
        const y0 = topY(data.terrain, data.works, site.x, site.y);
        const h = Math.max(0.3, buildingOf(site).height);
        return { site, box: new THREE.Box3(new THREE.Vector3(x0, y0 - 0.05, z0), new THREE.Vector3(x0 + w, y0 + h, z0 + d)) };
      }),
    [data.sites, data.terrain, data.works],
  );
  const hitPoint = useMemo(() => new THREE.Vector3(), []);
  const siteUnderRay = (ray: THREE.Ray, groundDistance: number): Site | null => {
    let best: Site | null = null;
    let bestD = groundDistance + 1e-3;
    for (const { site, box } of boxes) {
      if (!ray.intersectBox(box, hitPoint)) continue;
      const dist = hitPoint.distanceTo(ray.origin);
      if (dist < bestD) {
        bestD = dist;
        best = site;
      }
    }
    return best;
  };

  // Công trình đang phát lại tiến độ vẫn vẽ riêng tới khi xong hoạt cảnh, kể cả khi đã hoàn thành.
  const building = data.sites.filter((s) => !isDone(s) || props.replay[s.id]);
  const playing = useMemo(() => new Set(Object.keys(props.replay)), [props.replay]);

  return (
    <>
      <CameraRig size={data.terrain.size} rot={props.rot} interactive={props.interactive} autoSpin={props.autoSpin} reducedMotion={props.reducedMotion} paintMode={props.paintMode} onApi={props.onCameraApi} onChange={props.onCameraChange} focus={props.focus ?? cityFocus(data)} followRef={followRef} />
      <ShadowController />
      <hemisphereLight args={['#EAF4FF', '#8FB86A', 1.15]} />
      <directionalLight
        position={[18, 30, 12]}
        intensity={1.5}
        color="#FFF1D6"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-camera-near={1}
        shadow-camera-far={90}
        shadow-bias={-0.0006}
        shadow-normalBias={0.03}
      />
      {/* Chỉ nền + nước nhận di chuột (rẻ để raycast); công trình chỉ nhận cú bấm. */}
      <Terrain3D data={data} />
      <Water data={data} reducedMotion={props.reducedMotion} />
      <PickMesh data={data} handlers={handlers} />
      <Roads data={data} />
      <group>
        <StaticCity data={data} selected={props.selectedSite} skip={playing} />
        {building.map((s) => (
          <SiteMesh key={s.id} data={data} site={s} frames={props.replay[s.id]} onDone={props.onReplayDone} selected={props.selectedSite === s.id} />
        ))}
      </group>
      <Nature data={data} />
      <DecorLayer sites={data.sites} era={data.era ?? 5} place={placeSite} />
      {props.showGrid ? <Grid data={data} /> : null}
      {props.showZones ? <ZoneLayer data={data} /> : null}
      {props.regionHints ? <RegionLayer data={data} hints={props.regionHints} /> : null}
      {props.preview ? <PreviewLayer data={data} preview={props.preview} /> : null}
      {props.walk ? <WalkLayer data={data} walk={props.walk} rot={props.rot} followRef={followRef} /> : null}
      {props.hover && !props.preview ? <TileQuads data={data} tiles={[props.hover]} color="#FFFFFF" opacity={0.35} lift={0.05} /> : null}
    </>
  );
}

export function CityCanvas(props: SceneProps) {
  // Tuỳ chọn camera cố định từ lần đầu: R3F so sánh prop mỗi lần render, đổi
  // object là đặt lại vị trí camera — phá mất chỗ người dùng đang nhìn.
  const [camera] = useState(() => ({ zoom: props.zoom, near: -200, far: 400, position: [40, 40, 40] as [number, number, number] }));
  return (
    <Canvas
      frameloop="demand"
      orthographic
      camera={camera}
      shadows
      dpr={[1, MAX_DPR]}
      gl={{ antialias: true, alpha: true }}
      style={{ position: 'absolute', inset: 0 }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <Scene {...props} />
    </Canvas>
  );
}

