/**
 * NHÂN VẬT ĐI DẠO trong thành phố (kiểu Play Together): mặc đúng skin đang đeo,
 * đi bằng WASD / mũi tên (theo hướng màn hình) hoặc bấm ô để tự tìm đường.
 *
 * Cảnh vẽ theo yêu cầu (`frameloop="demand"`): chỉ khi đang đi mới xin khung
 * hình mới; đứng yên thì không tốn GPU. Camera bám theo qua `followRef` (bộ
 * điều khiển camera đọc nó mỗi khung).
 *
 * Luật đi (tường, nước, vách dốc, việc làm được ở chỗ đứng) ở `services/city/life.ts`.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';

import { activityAt, canStand, findPath, moveAvatar, spawnPoint, walkIndex, type Activity, type WalkIndex } from '@/services/city/life';
import { heightAt, isWater, tileAt } from '@/services/city/terrain';
import { key } from '@/services/city/placement';
import { HS, sampleField, waterLevel } from './surface';
import type { SceneWorld } from './CityScene';

export type AvatarColors = { body: string; trim: string; hair: string; skin: string; legs: string };

export type WalkProps = {
  colors: AvatarColors;
  /** Ô người dùng vừa bấm (đổi `id` mỗi lần bấm để bấm lại cùng ô vẫn đi). */
  goal: { tile: [number, number]; id: number } | null;
  /** Tạm dừng điều khiển (đang mở bảng câu hỏi...). */
  paused: boolean;
  onActivity: (a: Activity | null) => void;
  /** Toạ độ ô (số thực) khi dừng lại — lưu để lần sau đứng đúng chỗ. */
  onRest?: (pos: [number, number]) => void;
  start?: [number, number] | null;
  /** Tâm các công trình (ô) — chỗ xuất phát mặc định. */
  near: [number, number];
};

/** Tốc độ đi (ô / giây). */
const SPEED = 3.2;

const KEYS: Record<string, [number, number]> = {
  arrowup: [0, 1],
  w: [0, 1],
  arrowdown: [0, -1],
  s: [0, -1],
  arrowleft: [-1, 0],
  a: [-1, 0],
  arrowright: [1, 0],
  d: [1, 0],
};

function groundY(data: SceneWorld, ix: WalkIndex, px: number, py: number): number {
  const tx = Math.floor(px);
  const ty = Math.floor(py);
  const t = tileAt(data.terrain, tx, ty);
  const half = data.terrain.size / 2;
  if (t && isWater(t) && data.roads[key(tx, ty)]) {
    // Mặt cầu: như `roadGeometry` — ngang bờ cao nhất kề bên.
    let bank = t.h * HS;
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const nb = tileAt(data.terrain, tx + dx, ty + dy);
      if (nb && !isWater(nb)) bank = Math.max(bank, heightAt(data.terrain, ix.world.works, tx + dx, ty + dy) * HS);
    }
    return Math.max(bank, waterLevel(t) + 0.12) + 0.07;
  }
  return sampleField(data.field, px - half, py - half) + (data.roads[key(tx, ty)] ? 0.03 : 0);
}

const sameActivity = (a: Activity | null, b: Activity | null) =>
  a === b || (!!a && !!b && a.kind === b.kind && ('siteId' in a ? a.siteId : '') === ('siteId' in b ? b.siteId : ''));

