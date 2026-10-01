/**
 * Nền bản đồ thế giới của "Du ngoạn Band 9": lục địa cách điệu trên lưới 56×32 ô,
 * sinh bằng mã từ vài hình elip — không có tệp ảnh. Mỗi ô là một "điểm ảnh to"
 * nên bờ biển ra bậc thang kiểu pixel.
 */
export const WORLD_W = 56;
export const WORLD_H = 32;

type Blob = { cx: number; cy: number; rx: number; ry: number };

const BLOBS: Blob[] = [
  { cx: 7, cy: 6, rx: 2.6, ry: 4.4 }, // Anh
  { cx: 2.5, cy: 5.5, rx: 1.2, ry: 1.8 }, // Ireland
  { cx: 19, cy: 1.5, rx: 6, ry: 2.2 }, // Bắc Âu
  { cx: 18, cy: 10, rx: 8, ry: 6.5 }, // châu Âu
  { cx: 40, cy: 8, rx: 16, ry: 7 }, // châu Á
  { cx: 8, cy: 16, rx: 3.6, ry: 3.2 }, // Iberia
  { cx: 22.5, cy: 19, rx: 1.7, ry: 4.5 }, // Ý
  { cx: 18, cy: 26, rx: 11, ry: 6.3 }, // châu Phi
  { cx: 28, cy: 24, rx: 3, ry: 4 }, // sừng châu Phi
  { cx: 31, cy: 17, rx: 4.5, ry: 3.5 }, // Trung Đông
  { cx: 38, cy: 19, rx: 3.2, ry: 4.6 }, // Ấn Độ
  { cx: 38, cy: 22.5, rx: 1.8, ry: 3 },
  { cx: 45.5, cy: 18, rx: 2.6, ry: 5.5 }, // Đông Dương
  { cx: 46, cy: 24, rx: 1.2, ry: 2.5 }, // bán đảo Mã Lai
  { cx: 53, cy: 9, rx: 1, ry: 3.2 }, // Nhật Bản
  { cx: 51, cy: 27, rx: 3, ry: 1.6 }, // Borneo
  { cx: 43.5, cy: 27, rx: 3, ry: 1.1 }, // Sumatra
];

function inBlob(b: Blob, x: number, y: number): boolean {
  const dx = (x - b.cx) / b.rx;
  const dy = (y - b.cy) / b.ry;
  return dx * dx + dy * dy <= 1;
}

/** Ô (x, y) — tâm ô — có là đất không. */
export function isLand(x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= WORLD_W || y >= WORLD_H) return false;
  const px = x + 0.5;
  const py = y + 0.5;
  // Đảo nhỏ Singapore: hai ô sát mũi bán đảo.
  if (x === 46 && (y === 25 || y === 26)) return true;
  return BLOBS.some((b) => inBlob(b, px, py));
}

export type LandRun = { x: number; y: number; w: number; coast: boolean };

let cache: LandRun[] | null = null;

/** Các đoạn đất liền theo hàng (gộp ô liên tiếp cùng loại), `coast` = ô giáp biển. */
export function landRuns(): LandRun[] {
  if (cache) return cache;
  const runs: LandRun[] = [];
  for (let y = 0; y < WORLD_H; y += 1) {
    let start = -1;
    let coast = false;
    for (let x = 0; x <= WORLD_W; x += 1) {
      const land = x < WORLD_W && isLand(x, y);
      const edge = land && (!isLand(x - 1, y) || !isLand(x + 1, y) || !isLand(x, y - 1) || !isLand(x, y + 1));
      if (land && start >= 0 && edge === coast) continue;
      if (start >= 0) runs.push({ x: start, y, w: x - start, coast });
      if (land) {
        start = x;
        coast = edge;
      } else {
        start = -1;
      }
    }
  }
  cache = runs;
  return runs;
}

/** Vài ô "sóng" rải rác trên biển (xác định, không ngẫu nhiên theo lần vẽ). */
export function waveCells(): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  for (let y = 0; y < WORLD_H; y += 1)
    for (let x = 0; x < WORLD_W; x += 1) {
      if (isLand(x, y)) continue;
      const h = Math.imul(x * 73856093, 1) ^ Math.imul(y * 19349663, 1);
      if ((h >>> 0) % 11 === 0) out.push({ x, y });
    }
  return out;
}
