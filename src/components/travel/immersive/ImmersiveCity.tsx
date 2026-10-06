import type { CityId, CityMap, Tile, TravelState } from '@/services/travel/types';

/** Bản native: không có giao diện toàn màn hình (màn hình ngoài dùng danh sách địa điểm). Bản web ở `ImmersiveCity.web.tsx`. */
export type ImmersiveCityProps = {
  city: CityId;
  map: CityMap;
  fallbackMap?: CityMap;
  state: TravelState;
  onEnterPoi(id: string): void;
  onMove(tile: Tile): void;
  reducedMotion: boolean;
  activeVisitPoiId: string | null;
  onCloseVisit(): void;
};

export function ImmersiveCity(_props: ImmersiveCityProps): null {
  return null;
}
