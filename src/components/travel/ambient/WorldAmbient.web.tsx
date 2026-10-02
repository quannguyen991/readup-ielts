/**
 * Canvas hoạt hình phủ lên bản đồ thế giới (web). Canvas có độ phân giải ĐÚNG lưới ảnh nguồn (418×235) và được
 * CSS phóng nguyên số nguyên bằng `image-rendering: pixelated`, nên pixel vuông, sắc nét như ảnh nền.
 * 30 khung/giây, dừng khi tab ẩn; "giảm chuyển động" chỉ vẽ MỘT khung tĩnh.
 */
import React, { useEffect, useRef } from 'react';

import { WORLD_SRC_H, WORLD_SRC_W } from '@/services/travel/worldGeometry';
import { createAmbientWorld, type AmbientWorld } from './world';
import { decodeSea, NO_SEA, type SeaJson, type SeaMask } from './sea';
import type { WorldAmbientProps } from './WorldAmbient';

export type { WorldAmbientProps };

let seaPromise: Promise<SeaMask> | null = null;
/** Tải mặt nạ biển một lần cho cả phiên. */
export function loadSea(): Promise<SeaMask> {
  seaPromise ??= fetch('/travel/maps/world-sea.json')
    .then((r) => (r.ok ? (r.json() as Promise<SeaJson>) : Promise.reject(new Error(String(r.status)))))
    .then(decodeSea)
    .catch(() => NO_SEA);
  return seaPromise;
}

const KEY = 'band9.flight.shown';
const readShown = (): number | null => {
  try {
    const v = Number(window.localStorage.getItem(KEY));
    return window.localStorage.getItem(KEY) !== null && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : null;
  } catch {
    return null;
  }
};
const saveShown = (v: number) => {
  try {
    window.localStorage.setItem(KEY, String(v));
  } catch {
    /* không có localStorage: bỏ qua */
  }
};

export function WorldAmbient({ progress, k, still = false, hidePlane = false, density = 1, onPlane }: WorldAmbientProps) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const world = useRef<AmbientWorld | null>(null);
  const latest = useRef({ progress, still, hidePlane });
  const onPlaneRef = useRef(onPlane);
  onPlaneRef.current = onPlane;
  latest.current = { progress, still, hidePlane };

  useEffect(() => {
    let alive = true;
    let raf = 0;
    let last = 0;
    let acc = 0;
    let lastSaved = -1;
    void loadSea().then((sea) => {
      const cv = ref.current;
      if (!alive || !cv) return;
      const ctx = cv.getContext('2d');
      if (!ctx) return;
      const w = createAmbientWorld(sea, { plane: true, density });
      world.current = w;
      if (__DEV__) (window as unknown as { __ambient?: AmbientWorld }).__ambient = w;
      const start = readShown();
      w.setProgress(start ?? 0, true);
      w.setProgress(latest.current.progress, latest.current.still);
      const tellPlane = () => {
        const p = w.planeAt();
        onPlaneRef.current?.(p.x, p.y);
      };
      tellPlane();
      let lastTell = 0;
      const render = () => {
        ctx.clearRect(0, 0, WORLD_SRC_W, WORLD_SRC_H);
        w.setPlaneVisible(!latest.current.hidePlane);
        (latest.current.still ? w.drawStill : w.draw)(ctx);
      };
      if (latest.current.still) {
        render();
        saveShown(latest.current.progress);
        return;
      }
      const frame = (now: number) => {
        raf = requestAnimationFrame(frame);
        if (document.visibilityState === 'hidden') {
          last = now;
          return;
        }
        const dt = Math.min(0.1, (now - (last || now)) / 1000);
        last = now;
        acc += dt;
        if (acc < 1 / 30) return;
        const dbg = __DEV__ ? (window as unknown as { __flightP?: number }).__flightP : undefined;
        w.setProgress(dbg ?? latest.current.progress);
        w.update(acc);
        acc = 0;
        render();
        if (now - lastTell > 250) {
          lastTell = now;
          tellPlane();
        }
        const s = w.shown();
        if (!w.gliding() && s !== lastSaved) {
          lastSaved = s;
          saveShown(s);
        }
      };
      raf = requestAnimationFrame(frame);
    });
    return () => {
      alive = false;
      if (raf) cancelAnimationFrame(raf);
      world.current = null;
    };
    // `still` đổi (hiếm) thì dựng lại; progress đổi thì chỉ truyền xuống qua `latest`.
  }, [still, density]);

  return React.createElement('canvas', {
    ref,
    width: WORLD_SRC_W,
    height: WORLD_SRC_H,
    'aria-hidden': true,
    style: { position: 'absolute', left: 0, top: 0, width: WORLD_SRC_W * k, height: WORLD_SRC_H * k, imageRendering: 'pixelated', pointerEvents: 'none', zIndex: 1 },
  });
}
