/**
 * BẢN ĐỒ Ô TẠM cho Đà Nẵng và TP. Hồ Chí Minh: khi chưa có tranh đất/sprite thật, mỗi thành phố là một quảng
 * trường lát đá, hai hàng công trình (mặt tiền vẽ bằng mã) nhìn ra đại lộ ở giữa. Địa điểm lấy NGUYÊN danh mục
 * `data/travel/pois.ts` theo thứ tự, nên thêm/bớt địa điểm ở danh mục là bản đồ tự theo. Khi có tranh thật,
 * bản đồ cảnh (`hochiminh.ts`, `danang.ts`) sẽ thay thế và bản này thành dự phòng.
 */
import type { CityId, CityMap, Npc, Poi, PoiKind } from '@/services/travel/types';
import { poisOfCity } from '../pois';
import { doorOf, MapBuilder } from './builder';
import { withCatalog } from './imagemap';

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

const W = 56;
const COLS = 5;
const FW = 7;
const FH = 4;
const BAND = 10;

export function vietnamTiles(meta: {
  id: CityId;
  name: { vi: string; en: string };
  npcs: Npc[];
  weather?: CityMap['ambience']['weather'];
}): CityMap {
  const catalog = poisOfCity(meta.id).filter((c) => !c.action);
  const rows = Math.max(1, Math.ceil(catalog.length / COLS));
  const H = 3 + rows * BAND + 2;
  const m = new MapBuilder(W, H, 'g');
  for (let r = 0; r < rows; r++) {
    const fy = 3 + r * BAND;
    m.g(0, fy + 4, W, 5, 'p'); // vỉa hè trước mặt tiền
    m.g(0, fy + 6, W, 2, 'r'); // đường
    for (let x = 2; x < W; x += 8) m.o(x, fy + 5, 'L');
  }
  m.scatterMix(0, 0, W, 3, 'TUNb', 0.15, 7);

  const pois: Poi[] = catalog.map((c, i) => {
    const row = Math.floor(i / COLS);
    const col = i % COLS;
    const fp = { x: 3 + col * 10, y: 3 + row * BAND, w: FW, h: FH };
    const d = doorOf(fp);
    m.clear(d.x, d.y, 1, 1);
    return withCatalog({
      id: c.id,
      kind: c.kind,
      name: c.name,
      content: c.content,
      reward: c.reward,
      door: d,
      footprint: fp,
      sprite: `fac:${FACADE[c.kind] ?? 'shop'}:${LABEL[c.kind] ?? 'SIGHT'}`,
    });
  });

  return m.build({
    id: meta.id,
    name: meta.name,
    utcOffsetHours: 7,
    palette: meta.id,
    spawn: { x: 28, y: 3 + 5 },
    pois,
    npcs: meta.npcs,
    routes: [{ id: `${meta.id}-taxi`, sprite: 'taxi', path: [{ x: -4, y: 3 + 6 }, { x: W + 4, y: 3 + 6 }], speed: 3, count: 2, loop: true }],
    weather: meta.weather,
    sounds: ['city-day'],
  });
}
