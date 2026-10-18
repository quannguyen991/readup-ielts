/**
 * NỀN BẢN ĐỒ THẾ GIỚI CHUYỂN ĐỘNG cho màn học từ vựng (web): bản đồ pixel + lớp hoạt hình (sóng, mây, thuyền,
 * cá voi, hải âu, máy bay "học tới đâu bay tới đó"). Phóng nguyên số nguyên phủ kín màn, tự cuộn để máy bay
 * luôn ở trong khung; phủ một lớp tối nhẹ để thẻ học đọc rõ. Tab ẩn thì dừng; "giảm chuyển động" chỉ một khung tĩnh.
 */
import React, { useCallback, useState } from 'react';
import { useWindowDimensions } from 'react-native';

import { useReducedMotion } from '@/components/travel/ui/hooks';
import { learningProgress } from '@/services/travel/flightProgress';
import { WORLD_SRC_H, WORLD_SRC_W } from '@/services/travel/worldGeometry';
import { useTravelStore } from '@/store/useTravelStore';
import { WorldAmbient } from './WorldAmbient.web';

export function WorldBackdrop() {
  const { width, height } = useWindowDimensions();
  const still = useReducedMotion();
  const poi = useTravelStore((s) => s.poi);
  const progress = learningProgress({ poi });
  const [plane, setPlane] = useState({ x: WORLD_SRC_W / 2, y: WORLD_SRC_H / 2 });
  const onPlane = useCallback((x: number, y: number) => setPlane((p) => (Math.abs(p.x - x) < 0.5 && Math.abs(p.y - y) < 0.5 ? p : { x, y })), []);

  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  // Số nguyên theo điểm ảnh thiết bị: k·dpr nguyên, phủ kín cả hai chiều.
  const k = Math.max(1, Math.ceil(Math.max(width / WORLD_SRC_W, height / WORLD_SRC_H) * dpr) / dpr);
  const w = WORLD_SRC_W * k;
  const h = WORLD_SRC_H * k;
  const left = Math.min(0, Math.max(width - w, Math.round(width / 2 - plane.x * k)));
  const top = Math.min(0, Math.max(height - h, Math.round(height / 2 - plane.y * k)));

  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#0A2A44', contain: 'strict' }}>
      <div style={{ position: 'absolute', width: w, height: h, transform: `translate3d(${left}px, ${top}px, 0)`, transition: still ? 'none' : 'transform 1.4s ease-out', willChange: 'transform' }}>
        <img
          src="/travel/maps/world-clean.webp"
          alt=""
          width={w}
          height={h}
          draggable={false}
          style={{ display: 'block', width: w, height: h, imageRendering: 'pixelated', userSelect: 'none' }}
        />
        <WorldAmbient progress={progress} k={k} still={still} density={0.8} onPlane={onPlane} />
      </div>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(6,20,36,0.52) 0%, rgba(6,20,36,0.38) 45%, rgba(6,20,36,0.58) 100%)' }} />
    </div>
  );
}
