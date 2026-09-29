import type { Plots } from './blueprints';
import { EMPTY_MATERIALS, type DailyEarned, type Materials } from './materials';

/** Phần thành phố được lưu và đồng bộ lên Supabase (khoá `city`). */
export type CityPayload = {
  inventory: Materials;
  plots: Plots;
  daily: DailyEarned | null;
  giftClaimed: boolean;
  updatedAt: string | null;
};

export const EMPTY_CITY: CityPayload = {
  inventory: { ...EMPTY_MATERIALS },
  plots: {},
  daily: null,
  giftClaimed: false,
  updatedAt: null,
};

/**
 * Gộp hai máy: BẢN SỬA SAU THẮNG cả gói. Vật liệu là số dư đã tiêu/đã cộng,
 * cộng dồn hai máy sẽ nhân đôi vật liệu; chọn một bản thì chỉ có thể mất phần
 * làm song song trên máy kia trong cùng khoảng thời gian — rủi ro nhỏ hơn nhiều.
 */
export function mergeCity(local: CityPayload | null, remote: CityPayload | null): CityPayload {
  if (!local) return remote ?? EMPTY_CITY;
  if (!remote) return local;
  const l = local.updatedAt ?? '';
  const r = remote.updatedAt ?? '';
  return r > l ? remote : local;
}
