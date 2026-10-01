import React, { useMemo } from 'react';
import Svg, { Rect } from 'react-native-svg';

import { paletteFor, SPRITES, spriteRuns, type SpriteName } from './sprites';

/** Cạnh sắc cho pixel (react-native-svg chưa khai kiểu thuộc tính này, nhưng web vẫn nhận). */
const CRISP = { shapeRendering: 'crispEdges' } as object;

/**
 * Vẽ một sprite quái/linh vật 16×16 bằng SVG, cạnh sắc (`crispEdges`) nên phóng to bao nhiêu
 * cũng giữ đúng chất pixel. `flip` lật ngang — quái đứng bên phải quay mặt vào
 * nhân vật (nhân vật chính là `HeroSprite`).
 */
export function PixelSprite({
  name,
  size,
  color,
  flip = false,
  silhouette,
}: {
  name: SpriteName;
  size: number;
  /** Màu thân của quái. */
  color?: string;
  flip?: boolean;
  /** Tô cả hình một màu — dùng cho quái chưa gặp trong sổ quái. */
  silhouette?: string;
}) {
  const runs = useMemo(() => {
    const palette = paletteFor(color);
    const all = spriteRuns(SPRITES[name], palette);
    return silhouette ? all.map((r) => ({ ...r, fill: silhouette })) : all;
  }, [name, color, silhouette]);

  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" {...CRISP}>
      {runs.map((r, i) => (
        <Rect key={i} x={flip ? 16 - r.x - r.w : r.x} y={r.y} width={r.w} height={1} fill={r.fill} />
      ))}
    </Svg>
  );
}