export function WalkLayer({ data, walk, rot, followRef }: { data: SceneWorld; walk: WalkProps; rot: number; followRef: React.MutableRefObject<[number, number] | null> }) {
  const { invalidate } = useThree();
  const ix = useMemo(() => walkIndex({ terrain: data.terrain, works: data.works, regions: data.regions, roads: data.roads, sites: data.sites }), [data.terrain, data.works, data.regions, data.roads, data.sites]);
  const pos = useRef<[number, number] | null>(null);
  const face = useRef(0);
  const phase = useRef(0);
  const held = useRef(new Set<string>());
  const path = useRef<[number, number][]>([]);
  const lastAct = useRef<Activity | null>(null);
  const moving = useRef(false);
  const group = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Mesh>(null);
  const legR = useRef<THREE.Mesh>(null);
  const armL = useRef<THREE.Mesh>(null);
  const armR = useRef<THREE.Mesh>(null);
  const walkRef = useRef(walk);
  useEffect(() => {
    walkRef.current = walk;
  });

  // Chỗ đứng ban đầu (hoặc khi bản đồ đổi làm chỗ cũ không còn đứng được).
  useEffect(() => {
    // Chỗ cũ không còn đứng được (nhà mới xây đè lên, bản đồ khác) → tìm chỗ gần nhất.
    const p = pos.current ?? walkRef.current.start ?? null;
    pos.current = p && canStand(ix, Math.floor(p[0]), Math.floor(p[1])) ? p : spawnPoint(ix, p ?? walkRef.current.near);
    followRef.current = [pos.current[0] - data.terrain.size / 2, pos.current[1] - data.terrain.size / 2];
    const a = activityAt(ix, pos.current);
    lastAct.current = a;
    walkRef.current.onActivity(a);
    invalidate();
    return () => {
      followRef.current = null;
    };
  }, [ix, data.terrain, followRef, invalidate]);

  // Bấm ô → tìm đường.
  const goalId = walk.goal?.id;
  useEffect(() => {
    const g = walkRef.current.goal;
    const p = pos.current;
    if (!g || !p) return;
    path.current = findPath(ix, [Math.floor(p[0]), Math.floor(p[1])], g.tile) ?? [];
    invalidate();
  }, [goalId, ix, invalidate]);

  // Bàn phím.
  useEffect(() => {
    const isField = (el: EventTarget | null) => {
      const h = el as HTMLElement | null;
      return !!h && (h.tagName === 'INPUT' || h.tagName === 'TEXTAREA' || h.isContentEditable);
    };
    const down = (e: KeyboardEvent) => {
      if (isField(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (!KEYS[k]) return;
      e.preventDefault();
      held.current.add(k);
      path.current = [];
      invalidate();
    };
    const up = (e: KeyboardEvent) => {
      held.current.delete(e.key.toLowerCase());
    };
    const blur = () => held.current.clear();
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, [invalidate]);

  const colors = walk.colors;
  const mats = useMemo(
    () => ({
      body: new THREE.MeshLambertMaterial({ color: colors.body }),
      trim: new THREE.MeshLambertMaterial({ color: colors.trim }),
      hair: new THREE.MeshLambertMaterial({ color: colors.hair }),
      skin: new THREE.MeshLambertMaterial({ color: colors.skin }),
      legs: new THREE.MeshLambertMaterial({ color: colors.legs }),
      eye: new THREE.MeshBasicMaterial({ color: '#1B1330' }),
      shadow: new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.22, depthWrite: false }),
      // Bóng xuyên tường + dấu vàng trên đầu: đi khuất sau cao ốc vẫn thấy mình ở đâu.
      xray: new THREE.MeshBasicMaterial({ color: colors.body, transparent: true, opacity: 0.35, depthTest: false, depthWrite: false }),
      marker: new THREE.MeshBasicMaterial({ color: '#FACC15', depthTest: false, depthWrite: false }),
    }),
    [colors.body, colors.trim, colors.hair, colors.skin, colors.legs],
  );
  useEffect(() => () => Object.values(mats).forEach((m) => m.dispose()), [mats]);

  useFrame((_, rawDt) => {
    const p = pos.current;
    const g = group.current;
    if (!p || !g) return;
    const dt = Math.min(0.05, rawDt);
    const w = walkRef.current;
    let vx = 0;
    let vy = 0;
    if (!w.paused) {
      for (const k of held.current) {
        vx += KEYS[k]![0];
        vy += KEYS[k]![1];
      }
    }
    let dx = 0;
    let dz = 0;
    if (vx !== 0 || vy !== 0) {
      // Hướng màn hình → hướng bản đồ (giống `pan` của camera).
      const a = Math.PI / 4 + (rot * Math.PI) / 2;
      const len = Math.hypot(vx, vy);
      dx = ((Math.cos(a) * vx - Math.sin(a) * vy) / len) * SPEED * dt;
      dz = ((-Math.sin(a) * vx - Math.cos(a) * vy) / len) * SPEED * dt;
    } else if (!w.paused && path.current.length > 0) {
      const [tx, ty] = path.current[0]!;
      const ddx = tx - p[0];
      const ddz = ty - p[1];
      const d = Math.hypot(ddx, ddz);
      const step = SPEED * dt;
      if (d <= step) {
        path.current.shift();
        dx = ddx;
        dz = ddz;
      } else {
        dx = (ddx / d) * step;
        dz = (ddz / d) * step;
      }
    }
    const was = moving.current;
    if (dx !== 0 || dz !== 0) {
      const next = moveAvatar(ix, p, dx, dz);
      // Bị chặn hẳn khi đang theo đường → bỏ đường.
      if (next[0] === p[0] && next[1] === p[1]) path.current = [];
      pos.current = next;
      face.current = Math.atan2(dx, dz);
      phase.current += dt * 11;
      moving.current = true;
    } else {
      moving.current = false;
      phase.current = 0;
    }
    const cur = pos.current ?? p;
    const [px, py] = cur;
    const half = data.terrain.size / 2;
    const y = groundY(data, ix, px, py);
    const bob = moving.current ? Math.abs(Math.sin(phase.current)) * 0.04 : 0;
    g.position.set(px - half, y + bob, py - half);
    // Quay mặt mượt về hướng đi.
    let diff = face.current - g.rotation.y;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    g.rotation.y += diff * Math.min(1, dt * 14);
    const swing = moving.current ? Math.sin(phase.current) * 0.7 : 0;
    if (legL.current) legL.current.rotation.x = swing;
    if (legR.current) legR.current.rotation.x = -swing;
    if (armL.current) armL.current.rotation.x = -swing * 0.8;
    if (armR.current) armR.current.rotation.x = swing * 0.8;
    followRef.current = [px - half, py - half];

    if (moving.current) {
      const a = activityAt(ix, cur);
      if (!sameActivity(a, lastAct.current)) {
        lastAct.current = a;
        w.onActivity(a);
      }
      invalidate();
    } else if (was) {
      w.onRest?.([px, py]);
      invalidate();
    } else if (Math.abs(diff) > 0.01) {
      invalidate();
    }
  });

  // Nhân vật chibi ~0,62 ô: đầu to, thân ngắn, tay chân đung đưa khi đi.
  return (
    <group ref={group} scale={1.45}>
      <mesh rotation-x={-Math.PI / 2} position-y={0.012} material={mats.shadow}>
        <circleGeometry args={[0.2, 20]} />
      </mesh>
      <mesh ref={legL} position={[-0.055, 0.14, 0]} material={mats.legs} castShadow>
        <boxGeometry args={[0.075, 0.16, 0.08]} />
      </mesh>
      <mesh ref={legR} position={[0.055, 0.14, 0]} material={mats.legs} castShadow>
        <boxGeometry args={[0.075, 0.16, 0.08]} />
      </mesh>
      <mesh position={[0, 0.29, 0]} material={mats.body} castShadow>
        <boxGeometry args={[0.2, 0.18, 0.13]} />
      </mesh>
      <mesh position={[0, 0.215, 0]} material={mats.trim}>
        <boxGeometry args={[0.205, 0.03, 0.135]} />
      </mesh>
      <mesh ref={armL} position={[-0.125, 0.3, 0]} material={mats.body} castShadow>
        <boxGeometry args={[0.05, 0.15, 0.06]} />
      </mesh>
      <mesh ref={armR} position={[0.125, 0.3, 0]} material={mats.body} castShadow>
        <boxGeometry args={[0.05, 0.15, 0.06]} />
      </mesh>
      <mesh position={[0, 0.48, 0]} material={mats.skin} castShadow>
        <sphereGeometry args={[0.13, 16, 12]} />
      </mesh>
      <mesh position={[0, 0.53, -0.012]} scale={[1, 0.75, 1]} material={mats.hair}>
        <sphereGeometry args={[0.137, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <mesh position={[-0.045, 0.485, 0.12]} material={mats.eye}>
        <sphereGeometry args={[0.018, 8, 6]} />
      </mesh>
      <mesh position={[0.045, 0.485, 0.12]} material={mats.eye}>
        <sphereGeometry args={[0.018, 8, 6]} />
      </mesh>
      <mesh position={[0, 0.27, 0]} material={mats.xray} renderOrder={998}>
        <boxGeometry args={[0.22, 0.4, 0.14]} />
      </mesh>
      <mesh position={[0, 0.49, 0]} material={mats.xray} renderOrder={998}>
        <sphereGeometry args={[0.14, 12, 8]} />
      </mesh>
      <mesh position={[0, 0.86, 0]} rotation-x={Math.PI} material={mats.marker} renderOrder={999}>
        <coneGeometry args={[0.07, 0.14, 4]} />
      </mesh>
    </group>
  );
}
