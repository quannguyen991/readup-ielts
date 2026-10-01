/**
 * "DU NGOẠN BAND 9" — kiểu dùng chung giữa logic (`services/travel`), kho
 * (`store/useTravelStore`), dữ liệu bản đồ (`data/travel`) và bộ vẽ 2D
 * (`components/travel`). Xem docs/ke-hoach-du-ngoan-the-gioi.md.
 *
 * Giữ tệp này MỎNG và ổn định: hai bên (logic/UI và bộ vẽ) cùng dựa vào nó.
 */
import type { Bi } from '@/i18n/useL';

export type CityId = 'hanoi' | 'singapore' | 'london' | 'paris' | 'amsterdam' | 'rome';

export type Level = 1 | 2 | 3;

/** Loại câu hỏi trong một lượt tham quan (xem mục 5.2 của kế hoạch). */
export type QuestionType = 'cloze' | 'reply' | 'dictation' | 'listen-pick' | 'order' | 'translate' | 'speak';

export type PoiKind =
  | 'airport'
  | 'counter'
  | 'cafe'
  | 'restaurant'
  | 'hotel'
  | 'station'
  | 'market'
  | 'museum'
  | 'garden'
  | 'landmark'
  | 'secret';

/** Điểm trên lưới ô (đơn vị: ô, không phải pixel). */
export type Tile = { x: number; y: number };

export type Poi = {
  id: string;
  kind: PoiKind;
  name: Bi;
  /** Ô đứng để vào địa điểm. */
  door: Tile;
  /** Vùng chiếm của công trình, gồm góc trên-trái và kích thước theo ô. */
  footprint: { x: number; y: number; w: number; h: number };
  content: {
    /** Mã bộ từ trong `VOCAB_TOPICS` / bộ nghe (`listening-*`). */
    decks: string[];
    types: QuestionType[];
    level: Level;
  };
  unlock?: { after?: string; minStars?: number };
  reward: { coins: number; souvenir?: string };
  /**
   * (Thêm bởi bộ vẽ) Mã sprite vẽ ở chỗ công trình: hình biểu tượng (`lm_mbs`…) hoặc mặt tiền
   * sinh theo kích thước (`fac:cafe:CAFE`). Bỏ trống → mặt tiền theo `kind`. Hình neo ở GIỮA-ĐÁY
   * của `footprint` và có thể vươn lên trên vùng chiếm.
   */
  sprite?: string;
  /**
   * (Thêm bởi bộ vẽ) CHẾ ĐỘ ẢNH: vùng bấm trên ảnh nền, theo ĐIỂM NGUỒN (ảnh nhỏ 418×235). Khi bản đồ
   * có `image`, `door` cũng theo điểm nguồn (chỗ đứng để vào) và `footprint` = đúng `hotspot` (giữ cho hợp kiểu).
   */
  hotspot?: { x: number; y: number; w: number; h: number };
};

export type Npc = {
  id: string;
  /** Mã sprite trong atlas. */
  sprite: string;
  at: Tile;
  /** Đường đi lặp (ô); không có thì đứng yên. */
  path?: Tile[];
  /** Câu thoại tiếng Anh ngắn + dịch. */
  lines: { en: string; vi: string }[];
};

export type WeatherPlan = {
  kind: 'clear' | 'rain' | 'drizzle' | 'fog' | 'wind' | 'shower-evening';
  /** 0..1 */
  intensity: number;
};

/** (Thêm bởi bộ vẽ) Tuyến xe / thuyền / người đi lặp; toạ độ là ô (có thể ngoài lưới để vào-ra khỏi màn hình). */
export type Route = {
  id: string;
  sprite: string;
  path: Tile[];
  /** ô / giây */
  speed: number;
  /** số xe đi cùng lúc, cách đều (mặc định 1) */
  count?: number;
  /** true: hết đường quay về đầu; false/bỏ trống: đi tới rồi lùi lại */
  loop?: boolean;
  /** 'sky': bay trên trời có bóng đổ xuống đất (máy bay) */
  layer?: 'ground' | 'sky';
};

