import React from 'react';
import { Platform, View, type ViewStyle } from 'react-native';

/**
 * Dải cây leo bám theo một mép của khung: ảnh dải được lặp dọc mép bằng CSS background (repeat-x hoặc repeat-y),
 * nên dây chạy liền suốt viền thay vì một mảnh rời. Chỉ vẽ trên web; máy khác bỏ qua để không lộ hình vỡ.
 *
 * - `size`: chiều cao của đoạn lặp (mép trên/dưới) hoặc chiều rộng (mép trái/phải), px.
 * - `inset`: khoảng lệch so với mép; số âm để dây leo vượt ra ngoài mép cho cảm giác bám vào khung.
 * - `flip`: lật dải (dọc với mép ngang, ngang với mép dọc).
 */
export type VineEdge = 'top' | 'bottom' | 'left' | 'right';

export function VineBorder({
  edge,
  src,
  size = 110,
  inset = 0,
  opacity = 0.92,
  flip = false,
}: {
  edge: VineEdge;
  src: string;
  size?: number;
  inset?: number;
  opacity?: number;
  flip?: boolean;
}) {
  if (Platform.OS !== 'web') return null;

  const horizontal = edge === 'top' || edge === 'bottom';
  const place: ViewStyle = horizontal
    ? {
        position: 'absolute',
        left: 0,
        right: 0,
        height: size,
        ...(edge === 'top' ? { top: inset } : { bottom: inset }),
      }
    : {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: size,
        ...(edge === 'left' ? { left: inset } : { right: inset }),
      };

  const paint = {
    backgroundImage: `url("${src}")`,
    backgroundRepeat: horizontal ? 'repeat-x' : 'repeat-y',
    backgroundSize: horizontal ? `auto ${size}px` : `${size}px auto`,
    backgroundPosition: 'center',
    opacity,
    transform: flip ? (horizontal ? 'scaleY(-1)' : 'scaleX(-1)') : undefined,
  } as unknown as ViewStyle;

  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[place, paint]}
    />
  );
}

/** Đường dẫn các dải lặp, sinh bởi scratchpad/papercut/make_strips.py. */
export const VINE_STRIP = {
  hIvy: '/home/strips/h-ivy.webp',
  hRose: '/home/strips/h-rose.webp',
  vIvyA: '/home/strips/v-ivy-a.webp',
  vIvyB: '/home/strips/v-ivy-b.webp',
} as const;
