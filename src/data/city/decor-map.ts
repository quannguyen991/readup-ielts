/**
 * Gắn model trang trí TẢI VỀ (public/city/models, giấy phép ở
 * assets/city/LICENSES.json) vào công trình sinh bằng code.
 *
 * Mỗi mục đặt một model tại ĐIỂM NEO của công trình (`door`, `side`, `yard`,
 * `dock` — do bộ sinh công trình khai báo) hoặc tại vị trí tương đối trong khu
 * đất (`rel`: tỉ lệ theo nửa rộng / nửa sâu). Chỉ hiện từ công đoạn `from`
 * (mặc định 8 — cảnh quan / nghiệm thu) trở đi.
 *
 * Model chỉ được nạp khi thành phố có công trình dùng tới nó (và kỷ đã mở) —
 * không tải trước cả bộ.
 */
import type { Anchor } from '@/services/city/procgen/parts';

export type DecorModel =
  | 'barrel_03'
  | 'wooden_barrels_01'
  | 'stone_fire_pit'
  | 'vintage_oil_lamp'
  | 'handsaw_wood'
  | 'WoodenChair_01'
  | 'WoodenTable_01'
  | 'stone_01'
  | 'painted_wooden_bench'
  | 'planter_pot_clay'
  | 'street_lamp_01'
  | 'street_lamp_02'
  | 'tool_cart';

export const DECOR_MODELS: readonly DecorModel[] = [
  'barrel_03',
  'wooden_barrels_01',
  'stone_fire_pit',
  'vintage_oil_lamp',
  'handsaw_wood',
  'WoodenChair_01',
  'WoodenTable_01',
  'stone_01',
  'painted_wooden_bench',
  'planter_pot_clay',
  'street_lamp_01',
  'street_lamp_02',
  'tool_cart',
];

/** Kỷ sớm nhất cần tới model (nạp lười theo kỷ). */
export const MODEL_ERA: Record<DecorModel, number> = {
  stone_fire_pit: 1,
  vintage_oil_lamp: 1,
  stone_01: 1,
  barrel_03: 1,
  tool_cart: 1,
  handsaw_wood: 1,
  wooden_barrels_01: 2,
  WoodenChair_01: 2,
  WoodenTable_01: 2,
  painted_wooden_bench: 3,
  planter_pot_clay: 3,
  street_lamp_01: 3,
  street_lamp_02: 4,
};

export type DecorPlacement = {
  model: DecorModel;
  /** Điểm neo của công trình; không có thì dùng `rel`. */
  anchor?: Anchor['tag'];
  /** Vị trí tương đối trong khu đất: [x, z] theo tỉ lệ nửa rộng / nửa sâu (−1..1). */
  rel?: [number, number];
  /** Dời thêm (đơn vị ô, toạ độ cục bộ của công trình). */
  offset?: [number, number, number];
  /** Xoay thêm quanh trục đứng (radian). */
  ry?: number;
  scale?: number;
  /** Hiện từ công đoạn nào (0..8; 9 = chỉ khi hoàn thành). */
  from?: number;
};

const civic: DecorPlacement[] = [
  { model: 'street_lamp_01', anchor: 'door', offset: [0.45, -0.1, 0] },
  { model: 'painted_wooden_bench', anchor: 'side', ry: Math.PI / 2 },
];

/** Theo mã công trình (hoặc khoá `decor` trong catalog). */
export const DECOR: Record<string, readonly DecorPlacement[]> = {
  tent: [{ model: 'vintage_oil_lamp', anchor: 'door', offset: [0.12, -0.1, 0] }],
  campfire: [{ model: 'stone_01', rel: [0.7, -0.7], scale: 0.45 }],
  well: [{ model: 'barrel_03', rel: [0.72, 0.65], scale: 0.8 }],
  depot: [
    { model: 'barrel_03', anchor: 'yard' },
    { model: 'tool_cart', anchor: 'side', ry: 0.6 },
  ],
  house_wood: [
    { model: 'WoodenChair_01', anchor: 'door', offset: [0.18, -0.1, 0], ry: 0.3 },
    { model: 'barrel_03', anchor: 'side' },
  ],
  warehouse: [{ model: 'wooden_barrels_01', rel: [0.2, 0.82] }],
  dock: [
    { model: 'wooden_barrels_01', anchor: 'dock', scale: 0.8 },
    { model: 'barrel_03', anchor: 'side' },
  ],
  house_brick: [
    { model: 'planter_pot_clay', anchor: 'door', offset: [-0.2, -0.1, 0] },
    { model: 'painted_wooden_bench', anchor: 'side', ry: Math.PI / 2 },
  ],
  townhouse: [
    { model: 'planter_pot_clay', anchor: 'door', offset: [0.3, -0.1, 0] },
    { model: 'street_lamp_01', anchor: 'side' },
  ],
  market: [
    { model: 'WoodenTable_01', anchor: 'yard' },
    { model: 'WoodenChair_01', anchor: 'yard', offset: [0.28, 0, 0.1], ry: -1.2 },
    { model: 'wooden_barrels_01', anchor: 'side', scale: 0.8 },
  ],
  park: [
    { model: 'painted_wooden_bench', rel: [-0.55, 0.7] },
    { model: 'street_lamp_01', rel: [0.75, 0.75] },
    { model: 'stone_fire_pit', rel: [0.45, -0.5], scale: 0.7 },
  ],
  vocab_house: [{ model: 'planter_pot_clay', anchor: 'door', offset: [0.3, -0.1, 0], from: 8 }],
  listen_house: [{ model: 'planter_pot_clay', anchor: 'door', offset: [0.3, -0.1, 0], from: 8 }],
  reading_house: [{ model: 'WoodenTable_01', anchor: 'side', ry: Math.PI / 2 }],
  school: civic,
  library: civic,
  post_office: civic,
  hospital: civic,
  academy: civic,
  fountain_plaza: [
    { model: 'street_lamp_02', rel: [-0.85, -0.85] },
    { model: 'street_lamp_02', rel: [0.85, 0.85], ry: Math.PI },
  ],
  station: [{ model: 'street_lamp_02', rel: [0.85, 0.8] }],
  lighthouse: [{ model: 'stone_01', rel: [-0.7, 0.6], scale: 0.7 }],
  power_station: [{ model: 'tool_cart', anchor: 'side', ry: -0.4 }],
};

/** Đồ nghề đặt ở góc công trường khi đội đang làm (công đoạn 1–7). */
export const SITE_TOOLS: readonly DecorPlacement[] = [
  { model: 'tool_cart', rel: [0.78, -0.72], ry: 0.8 },
  { model: 'handsaw_wood', rel: [0.62, -0.5], offset: [0, 0.01, 0], ry: 1.2 },
];
