/**
 * TRANG TRÍ CHE ĐƯỜNG NỐI giữa các mảnh đất: dọc mỗi đường nối đặt một hàng cây/bụi liên tục (vật đứng, xếp theo độ sâu),
 * chừa khoảng hở quanh mọi điểm nối (đường/cầu vẫn thông) và bỏ qua chỗ nước/chặn (đã có hoà sắc che). Hàm thuần.
 */
import type { MapObject } from '@/services/travel/types';

export type SeamLine = { x0: number; y0: number; x1: number; y1: number };

export function seamDecor(o: {
  prefix: string;
  maskRows: string[];
  cell: number;
  lines: SeamLine[];
  /** Điểm nối (toạ độ thế giới) — quanh mỗi điểm chừa hở `gap` điểm. */
  gaps: { x: number; y: number }[];
  sprites: string[];
  gap?: number;
  spacing?: number;
}): MapObject[] {
  const gap = Math.max(o.gap ?? 28, 28);
  const spacing = Math.max(o.spacing ?? 120, 110);
  const out: MapObject[] = [];
  let n = 0;
  for (const l of o.lines) {
    const len = Math.hypot(l.x1 - l.x0, l.y1 - l.y0);
    const count = Math.max(1, Math.floor(len / spacing));
    for (let i = 0; i <= count; i++) {
      const x = Math.round(l.x0 + ((l.x1 - l.x0) * i) / count);
      const y = Math.round(l.y0 + ((l.y1 - l.y0) * i) / count) + ((i * 7) % 5) - 2;
      if (o.maskRows[Math.floor(y / o.cell)]?.[Math.floor(x / o.cell)] !== '#') continue;
      // bỏ chỗ đường/vạch qua đường: bề ngang đi được dọc theo đường nối quá rộng thì không đặt vật
      const horizontal = Math.abs(l.x1 - l.x0) >= Math.abs(l.y1 - l.y0);
      const at = (dx: number) => o.maskRows[Math.floor((horizontal ? y : y + dx) / o.cell)]?.[Math.floor((horizontal ? x + dx : x) / o.cell)] === '#';
      let run = 1;
      for (let d = o.cell; d <= 40 && at(d); d += o.cell) run += 1;
      for (let d = o.cell; d <= 40 && at(-d); d += o.cell) run += 1;
      if (run * o.cell > 24) continue;
      if (o.gaps.some((g) => Math.abs(g.x - x) <= gap && Math.abs(g.y - y) <= gap)) continue;
      out.push({
        id: `${o.prefix}-${n}`,
        sprite: o.sprites[n % o.sprites.length]!,
        x,
        y,
        footprint: { x: -5, y: -6, w: 10, h: 6 },
      });
      n++;
    }
  }
  return out;
}
