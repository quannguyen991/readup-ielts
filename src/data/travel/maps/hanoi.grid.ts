/**
 * HÀ NỘI — BẢN LƯỚI (M3: 40 địa điểm, đối chiếu Google Maps). Vẽ bằng mã trên lưới ô 128×96, bố cục cố định
 * (hạt giống cố định) để test được.
 *
 * Vị trí địa điểm: lấy TOẠ ĐỘ thật từ Google Maps (`GEO` bên dưới), quy đổi lên lưới theo tỉ lệ 8 ô/km với tâm hồ
 * Hoàn Kiếm ở ô (80,50). Sau đó mỗi địa điểm được đặt vào ô đất trống gần nhất (không đè nước, đường, nhau).
 * Vì vậy hướng và thứ tự khoảng cách giữ đúng, còn khoảng cách chỉ gần đúng: cả lưới chỉ 128×96 ô.
 * Hồ Tây được vẽ nhỏ hơn và lệch về phía tây so với thật; các địa điểm quanh hồ Tây vẫn đặt theo toạ độ của chúng.
 */
import type { CityMap, Npc, Poi, PoiKind, Route, Tile } from '@/services/travel/types';
import { poisOfCity } from '../pois';
import { doorOf, MapBuilder } from './builder';
import { withCatalog } from './imagemap';
import { mulberry32 } from '../sprites/paint';

const W = 128;
const H = 96;

const FACADE: Partial<Record<PoiKind, string>> = {
  airport: 'terminal',
  market: 'market',
  restaurant: 'restaurant',
  cafe: 'cafe',
  museum: 'museum',
  hotel: 'hotel',
  station: 'station',
  garden: 'garden',
  landmark: 'hall',
};

const LABEL: Record<string, string> = {
  airport: 'AIRPORT',
  market: 'MARKET',
  restaurant: 'FOOD',
  cafe: 'CAFE',
  museum: 'MUSEUM',
  hotel: 'HOTEL',
  station: 'STATION',
  garden: 'PARK',
  landmark: 'SIGHT',
};

type Rect = { x: number; y: number; w: number; h: number };

/**
 * Địa điểm và toạ độ. `lat/lon`: trang địa điểm trên Google Maps (tham số !3d/!4d), kiểm ngày 11/10/2026.
 * `generic`: mẫu chung (quán vỉa hè, nhà ống), không phải địa điểm cụ thể có toạ độ thật.
 * `w × h`: cỡ vùng chiếm, theo ô.
 */
