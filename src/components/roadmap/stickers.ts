/**
 * Nhãn dán trang trí quanh bản đồ lộ trình (cây, đèn, ghế, đài phun nước, cầu biển, mây...).
 *
 * Mỗi nhãn là một PNG nền trong suốt trong public/roadmap/stickers/<file>. Vị trí `x`, `y` là tỉ lệ
 * (0–1) trên khung bản đồ; `size` là cạnh ảnh tính bằng px. Nhãn chỉ hiện khi `ready` là true,
 * tức là file đã có trong thư mục. Thêm ảnh xong thì đổi `ready` sang true.
 *
 * Danh sách prompt gọi ChatGPT nằm ở scripts/art/roadmap-stickers-prompts.md.
 */
export type Sticker = {
  id: string;
  file: string;
  x: number;
  y: number;
  size: number;
  ready: boolean;
};

export const STICKERS: Sticker[] = [
  { id: 'tree-left-top', file: 'tree-round.png', x: 0.04, y: 0.1, size: 150, ready: true },
  { id: 'lamp', file: 'lamp.png', x: 0.12, y: 0.22, size: 120, ready: true },
  { id: 'bench', file: 'bench.png', x: 0.14, y: 0.3, size: 110, ready: true },
  { id: 'cloud-right-top', file: 'cloud-1.png', x: 0.92, y: 0.04, size: 150, ready: true },
  { id: 'town-hall', file: 'town-hall.png', x: 0.88, y: 0.22, size: 170, ready: true },
  { id: 'tree-right-mid', file: 'bush-flowers.png', x: 0.86, y: 0.36, size: 120, ready: true },
  { id: 'sea-bridge', file: 'sea-bridge.png', x: 0.88, y: 0.56, size: 240, ready: true },
  { id: 'tree-left-low', file: 'tree-tall.png', x: 0.05, y: 0.62, size: 150, ready: true },
  { id: 'fountain', file: 'fountain.png', x: 0.2, y: 0.9, size: 170, ready: true },
  { id: 'signpost', file: 'signpost.png', x: 0.78, y: 0.1, size: 96, ready: true },
];

export const STICKER_BASE = '/roadmap/stickers/';
