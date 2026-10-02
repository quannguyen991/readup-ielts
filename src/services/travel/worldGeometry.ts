/**
 * HÌNH HỌC bản đồ thế giới (thuần, không đụng giao diện): toạ độ điểm sáng từng thành phố trong ảnh nguồn
 * 418×235 và đường bay cong nhẹ giữa hai thành phố. Dùng chung cho máy bay lúc bay vé, máy bay "chuyến bay
 * học tập" và lớp hoạt hình nền.
 */
import type { CityId } from './types';

export const WORLD_SRC_W = 418;
export const WORLD_SRC_H = 235;

/** Điểm sáng vàng của từng thành phố trong ảnh (px nguồn, lưới 418×235). */
export const WORLD_ART: Record<CityId, { x: number; y: number }> = {
  london: { x: 51, y: 42 },
  paris: { x: 70, y: 64 },
  amsterdam: { x: 94, y: 49 },
  rome: { x: 102, y: 80 },
  hanoi: { x: 332, y: 107 },
  danang: { x: 343, y: 127 },
  hochiminh: { x: 337, y: 143 },
  singapore: { x: 331, y: 155 },
};

export type RoutePoint = { x: number; y: number; angle: number };

/** Điểm tại tỉ lệ `t` (0..1) trên đường bay a → b, kèm hướng (độ). Đường cong khớp nét đường bay vẽ sẵn. */
export function routePoint(a: CityId, b: CityId, t: number): RoutePoint {
  const p0 = WORLD_ART[a];
  const p1 = WORLD_ART[b];
  const mx = (p0.x + p1.x) / 2;
  const my = (p0.y + p1.y) / 2;
  const dx = p1.x - p0.x;
  const dy = p1.y - p0.y;
  const len = Math.hypot(dx, dy) || 1;
  const bow = Math.min(40, len * 0.18);
  const nx = dy / len;
  const ny = -dx / len;
  const sign = ny <= 0 ? 1 : -1;
  const cx = mx + nx * sign * bow;
  const cy = my + ny * sign * bow;
  const x = (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * cx + t * t * p1.x;
  const y = (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * cy + t * t * p1.y;
  const tx = 2 * (1 - t) * (cx - p0.x) + 2 * t * (p1.x - cx);
  const ty = 2 * (1 - t) * (cy - p0.y) + 2 * t * (p1.y - cy);
  return { x, y, angle: (Math.atan2(ty, tx) * 180) / Math.PI };
}
