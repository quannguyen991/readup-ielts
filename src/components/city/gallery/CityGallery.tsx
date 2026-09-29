/**
 * /quest/city/gallery — trang soát hình cho NHÀ PHÁT TRIỂN (chỉ `__DEV__`).
 *
 * Xem mọi công trình sinh bằng code ở mọi trạng thái: đủ công đoạn, tường lên
 * từng hàng / mái lắp từng phần, cao ốc từng tầng từng bước (có cần cẩu), 20
 * seed của một loại, 4 họ cao ốc, toàn bộ catalog, ba địa hình. Xoay 90° để
 * soát mặt sau / mặt bên. Mỗi ô ghi số bộ phận, số tam giác và cảnh báo nếu có
 * bộ phận tràn ra ngoài khu đất.
 */
import React, { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { MapControls } from 'three/examples/jsm/controls/MapControls.js';

import { CATALOG, catalogItem, isTower } from '@/data/city/catalog';
import { floorsFor, STAGES } from '@/services/city/construction';
import { generateBuilding } from '@/services/city/procgen/buildings';
import { bounds, DONE, visibleParts, type ProcBuilding, type Visual } from '@/services/city/procgen/parts';
import { generateTerrain, REGIONS_PER_SIDE } from '@/services/city/terrain';
import { groundMaterial, partsGeometry, toonMaterial, Writer } from '../scene/geometry';
import { CraneModel, DecorLayer } from '../scene/CityScene';
import { loadDecor } from '../scene/decor';
import { DECOR_MODELS, type DecorModel } from '@/data/city/decor-map';
import { CREDITS } from '@/data/city/credits';
import type { Site } from '@/services/city/construction';
import { buildField } from '../scene/surface';
import { terrainGeometry, waterGeometry, waterMaterial } from '../scene/world';
import { CG, useCityCss } from '../ui/theme';

const GALLERY_CAMERA = { near: -300, far: 600, position: [40, 40, 40] as [number, number, number] };

type Mode = 'stages' | 'fractions' | 'floors' | 'seeds' | 'towers' | 'catalog' | 'terrain' | 'assets';
type Item = { type: string; seed: number; v: Visual; x: number; z: number; label: string; crane?: boolean };

const MODES: { id: Mode; label: string }[] = [
  { id: 'stages', label: 'Công đoạn' },
  { id: 'fractions', label: 'Tường / mái từng phần' },
  { id: 'floors', label: 'Cao ốc từng tầng' },
  { id: 'seeds', label: '20 seed' },
  { id: 'towers', label: '4 họ cao ốc' },
  { id: 'catalog', label: 'Toàn catalog' },
  { id: 'terrain', label: 'Ba địa hình' },
  { id: 'assets', label: 'Tài nguyên tải về' },
];

const V = (stage: number, fraction = 1, extra: Partial<Visual> = {}): Visual => ({ stage, fraction, delivered: true, floorsDone: 0, floorStep: 0, craneUp: false, ...extra });

function layout(mode: Mode, type: string, seed: number): Item[] {
  const item = catalogItem(type)!;
  const gap = Math.max(item.size[0], item.size[1]) + 1.6;
  const floors = item.floors ? floorsFor(item, seed) : 0;
  const row = (list: Omit<Item, 'x' | 'z'>[], perRow = list.length, g = gap): Item[] =>
    list.map((it, i) => ({ ...it, x: (i % perRow) * g - ((Math.min(perRow, list.length) - 1) * g) / 2, z: Math.floor(i / perRow) * (g + 1) }));
  switch (mode) {
    case 'stages': {
      const list: Omit<Item, 'x' | 'z'>[] = item.stages.map((st) => {
        const tower = isTower(item) && st === 4;
        const v = V(st, 0.6, tower ? { craneUp: true, floorsDone: Math.floor(floors / 2), floorStep: 2 } : {});
        return { type, seed, v, label: `${st} · ${STAGES[st]!.vi}`, crane: tower };
      });
      list.push({ type, seed, v: DONE, label: 'Hoàn thành' });
      return row(list, 5);
    }
    case 'fractions': {
      const list: Omit<Item, 'x' | 'z'>[] = [];
      for (const f of [0.2, 0.4, 0.6, 0.8, 1]) list.push({ type, seed, v: V(5, f), label: `Tường ${Math.round(f * 100)}%` });
      for (const f of [0.35, 0.65, 0.85, 1]) list.push({ type, seed, v: V(6, f), label: `Mái ${Math.round(f * 100)}%` });
      return row(list, 5);
    }
    case 'floors': {
      const t = isTower(item) ? type : 'tower_office';
      const ti = catalogItem(t)!;
      const fl = floorsFor(ti, seed);
      const list: Omit<Item, 'x' | 'z'>[] = [{ type: t, seed, v: V(4, 1, { craneUp: true, floorsDone: 0, floorStep: 0 }), label: 'Cần cẩu dựng xong', crane: true }];
      for (let s = 0; s < 4; s++) list.push({ type: t, seed, v: V(4, 0, { craneUp: true, floorsDone: 3, floorStep: s }), label: `Tầng 4 · bước ${['khung', 'sàn', 'mặt dựng', 'mép sàn'][s]}`, crane: true });
      for (const k of [0.5, 0.8, 1]) list.push({ type: t, seed, v: V(4, 0, { craneUp: true, floorsDone: Math.round(fl * k), floorStep: 0 }), label: `Tầng ${Math.round(fl * k)}/${fl}`, crane: true });
      list.push({ type: t, seed, v: V(6, 1), label: 'Cất nóc' });
      list.push({ type: t, seed, v: DONE, label: 'Hoàn thành' });
      return row(list, 5, 5.2);
    }
    case 'seeds':
      return row(
        Array.from({ length: 20 }, (_, i) => ({ type, seed: (i + 1) * 7919, v: DONE, label: `seed ${(i + 1) * 7919}` })),
        5,
      );
    case 'towers': {
      const list: Omit<Item, 'x' | 'z'>[] = [];
      for (const t of ['tower_office', 'tower_glass', 'tower_twin', 'tower_observation'])
        for (let i = 0; i < 5; i++) list.push({ type: t, seed: 101 + i * 977, v: DONE, label: `${catalogItem(t)!.vi} · ${101 + i * 977}` });
      return row(list, 5, 5.4);
    }
    case 'catalog':
      return row(
        CATALOG.map((c) => ({ type: c.id, seed, v: DONE, label: c.vi })),
        6,
        5,
      );
    default:
      return [];
  }
}

/** Kiểm nhanh: bộ phận vượt khỏi khu đất (sai số 0.05; mái hiên được chừa 0.25). */
function overflow(pb: ProcBuilding): number {
  const [w, d] = pb.size;
  let n = 0;
  for (const p of pb.parts) {
    if (p.until !== undefined && p.until <= 4) continue; // vật dụng công trường tạm
    const b = bounds(p);
    if (b.min[0] < -w / 2 - 0.3 || b.max[0] > w / 2 + 0.3 || b.min[2] < -d / 2 - 0.3 || b.max[2] > d / 2 + 0.3) n++;
  }
  return n;
}

type Built = { geo: THREE.BufferGeometry | null; stats: { parts: number; tris: number; over: number }[]; bases: THREE.Matrix4[] };

function buildGallery(items: Item[], rot: number): Built {
  const w = new Writer();
  const stats: Built['stats'] = [];
  const bases: THREE.Matrix4[] = [];
  for (const it of items) {
    const pb = generateBuilding(it.type, it.seed, catalogItem(it.type)!.era);
    const base = new THREE.Matrix4().makeRotationY((rot * Math.PI) / 2).setPosition(it.x, 0, it.z);
    bases.push(base);
    const before = w.pos.length;
    const parts = visibleParts(pb, it.v);
    partsGeometry(parts, it.v, base, w);
    stats.push({ parts: parts.length, tris: (w.pos.length - before) / 9, over: overflow(pb) });
  }
  return { geo: w.empty ? null : w.toGeometry(), stats, bases };
}

function GalleryMeshes({ items, built }: { items: Item[]; built: Built }) {
  const { invalidate } = useThree();
  const mat = useMemo(() => toonMaterial(), []);
  // Công trình hoàn thành: gắn đồ trang trí tải về như trong thành phố.
  const doneSites = useMemo<Site[]>(
    () =>
      items.flatMap((it, i) => {
        if (it.v.stage < 9) return [];
        const c = catalogItem(it.type)!;
        return [{ id: String(i), type: it.type, seed: it.seed, x: 0, y: 0, rot: 0, stageIdx: c.stages.length, shifts: 0, delivered: true, startedAt: '', crew: null, createdAt: '' } as Site];
      }),
    [items],
  );
  const place = React.useCallback((s: Site) => built.bases[Number(s.id)]!, [built]);
  React.useEffect(() => {
    invalidate();
    return () => built.geo?.dispose();
  }, [built, invalidate]);
  return (
    <>
      {built.geo ? <mesh geometry={built.geo} material={mat} castShadow receiveShadow /> : null}
      <DecorLayer sites={doneSites} era={5} place={place} />
      {items.map((it, i) => {
        const pb = generateBuilding(it.type, it.seed, catalogItem(it.type)!.era);
        return it.crane && pb.tower && it.v.stage >= 4 && it.v.stage < 8 ? (
          <CraneModel key={i} pb={pb} base={built.bases[i]!} floorsDone={it.v.stage > 4 ? pb.tower.floors : it.v.floorsDone} working={false} />
        ) : null;
      })}
    </>
  );
}

/** Nhãn DOM nằm ngoài canvas; mỗi khung hình chiếu điểm neo 3D ra màn hình (không tạo root React riêng). */
function LabelTracker({ anchors, els }: { anchors: [number, number, number][]; els: React.RefObject<(HTMLDivElement | null)[]> }) {
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera, size }) => {
    const list = els.current;
    if (!list) return;
    anchors.forEach((a, i) => {
      const el = list[i];
      if (!el) return;
      v.set(a[0], a[1], a[2]).project(camera);
      el.style.transform = `translate(-50%, -50%) translate(${((v.x + 1) / 2) * size.width}px, ${((1 - v.y) / 2) * size.height}px)`;
      el.style.visibility = 'visible';
    });
  });
  return null;
}

