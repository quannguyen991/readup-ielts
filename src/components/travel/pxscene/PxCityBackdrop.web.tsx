/**
 * NỀN CẢNH THÀNH PHỐ PIXEL CHUYỂN ĐỘNG cho màn học (web). Cảnh 320×180 phóng nguyên số nguyên phủ kín màn,
 * căn theo "điểm nhấn" của từng cảnh, phủ lớp tối nhẹ để thẻ học và chữ ngoài thẻ đọc rõ.
 */
import React from 'react';
import { useWindowDimensions } from 'react-native';

import { useReducedMotion } from '@/components/travel/ui/hooks';
import type { CityId } from '@/services/travel/types';
import { useTravelStore } from '@/store/useTravelStore';
import { isPxSceneId, type PxSceneId } from './index';
import { PxSceneCanvas } from './PxSceneCanvas.web';
import { SCENE_H, SCENE_W } from './scene';

/** Thành phố Du ngoạn → cảnh gần nhất. */
export const SCENE_OF_CITY: Record<CityId, PxSceneId> = {
  hanoi: 'hanoi',
  danang: 'hanoi',
  hochiminh: 'singapore',
  singapore: 'singapore',
  london: 'london',
  paris: 'paris',
  amsterdam: 'london',
  rome: 'paris',
  tokyo: 'tokyo',
  seoul: 'tokyo',
  newyork: 'london',
  istanbul: 'paris',
  cairo: 'hanoi',
  sydney: 'singapore',
  mexicocity: 'hanoi',
  rio: 'singapore',
  capetown: 'singapore',
  marrakech: 'hanoi',
  shanghai: 'tokyo',
};

/** Điểm nhấn (0..1 theo chiều ngang) để cảnh không bị cắt mất vật chính trên màn hẹp. */
const FOCUS: Record<PxSceneId, number> = { tokyo: 0.6, paris: 0.66, london: 0.45, singapore: 0.5, hanoi: 0.42 };
/** Độ tối lớp phủ: cảnh sáng (Hà Nội sớm mai) cần nhiều hơn. */
const SCRIM: Record<PxSceneId, number> = { tokyo: 0.3, paris: 0.34, london: 0.32, singapore: 0.3, hanoi: 0.5 };

export function PxCityBackdrop({ themeId }: { themeId: string }) {
  const { width, height } = useWindowDimensions();
  const still = useReducedMotion();
  const city = useTravelStore((s) => s.city);
  const raw = themeId.replace(/^px-/, '');
  const scene: PxSceneId = isPxSceneId(raw) ? raw : SCENE_OF_CITY[city] ?? 'tokyo';

  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const k = Math.max(1, Math.ceil(Math.max(width / SCENE_W, height / SCENE_H) * dpr) / dpr);
  const w = SCENE_W * k;
  const h = SCENE_H * k;
  const left = Math.min(0, Math.max(width - w, Math.round(width / 2 - FOCUS[scene] * w)));
  const top = Math.min(0, Math.max(height - h, Math.round(height - h)));
  const a = SCRIM[scene];

  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#070A1E', contain: 'strict' }}>
      <div style={{ position: 'absolute', width: w, height: h, left, top }}>
        <PxSceneCanvas key={scene} scene={scene} k={k} still={still} />
      </div>
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, rgba(5,6,22,${a + 0.12}) 0%, rgba(5,6,22,${a - 0.1}) 40%, rgba(5,6,22,${a + 0.22}) 100%)` }} />
    </div>
  );
}
