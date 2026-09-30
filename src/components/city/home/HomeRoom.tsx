/**
 * NHÀ CỦA TÔI — phòng 8×8 ô nhìn chéo từ trên xuống (kiểu Play Together), bày
 * nội thất đổi bằng sao. Chế độ `readOnly` dùng khi đi thăm nhà bạn.
 *
 * Cách bày: chọn một món trong túi bên trái → bấm ô sàn để đặt (R xoay).
 * Bấm một món đã đặt để chọn → xoay / cất đi. Luật đặt ở `services/city/life.ts`.
 * Mua thêm ngay tại đây bằng sao (cùng cửa hàng sao, mã `home-<món>`).
 */
import React, { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { Canvas, type ThreeEvent } from '@react-three/fiber';

import { canPlaceFurniture, FURNITURE, furnitureById, furnitureShopId, placedCount, ROOM, type HomeLayout, type Placed } from '@/services/city/life';
import { formatStars } from '@/services/gamification/shop';
import { useCityLifeStore } from '@/store/useCityLifeStore';
import { useRewardStore } from '@/store/useRewardStore';
import { useStarBalance } from '@/store/useStarBalance';
import { useL } from '../ui/common';
import { CG } from '../ui/theme';

const H = ROOM / 2;
const WALL_H = 2.6;

const FLOORS = ['#E7D3B0', '#CFA77A', '#D9E4EC', '#F3D9DC', '#C8D9B8'];
const WALLS = ['#F8EFE2', '#E6F0FA', '#FDF1C7', '#EDE4F7', '#E3F2E9'];

/** Tâm thế giới của một món đặt ở (x, y) với kích thước đã xoay (w, d). */
function centerOf(p: Pick<Placed, 'item' | 'x' | 'y' | 'rot'>): { cx: number; cz: number; w: number; d: number } {
  const f = furnitureById(p.item)!;
  const [w, d] = p.rot === 1 ? [f.size[1], f.size[0]] : f.size;
  return { cx: p.x + w / 2 - H, cz: p.y + d / 2 - H, w, d };
}

function Box({ size, pos, color, opacity }: { size: [number, number, number]; pos: [number, number, number]; color: string; opacity?: number }) {
  return (
    <mesh position={pos} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshLambertMaterial color={color} transparent={opacity !== undefined} opacity={opacity ?? 1} />
    </mesh>
  );
}

/** Hình của từng món — dựng bằng khối đơn giản, cùng tinh thần low-poly của thành phố. */
function FurnitureModel({ item, w, d, fishCount, ghost }: { item: string; w: number; d: number; fishCount: number; ghost?: boolean }) {
  const f = furnitureById(item)!;
  const o = ghost ? 0.55 : undefined;
  const h = f.height;
  const c = f.color;
  const iw = w - 0.12;
  const id = d - 0.12;
  switch (item) {
    case 'bed':
      return (
        <group>
          <Box size={[iw, 0.35, id]} pos={[0, 0.175, 0]} color="#8B5A2B" opacity={o} />
          <Box size={[iw - 0.08, 0.14, id - 0.1]} pos={[0, 0.42, 0.04]} color={c} opacity={o} />
          <Box size={[iw * 0.7, 0.1, 0.35]} pos={[0, 0.54, -id / 2 + 0.3]} color="#FFFFFF" opacity={o} />
          <Box size={[iw, 0.8, 0.1]} pos={[0, 0.4, -id / 2]} color="#6B4423" opacity={o} />
        </group>
      );
    case 'bookshelf':
      return (
        <group>
          <Box size={[iw, h, id * 0.6]} pos={[0, h / 2, -id * 0.2]} color={c} opacity={o} />
          {[0.35, 0.8, 1.25, 1.65].map((y, i) => (
            <Box key={i} size={[iw - 0.12, 0.28, 0.08]} pos={[0, y, -id * 0.2 + id * 0.3]} color={['#EF4444', '#3B82F6', '#10B981', '#F59E0B'][i]!} opacity={o} />
          ))}
        </group>
      );
    case 'lamp':
      return (
        <group>
          <Box size={[0.3, 0.05, 0.3]} pos={[0, 0.025, 0]} color="#334155" opacity={o} />
          <Box size={[0.05, h - 0.3, 0.05]} pos={[0, (h - 0.3) / 2, 0]} color="#334155" opacity={o} />
          <mesh position={[0, h - 0.18, 0]}>
            <coneGeometry args={[0.24, 0.34, 16, 1, true]} />
            <meshBasicMaterial color={c} side={THREE.DoubleSide} transparent={!!ghost} opacity={o ?? 1} />
          </mesh>
        </group>
      );
    case 'plant':
      return (
        <group>
          <Box size={[0.36, 0.34, 0.36]} pos={[0, 0.17, 0]} color="#C2410C" opacity={o} />
          <mesh position={[0, 0.72, 0]} castShadow>
            <icosahedronGeometry args={[0.36, 0]} />
            <meshLambertMaterial color={c} flatShading transparent={!!ghost} opacity={o ?? 1} />
          </mesh>
        </group>
      );
    case 'aquarium':
      return (
        <group>
          <Box size={[iw, 0.5, id]} pos={[0, 0.25, 0]} color="#1F2937" opacity={o} />
          <Box size={[iw, 0.6, id]} pos={[0, 0.8, 0]} color={c} opacity={0.45} />
          {Array.from({ length: Math.min(8, fishCount) }, (_, i) => (
            <mesh key={i} position={[-iw / 2 + 0.2 + ((i * 0.37) % (iw - 0.3)), 0.62 + ((i * 0.13) % 0.35), ((i % 3) - 1) * 0.15]}>
              <sphereGeometry args={[0.05, 8, 6]} />
              <meshBasicMaterial color={['#F97316', '#FACC15', '#F472B6', '#FFFFFF'][i % 4]!} />
            </mesh>
          ))}
        </group>
      );
    case 'terrarium':
      return (
        <group>
          <Box size={[0.8, 0.3, 0.8]} pos={[0, 0.15, 0]} color="#78350F" opacity={o} />
          <Box size={[0.76, 0.55, 0.76]} pos={[0, 0.58, 0]} color={c} opacity={0.4} />
        </group>
      );
    case 'piano':
      return (
        <group>
          <Box size={[iw, h, id * 0.55]} pos={[0, h / 2, -id * 0.22]} color={c} opacity={o} />
          <Box size={[iw, 0.06, id * 0.35]} pos={[0, 0.75, id * 0.2]} color="#F8FAFC" opacity={o} />
          <Box size={[iw, 0.75, 0.08]} pos={[0, 0.375, id * 0.36]} color={c} opacity={o} />
        </group>
      );
    case 'tv':
      return (
        <group>
          <Box size={[iw, 0.45, id * 0.7]} pos={[0, 0.225, 0]} color="#A16207" opacity={o} />
          <Box size={[iw * 0.9, 0.62, 0.06]} pos={[0, 0.8, 0]} color={c} opacity={o} />
          <Box size={[iw * 0.84, 0.54, 0.02]} pos={[0, 0.8, 0.035]} color="#38BDF8" opacity={o} />
        </group>
      );
    case 'globe':
      return (
        <group>
          <Box size={[0.3, 0.5, 0.3]} pos={[0, 0.25, 0]} color="#78350F" opacity={o} />
          <mesh position={[0, 0.72, 0]} castShadow>
            <sphereGeometry args={[0.24, 16, 12]} />
            <meshLambertMaterial color={c} transparent={!!ghost} opacity={o ?? 1} />
          </mesh>
        </group>
      );
    case 'trophy':
      return (
        <group>
          <Box size={[0.8, h, 0.6]} pos={[0, h / 2, 0]} color="#7C2D12" opacity={o} />
          <Box size={[0.66, h - 0.2, 0.4]} pos={[0, h / 2, 0.12]} color="#BAE6FD" opacity={0.4} />
          <mesh position={[0, h * 0.62, 0.05]}>
            <cylinderGeometry args={[0.13, 0.06, 0.24, 12]} />
            <meshLambertMaterial color={c} />
          </mesh>
        </group>
      );
    case 'sofa':
      return (
        <group>
          <Box size={[iw, 0.4, id]} pos={[0, 0.2, 0]} color={c} opacity={o} />
          <Box size={[iw, 0.45, 0.22]} pos={[0, 0.55, -id / 2 + 0.11]} color={c} opacity={o} />
          <Box size={[0.2, 0.3, id]} pos={[-iw / 2 + 0.1, 0.5, 0]} color={c} opacity={o} />
          <Box size={[0.2, 0.3, id]} pos={[iw / 2 - 0.1, 0.5, 0]} color={c} opacity={o} />
        </group>
      );
    case 'desk':
    case 'table':
      return (
        <group>
          <Box size={[iw, 0.07, id]} pos={[0, h, 0]} color={c} opacity={o} />
          {[
            [-1, -1],
            [1, -1],
            [-1, 1],
            [1, 1],
          ].map(([sx, sz], i) => (
            <Box key={i} size={[0.07, h, 0.07]} pos={[(sx! * (iw - 0.12)) / 2, h / 2, (sz! * (id - 0.12)) / 2]} color="#6B4423" opacity={o} />
          ))}
          {item === 'desk' ? <Box size={[0.4, 0.28, 0.05]} pos={[0.2, h + 0.18, -id / 2 + 0.12]} color="#1F2937" opacity={o} /> : null}
        </group>
      );
    case 'chair':
      return (
        <group>
          <Box size={[0.5, 0.08, 0.5]} pos={[0, 0.45, 0]} color={c} opacity={o} />
          <Box size={[0.5, 0.45, 0.08]} pos={[0, 0.7, -0.21]} color={c} opacity={o} />
          <Box size={[0.06, 0.42, 0.06]} pos={[0, 0.21, 0]} color="#64748B" opacity={o} />
        </group>
      );
    case 'rug-round':
      return (
        <mesh position={[0, 0.012, 0]} rotation-x={-Math.PI / 2} receiveShadow>
          <circleGeometry args={[Math.min(w, d) / 2 - 0.08, 32]} />
          <meshLambertMaterial color={c} transparent={!!ghost} opacity={o ?? 1} />
        </mesh>
      );
    case 'rug-long':
      return <Box size={[iw, 0.02, id]} pos={[0, 0.01, 0]} color={c} opacity={o} />;
    default:
      return <Box size={[iw, h, id]} pos={[0, h / 2, 0]} color={c} opacity={o} />;
  }
}

/** Đồ treo tường: tấm phẳng trên bức tường trong (hàng y = 0). */
function WallModel({ item, w, ghost }: { item: string; w: number; ghost?: boolean }) {
  const f = furnitureById(item)!;
  const o = ghost ? 0.55 : undefined;
  return (
    <group position={[0, 1.45, 0.04]}>
      <Box size={[w - 0.3, f.height, 0.06]} pos={[0, 0, 0]} color={item === 'window' ? '#FFFFFF' : '#6B4423'} opacity={o} />
      <Box size={[w - 0.42, f.height - 0.12, 0.02]} pos={[0, 0, 0.035]} color={f.color} opacity={o} />
      {item === 'poster' ? <Box size={[w - 0.8, 0.12, 0.01]} pos={[0, 0.1, 0.05]} color="#1E3A8A" opacity={o} /> : null}
    </group>
  );
}

function PlacedModel({ p, fishCount, selected, ghost, bad }: { p: Pick<Placed, 'item' | 'x' | 'y' | 'rot'>; fishCount: number; selected?: boolean; ghost?: boolean; bad?: boolean }) {
  const f = furnitureById(p.item);
  if (!f) return null;
  const { cx, cz, w, d } = centerOf(p);
  if (f.kind === 'wall') {
    return (
      <group position={[cx, 0, -H]}>
        <WallModel item={p.item} w={w} ghost={ghost} />
        {selected || bad ? <Box size={[w, 0.03, 0.4]} pos={[0, 0.02, 0.2]} color={bad ? CG.bad : CG.brand} opacity={0.5} /> : null}
      </group>
    );
  }
  // Mô hình vẽ theo chiều chưa xoay; xoay 90° thì đổi w/d và quay nhóm.
  const [mw, md] = p.rot === 1 ? [d, w] : [w, d];
  return (
    <group position={[cx, 0, cz]}>
      <group rotation-y={p.rot === 1 ? Math.PI / 2 : 0}>
        <FurnitureModel item={p.item} w={mw} d={md} fishCount={fishCount} ghost={ghost} />
      </group>
      {selected || bad ? <Box size={[w, 0.02, d]} pos={[0, 0.02, 0]} color={bad ? CG.bad : CG.brand} opacity={0.35} /> : null}
    </group>
  );
}

function Room({ layout, fishCount, hover, holding, selected, onTile, onHover, onPick }: { layout: HomeLayout; fishCount: number; hover: [number, number] | null; holding: { item: string; rot: 0 | 1 } | null; selected: string | null; onTile: (t: [number, number]) => void; onHover: (t: [number, number] | null) => void; onPick: (uid: string) => void }) {
  const tileOf = (e: ThreeEvent<PointerEvent | MouseEvent>): [number, number] | null => {
    const x = Math.floor(e.point.x + H);
    const y = Math.floor(e.point.z + H);
    return x >= 0 && y >= 0 && x < ROOM && y < ROOM ? [x, y] : null;
  };
  const grid = useMemo(() => {
    const pts: number[] = [];
    for (let i = 0; i <= ROOM; i++) {
      pts.push(-H, 0.005, i - H, H, 0.005, i - H, i - H, 0.005, -H, i - H, 0.005, H);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);
  const ghost = holding && hover ? { item: holding.item, x: hover[0], y: hover[1], rot: holding.rot } : null;
  const ghostOk = ghost ? canPlaceFurniture(layout, ghost, undefined).ok : false;
  // Đồ sàn xếp theo độ cao sau thảm để thảm luôn nằm dưới.
  const items = [...layout.items].sort((a, b) => (furnitureById(a.item)?.kind === 'rug' ? -1 : 0) - (furnitureById(b.item)?.kind === 'rug' ? -1 : 0));
  return (
    <>
      <hemisphereLight args={['#FFF7ED', '#C7B299', 1.1]} />
      <directionalLight position={[6, 10, 8]} intensity={1.3} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-7} shadow-camera-right={7} shadow-camera-top={7} shadow-camera-bottom={-7} />
      <mesh
        rotation-x={-Math.PI / 2}
        receiveShadow
        onPointerMove={(e) => {
          e.stopPropagation();
          onHover(tileOf(e));
        }}
        onPointerOut={() => onHover(null)}
        onClick={(e) => {
          e.stopPropagation();
          const t = tileOf(e);
          if (t) onTile(t);
        }}
      >
        <planeGeometry args={[ROOM, ROOM]} />
        <meshLambertMaterial color={layout.floor} />
      </mesh>
      <lineSegments geometry={grid}>
        <lineBasicMaterial color="#000000" transparent opacity={holding ? 0.12 : 0.05} />
      </lineSegments>
      {/* Hai bức tường trong + chân tường. */}
      <Box size={[ROOM + 0.2, WALL_H, 0.2]} pos={[0, WALL_H / 2, -H - 0.1]} color={layout.wall} />
      <Box size={[0.2, WALL_H, ROOM + 0.2]} pos={[-H - 0.1, WALL_H / 2, 0]} color={layout.wall} />
      <Box size={[ROOM, 0.14, 0.04]} pos={[0, 0.07, -H + 0.02]} color="#A47148" />
      <Box size={[0.04, 0.14, ROOM]} pos={[-H + 0.02, 0.07, 0]} color="#A47148" />
      {items.map((p) => (
        <group
          key={p.uid}
          onClick={(e) => {
            if (holding) return;
            e.stopPropagation();
            onPick(p.uid);
          }}
        >
          <PlacedModel p={p} fishCount={fishCount} selected={selected === p.uid} />
        </group>
      ))}
      {ghost ? <PlacedModel p={ghost} fishCount={fishCount} ghost bad={!ghostOk} /> : null}
    </>
  );
}

const uid = () => Math.random().toString(36).slice(2, 10);

export function HomeRoom({ onClose, readOnly, layout: visitLayout, title }: { onClose: () => void; readOnly?: boolean; layout?: HomeLayout; title?: string }) {
  const { L } = useL();
  const own = useCityLifeStore((s) => s.home);
  const setHome = useCityLifeStore((s) => s.setHome);
  const collection = useCityLifeStore((s) => s.collection);
  const owned = useRewardStore((s) => s.owned);
  const buy = useRewardStore((s) => s.buy);
  const balance = useStarBalance();
  const layout = readOnly ? visitLayout ?? { items: [], floor: FLOORS[0]!, wall: WALLS[0]! } : own;
  const [holding, setHolding] = useState<{ item: string; rot: 0 | 1; moving?: string } | null>(null);
  const [hover, setHover] = useState<[number, number] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  useEffect(() => {
    if (!note) return;
    const id = setTimeout(() => setNote(null), 3200);
    return () => clearTimeout(id);
  }, [note]);
  const fishCount = Object.entries(collection).filter(([id]) => id.startsWith('fish-')).reduce((a, [, v]) => a + v.n, 0);

  const have = (item: string) => owned[furnitureShopId(item)] ?? 0;
  const free = (item: string) => have(item) - placedCount(own, item);

  const save = (items: Placed[]) => setHome({ ...own, items });

  const onTile = (t: [number, number]) => {
    if (readOnly) return;
    if (!holding) {
      setSelected(null);
      return;
    }
    const base = holding.moving ? own.items.filter((p) => p.uid !== holding.moving) : own.items;
    const next = { item: holding.item, x: t[0], y: t[1], rot: holding.rot };
    const chk = canPlaceFurniture({ ...own, items: base }, next);
    if (!chk.ok) {
      setNote(chk.reason === 'wall_only' ? L({ vi: 'Đồ treo tường chỉ đặt ở hàng sát tường trong.', en: 'Wall items go on the row next to the back wall.' }) : chk.reason === 'outside' ? L({ vi: 'Không vừa trong phòng.', en: "Doesn't fit in the room." }) : L({ vi: 'Chỗ này có đồ rồi.', en: 'Something is already there.' }));
      return;
    }
    save([...base, { uid: holding.moving ?? uid(), ...next }]);
    setNote(null);
    // Còn món cùng loại trong túi thì cầm tiếp để đặt nhanh.
    if (holding.moving || free(holding.item) - 1 <= 0) setHolding(null);
  };

  const sel = own.items.find((p) => p.uid === selected) ?? null;
  const rotateSel = () => {
    if (!sel) return;
    const next = { ...sel, rot: (sel.rot === 1 ? 0 : 1) as 0 | 1 };
    const chk = canPlaceFurniture(own, next, sel.uid);
    if (!chk.ok) return setNote(L({ vi: 'Xoay thì bị vướng — dời chỗ trước đã.', en: 'No room to rotate — move it first.' }));
    save(own.items.map((p) => (p.uid === sel.uid ? next : p)));
  };
  const removeSel = () => {
    if (!sel) return;
    save(own.items.filter((p) => p.uid !== sel.uid));
    setSelected(null);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'escape') {
        e.stopPropagation();
        if (holding) setHolding(null);
        else if (selected) setSelected(null);
        else onClose();
      } else if (k === 'r') {
        if (holding) setHolding({ ...holding, rot: holding.rot === 1 ? 0 : 1 });
        else rotateSel();
      } else if (k === 'delete' || k === 'backspace') removeSel();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  });

  const [camera] = useState(() => ({ zoom: 58, near: -100, far: 200, position: [10, 11, 10] as [number, number, number] }));

  return (
    <div className="cg-modal-bg" style={{ zIndex: 45, background: 'rgba(16,33,63,.5)' }}>
      <div className="cg-panel cg-modal" role="dialog" aria-modal="true" aria-label={title ?? L({ vi: 'Nhà của tôi', en: 'My home' })} style={{ width: 'min(1100px, calc(100% - 32px))', height: 'min(720px, calc(100% - 32px))', maxHeight: 'none', padding: 0, overflow: 'hidden', flexDirection: 'row' }}>
        {readOnly ? null : (
          <aside className="cg-scroll" style={{ width: 290, flex: 'none', padding: 16, borderRight: `1px solid ${CG.line}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <strong className="cg-x" style={{ fontSize: 18 }}>🛋️ {L({ vi: 'Nội thất', en: 'Furniture' })}</strong>
            <span className="cg-muted" style={{ fontSize: 14 }}>
              {L({ vi: `Bạn có ${formatStars(balance)} sao. Chọn món rồi bấm lên sàn để đặt · R xoay · Esc thôi.`, en: `You have ${formatStars(balance)} stars. Pick an item, then click the floor · R rotates · Esc cancels.` })}
            </span>
            {FURNITURE.map((f) => {
              const n = free(f.id);
              const on = holding?.item === f.id && !holding.moving;
              return (
                <div key={f.id} className={`cg-card${on ? ' on' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'default' }}>
                  <span aria-hidden style={{ fontSize: 24 }}>{f.glyph}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span className="cg-b" style={{ display: 'block', fontSize: 14 }}>{f.vi}</span>
                    <span className="cg-muted" style={{ fontSize: 14 }}>
                      {L({ vi: `còn ${n} · đặt ${placedCount(own, f.id)}`, en: `${n} left · ${placedCount(own, f.id)} placed` })}
                    </span>
                  </span>
                  {n > 0 ? (
                    <button
                      className="cg-btn small primary"
                      onClick={() => {
                        setSelected(null);
                        setHolding(on ? null : { item: f.id, rot: 0 });
                      }}
                    >
                      {on ? L({ vi: 'Thôi', en: 'Cancel' }) : L({ vi: 'Đặt', en: 'Place' })}
                    </button>
                  ) : (
                    <button
                      className="cg-btn small"
                      disabled={balance < f.price}
                      title={balance < f.price ? L({ vi: `Còn thiếu ${f.price - balance} sao`, en: `${f.price - balance} more stars needed` }) : undefined}
                      onClick={() => {
                        const r = buy(furnitureShopId(f.id), balance);
                        if (r.ok) {
                          setHolding({ item: f.id, rot: 0 });
                          setNote(L({ vi: `Đã mua ${f.vi} — bấm lên sàn để đặt.`, en: 'Bought — click the floor to place it.' }));
                        } else setNote(r.reason ?? L({ vi: 'Không mua được.', en: 'Could not buy.' }));
                      }}
                    >
                      ⭐ {f.price}
                    </button>
                  )}
                </div>
              );
            })}
            <strong className="cg-b" style={{ fontSize: 15, marginTop: 6 }}>{L({ vi: 'Màu sàn & tường', en: 'Floor & wall colours' })}</strong>
            <div className="cg-row" style={{ flexWrap: 'wrap' }}>
              {FLOORS.map((c) => (
                <button key={c} className="cg-tool" aria-label={c} style={{ width: 32, height: 32, background: c, boxShadow: own.floor === c ? `0 0 0 3px ${CG.brand}` : `0 0 0 1px ${CG.line}` }} onClick={() => setHome({ ...own, floor: c })} />
              ))}
            </div>
            <div className="cg-row" style={{ flexWrap: 'wrap' }}>
              {WALLS.map((c) => (
                <button key={c} className="cg-tool" aria-label={c} style={{ width: 32, height: 32, background: c, boxShadow: own.wall === c ? `0 0 0 3px ${CG.brand}` : `0 0 0 1px ${CG.line}` }} onClick={() => setHome({ ...own, wall: c })} />
              ))}
            </div>
          </aside>
        )}
        <div style={{ position: 'relative', flex: 1, minWidth: 0, background: 'linear-gradient(180deg,#DDEBFF,#F6F0E6)' }}>
          <Canvas orthographic shadows camera={camera} dpr={[1, 1.5]} onCreated={({ camera: c }) => c.lookAt(0, 0.6, 0)} style={{ position: 'absolute', inset: 0 }}>
            <Room layout={layout} fishCount={fishCount} hover={readOnly ? null : hover} holding={readOnly ? null : holding} selected={selected} onTile={onTile} onHover={setHover} onPick={(u) => !readOnly && setSelected(u)} />
          </Canvas>
          <div className="cg-row" style={{ position: 'absolute', left: 16, top: 14, right: 16, justifyContent: 'space-between' }}>
            <strong className="cg-x cg-panel" style={{ fontSize: 18, padding: '8px 14px' }}>🏠 {title ?? L({ vi: 'Nhà của tôi', en: 'My home' })}</strong>
            <button className="cg-btn" onClick={onClose}>
              ✕ {L({ vi: 'Ra ngoài', en: 'Go outside' })}
            </button>
          </div>
          {sel && !readOnly ? (
            <div className="cg-panel cg-prompt" style={{ bottom: 16 }}>
              <span className="cg-b">{furnitureById(sel.item)?.glyph} {furnitureById(sel.item)?.vi}</span>
              <button className="cg-btn small" onClick={rotateSel}>⟳ {L({ vi: 'Xoay', en: 'Rotate' })} (R)</button>
              <button className="cg-btn small" onClick={() => { setHolding({ item: sel.item, rot: sel.rot, moving: sel.uid }); setSelected(null); }}>
                ✥ {L({ vi: 'Dời', en: 'Move' })}
              </button>
              <button className="cg-btn small danger" onClick={removeSel}>{L({ vi: 'Cất vào túi', en: 'Put away' })}</button>
            </div>
          ) : null}
          {note ? (
            <div className="cg-toast info" role="status" style={{ bottom: sel ? 78 : 18 }}>
              {note}
            </div>
          ) : null}
          {readOnly && layout.items.length === 0 ? (
            <div className="cg-panel cg-prompt" style={{ bottom: 16 }}>{L({ vi: 'Nhà này chưa bày món nào.', en: 'Nothing placed in this home yet.' })}</div>
          ) : null}
          {!readOnly && own.items.length === 0 && !holding ? (
            <div className="cg-panel cg-prompt" style={{ bottom: 16 }}>{L({ vi: 'Phòng còn trống — đổi sao lấy món đầu tiên ở cột bên trái.', en: 'Empty room — trade stars for your first piece on the left.' })}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

