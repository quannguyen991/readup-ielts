import React from 'react';
import Svg, { Rect } from 'react-native-svg';

/** Ba mẫu áo của lữ khách pixel (chỉ số `prefs.outfit`). */
export const OUTFITS = [
  { jacket: '#0F1D33', scarf: '#B8955A', hair: '#2B1B12', name: { vi: 'Áo navy', en: 'Navy coat' } },
  { jacket: '#B8955A', scarf: '#0F1D33', hair: '#5A3A22', name: { vi: 'Áo vàng', en: 'Gold coat' } },
  { jacket: '#2F8F6B', scarf: '#F3EDE1', hair: '#15110E', name: { vi: 'Áo xanh lá', en: 'Green coat' } },
] as const;

const SKIN = '#E9B98A';

/** Lữ khách 10×14 ô, vẽ bằng hình chữ nhật (không ảnh). */
export function Traveller({ outfit = 0, size = 64 }: { outfit?: number; size?: number }) {
  const o = OUTFITS[Math.max(0, Math.min(OUTFITS.length - 1, outfit))]!;
  const px = (x: number, y: number, w: number, h: number, fill: string) => <Rect key={`${x},${y},${w},${h},${fill}`} x={x} y={y} width={w} height={h} fill={fill} />;
  return (
    <Svg width={size} height={(size * 14) / 10} viewBox="0 0 10 14">
      {px(3, 0, 4, 1, o.hair)}
      {px(2, 1, 6, 2, o.hair)}
      {px(3, 3, 4, 3, SKIN)}
      {px(3, 3, 1, 1, o.hair)}
      {px(4, 4, 1, 1, '#1A1A1A')}
      {px(6, 4, 1, 1, '#1A1A1A')}
      {px(3, 6, 4, 1, o.scarf)}
      {px(2, 7, 6, 4, o.jacket)}
      {px(1, 7, 1, 3, o.jacket)}
      {px(8, 7, 1, 3, o.jacket)}
      {px(1, 10, 1, 1, SKIN)}
      {px(8, 10, 1, 1, SKIN)}
      {px(4, 7, 2, 1, o.scarf)}
      {px(3, 11, 2, 2, '#2A2F3A')}
      {px(5, 11, 2, 2, '#2A2F3A')}
      {px(2, 13, 3, 1, '#14161C')}
      {px(5, 13, 3, 1, '#14161C')}
      {px(8, 8, 2, 3, '#7A5634')}
    </Svg>
  );
}