export type Geo = { slug: string; lat: number; lon: number; w: number; h: number; generic?: boolean };
export const HANOI_GEO: Geo[] = [
  // Công trình và địa điểm có toạ độ thật
  { slug: 'gate', lat: 21.2178001, lon: 105.8025514, w: 8, h: 4 },
  { slug: 'counter', lat: 21.023295, lon: 105.841378, w: 6, h: 4 },
  { slug: 'dongxuan', lat: 21.0381434, lon: 105.8500387, w: 5, h: 3 },
  { slug: 'thaprua', lat: 21.0278365, lon: 105.8522734, w: 3, h: 2 },
  { slug: 'vanmieu', lat: 21.0281175, lon: 105.8356692, w: 8, h: 4 },
  { slug: 'flowers', lat: 21.0676456, lon: 105.8274244, w: 6, h: 4 },
  { slug: 'biahoi', lat: 21.0353683, lon: 105.8524343, w: 4, h: 3 },
  { slug: 'puppet', lat: 21.0316826, lon: 105.8533466, w: 6, h: 4 },
  { slug: 'opera', lat: 21.0242501, lon: 105.8576249, w: 6, h: 4 },
  { slug: 'doanmon', lat: 21.0406784, lon: 105.840762, w: 8, h: 4 },
  { slug: 'tranquoc', lat: 21.047871, lon: 105.8368738, w: 6, h: 4 },
  { slug: 'longbien', lat: 21.043057, lon: 105.8578368, w: 6, h: 4 },
  { slug: 'mausoleum', lat: 21.0368973, lon: 105.8346667, w: 8, h: 4 },
  { slug: 'motcot', lat: 21.0358725, lon: 105.8336273, w: 6, h: 4 },
  { slug: 'ngocson', lat: 21.0306489, lon: 105.8524098, w: 5, h: 3 },
  { slug: 'nhatholon', lat: 21.0285957, lon: 105.8488606, w: 6, h: 4 },
  { slug: 'buudien', lat: 21.0266056, lon: 105.8538003, w: 5, h: 3 },
  { slug: 'lichsu', lat: 21.0247173, lon: 105.8597239, w: 5, h: 3 },
  { slug: 'hoalo', lat: 21.0253297, lon: 105.8464781, w: 5, h: 3 },
  { slug: 'quansu', lat: 21.0244934, lon: 105.8453387, w: 4, h: 3 },
  { slug: 'hangma', lat: 21.0366791, lon: 105.8478172, w: 6, h: 3 },
  { slug: 'cotco', lat: 21.0325556, lon: 105.8398039, w: 4, h: 4 },
  { slug: 'badinh', lat: 21.0372679, lon: 105.8358367, w: 6, h: 3 },
  { slug: 'quanthanh', lat: 21.0430155, lon: 105.8365426, w: 5, h: 4 },
  { slug: 'phutayho', lat: 21.0551012, lon: 105.8197288, w: 6, h: 4 },
  { slug: 'kimlien', lat: 21.0585474, lon: 105.8330295, w: 5, h: 3 },
  { slug: 'godongda', lat: 21.011981, lon: 105.824451, w: 5, h: 4 },
  { slug: 'huonglien', lat: 21.0181373, lon: 105.8538926, w: 5, h: 3 },
  { slug: 'dantoc', lat: 21.0403422, lon: 105.7987354, w: 6, h: 4 },
  { slug: 'keangnam', lat: 21.0167533, lon: 105.7837738, w: 6, h: 4 },
  { slug: 'chollongbien', lat: 21.0412679, lon: 105.8504815, w: 6, h: 4 },
  { slug: 'cafegiang', lat: 21.0334664, lon: 105.854518, w: 4, h: 3 },
  { slug: 'banhmichao', lat: 21.0100501, lon: 105.8488412, w: 5, h: 3 },
  { slug: 'honguom', lat: 21.022074, lon: 105.8521728, w: 6, h: 4 },
  // Mẫu chung: quán vỉa hè và nhà ống, không có toạ độ thật
  { slug: 'board', lat: 21.217, lon: 105.804, w: 5, h: 3, generic: true },
  { slug: 'pho', lat: 21.034, lon: 105.8492, w: 5, h: 3, generic: true },
  { slug: 'eggcoffee', lat: 21.0322, lon: 105.852, w: 5, h: 3, generic: true },
  { slug: 'oldquarter', lat: 21.035, lon: 105.8468, w: 6, h: 4, generic: true },
  { slug: 'buncha', lat: 21.033, lon: 105.8485, w: 5, h: 3, generic: true },
  { slug: 'banhmi', lat: 21.03, lon: 105.8478, w: 5, h: 3, generic: true },
];

/** Toạ độ tâm hồ Hoàn Kiếm (ô (80,50)) và tỉ lệ lưới: 8 ô mỗi km, mỗi trục. */
const LAKE = { lat: 21.0288, lon: 105.8524 };
const TILES_PER_KM = 14;
export function geoToGrid(lat: number, lon: number): { x: number; y: number } {
  const kmE = (lon - LAKE.lon) * 103.9;
  const kmN = (lat - LAKE.lat) * 111.2;
  return { x: 80 + kmE * TILES_PER_KM, y: 50 - kmN * TILES_PER_KM };
}

/** Vị trí các địa điểm sau khi đặt lên lưới: slug → ô góc trên-trái. */
export type Slot = Rect & { slug: string };

/** Quán ăn có ghế nhựa trà đá ở vỉa hè trước cửa. */
const STREET_FOOD = ['pho', 'eggcoffee', 'banhmi', 'buncha', 'biahoi'];

/** Chỗ đứng của NPC (giữ trống, nhà và địa điểm không đè lên). */
const GUARD_AT = { x: 46, y: 45 };
const TOURIST_AT = { x: 100, y: 62 };
const TOURIST_PATH = { x: 90, y: 62 };

