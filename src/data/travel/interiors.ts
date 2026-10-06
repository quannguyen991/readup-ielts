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

export type InteriorKindId = 'cafe' | 'restaurant' | 'hotel' | 'market' | 'museum' | 'station' | 'airport' | 'counter' | 'garden' | 'landmark' | 'secret';
export const INTERIOR_KIND_IDS: InteriorKindId[] = ['cafe', 'restaurant', 'hotel', 'market', 'museum', 'station', 'airport', 'counter', 'garden', 'landmark', 'secret'];
export type InteriorZone = 'main' | 'platform';

export type InteriorLayout = {
  zone?: InteriorZone;
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
  /** Lối sang khu vực khác trong cùng một địa điểm; dùng cho cầu thang ga tàu. */
  portal?: { at: IPt; rect: IRect; destination: InteriorZone; spawn: IPt; label: { vi: string; en: string } };
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
  station: {
    ...base([
      { x: 22, y: 85, w: 46, h: 47 },
      { x: 22, y: 140, w: 63, h: 40 },
      { x: 332, y: 151, w: 55, h: 32 },
    ]),
    portal: {
      at: { x: 351, y: 112 },
      rect: { x: 315, y: 72, w: 78, h: 70 },
      destination: 'platform',
      spawn: { x: 114, y: 164 },
      label: { vi: 'SÂN GA ↓', en: 'PLATFORM ↓' },
    },
  },
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
  garden: base([
    { x: 24, y: 76, w: 48, h: 55 },
    { x: 347, y: 75, w: 48, h: 56 },
    { x: 45, y: 164, w: 74, h: 16 },
    { x: 299, y: 164, w: 74, h: 16 },
    { x: 188, y: 56, w: 42, h: 38 },
  ]),
  landmark: base([
    { x: 24, y: 78, w: 65, h: 84 },
    { x: 329, y: 78, w: 65, h: 84 },
    { x: 164, y: 50, w: 90, h: 40 },
    { x: 148, y: 170, w: 122, h: 20 },
  ], { x: 316, y: 54, w: 70, h: 32 }, { host: { x: 351, y: 61 }, hostFront: { x: 311, y: 103 } }),
  secret: base([
    { x: 26, y: 65, w: 60, h: 105 },
    { x: 332, y: 65, w: 60, h: 105 },
    { x: 145, y: 52, w: 130, h: 34 },
    { x: 57, y: 175, w: 65, h: 18 },
    { x: 296, y: 175, w: 65, h: 18 },
  ], { x: 146, y: 52, w: 128, h: 34 }),
};

/** Sân ga MRT bên dưới sảnh bán vé. Cầu thang phía trái dẫn ngược lên sảnh. */
export const STATION_PLATFORM: InteriorLayout = {
  zone: 'platform',
  floor: { x: 12, y: 61, w: 394, h: 137 },
  blockers: [{ x: 40, y: 62, w: 338, h: 68 }],
  doorway: { x: 18, y: 140, w: 64, h: 58 },
  host: { x: 212, y: 92 },
  hostFront: { x: 212, y: 141 },
  spawn: { x: 114, y: 164 },
  exit: { x: 48, y: 170 },
  counter: { x: 0, y: 0, w: 1, h: 1 },
  portal: {
    at: { x: 50, y: 169 },
    rect: { x: 18, y: 139, w: 64, h: 59 },
    destination: 'main',
    spawn: { x: 300, y: 130 },
    label: { vi: 'LÊN SẢNH ↑', en: 'UP TO CONCOURSE ↑' },
  },
};