/** Hàng model tải về (sau khi chuyển bảng màu), phóng to ×2.5 để soát. */
function AssetRow({ rot }: { rot: number }) {
  const [geos, setGeos] = useState<Partial<Record<DecorModel, THREE.BufferGeometry>>>({});
  const { invalidate } = useThree();
  const mat = useMemo(() => toonMaterial(), []);
  React.useEffect(() => {
    let alive = true;
    Promise.all(DECOR_MODELS.map((m) => loadDecor(m).then((g) => [m, g] as const))).then((list) => {
      if (!alive) return;
      setGeos(Object.fromEntries(list));
      invalidate();
    });
    return () => {
      alive = false;
    };
  }, [invalidate]);
  return (
    <>
      {DECOR_MODELS.map((m, i) =>
        geos[m] ? <mesh key={m} geometry={geos[m]} material={mat} position={[assetX(i), 0, assetZ(i)]} rotation={[0, (rot * Math.PI) / 2, 0]} scale={3} castShadow receiveShadow /> : null,
      )}
    </>
  );
}

const assetX = (i: number) => ((i % 5) - 2) * 3.4;
const assetZ = (i: number) => (Math.floor(i / 5) - 1) * 5.2;

function Terrains({ rot }: { rot: number }) {
  const parts = useMemo(() => {
    const regions = Array.from({ length: REGIONS_PER_SIDE * REGIONS_PER_SIDE }, (_, i) => i);
    return (['plains', 'coast', 'mountain'] as const).map((k, i) => {
      const t = generateTerrain(k, 4242 + i);
      const f = buildField(t, {});
      return { k, terrain: terrainGeometry(t, {}, regions, f), water: waterGeometry(t, f), x: (i - 1) * 46 };
    });
  }, []);
  const gm = useMemo(() => groundMaterial(), []);
  const wm = useMemo(() => waterMaterial(), []);
  return (
    <>
      {parts.map((p) => (
        <group key={p.k} position={[p.x, 0, 0]} rotation={[0, (rot * Math.PI) / 2, 0]}>
          <mesh geometry={p.terrain} material={gm} receiveShadow castShadow />
          <mesh geometry={p.water} material={wm} />
        </group>
      ))}
    </>
  );
}

