import type { CityMap, Tile, TravelState, WeatherPlan } from '@/services/travel/types';

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
};

export function CityCanvas(_props: CityCanvasProps): null {
  return null;
}
