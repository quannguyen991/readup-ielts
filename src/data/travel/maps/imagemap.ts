/**
 * Ghép HÌNH HỌC (vùng chạm + cửa theo điểm nguồn của tranh nền) với NỘI DUNG địa điểm do
 * `data/travel/pois.ts` quản (tên, bộ từ, loại câu, thưởng, điều kiện mở). Mã địa điểm là
 * `<cityId>-<slug>`; địa điểm không có trong danh mục thì lỗi ngay khi nạp để khỏi lệch hai bên.
 */
import type { CityId, CityMap, ImageLayer, Npc, Poi, Route, Tile, WeatherPlan } from '@/services/travel/types';
import { getPoiContent } from '../pois';

export type PxRect = { x: number; y: number; w: number; h: number };

export function imagePoi(id: string, g: { hotspot: PxRect; door: Tile }): Poi {
  const c = getPoiContent(id);
  if (!c) throw new Error(`Địa điểm ${id} không có trong danh mục data/travel/pois.ts`);
  return { id, kind: c.kind, name: c.name, content: c.content, unlock: c.unlock, reward: c.reward, door: g.door, footprint: g.hotspot, hotspot: g.hotspot };
}

/** Bản đồ ô dự phòng / dựng bằng bộ chữ cũng cần nội dung đúng danh mục. */
export function withCatalog(p: Poi): Poi {
  const c = getPoiContent(p.id);
  if (!c) throw new Error(`Địa điểm ${p.id} không có trong danh mục data/travel/pois.ts`);
  return { ...p, kind: c.kind, name: c.name, content: c.content, unlock: c.unlock, reward: c.reward };
}

export const IMAGE_SIZE = { w: 418, h: 235 } as const;

export function imageMap(m: {
  id: CityId;
  name: { vi: string; en: string };
  utcOffsetHours: number;
  palette?: string;
  spawn: Tile;
  pois: Poi[];
  npcs: Npc[];
  routes?: Route[];
  mask: { cell: number; rows: string[] };
  lights?: ImageLayer['lights'];
  occluders?: ImageLayer['occluders'];
  weather?: WeatherPlan;
  sounds?: string[];
  /** Cỡ ảnh nhỏ (mặc định 418×235); ảnh đất mới có thể khác (vd London 403×243). */
  size?: { w: number; h: number };
  /** Dùng ảnh ĐẤT (`/travel/terrain/<id>*.png`) thay cho tranh phẳng. */
  terrain?: boolean;
  /** Thế giới nhiều mảnh (tên tệp `<id>.small.png`, `<id>-e…`); độ lệch theo điểm nguồn. */
  panels?: { suffix: string; x: number; y: number; w?: number; h?: number }[];
  links?: { from: number; to: number; x: number; y: number; r?: number }[];
}): CityMap {
  const size = m.size ?? { w: IMAGE_SIZE.w, h: IMAGE_SIZE.h };
  const dir = m.terrain ? 'terrain' : 'maps';
  return {
    id: m.id,
    name: m.name,
    utcOffsetHours: m.utcOffsetHours,
    palette: m.palette ?? m.id,
    size: { ...size },
    layers: { ground: [], objects: [], roofs: [] },
    spawn: m.spawn,
    pois: m.pois,
    npcs: m.npcs,
    routes: m.routes,
    image: {
      src: `/travel/${dir}/${m.id}.png`,
      smallSrc: `/travel/${dir}/${m.id}.small.png`,
      scale: 4,
      size: { ...size },
      mask: m.mask,
      panels: m.panels?.map((p) => ({ src: `/travel/${dir}/${m.id}${p.suffix}.small.png`, x: p.x, y: p.y, w: p.w, h: p.h })),
      links: m.links,
      lights: m.lights,
      occluders: m.occluders,
    },
    ambience: { weather: m.weather ?? { kind: 'clear', intensity: 0 }, sounds: m.sounds ?? [] },
  };
}
