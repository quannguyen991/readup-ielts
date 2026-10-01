import { getPoiContent } from '@/data/travel/pois';
import { CITY_MAPS, TILE_FALLBACKS } from '@/data/travel/maps';
import type { CityId, CityMap } from '@/services/travel/types';

/**
 * Bản đồ thành phố đã có (do bộ vẽ cung cấp). Thành phố chưa có bản đồ thì trang
 * thành phố chỉ hiện danh sách địa điểm.
 *
 * Mã địa điểm trong bản đồ (`sg-changi`) được đổi sang mã của danh mục nội dung
 * (`singapore-changi`); phần nội dung (bộ từ, loại câu, thưởng, điều kiện mở)
 * lấy từ danh mục — bản đồ chỉ cung cấp hình học và tên.
 */
const RAW: Partial<Record<CityId, CityMap>> = CITY_MAPS;

/** Bản đồ ô dự phòng khi không tải được tranh nền (hiện có cho Singapore). */
export function getFallbackMap(id: CityId): CityMap | undefined {
  return TILE_FALLBACKS[id];
}

function normalize(map: CityMap): CityMap {
  return {
    ...map,
    pois: map.pois.map((p) => {
      const slug = p.id.includes('-') ? p.id.split('-').slice(1).join('-') : p.id;
      const cat = getPoiContent(`${map.id}-${slug}`);
      if (!cat) return p;
      return { ...p, id: cat.id, kind: cat.kind, content: cat.content, reward: cat.reward, unlock: cat.unlock };
    }),
  };
}

const CACHE = new Map<CityId, CityMap>();

export function getCityMap(id: CityId): CityMap | undefined {
  const raw = RAW[id];
  if (!raw) return undefined;
  let m = CACHE.get(id);
  if (!m) {
    m = normalize(raw);
    CACHE.set(id, m);
  }
  return m;
}
