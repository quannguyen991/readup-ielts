/**
 * BẢN ĐỒ CÁC THÀNH PHỐ cho bộ vẽ 2D. Mặc định là bản ĐỒ ẢNH (tranh pixel-art + lưới đi được); bản đồ ô vẽ
 * bằng mã chỉ còn là dự phòng khi không tải được tranh (hiện có cho Singapore).
 */
import type { CityId, CityMap } from '@/services/travel/types';
import { amsterdam } from './amsterdam';
import { hanoi } from './hanoi';
import { london } from './london';
import { paris } from './paris';
import { rome } from './rome';
import { singapore } from './singapore';
import { singaporeTiles } from './singapore.tiles';

export const CITY_MAPS: Record<CityId, CityMap> = { hanoi, singapore, london, paris, amsterdam, rome };

/** Bản đồ ô dự phòng (code-drawn) cho thành phố nào đã có. */
export const TILE_FALLBACKS: Partial<Record<CityId, CityMap>> = { singapore: singaporeTiles };

export function getCityMap(id: CityId): CityMap {
  return CITY_MAPS[id];
}

export { hanoi, singapore, london, paris, amsterdam, rome, singaporeTiles };
