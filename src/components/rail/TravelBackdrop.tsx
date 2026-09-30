import React from 'react';

import { OliveGrid } from '@/components/layout/OliveGrid';

/**
 * Nền màn ôn từ vựng. Bản iOS/Android: nền chàm kẻ ô như cũ (cảnh tàu chạy vẽ
 * bằng canvas trình duyệt, chỉ có ở bản web — `TravelBackdrop.web.tsx`).
 */
export function TravelBackdrop({ color, children }: { color: string; children: React.ReactNode }) {
  return <OliveGrid color={color}>{children}</OliveGrid>;
}

/** Nền toa tàu có đang bật ở màn học từ không (bản iOS/Android: không bao giờ). */
export function useTravelBackdropOn(): boolean {
  return false;
}
