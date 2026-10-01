import React from 'react';

import { LightGrid } from '@/components/layout/LightGrid';
import { OliveGrid } from '@/components/layout/OliveGrid';

/**
 * Nền màn ôn từ vựng. Bản iOS/Android: nền chàm kẻ ô như cũ (cảnh bay qua thành phố vẽ
 * bằng canvas trình duyệt, chỉ có ở bản web — `TravelBackdrop.web.tsx`).
 */
export function TravelBackdrop({ color, tone = 'dark', children }: { color: string; tone?: 'dark' | 'light'; children: React.ReactNode }) {
  return tone === 'light' ? <LightGrid>{children}</LightGrid> : <OliveGrid color={color}>{children}</OliveGrid>;
}

/** Nền cảnh bay có đang bật ở màn học từ không (bản iOS/Android: không bao giờ). */
export function useTravelBackdropOn(): boolean {
  return false;
}

export function useTravelActive(): boolean {
  return false;
}
