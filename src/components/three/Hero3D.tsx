import React, { useEffect, useRef } from 'react';
import { Platform, View, type StyleProp, type ViewStyle } from 'react-native';

import type { SceneKind } from './scene-kit';

export type { SceneKind };

/**
 * Khung chứa cảnh 3D trang trí (`scene-kit.ts`). Trên web, thư viện three.js
 * chỉ được tải khi khung này xuất hiện; trên app native khung để trống.
 *
 * `pointerEvents="none"`: cảnh chỉ để nhìn, không bao giờ chặn cú bấm vào nút
 * nằm dưới hay cạnh nó.
 */
export function Hero3D({ scene, style }: { scene: SceneKind; style?: StyleProp<ViewStyle> }) {
  const host = useRef<View>(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const el = host.current as unknown as HTMLElement | null;
    if (!el) return;
    let dispose: (() => void) | null = null;
    let cancelled = false;
    void import('./scene-kit')
      .then(({ mountScene }) => {
        if (!cancelled) dispose = mountScene(el, scene);
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