/**
 * Ô phố: đất giữa các đường lớn (đã trừ vỉa hè). Mỗi ô có viền đi bộ 1 ô phía trong để nối vỉa hè với ngõ.
 * Chỗ nào còn là cỏ mặc định mới được lát và xếp nhà; công viên, hồ và đường không thuộc ô phố.
 */
const BLOCKS: Rect[] = [
  // Hàng bắc (phía trên đường 34)
  { x: 0, y: 0, w: 28, h: 32 },
  { x: 34, y: 0, w: 28, h: 32 },
  { x: 68, y: 0, w: 28, h: 32 },
  { x: 102, y: 0, w: 4, h: 32 },
  { x: 112, y: 0, w: 16, h: 32 },
  // Hàng giữa (giữa đường 34 và 60)
  { x: 0, y: 38, w: 28, h: 20 },
  { x: 34, y: 38, w: 28, h: 20 },
  { x: 68, y: 38, w: 28, h: 20 },
  { x: 102, y: 38, w: 4, h: 20 },
  { x: 112, y: 38, w: 16, h: 20 },
  // Hàng dưới giữa (giữa đường 60 và 80)
  { x: 0, y: 64, w: 28, h: 14 },
  { x: 34, y: 64, w: 28, h: 14 },
  { x: 68, y: 64, w: 28, h: 14 },
  { x: 102, y: 64, w: 4, h: 14 },
  { x: 112, y: 64, w: 16, h: 14 },
  // Hàng nam (phía dưới đường 80)
  { x: 0, y: 84, w: 28, h: 12 },
  { x: 34, y: 84, w: 28, h: 12 },
  { x: 68, y: 84, w: 28, h: 12 },
  { x: 102, y: 84, w: 4, h: 12 },
  { x: 112, y: 84, w: 16, h: 12 },
];

/** Phố cổ Hoàn Kiếm: ô phố lát gạch cổ thay cho vỉa đá. */
const OLD_QUARTER: Rect = { x: 68, y: 38, w: 28, h: 20 };

const inEllipse = (x: number, y: number, cx: number, cy: number, rx: number, ry: number) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
const inRect = (x: number, y: number, r: Rect) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;

