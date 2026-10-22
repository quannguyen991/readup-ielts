import { themedHex } from '@/theme/palette-state';
import React from 'react';

import type { CityMap } from '@/services/travel/types';

/**
 * Bản đồ nhỏ góc dưới-trái: ghép các mảnh tranh đất thu nhỏ + chấm địa điểm (vàng = nên đi, xanh = đã đạt, xám = khoá)
 * + chấm người chơi. Chỉ web (dùng thẻ img/div trực tiếp).
 */
export function Minimap({
  map,
  player,
  recommended,
  locked,
  done,
  width,
  label,
}: {
  map: CityMap;
  player: { x: number; y: number } | null;
  recommended: string | null;
  locked: ReadonlySet<string>;
  done: ReadonlySet<string>;
  width: number;
  label: string;
}) {
  const img = map.image;
  if (!img) return null;
  const W = map.size.w;
  const H = map.size.h;
  const s = width / W;
  const height = Math.round(H * s);
  const panels = img.panels && img.panels.length ? img.panels : [{ src: img.smallSrc, x: 0, y: 0, w: W, h: H }];
  const dot = (key: string, x: number, y: number, size: number, bg: string, border = '#0F1D33', z = 2) => (
    <div key={key} style={{ position: 'absolute', left: x * s - size / 2, top: y * s - size / 2, width: size, height: size, borderRadius: '50%', background: bg, border: `1px solid ${border}`, zIndex: z, boxSizing: 'border-box' }} />
  );
  return (
    <div role="img" aria-label={label} style={{ position: 'relative', width, height, overflow: 'hidden', borderRadius: 8, border: '1.5px solid rgba(139, 108, 240,0.9)', background: '#0F1D33', boxShadow: '0 4px 14px rgba(0,0,0,0.35)', imageRendering: 'pixelated' }}>
      {panels.map((p, i) => (
        <img key={i} src={p.src} alt="" draggable={false} style={{ position: 'absolute', left: Math.round(p.x * s), top: Math.round(p.y * s), width: Math.ceil((p.w ?? 418) * s), height: Math.ceil((p.h ?? 235) * s), imageRendering: 'pixelated', opacity: 0.9, pointerEvents: 'none' }} />
      ))}
      {map.pois.map((p) => {
        const isRec = p.id === recommended;
        const bg = isRec ? '#E2C88F' : locked.has(p.id) ? '#9a958a' : done.has(p.id) ? '#4FB67A' : '#F3EDE1';
        return dot(`poi:${p.id}`, p.door.x, p.door.y, isRec ? 9 : 6, bg, isRec ? themedHex('#8B6CF0') : '#0F1D33', isRec ? 3 : 2);
      })}
      {player ? dot('player', player.x, player.y, 8, '#ffffff', '#E5483A', 4) : null}
    </div>
  );
}
