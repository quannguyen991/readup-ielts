/**
 * Vị trí các nút trên đường đi của bản đồ. Nút luân phiên bên trái và bên phải, tạo đường lượn
 * như bản đồ trò chơi. Tính thuần để test được; giao diện chỉ đặt từng nút theo toạ độ này.
 */

export const NODE_SIZE = 76;
export const ROW_GAP = 132;
export const TOP_PAD = 56;
export const LABEL_WIDTH = 176;

export type NodePoint = { x: number; y: number; side: 'left' | 'right' };

export function layoutPath(count: number, width: number): { points: NodePoint[]; height: number } {
  const w = Math.max(280, width);
  // Tâm nút nằm cách mép 30% chiều rộng; nhãn đứng cạnh nút, không tràn khung.
  const leftX = Math.round(w * 0.3);
  const rightX = Math.round(w * 0.7);
  const points: NodePoint[] = [];
  for (let i = 0; i < count; i += 1) {
    const side = i % 2 === 0 ? 'left' : 'right';
    points.push({ x: side === 'left' ? leftX : rightX, y: TOP_PAD + i * ROW_GAP + NODE_SIZE / 2, side });
  }
  const height = TOP_PAD * 2 + Math.max(0, count - 1) * ROW_GAP + NODE_SIZE;
  return { points, height };
}

/** Đường cong nối các tâm nút liên tiếp, dạng SVG path (đường cong bậc ba theo chiều dọc). */
export function curvePath(points: NodePoint[]): string {
  if (points.length < 2) return '';
  let d = `M ${points[0]!.x} ${points[0]!.y}`;
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1]!;
    const b = points[i]!;
    const midY = (a.y + b.y) / 2;
    d += ` C ${a.x} ${midY}, ${b.x} ${midY}, ${b.x} ${b.y}`;
  }
  return d;
}
