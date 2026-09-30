/**
 * NỘI THẤT đổi bằng sao cho nhà trong Thành phố Tri thức. Chỉ là dữ liệu (không
 * phụ thuộc gì) để cửa hàng sao và máy chủ nhập được mà không kéo luật thành phố.
 * Luật bày đồ ở `services/city/life.ts`; hình vẽ ở `components/city/home`.
 */
export type FurnitureKind = 'floor' | 'rug' | 'wall';
export type Furniture = { id: string; vi: string; glyph: string; size: [number, number]; kind: FurnitureKind; price: number; color: string; height: number };

export const FURNITURE: readonly Furniture[] = [
  { id: 'bed', vi: 'Giường gỗ', glyph: '🛏️', size: [2, 3], kind: 'floor', price: 120, color: '#60A5FA', height: 0.55 },
  { id: 'desk', vi: 'Bàn học', glyph: '🪑', size: [2, 1], kind: 'floor', price: 90, color: '#B45309', height: 0.8 },
  { id: 'chair', vi: 'Ghế xoay', glyph: '💺', size: [1, 1], kind: 'floor', price: 40, color: '#334155', height: 0.9 },
  { id: 'bookshelf', vi: 'Giá sách', glyph: '📚', size: [2, 1], kind: 'floor', price: 110, color: '#92400E', height: 1.9 },
  { id: 'sofa', vi: 'Sofa êm', glyph: '🛋️', size: [3, 1], kind: 'floor', price: 150, color: '#F472B6', height: 0.8 },
  { id: 'table', vi: 'Bàn trà', glyph: '🟫', size: [2, 2], kind: 'floor', price: 70, color: '#D97706', height: 0.45 },
  { id: 'lamp', vi: 'Đèn cây', glyph: '💡', size: [1, 1], kind: 'floor', price: 45, color: '#FDE047', height: 1.6 },
  { id: 'plant', vi: 'Chậu cây', glyph: '🪴', size: [1, 1], kind: 'floor', price: 35, color: '#22C55E', height: 1.1 },
  { id: 'aquarium', vi: 'Bể cá', glyph: '🐠', size: [2, 1], kind: 'floor', price: 160, color: '#38BDF8', height: 1.1 },
  { id: 'terrarium', vi: 'Hộp nuôi bọ', glyph: '🪲', size: [1, 1], kind: 'floor', price: 90, color: '#84CC16', height: 0.9 },
  { id: 'piano', vi: 'Đàn piano', glyph: '🎹', size: [2, 1], kind: 'floor', price: 220, color: '#111827', height: 1.2 },
  { id: 'tv', vi: 'Kệ ti vi', glyph: '📺', size: [2, 1], kind: 'floor', price: 130, color: '#1F2937', height: 1.1 },
  { id: 'globe', vi: 'Quả địa cầu', glyph: '🌏', size: [1, 1], kind: 'floor', price: 60, color: '#0EA5E9', height: 1.0 },
  { id: 'trophy', vi: 'Tủ cúp', glyph: '🏆', size: [1, 1], kind: 'floor', price: 140, color: '#EAB308', height: 1.7 },
  { id: 'rug-round', vi: 'Thảm tròn', glyph: '🟣', size: [3, 3], kind: 'rug', price: 60, color: '#A78BFA', height: 0.03 },
  { id: 'rug-long', vi: 'Thảm dài', glyph: '🟥', size: [2, 4], kind: 'rug', price: 55, color: '#F87171', height: 0.03 },
  { id: 'poster', vi: 'Tranh IELTS 8.0', glyph: '🖼️', size: [2, 1], kind: 'wall', price: 50, color: '#F59E0B', height: 1.0 },
  { id: 'clock', vi: 'Đồng hồ treo', glyph: '🕰️', size: [1, 1], kind: 'wall', price: 40, color: '#F8FAFC', height: 0.7 },
  { id: 'window', vi: 'Cửa sổ vườn', glyph: '🪟', size: [2, 1], kind: 'wall', price: 70, color: '#BAE6FD', height: 1.1 },
];

export function furnitureById(id: string): Furniture | undefined {
  return FURNITURE.find((f) => f.id === id);
}

/** Mã món trong cửa hàng sao ứng với một món nội thất. */
export const furnitureShopId = (id: string) => `home-${id}`;