function buildHanoiGrid(): CityMap {
  const m = new MapBuilder(W, H, 'g');
  const water = (x: number, y: number) => m.ground[y]?.[x] === 'w';

  // Tô hình chữ nhật. `force` = tô cả lên nước (đường đắp, cầu); mặc định chỉ tô lên đất.
  const paint = (x: number, y: number, w: number, h: number, c: string, force = false) => {
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        const gx = x + i;
        const gy = y + j;
        if (gx < 0 || gy < 0 || gx >= W || gy >= H) continue;
        if (force || !water(gx, gy)) m.ground[gy]![gx] = c;
      }
    }
  };

  // Công viên và quảng trường (trên đất).
  paint(68, 12, 28, 9, 'P');
  paint(2, 18, 10, 14, 'f');
  paint(32, 36, 6, 20, 'f');
  paint(4, 40, 20, 16, 'f');
  paint(2, 64, 26, 14, 'f');
  paint(82, 66, 12, 10, 'f');
  paint(36, 84, 22, 10, 'f');
  paint(2, 84, 24, 10, 'f');

  // Nước: hồ Tây, hồ Hoàn Kiếm, sông Hồng.
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (inEllipse(x, y, 34, 20, 13, 10)) m.ground[y]![x] = 'w';
    }
  }
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (inEllipse(x, y, 80, 50, 7, 5)) m.ground[y]![x] = 'w';
      else if (inEllipse(x, y, 80, 50, 9, 7)) m.ground[y]![x] = 'p';
    }
  }
  paint(106, 0, 6, H, 'w', true);

  // Vỉa hè hai bên các đường lớn (chỉ tô lên đất).
  const hRoads = [
    { y: 34, x0: 0, x1: 105 },
    { y: 60, x0: 0, x1: 105 },
    { y: 80, x0: 0, x1: 105 },
    { y: 46, x0: 98, x1: 117 },
  ];
  const vRoads = [
    { x: 30, y0: 0, y1: H - 1 },
    { x: 64, y0: 0, y1: H - 1 },
    { x: 98, y0: 0, y1: H - 1 },
  ];
  for (const r of hRoads) {
    paint(r.x0, r.y - 2, r.x1 - r.x0 + 1, 2, 'p');
    paint(r.x0, r.y + 2, r.x1 - r.x0 + 1, 2, 'p');
  }
  for (const r of vRoads) {
    paint(r.x - 2, r.y0, 2, r.y1 - r.y0 + 1, 'p');
    paint(r.x + 2, r.y0, 2, r.y1 - r.y0 + 1, 'p');
  }

  // Đường lớn (đè lên nước: đường đắp qua hồ Tây và cầu qua sông Hồng).
  for (const r of hRoads) paint(r.x0, r.y, r.x1 - r.x0 + 1, 2, 'r', true);
  for (const r of vRoads) paint(r.x, r.y0, 2, r.y1 - r.y0 + 1, 'r', true);
  for (let x = 2; x < 106; x += 6) m.ground[34]![x] = 'h';
  for (let x = 2; x < 106; x += 6) m.ground[60]![x] = 'h';
  for (let y = 2; y < H; y += 6) m.ground[y]![30] = 'v';

  // Ô phố: cỏ mặc định còn lại trong ô được lát vỉa đá (phố cổ lát gạch). Làm TRƯỚC khi vẽ đảo,
  // để đảo (vẽ đè lên nước) không bị coi là ô phố.
  const blockZone = new Uint8Array(W * H);
  for (const b of BLOCKS) {
    for (let y = b.y; y < b.y + b.h; y++) {
      for (let x = b.x; x < b.x + b.w; x++) {
        if (m.ground[y]![x] !== 'g') continue;
        blockZone[y * W + x] = 1;
        m.ground[y]![x] = inRect(x, y, OLD_QUARTER) ? 'c' : 'p';
      }
    }
  }

  // Hai đảo: đảo Ngọc Sơn ở bờ bắc (nối bờ bằng cầu Thê Húc) và đảo Tháp Rùa ở giữa hồ. Đảo là đất đi được.
  const islandZone = new Uint8Array(W * H);
  const island = (x: number, y: number, w: number, h: number) => {
    paint(x, y, w, h, 'g', true);
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        const gx = x + i;
        const gy = y + j;
        if (gx < 0 || gy < 0 || gx >= W || gy >= H) continue;
        islandZone[gy * W + gx] = 1;
        blockZone[gy * W + gx] = 0;
      }
    }
  };
  island(77, 42, 7, 6); // đảo Ngọc Sơn
  paint(79, 39, 2, 3, 'r', true); // cầu Thê Húc
  island(77, 47, 7, 7); // đảo Tháp Rùa
  paint(79, 49, 3, 3, 'g', true);
  paint(79, 52, 3, 6, 'r', true); // đường đắp từ đảo xuống đường lớn phía nam hồ

  // Đặt địa điểm: toạ độ Google Maps → ô lưới; mỗi địa điểm chiếm ô đất trống gần vị trí đó nhất.
  const occupied = new Uint8Array(W * H);
  const idx = (x: number, y: number) => y * W + x;
  const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H;
  const mark = (x: number, y: number, w: number, h: number, margin: number) => {
    for (let j = -margin; j < h + margin; j++) {
      for (let i = -margin; i < w + margin; i++) {
        if (inside(x + i, y + j)) occupied[idx(x + i, y + j)] = 1;
      }
    }
  };
  for (const p of [GUARD_AT, TOURIST_AT, TOURIST_PATH]) mark(p.x, p.y, 1, 1, 1);
  const placeable = (x: number, y: number) => {
    if (!inside(x, y)) return false;
    const k = idx(x, y);
    if (occupied[k]) return false;
    const g = m.ground[y]![x]!;
    if (g === 'r' || g === 'h' || g === 'v' || g === 'w') return false; // đường và nước không đặt công trình
    return blockZone[k] === 1 || islandZone[k] === 1 || g === 'f' || g === 'P';
  };
  const fits = (x: number, y: number, w: number, h: number) => {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (!placeable(x + i, y + j)) return false;
    return placeable(x + Math.floor(w / 2), y + h); // cửa phải đi tới được
  };
  // Địa điểm thật được đặt trước (gần hồ trước), rồi tới các mẫu chung chọn chỗ còn trống.
  const distToLake = (g: Geo) => {
    const t = geoToGrid(g.lat, g.lon);
    return (t.x - 80) ** 2 + (t.y - 50) ** 2;
  };
  const order = [...HANOI_GEO].sort(
    (a, b) => Number(!!a.generic) - Number(!!b.generic) || distToLake(a) - distToLake(b) || (a.slug < b.slug ? -1 : 1),
  );
  const SLOTS: Slot[] = [];
  for (const g of order) {
    const t = geoToGrid(g.lat, g.lon);
    let best: { x: number; y: number; d: number } | null = null;
    for (let y = 1; y <= H - g.h - 1; y++) {
      for (let x = 1; x <= W - g.w - 1; x++) {
        if (!fits(x, y, g.w, g.h)) continue;
        const d = (x + g.w / 2 - t.x) ** 2 + (y + g.h / 2 - t.y) ** 2;
        if (!best || d < best.d) best = { x, y, d };
      }
    }
    if (!best) throw new Error(`Hà Nội lưới: không đặt được ${g.slug}`);
    SLOTS.push({ slug: g.slug, x: best.x, y: best.y, w: g.w, h: g.h });
    // Các địa điểm có thể sát nhau; chỉ ô cửa và chính vùng chiếm là bị giữ.
    mark(best.x, best.y, g.w, g.h, 0);
    occupied[idx(best.x + Math.floor(g.w / 2), best.y + g.h)] = 1;
  }
  const footprints = SLOTS.map((s) => ({ x: s.x, y: s.y, w: s.w, h: s.h }));
  const onFootprint = (x: number, y: number) => footprints.some((r) => inRect(x, y, r));

  // Ngoài mọi địa điểm: viền đi bộ quanh địa điểm để nhà không xếp chặn cửa.
  const reserved = new Uint8Array(W * H);
  const taken = new Uint8Array(W * H); // ô đã dùng: nhà, khe hở (ngõ), chỗ dành
  const setFlag = (arr: Uint8Array, x: number, y: number) => {
    if (inside(x, y)) arr[idx(x, y)] = 1;
  };
  // Viền 1 ô quanh địa điểm, riêng phía cửa chừa 2 ô để khách đứng và đi tới cửa.
  for (const s of SLOTS) for (let dy = -1; dy < s.h + 2; dy++) for (let dx = -1; dx < s.w + 1; dx++) setFlag(reserved, s.x + dx, s.y + dy);
  for (const p of [GUARD_AT, TOURIST_AT, TOURIST_PATH]) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) setFlag(reserved, p.x + dx, p.y + dy);

  // Nhà ống và cửa hàng: xếp đầy ô phố, cách nhau bằng ngõ, chừa viền đi bộ, tránh địa điểm và chỗ NPC đứng.
  const rnd = mulberry32(2026);
  const open = (x: number, y: number) => inside(x, y) && blockZone[idx(x, y)] === 1 && !reserved[idx(x, y)] && !taken[idx(x, y)];
  for (const b of BLOCKS) {
    const x1 = b.x + b.w - 2;
    const y1 = b.y + b.h - 2;
    for (let y = b.y + 1; y <= y1; y++) {
      for (let x = b.x + 1; x <= x1; x++) {
        const bw = 3 + Math.floor(rnd() * 2);
        const bh = 2 + Math.floor(rnd() * 2);
        const skip = rnd() < 0.12;
        if (skip || !open(x, y)) continue;
        if (x + bw - 1 > x1 || y + bh - 1 > y1) continue;
        let ok = true;
        for (let j = 0; j < bh && ok; j++) for (let i = 0; i < bw; i++) if (!open(x + i, y + j)) ok = false;
        if (!ok) continue;
        const ch = rnd() < 0.3 ? '%' : '#';
        for (let j = 0; j < bh; j++) for (let i = 0; i < bw; i++) m.objs[y + j]![x + i] = ch;
        // Khe ngõ: một cột bên phải và một hàng bên dưới luôn để trống.
        for (let j = 0; j <= bh; j++) for (let i = 0; i <= bw; i++) setFlag(taken, x + i, y + j);
      }
    }
  }

  // Địa điểm: cửa, xoá vật ở cửa.
  const doors = new Set<string>();
  const pois: Poi[] = [];
  const catalog = poisOfCity('hanoi');
  for (const c of catalog) {
    const slug = c.id.split('-').slice(1).join('-');
    const slot = SLOTS.find((s) => s.slug === slug);
    if (!slot) throw new Error(`Hà Nội lưới: thiếu vị trí cho ${c.id}`);
    const fp = { x: slot.x, y: slot.y, w: slot.w, h: slot.h };
    const d: Tile = doorOf(fp);
    doors.add(`${d.x},${d.y}`);
    m.clear(d.x, d.y, 1, 1);
    pois.push(
      withCatalog({
        id: c.id,
        kind: c.kind,
        name: c.name,
        content: c.content,
        reward: c.reward,
        door: d,
        footprint: fp,
        sprite: HANOI_ART_SLUGS.has(slug) ? `art:hanoi-art/${slug}` : `fac:${FACADE[c.kind] ?? 'shop'}:${LABEL[c.kind] ?? 'SIGHT'}`,
      }),
    );
  }

  // Đèn đường dọc các vỉa hè (bỏ qua chỗ nước, cửa, địa điểm).
  const free = (x: number, y: number) => !water(x, y) && !doors.has(`${x},${y}`) && !onFootprint(x, y);
  const isFreeTile = (x: number, y: number) => free(x, y) && m.objs[y]![x] === '.';
  for (const r of hRoads) {
    for (const y of [r.y - 2, r.y + 3]) {
      for (let x = 4; x < r.x1; x += 8) if (x >= r.x0 && free(x, y)) m.o(x, y, 'L');
    }
  }
  for (const r of vRoads) {
    for (const x of [r.x - 2, r.x + 3]) {
      for (let y = 4; y < H; y += 8) if (free(x, y)) m.o(x, y, 'L');
    }
  }

  // Ghế nhựa trà đá hai bên cửa quán ăn, dù ở giữa, thùng rác và xe đẩy cạnh quán.
  for (const slug of STREET_FOOD) {
    const slot = SLOTS.find((s) => s.slug === slug)!;
    const d = doorOf(slot);
    // Đặt một hàng dưới cửa, không cùng hàng với cửa, để không chắn lối đi ngang tới cửa.
    for (const dx of [-2, 2]) {
      if (free(d.x + dx, d.y + 1)) m.o(d.x + dx, d.y + 1, 'E');
    }
    // Dù: thử cạnh cửa trước, để hàng hiên ngay trước cửa luôn thông.
    const umbrella = [
      { x: d.x - 3, y: d.y + 1 },
      { x: d.x + 3, y: d.y + 1 },
      { x: d.x, y: d.y + 2 },
    ].find((c) => isFreeTile(c.x, c.y));
    if (umbrella) m.o(umbrella.x, umbrella.y, 'P');
    if (isFreeTile(d.x - 3, d.y + 3)) m.o(d.x - 3, d.y + 3, 'n');
  }
  for (const slug of ['banhmi', 'biahoi']) {
    const d = doorOf(SLOTS.find((s) => s.slug === slug)!);
    if (isFreeTile(d.x + 3, d.y + 2)) m.o(d.x + 3, d.y + 2, 'k');
  }

  // Biển chỉ đường ở góc các giao lộ lớn (ô vỉa hè còn trống).
  for (const v of vRoads) {
    for (const hr of hRoads.slice(0, 3)) {
      for (const c of [
        { x: v.x - 2, y: hr.y - 2 },
        { x: v.x + 3, y: hr.y + 3 },
      ]) {
        if (isFreeTile(c.x, c.y)) {
          m.o(c.x, c.y, 'G');
          break;
        }
      }
    }
  }

  // Cây hai bên đường lớn, xen giữa đèn đường (hàng ngoài cùng của vỉa hè).
  for (const r of hRoads) {
    for (const y of [r.y - 2, r.y + 3]) {
      for (let x = 8; x < r.x1; x += 8) if (x >= r.x0 && isFreeTile(x, y)) m.o(x, y, x % 16 === 8 ? 'U' : 'T');
    }
  }
  for (const r of vRoads) {
    for (const x of [r.x - 2, r.x + 3]) {
      for (let y = 8; y < H; y += 8) if (isFreeTile(x, y)) m.o(x, y, y % 16 === 8 ? 'U' : 'T');
    }
  }

  // Cây và hoa trong công viên (chỉ rải trên ô công viên).
  m.scatter(2, 18, 10, 14, 'T', 0.3, 11, 'f');
  m.scatter(4, 40, 20, 16, 'T', 0.25, 12, 'f');
  m.scatter(34, 40, 4, 14, 'T', 0.3, 21, 'f');
  m.scatter(82, 66, 12, 10, 'T', 0.25, 31, 'f');
  m.scatter(2, 64, 26, 14, 'T', 0.2, 41, 'f');
  m.scatter(2, 84, 24, 10, 'T', 0.25, 51, 'f');
  m.scatter(36, 84, 22, 10, 'T', 0.25, 61, 'f');
  m.scatterMix(0, 0, W, H, 'aei', 0.08, 91, 'f');
  // Không để cây hay hoa mọc trên vùng chiếm của địa điểm hay trước cửa.
  for (const s of SLOTS) m.clear(s.x, s.y, s.w, s.h);
  for (const p of pois) m.clear(p.door.x, p.door.y, 1, 1);

  // Thùng rác dọc vỉa hè các đại lộ (ngoài cùng, không chắn lối đi).
  for (const r of hRoads.slice(0, 3)) {
    for (const x of [20, 52, 84]) if (x >= r.x0 && x < r.x1 && isFreeTile(x, r.y - 2)) m.o(x, r.y - 2, 'n');
  }

  const npcs: Npc[] = [
    {
      id: 'hanoi-npc-guard',
      sprite: 'npc_guard',
      at: { ...GUARD_AT },
      lines: [
        { en: 'Careful crossing here, the scooters do not stop.', vi: 'Qua đường cẩn thận nhé, xe máy không dừng đâu.' },
        { en: 'The lake is the heart of the old quarter.', vi: 'Hồ là trái tim của phố cổ.' },
      ],
    },
    {
      id: 'hanoi-npc-tourist',
      sprite: 'npc_tourist',
      at: { ...TOURIST_AT },
      path: [{ ...TOURIST_PATH }],
      lines: [
        { en: 'Is the coffee on this street really that strong?', vi: 'Cà phê ở con phố này có thật sự đậm vậy không?' },
        { en: 'I cannot find the turtle tower. Which way?', vi: 'Mình không tìm thấy Tháp Rùa. Đi hướng nào?' },
      ],
    },
    // Người Hà Nội bình dị ngoài đường (tranh pixel riêng, khung người 16×24).
    {
      id: 'hanoi-npc-xichlo',
      sprite: 'art:hanoi-npc/xichlo',
      at: { x: 70, y: 62 },
      lines: [
        { en: 'Where to, young one? Hop on, I will take you around the lake.', vi: 'Đi đâu đấy cháu? Lên xe bác chở một vòng quanh hồ.' },
        { en: 'A cyclo is the best way to see the Old Quarter slowly.', vi: 'Đi xích lô chậm rãi mới ngắm hết phố cổ.' },
      ],
    },
    {
      id: 'hanoi-npc-ganhhang',
      sprite: 'art:hanoi-npc/ganhhang',
      at: { x: 38, y: 33 },
      path: [{ x: 56, y: 33 }],
      lines: [
        { en: 'Anyone buying guavas or plums? Very sweet today!', vi: 'Ai mua ổi, mận không? Hôm nay ngọt lắm!' },
        { en: 'The load is heavy, but I enjoy walking the street.', vi: 'Gánh nặng thật, nhưng đi dạo phố thì vui.' },
      ],
    },
    {
      id: 'hanoi-npc-caphetrung',
      sprite: 'art:hanoi-npc/caphetrung',
      at: { x: 76, y: 41 },
      lines: [
        { en: 'Egg coffee here! Creamy, sweet and fragrant.', vi: 'Cà phê trứng đây! Béo, ngọt, thơm lắm.' },
        { en: 'Drink it warm, and do not stir too hard or the foam falls.', vi: 'Uống khi còn nóng, khuấy mạnh là bọt xẹp đấy.' },
      ],
    },
    {
      id: 'hanoi-npc-codo',
      sprite: 'art:hanoi-npc/codo',
      at: { x: 60, y: 62 },
      lines: [
        { en: 'Use the crossing, the scooters are heavy this morning.', vi: 'Sang đường qua vạch kẻ nhé, xe máy sáng nay đông lắm.' },
        { en: 'Keep to the sidewalk, it is safer for everyone.', vi: 'Đi trên vỉa hè cho an toàn nhé.' },
      ],
    },
    {
      id: 'hanoi-npc-xeom',
      sprite: 'art:hanoi-npc/xeom',
      at: { x: 92, y: 36 },
      lines: [
        { en: 'Where to? Long Bien or West Lake?', vi: 'Đi đâu? Long Biên hay Hồ Tây?' },
        { en: 'I know every alley in the Old Quarter.', vi: 'Ngõ nào trong phố cổ tôi cũng biết.' },
      ],
    },
    {
      id: 'hanoi-npc-ongcocho',
      sprite: 'art:hanoi-npc/ongcocho',
      at: { x: 10, y: 46 },
      lines: [
        { en: 'Fancy a game of Chinese chess?', vi: 'Đánh một ván cờ tướng không cháu?' },
        { en: 'Think carefully before this move.', vi: 'Đi nước này phải nghĩ kỹ đấy.' },
      ],
    },
    {
      id: 'hanoi-npc-hoasen',
      sprite: 'art:hanoi-npc/hoasen',
      at: { x: 56, y: 8 },
      lines: [
        { en: 'West Lake lotus, for your altar at home.', vi: 'Sen Tây Hồ đây, mua về cắm bàn thờ.' },
        { en: 'The lotus is most beautiful at West Lake in summer.', vi: 'Mùa hè sen Tây Hồ nở đẹp nhất.' },
      ],
    },
    {
      id: 'hanoi-npc-nonla',
      sprite: 'art:hanoi-npc/nonla',
      at: { x: 82, y: 53 },
      lines: [
        { en: 'Hi! I am on my way to take photos of Hoan Kiem Lake.', vi: 'Chào bạn! Mình đang đi chụp ảnh Hồ Gươm.' },
        { en: 'The lake looks lovely in the early morning.', vi: 'Hồ Gươm sáng sớm đẹp lắm.' },
      ],
    },
  ];

  const routes: Route[] = [
    { id: 'hanoi-east-west', sprite: 'taxi', path: [{ x: -4, y: 34 }, { x: 105, y: 34 }], speed: 3, count: 3, loop: true },
    { id: 'hanoi-south-west', sprite: 'bus', path: [{ x: -4, y: 60 }, { x: 105, y: 60 }], speed: 2, count: 2, loop: true },
    { id: 'hanoi-north-south', sprite: 'taxi', path: [{ x: 64, y: -4 }, { x: 64, y: H - 1 }], speed: 2, count: 2, loop: true },
    { id: 'hanoi-bridge', sprite: 'taxi', path: [{ x: 98, y: 46 }, { x: 117, y: 46 }], speed: 2, count: 2, loop: true },
  ];

  return m.build({
    id: 'hanoi',
    name: { vi: 'Hà Nội', en: 'Hanoi' },
    utcOffsetHours: 7,
    palette: 'hanoi',
    spawn: { x: 80, y: 34 },
    pois,
    npcs,
    routes,
    sounds: ['city-day'],
  });
}

/** Công trình có tranh pixel thật (public/travel/sprites/hanoi-art/<slug>.png, vẽ theo ảnh tham khảo Commons). */
export const HANOI_ART_SLUGS = new Set<string>([
  'opera',
  'doanmon',
  'motcot',
  'mausoleum',
  'vanmieu',
  'tranquoc',
  'puppet',
  'longbien',
  'thaprua',
  'counter',
  'dongxuan',
  'gate',
  'board',
  'eggcoffee',
  'pho',
  'buncha',
  'biahoi',
  'banhmi',
  'flowers',
  'oldquarter',
  'hangma',
  'banhmichao',
  'ngocson',
  'nhatholon',
  'buudien',
  'lichsu',
  'hoalo',
  'quansu',
  'cotco',
  'badinh',
  'quanthanh',
  'phutayho',
  'kimlien',
  'godongda',
  'huonglien',
  'dantoc',
  'keangnam',
  'chollongbien',
  'cafegiang',
]);

export const hanoiGrid: CityMap = buildHanoiGrid();
