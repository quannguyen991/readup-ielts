/**
 * "DU NGOẠN BAND 9" — kiểu dùng chung giữa logic (`services/travel`), kho
 * (`store/useTravelStore`), dữ liệu bản đồ (`data/travel`) và bộ vẽ 2D
 * (`components/travel`). Xem docs/ke-hoach-du-ngoan-the-gioi.md.
 *
 * Giữ tệp này MỎNG và ổn định: hai bên (logic/UI và bộ vẽ) cùng dựa vào nó.
 */
import type { Bi } from '@/i18n/useL';

export type CityId =
  | 'hanoi' | 'danang' | 'hochiminh' | 'singapore' | 'london' | 'paris' | 'amsterdam' | 'rome'
  | 'tokyo' | 'seoul' | 'newyork' | 'istanbul' | 'cairo' | 'sydney' | 'mexicocity' | 'rio' | 'capetown' | 'marrakech' | 'shanghai';

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
  /** Vai trò dùng để mở hội thoại AI tự do khi người chơi bắt chuyện. */
  chatPersona?: 'staff' | 'local' | 'traveller' | 'vendor' | 'student' | 'elder' | 'guide';
  /** Tên hiển thị tuỳ chọn của nhân vật. */
  chatName?: Bi;
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
  /**
   * (Thêm bởi bộ vẽ) NHIỀU MẢNH: thế giới lớn ghép từ nhiều ảnh đất, mỗi mảnh đặt ở độ lệch NGUYÊN (điểm nguồn) trong
   * thế giới. Khi có `panels`, `size` của bản đồ/ảnh là hộp bao cả thế giới; `smallSrc` = mảnh đầu (mảnh gốc, trên-trái).
   * Mảnh nào không tải được (trừ mảnh đầu) thì vùng đó bị chặn và vật/địa điểm nằm trong đó bị bỏ.
   */
  panels?: { src: string; x: number; y: number; w?: number; h?: number }[];
  /** Bề rộng vùng chồng giữa hai mảnh kề nhau (điểm nguồn), hoà bằng mặt nạ Bayer; mặc định 20, 0 = cắt thẳng. */
  blend?: number;
  /** Chỗ nối giữa hai mảnh (toạ độ thế giới): lưới đi được được khoét thông quanh điểm này. `from`/`to` là chỉ số trong `panels`. */
  links?: { from: number; to: number; x: number; y: number; r?: number }[];
  /** Phần ảnh vẽ đè lên người đứng phía sau (hiếm dùng): cắt từ ảnh; che người có chân ở y < baseY. */
  occluders?: { x: number; y: number; w: number; h: number; baseY: number }[];
  /** Nguồn sáng ban đêm (đèn đường, cửa sổ): điểm nguồn + bán kính. */
  lights?: { x: number; y: number; r: number }[];
};

/**
 * (Thêm bởi bộ vẽ) CHẾ ĐỘ ĐỐI TƯỢNG (kiểu Bến Dừa): `image` là ảnh ĐẤT trống (không nhà) + lưới đi được; mỗi nhà /
 * công trình là một `MapObject` đứng riêng (sprite có mặt tiền + cửa), xếp theo độ sâu cùng người chơi, có thể vào cửa.
 * Toạ độ là điểm nguồn của ảnh đất (418×235).
 */
export type SceneSprite = {
  w: number;
  h: number;
  /** Absolute public asset path; use this when a city reuses a shared 2D prop. */
  src?: string;
  /** Tệp trong `/travel/sprites/<cityId>/`; mặc định `<id>.png`. */
  file?: string;
  /** Cắt một phần của tệp (bảng nhiều vật). */
  crop?: { x: number; y: number; w: number; h: number };
  /** Xoá các hình chữ nhật (toạ độ sau khi cắt) — để tách vật dính nhau trong bảng. */
  erase?: { x: number; y: number; w: number; h: number }[];
};

export type MapObject = {
  id: string;
  /** Mã trong `scene.sprites`. */
  sprite: string;
  /** GIỮA-ĐÁY của sprite trên mặt đất (điểm nguồn). */
  x: number;
  y: number;
  poiId?: string;
  /** Chỗ người chơi phải đứng để vào, tính từ giữa-đáy. */
  door?: { dx: number; dy: number };
  /** Vùng va chạm, TƯƠNG ĐỐI giữa-đáy (x,y là góc trên-trái so với giữa-đáy; thường là ~40% dưới của sprite). */
  footprint: { x: number; y: number; w: number; h: number };
  /** Quầng sáng ban đêm, tương đối giữa-đáy. */
  glow?: { dx: number; dy: number; r: number };
  /** Cộng thêm vào khoá xếp độ sâu (hiếm dùng). */
  z?: number;
};

export type ObjectScene = {
  sprites: Record<string, SceneSprite>;
  objects: MapObject[];
  /** Số NPC đi dạo ngẫu nhiên thêm vào (mặc định 8). */
  ambient?: number;
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
  /** (Thêm bởi bộ vẽ, tuỳ chọn) vật đứng riêng trên ảnh đất; cần `image` là ảnh đất. */
  scene?: ObjectScene;
  /** (Tuỳ chọn) bản lưới có phòng trong: vào các địa điểm trong nhà thì mở phòng như bản ảnh. */
  interiors?: boolean;
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
  /**
   * Bộ từ người học TỰ CHỌN để học khi du ngoạn (mã `VOCAB_TOPICS` / `listening-*`). Rỗng / thiếu =
   * theo lộ trình (nếu biết) rồi bộ mặc định của địa điểm. Theo `updatedAt` khi gộp hai máy.
   * Điểm hộ chiếu và quà đã nhận KHÔNG có trường riêng: nằm trong `ledger` (`pp:` / `pc:`).
   */
  decks?: string[];
};
