import type { MutableRefObject } from 'react';

import type { PoiHighlights } from '../engine/CityEngine';
import type { CityMap, Tile, TravelState, WeatherPlan } from '@/services/travel/types';

/** Cần điều khiển từ ngoài: tự đi tới một địa điểm. */
export type CityCanvasHandle = { walkToPoi(id: string): boolean };

/**
 * Bản iOS/Android: KHÔNG vẽ canvas — giai đoạn đầu native chỉ có trang danh sách địa điểm
 * (do màn hình bên ngoài lo). Tách file theo nền tảng để bundle native không kéo bộ vẽ vào.
 */
export type CityCanvasProps = {
  map: CityMap;
  state: TravelState;
  onEnterPoi(id: string): void;
  onMove(tile: Tile): void;
  reducedMotion: boolean;
  /** Ghi đè giờ địa phương 0..24 (trang thử). Bỏ trống = giờ thật của thành phố. */
  hour?: number;
  /** Ghi đè thời tiết (trang thử). */
  weather?: WeatherPlan;
  /** Bản đồ ô dự phòng khi bản đồ ảnh không tải được tranh nền. */
  fallbackMap?: CityMap;
  /** Lớp gỡ lỗi (vùng đi được/vùng chạm/cửa/tuyến); chỉ khi `__DEV__`. Mặc định theo `?debug=1`. */
  debug?: boolean;
  /** Làm nổi địa điểm (nơi nên đi, đang rê trong danh sách, tập khoá). */
  highlights?: PoiHighlights;
  onHoverPoi?(id: string | null, at: { x: number; y: number }): void;
  onPlayer?(p: { x: number; y: number }): void;
  /** Nhận tay điều khiển (đi tới địa điểm). */
  handleRef?: MutableRefObject<CityCanvasHandle | null>;
  /** Ẩn nút toàn màn hình tự có (khi lớp giao diện bên ngoài đã có nút riêng). */
  hideFullscreenButton?: boolean;
};

export function CityCanvas(_props: CityCanvasProps): null {
  return null;
}
