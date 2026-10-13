/**
 * BẢN ĐỒ CÁC THÀNH PHỐ cho bộ vẽ 2D. Mặc định là bản ĐỒ ẢNH (tranh pixel-art + lưới đi được); bản đồ ô vẽ
 * bằng mã chỉ còn là dự phòng khi không tải được tranh (hiện có cho Singapore).
 */
import type { CityId, CityMap } from '@/services/travel/types';
import { amsterdam } from './amsterdam';
import { amsterdamFlat } from './amsterdam.flat';
import { danang, danangTiles } from './danang';
import { hanoi, hanoiTiles } from './hanoi';
import { hanoiGrid } from './hanoi.grid';
import { hochiminh, hochiminhTiles } from './hochiminh';
import { hochiminhGrid } from './hochiminh.grid';
import { london } from './london';
import { londonFlat } from './london.flat';
import { paris } from './paris';
import { parisFlat } from './paris.flat';
import { rome } from './rome';
import { romeFlat } from './rome.flat';
import { singapore } from './singapore';
import { singaporeFlat } from './singapore.flat';
import { singaporeTiles } from './singapore.tiles';
import { cairo, capetown, istanbul, marrakech, mexicocity, rio, seoul, sydney } from './world-cities';
import { tokyo } from './tokyo';
import { newyork } from './newyork';
import { shanghai } from './shanghai';

export const CITY_MAPS: Record<CityId, CityMap> = { hanoi: hanoiGrid, singapore, london, paris, amsterdam, rome, hochiminh: hochiminhGrid, danang, tokyo, seoul, newyork, istanbul, cairo, sydney, mexicocity, rio, capetown, marrakech, shanghai };

/** Bản đồ ô dự phòng (code-drawn) cho thành phố nào đã có. */
export const TILE_FALLBACKS: Partial<Record<CityId, CityMap>> = { singapore: singaporeTiles, hanoi: hanoiTiles, hochiminh: hochiminhTiles, danang: danangTiles };

/** Bản đồ ẢNH PHẲNG cũ: dự phòng của chế độ đối tượng khi chưa có/không tải được ảnh đất. */
export const FLAT_FALLBACKS: Partial<Record<CityId, CityMap>> = { singapore: singaporeFlat, london: londonFlat, paris: parisFlat, amsterdam: amsterdamFlat, rome: romeFlat };

export function getCityMap(id: CityId): CityMap {
  return CITY_MAPS[id];
}

export { hanoi, hanoiTiles, hochiminh, hochiminhTiles, danang, danangTiles, singapore, london, paris, amsterdam, rome, tokyo, seoul, newyork, istanbul, cairo, sydney, mexicocity, rio, capetown, marrakech, shanghai, singaporeTiles, singaporeFlat, londonFlat, parisFlat, amsterdamFlat, romeFlat };
