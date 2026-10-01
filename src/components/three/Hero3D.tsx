import React, { useEffect, useRef, useSyncExternalStore } from 'react';
import { Platform, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';

import { isLaptopLike } from './hero-star-policy';
import type { SceneKind } from './hero-star';

export type { SceneKind };

/**
 * Khung chứa ngôi sao phát sáng 3D ở phần đầu trang (`hero-star.ts`). Trên web, three.js
 * chỉ được tải khi khung này xuất hiện; trên app native khung để trống.
 *
 * `pointerEvents="none"`: cảnh chỉ để nhìn, không bao giờ chặn cú bấm vào nút
 * nằm dưới hay cạnh nó.
 *
 * Nơi đặt khung PHẢI hỏi `useHeroStar()` trước: chỉ máy tính mới có ngôi sao,
 * điện thoại và máy tính bảng bỏ hẳn (xem `hero-star-policy.ts`).
 */
export function Hero3D({ scene, style }: { scene: SceneKind; style?: StyleProp<ViewStyle> }) {
  const host = useRef<View>(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const el = host.current as unknown as HTMLElement | null;
    if (!el) return;
    let dispose: (() => void) | null = null;
    let cancelled = false;
    // Trang chủ: logo Band 9 dạng 3D (01/10/2026); các mảng khác vẫn là ngôi sao.
    const load: Promise<(host: HTMLElement) => () => void> =
      scene === 'home' ? import('./hero-logo').then((m) => m.mountHeroLogo) : import('./hero-star').then((m) => (h: HTMLElement) => m.mountHeroStar(h, scene));
    void load
      .then((mount) => {
        if (!cancelled) dispose = mount(el);
      })
      .catch(() => {
        // Máy không có WebGL: bỏ qua, phần đầu trang vẫn đầy đủ chữ và nút.
      });
    return () => {
      cancelled = true;
      dispose?.();
    };
  }, [scene]);

  return <View ref={host} pointerEvents="none" style={style} />;
}

const FINE_POINTER = '(hover: hover) and (pointer: fine)';

function subscribePointer(onChange: () => void): () => void {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.matchMedia) return () => {};
  const query = window.matchMedia(FINE_POINTER);
  query.addEventListener?.('change', onChange);
  return () => query.removeEventListener?.('change', onChange);
}

function finePointerNow(): boolean {
  return Platform.OS === 'web' && typeof window !== 'undefined' && Boolean(window.matchMedia?.(FINE_POINTER).matches);
}

/**
 * Có dựng ngôi sao to ở phần đầu trang không: chỉ trên máy tính (laptop, máy
 * bàn). Bản dựng sẵn phía máy chủ luôn trả `false`, nên trang về tới máy nào
 * cũng vẽ chữ trước, ngôi sao gắn vào sau nếu là máy tính.
 */
export function useHeroStar(): boolean {
  const fine = useSyncExternalStore(subscribePointer, finePointerNow, () => false);
  const { width } = useWindowDimensions();
  if (Platform.OS !== 'web' || typeof navigator === 'undefined') return false;
  return isLaptopLike({ width, finePointer: fine, userAgent: navigator.userAgent, touchPoints: navigator.maxTouchPoints ?? 0 });
}
