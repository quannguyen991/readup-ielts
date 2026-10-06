/**
 * CHẾ ĐỘ ĐỐI TƯỢNG — phần thuần (không DOM): hình học của vật đứng riêng, ô bị chặn và cửa.
 */
import { INTERIORS, INTERIOR_SIZE, STATION_PLATFORM, type InteriorLayout, type InteriorZone } from '@/data/travel/interiors';
import type { CityMap, MapObject, Poi, SceneSprite } from '@/services/travel/types';
import { buildImgWorld, type ImgWorld, type Pt } from './imageWorld';

export type Rect = { x: number; y: number; w: number; h: number };

export function footprintRect(o: MapObject): Rect {
  return { x: o.x + o.footprint.x, y: o.y + o.footprint.y, w: o.footprint.w, h: o.footprint.h };
}

export function spriteRect(o: MapObject, sp: SceneSprite): Rect {
  return { x: o.x - sp.w / 2, y: o.y - sp.h, w: sp.w, h: sp.h };
}

export function doorPoint(o: MapObject): Pt | null {
  return o.door ? { x: o.x + o.door.dx, y: o.y + o.door.dy } : null;
}

/** Thế giới đi lại của cảnh: lưới đất trừ vùng chiếm của mọi vật. */
export function buildSceneWorld(map: CityMap): ImgWorld {
  const w = buildImgWorld(map.image!);
  for (const o of map.scene?.objects ?? []) {
    const f = footprintRect(o);
    const i0 = Math.max(0, Math.floor(f.x / w.cell));
    const i1 = Math.min(w.mw - 1, Math.floor((f.x + f.w - 1) / w.cell));
    const j0 = Math.max(0, Math.floor(f.y / w.cell));
    const j1 = Math.min(w.mh - 1, Math.floor((f.y + f.h - 1) / w.cell));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) w.walk[j * w.mw + i] = 0;
  }
  // danh sách ô đi được phải khớp lại sau khi chặn
  const kc: number[] = [];
  for (let n = 0; n < w.walk.length; n++) if (w.walk[n]) kc.push(n);
  (w as { walkCells: Int32Array }).walkCells = Int32Array.from(kc);
  return w;
}

/** Địa điểm do vật gắn `poiId` quyết định: cửa + vùng chạm theo sprite. Dùng khi dựng bản đồ. */
export function poiGeometry(o: MapObject, sp: SceneSprite): { door: Pt; hotspot: Rect } {
  const d = doorPoint(o);
  if (!d) throw new Error(`Vật ${o.id} gắn địa điểm nhưng thiếu cửa`);
  return { door: { x: Math.round(d.x), y: Math.round(d.y) }, hotspot: spriteRect(o, sp) };
}

export type InteriorKind = 'cafe' | 'hotel' | 'station' | 'market' | 'museum' | 'restaurant' | 'counter' | 'airport' | 'garden' | 'landmark' | 'secret';

/** Loại địa điểm nào có phòng trong; còn lại (cảnh quan) vào thẳng lượt hỏi. */
export function interiorKindOf(kind: Poi['kind']): InteriorKind | null {
  switch (kind) {
    case 'cafe':
    case 'hotel':
    case 'station':
    case 'market':
    case 'museum':
    case 'restaurant':
    case 'counter':
    case 'airport':
      return kind;
    case 'garden':
    case 'landmark':
    case 'secret':
      return kind;
    default:
      return null;
  }
}


export const INTERIOR_CELL = 2;

export function interiorLayout(kind: InteriorKind, zone: InteriorZone = 'main'): InteriorLayout {
  return kind === 'station' && zone === 'platform' ? STATION_PLATFORM : INTERIORS[kind];
}

/** Lưới đi được của phòng: sàn − đồ đạc + lối ra. */
export function interiorMaskRows(layout: InteriorLayout, w: number = INTERIOR_SIZE.w, h: number = INTERIOR_SIZE.h): string[] {
  const c = INTERIOR_CELL;
  const inR = (r: { x: number; y: number; w: number; h: number }, x: number, y: number) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
  const rows: string[] = [];
  for (let j = 0; j < Math.ceil(h / c); j++) {
    let r = '';
    for (let i = 0; i < Math.ceil(w / c); i++) {
      const x = i * c;
      const y = j * c;
      let ok = inR(layout.floor, x, y) || inR(layout.doorway, x, y);
      if (ok && layout.blockers.some((b) => inR(b, x, y))) ok = false;
      r += ok ? '#' : '.';
    }
    rows.push(r);
  }
  return rows;
}