/** Camera trực giao 35°/45° + MapControls của three (không dùng drei). */
function GalleryCamera({ zoom }: { zoom: number }) {
  const get = useThree((s) => s.get);
  useEffect(() => {
    const { camera, gl, invalidate } = get();
    const c = camera as THREE.OrthographicCamera;
    const a = Math.PI / 4;
    const e = (35 * Math.PI) / 180;
    c.position.set(Math.sin(a) * Math.cos(e) * 80, Math.sin(e) * 80, Math.cos(a) * Math.cos(e) * 80);
    c.lookAt(0, 0, 0);
    c.zoom = zoom;
    c.updateProjectionMatrix();
    const k = new MapControls(c, gl.domElement);
    k.enableRotate = false;
    k.target.set(0, 0, 0);
    k.update();
    k.addEventListener('change', () => invalidate());
    invalidate();
    return () => k.dispose();
  }, [zoom, get]);
  return null;
}

export default function CityGallery() {
  useCityCss();
  const [mode, setMode] = useState<Mode>('stages');
  const [type, setType] = useState('house_brick');
  const [seed, setSeed] = useState(7919);
  const [rot, setRot] = useState(0);
  const items = useMemo(() => {
    if (mode === 'terrain') return [];
    const raw = layout(mode, type, seed);
    // Căn giữa theo z để camera nhìn vào tâm bố cục.
    const zs = raw.map((it) => it.z);
    const zc = (Math.min(...zs) + Math.max(...zs)) / 2;
    return raw.map((it) => ({ ...it, z: it.z - zc }));
  }, [mode, type, seed]);
  const built = useMemo(() => buildGallery(items, rot), [items, rot]);
  const labelEls = React.useRef<(HTMLDivElement | null)[]>([]);
  const anchors = useMemo<[number, number, number][]>(
    () =>
      items.map((it) => {
        const pb = generateBuilding(it.type, it.seed, catalogItem(it.type)!.era);
        return [it.x, 0, it.z + Math.max(pb.size[0], pb.size[1]) / 2 + 0.55];
      }),
    [items],
  );
  const assetAnchors = useMemo<[number, number, number][]>(() => DECOR_MODELS.map((_, i) => [assetX(i), 0, assetZ(i) + 1.6]), []);
  const extent = useMemo(() => {
    if (mode === 'terrain') return 150;
    if (mode === 'assets') return 19;
    const xs = items.map((it) => Math.abs(it.x));
    const zs = items.map((it) => Math.abs(it.z));
    return (Math.max(4, ...xs) + Math.max(4, ...zs)) * 2 + 6;
  }, [items, mode]);
  const W = typeof window !== 'undefined' ? window.innerWidth - 260 : 1200;
  const H = typeof window !== 'undefined' ? window.innerHeight - 180 : 700;
  const zoom = Math.min(W / (extent * 0.74), H / (extent * 0.44 + 10));

  return (
    <div className="cg-root" style={{ position: 'relative', flex: 1, width: '100%', height: '100%', minHeight: 600 }}>
      <Canvas frameloop="demand" orthographic camera={GALLERY_CAMERA} shadows dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }} style={{ position: 'absolute', inset: 0 }}>
        <GalleryCamera zoom={zoom} />
        <hemisphereLight args={['#EAF4FF', '#8FB86A', 1.15]} />
        <directionalLight position={[18, 30, 12]} intensity={1.5} color="#FFF1D6" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-60} shadow-camera-right={60} shadow-camera-top={60} shadow-camera-bottom={-60} shadow-bias={-0.0006} />
        {mode === 'terrain' ? (
          <Terrains rot={rot} />
        ) : mode === 'assets' ? (
          <>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
              <planeGeometry args={[40, 40]} />
              <meshLambertMaterial color="#9CC96A" />
            </mesh>
            <AssetRow rot={rot} />
            <LabelTracker anchors={assetAnchors} els={labelEls} />
          </>
        ) : (
          <>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
              <planeGeometry args={[extent * 1.2, extent * 1.2]} />
              <meshLambertMaterial color="#9CC96A" />
            </mesh>
            <GalleryMeshes items={items} built={built} />
            <LabelTracker anchors={anchors} els={labelEls} />
          </>
        )}
      </Canvas>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {mode === 'assets'
          ? DECOR_MODELS.map((m, i) => (
              <div
                key={`a-${m}`}
                ref={(el) => {
                  labelEls.current[i] = el;
                }}
                style={{ position: 'absolute', left: 0, top: 0, visibility: 'hidden', font: `600 14px/1.3 ${CG.font}`, color: CG.ink, background: 'rgba(255,255,255,.9)', padding: '2px 6px', borderRadius: 8, whiteSpace: 'nowrap' }}
              >
                {CREDITS.find((r) => r.id === m)?.ten ?? m}
              </div>
            ))
          : null}
        {mode !== 'assets' && items.map((it, i) => {
          const st = built.stats[i];
          return (
            <div
              key={`${mode}-${i}`}
              ref={(el) => {
                labelEls.current[i] = el;
              }}
              style={{ position: 'absolute', left: 0, top: 0, visibility: 'hidden', font: `600 14px/1.3 ${CG.font}`, color: CG.ink, background: 'rgba(255,255,255,.9)', padding: '3px 7px', borderRadius: 8, whiteSpace: 'nowrap', textAlign: 'center', boxShadow: '0 2px 6px rgba(0,0,0,.12)' }}
            >
              {it.label}
              <br />
              <span style={{ color: st?.over ? CG.bad : CG.muted, fontWeight: 500 }}>
                {st?.parts} bộ phận · {Math.round(st?.tris ?? 0)} ▲{st?.over ? ` · ⚠ ${st.over} tràn` : ''}
              </span>
            </div>
          );
        })}
      </div>
      {mode === 'assets' ? (
        <div className="cg-panel" style={{ position: 'absolute', left: 16, right: 16, bottom: 16, padding: 10, display: 'flex', gap: 8, overflowX: 'auto', zIndex: 10 }}>
          <strong style={{ fontSize: 14, alignSelf: 'center', whiteSpace: 'nowrap', marginRight: 4 }}>Ảnh gốc Poly Haven (trước) →</strong>
          {DECOR_MODELS.map((m) => (
            <figure key={m} style={{ margin: 0, textAlign: 'center', fontSize: 14, color: CG.muted, flex: 'none' }}>
              <img src={`https://cdn.polyhaven.com/asset_img/thumbs/${m}.png?width=120&height=90`} alt="" style={{ display: 'block', width: 72, height: 54, objectFit: 'contain', background: '#EEF2F7', borderRadius: 6 }} />
              {m.replace(/_/g, ' ').slice(0, 12)}
            </figure>
          ))}
        </div>
      ) : null}
      <div className="cg-panel" style={{ position: 'absolute', left: 16, top: 16, right: 16, padding: 12, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', zIndex: 10 }}>
        <strong className="cg-x" style={{ fontSize: 17, marginRight: 6 }}>🛠️ Gallery công trình (dev)</strong>
        {MODES.map((m) => (
          <button key={m.id} className={`cg-tab${mode === m.id ? ' on' : ''}`} onClick={() => setMode(m.id)}>
            {m.label}
          </button>
        ))}
        <span style={{ flex: 1 }} />
        <select value={type} onChange={(e) => setType(e.target.value)} style={{ font: 'inherit', fontSize: 14, padding: '6px 8px', borderRadius: 10, border: `1px solid ${CG.line}` }} aria-label="Loại công trình">
          {CATALOG.map((c) => (
            <option key={c.id} value={c.id}>
              {c.era} · {c.vi}
            </option>
          ))}
        </select>
        <button className="cg-btn small" onClick={() => setSeed((s) => s + 7919)}>
          🎲 seed {seed}
        </button>
        <button className="cg-btn small" onClick={() => setRot((r) => (r + 3) % 4)} aria-label="Xoay trái">
          ⟲
        </button>
        <button className="cg-btn small" onClick={() => setRot((r) => (r + 1) % 4)} aria-label="Xoay phải">
          ⟳ {rot * 90}°
        </button>
      </div>
    </div>
  );
}