/**
 * (Thêm bởi bộ vẽ) CHẾ ĐỘ ẢNH — nền là tranh pixel-art dựng sẵn thay cho lưới ô. Mọi toạ độ (spawn, cửa, NPC,
 * tuyến, vùng chạm) là ĐIỂM NGUỒN của ảnh nhỏ `smallSrc` (mỗi điểm = `scale` điểm của `src`).
 * Khi có `image`: `size` = cỡ ảnh nhỏ theo điểm nguồn và `layers` để trống.
 */
export type ImageLayer = {
  /** Ảnh phóng ×scale (dùng làm dự phòng / xem trước). */
  src: string;
  /** Ảnh gốc nhỏ (điểm nguồn 1:1) — bộ vẽ dùng ảnh này rồi tự phóng nguyên lần. */
  smallSrc?: string;
  scale: number;
  size: { w: number; h: number };
  /**
   * Lưới thô mô tả mặt đất, mỗi ô `cell` điểm nguồn: '#' đi được, '~' nước (cho sóng/thuyền), '.' chặn.
   * `rows[j][i]` ứng với điểm nguồn (i*cell, j*cell).
   */
  mask: { cell: number; rows: string[] };
  /** Phần ảnh vẽ đè lên người đứng phía sau (hiếm dùng): cắt từ ảnh; che người có chân ở y < baseY. */
  occluders?: { x: number; y: number; w: number; h: number; baseY: number }[];
  /** Nguồn sáng ban đêm (đèn đường, cửa sổ): điểm nguồn + bán kính. */
  lights?: { x: number; y: number; r: number }[];
};

export type CityMap = {
  id: CityId;
  name: Bi;
  /** Múi giờ IANA, chỉ để tính giờ ngày/đêm (cộng độ lệch cố định, không dùng biến TZ). */
  utcOffsetHours: number;
  /** Bảng màu của thành phố (mã trong `data/travel/palettes`). */
  palette: string;
  size: { w: number; h: number };
  /** Lưới ký tự → mã ô; mỗi lớp `size.h` dòng dài `size.w`. */
  layers: { ground: string[]; objects: string[]; roofs: string[] };
  spawn: Tile;
  pois: Poi[];
  npcs: Npc[];
  /** (Thêm bởi bộ vẽ, tuỳ chọn) tuyến phương tiện/người đi lặp. */
  routes?: Route[];
  /** (Thêm bởi bộ vẽ, tuỳ chọn) chế độ ảnh nền; xem `ImageLayer`. */
  image?: ImageLayer;
  ambience: { weather: WeatherPlan; sounds: string[] };
};

export type SouvenirId = string;

/** Tiến độ của một địa điểm. `best`: 0 chưa/không đạt, 1 đạt, 2 tốt, 3 xuất sắc. */
export type PoiProgress = { best: 0 | 1 | 2 | 3; runs: number; level: Level; lastAt: string };

export type TravelState = {
  tickets: number;
  coins: number;
  city: CityId;
  pos: Tile;
  visited: Partial<Record<CityId, { stamp: boolean; firstAt: string }>>;
  poi: Record<string, PoiProgress>;
  souvenirs: Record<SouvenirId, true>;
  /** Sổ cái: mã khoản → số lượng đã cộng (vé/xu), để đồng bộ nhiều máy không cộng đôi. */
  ledger: Record<string, number>;
  passportLevel: number;
  /**
   * `custom`: số lượt hải quan đã làm hôm nay; `review`: vé ôn đã nhận; `stars`: vé đổi từ sao.
   * `reviewWords` (thêm sau): số từ ôn đúng hôm nay, cứ 10 từ thành 1 vé.
   */
  dailyCaps: { day: string; custom: number; review: number; stars: number; reviewWords?: number };
  prefs: { name: string; outfit: number; sound: boolean };
  /** Thêm sau (đều tuỳ chọn để không phá chỗ dựng TravelState có sẵn). */
  /** Đã qua màn giới thiệu chưa. */
  onboarded?: boolean;
  /** Mốc ISO của lần đổi gần nhất của `city` / `pos` / `prefs` — dùng khi gộp hai máy. */
  updatedAt?: string;
  /** Câu đã làm gần đây: khoá câu/từ → mốc ISO. Dùng để không hỏi lại trong 24 giờ. */
  seen?: Record<string, string>;
};
