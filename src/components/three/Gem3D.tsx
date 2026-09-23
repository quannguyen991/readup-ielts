import React, { useContext, useEffect, useRef } from 'react';
import { Platform, View } from 'react-native';

import { CardHoverContext } from '@/components/ui/StickerCard';
import type { Cut, GemColor } from './gem-core';
import type { GemHandle } from './gem-kit';

export type { Cut, GemColor };

/**
 * Một viên đá quý 3D nhỏ xoay ở góc thẻ khối (`gem-kit.ts`). three.js chỉ được
 * tải khi khung này xuất hiện, và chỉ trên web; app native để trống.
 *
 * Đặt trong `StickerCard` (qua prop `ornament`) thì viên đá tự biết thẻ đang được
 * rê chuột và xoay nhanh hơn.
 */
export function Gem3D({ cut, color, companion, size = 104 }: { cut: Cut; color: GemColor; companion?: GemColor; size?: number }) {
  const host = useRef<View>(null);
  const handle = useRef<GemHandle | null>(null);
  const hover = useContext(CardHoverContext);
  const hoverRef = useRef(hover);

  useEffect(() => {
    hoverRef.current = hover;
    handle.current?.setBoost(hover);
  }, [hover]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const el = host.current as unknown as HTMLElement | null;
    if (!el) return;
    const canvas = document.createElement('canvas');
    Object.assign(canvas.style, { width: '100%', height: '100%', display: 'block' });
    el.appendChild(canvas);
    let cancelled = false;
    void import('./gem-kit')
      .then(({ mountGem }) => {
        if (cancelled) return;
        handle.current = mountGem(canvas, { cut, color, companion }, size);
        handle.current.setBoost(hoverRef.current);
      })
      .catch(() => {
        // Máy không có WebGL: thẻ vẫn đủ chữ và biểu tượng, chỉ thiếu viên đá trang trí.
      });
    return () => {
      cancelled = true;
      handle.current?.dispose();
      handle.current = null;
      canvas.remove();
    };
  }, [cut, color, companion, size]);

  return <View ref={host} pointerEvents="none" style={{ width: size, height: size }} />;
}
