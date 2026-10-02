/**
 * BỐ CỤC PHÒNG TRONG theo loại địa điểm — toạ độ điểm nguồn của ảnh phòng `/travel/interiors/<kind>.png`
 * (418×235; ảnh `.small.png` dùng 1:1, ảnh x4 được lấy mẫu gần nhất). Ảnh phòng là tranh nhìn từ trên xuống kiểu 3/4:
 * tường ở trên và hai bên, sàn đi được, cửa/bậc thềm ở ĐÁY GIỮA. Lưới đi được suy từ bố cục này (không đọc từ ảnh):
 * `floor` (chữ nhật đi được) trừ `blockers` (đồ đạc) cộng `doorway` (lối ra xuống mép đáy).
 * Muốn khớp ảnh mới chỉ cần chỉnh số ở đây.
 */
export type IRect = { x: number; y: number; w: number; h: number };
export type IPt = { x: number; y: number };

export const INTERIOR_SIZE = { w: 418, h: 235 } as const;

export type InteriorKindId = 'cafe' | 'restaurant' | 'hotel' | 'market' | 'museum' | 'station' | 'airport' | 'counter';
export const INTERIOR_KIND_IDS: InteriorKindId[] = ['cafe', 'restaurant', 'hotel', 'market', 'museum', 'station', 'airport', 'counter'];

export type InteriorLayout = {
  floor: IRect;
  blockers: IRect[];
  /** Lối ra: hình chữ nhật đi được nối sàn với mép đáy ảnh. */
  doorway: IRect;
  /** Điểm đứng của chủ quán / lễ tân (phía sau quầy). */
  host: IPt;
  /** Chỗ người chơi đứng nói chuyện với chủ. */
  hostFront: IPt;
  /** Điểm xuất hiện (ngay trong cửa). */
  spawn: IPt;
  /** Ô lối ra: chạm vào (hoặc bấm E gần đó) là ra ngoài. */
  exit: IPt;
  /** Quầy (để vẽ phòng dự phòng; ảnh thật tự vẽ quầy). */
  counter: IRect;
};

// Đo từ ảnh `/travel/interiors/cafe.small.png` (và restaurant — cùng bố cục): sàn x 30–388, y 62–198; quầy + tủ kính
// x 135–295, y 52–90; bậc thềm / cửa ở đáy giữa x ~178–242, y 196–226. Loại chưa có ảnh dùng chung các số này.
const FLOOR: IRect = { x: 30, y: 62, w: 358, h: 136 };
const DOORWAY: IRect = { x: 178, y: 196, w: 64, h: 30 };
const COUNTER: IRect = { x: 135, y: 52, w: 160, h: 38 };

const base = (blockers: IRect[], counter: IRect = COUNTER, over: Partial<Pick<InteriorLayout, 'host' | 'hostFront'>> = {}): InteriorLayout => ({
  floor: FLOOR,
  blockers: [counter, ...blockers],
  doorway: DOORWAY,
  host: over.host ?? { x: 209, y: 66 },
  hostFront: over.hostFront ?? { x: 209, y: 100 },
  spawn: { x: 209, y: 190 },
  exit: { x: 209, y: 216 },
  counter,
});

/** Bàn tròn + ghế của quán (đúng vị trí trên ảnh cafe/restaurant) và hai chậu cây hai bên cửa. */
const cafeTables: IRect[] = [
  { x: 28, y: 80, w: 70, h: 45 },
  { x: 28, y: 134, w: 70, h: 52 },
  { x: 318, y: 88, w: 66, h: 40 },
  { x: 325, y: 142, w: 62, h: 50 },
  { x: 152, y: 176, w: 24, h: 22 },
  { x: 244, y: 176, w: 24, h: 22 },
];

export const INTERIORS: Record<InteriorKindId, InteriorLayout> = {
  cafe: base(cafeTables),
  restaurant: base(cafeTables),
  // Đo từ ảnh hotel/market/museum/station trong /travel/interiors/ (cùng sàn, cửa và hai chậu như cafe).
  market: base([
    { x: 22, y: 80, w: 66, h: 105 }, // thùng, thùng tròn bên trái
    { x: 335, y: 82, w: 57, h: 108 },
    { x: 152, y: 176, w: 24, h: 22 },
    { x: 244, y: 176, w: 24, h: 22 },
  ]),
  hotel: base(
    [
      { x: 30, y: 75, w: 70, h: 100 }, // ghế sofa bên trái
      { x: 335, y: 82, w: 57, h: 98 }, // ghế bành + xe đẩy hành lý
      { x: 152, y: 176, w: 24, h: 22 },
      { x: 244, y: 176, w: 24, h: 22 },
    ],
    { x: 136, y: 52, w: 146, h: 36 },
  ),
  museum: base(
    [
      { x: 30, y: 55, w: 70, h: 50 }, // bệ khủng long
      { x: 22, y: 110, w: 68, h: 52 }, // tủ kính bình cổ
      { x: 330, y: 45, w: 60, h: 60 }, // tượng
      { x: 330, y: 110, w: 65, h: 52 }, // tủ kính phải
      { x: 20, y: 172, w: 70, h: 18 }, // ghế dài
      { x: 328, y: 172, w: 70, h: 18 },
    ],
    { x: 157, y: 42, w: 105, h: 38 },
    { host: { x: 209, y: 58 }, hostFront: { x: 209, y: 94 } },
  ),
  station: base([
    { x: 22, y: 85, w: 46, h: 47 },
    { x: 22, y: 140, w: 63, h: 40 },
    { x: 335, y: 85, w: 50, h: 47 },
    { x: 332, y: 142, w: 63, h: 40 },
  ]),
  // airport: quầy x135–270 + cổng soát x270–300 (liền quầy), ghế chờ hai bên
  airport: base(
    [
      { x: 35, y: 82, w: 40, h: 33 },
      { x: 20, y: 142, w: 70, h: 38 },
      { x: 320, y: 82, w: 70, h: 33 },
      { x: 325, y: 142, w: 60, h: 43 },
      { x: 152, y: 176, w: 24, h: 22 },
      { x: 244, y: 176, w: 24, h: 22 },
    ],
    { x: 135, y: 52, w: 165, h: 36 },
  ),
  // counter: bàn x136–292; kệ góc trên trái, bàn + ghế trái, giá tờ rơi góc trên phải, ghế dài phải
  counter: base(
    [
      { x: 37, y: 20, w: 43, h: 55 },
      { x: 25, y: 92, w: 60, h: 63 },
      { x: 328, y: 40, w: 42, h: 45 },
      { x: 328, y: 135, w: 64, h: 55 },
      { x: 152, y: 176, w: 24, h: 22 },
      { x: 244, y: 176, w: 24, h: 22 },
    ],
    { x: 136, y: 52, w: 156, h: 36 },
  ),
};
