import type { RoadTile } from './placement';
import type { Site } from './construction';
import { EMPTY_ECONOMY, type EconomyState } from './economy';
import type { LandWork } from './terrain';
import type { TerrainKind, ZoneKind } from '@/data/city/catalog';

/**
 * Phần Thành Phố Tri Thức được lưu và đồng bộ lên Supabase (khoá `city`, bảng
 * `user_state` sẵn có — không đổi schema). Không lưu hình học hay texture: chỉ
 * seed + trạng thái, cảnh 3D dựng lại từ đó.
 */
export type CityPayload = EconomyState & {
  terrain: { kind: TerrainKind; seed: number } | null;
  regions: number[];
  zones: Record<string, ZoneKind>;
  roads: Record<string, RoadTile>;
  works: Record<string, LandWork>;
  sites: Site[];
  era: number;
  priority: string | null;
  name: string | null;
  /** Tổng vật liệu + ca từng nhận (chỉ tăng) — để gộp hai máy chọn bản "học nhiều hơn". */
  lifetime: number;
  updatedAt: string | null;
};

export const EMPTY_CITY: CityPayload = {
  ...EMPTY_ECONOMY,
  terrain: null,
  regions: [],
  zones: {},
  roads: {},
  works: {},
  sites: [],
  era: 1,
  priority: null,
  name: null,
  lifetime: 0,
  updatedAt: null,
};

/**
 * Gộp hai máy — cùng tinh thần `mergeGame`: bản đã HỌC NHIỀU HƠN (lifetime lớn
 * hơn; hoà thì bản sửa sau) giữ nguyên thành phố và kho vật liệu. Trộn công
 * trường của máy này với kho của máy kia là ra trạng thái không có thật.
 *
 * Mã sự kiện đã thưởng thì HỢP của hai bên: một bài đã nhận thép trên điện
 * thoại thì máy tính không nhận lại lần nữa.
 */
export function mergeCity(local: CityPayload | null, remote: CityPayload | null): CityPayload {
  if (!local) return remote ?? EMPTY_CITY;
  if (!remote) return local;
  const lScore = local.lifetime ?? 0;
  const rScore = remote.lifetime ?? 0;
  const base = rScore > lScore || (rScore === lScore && (remote.updatedAt ?? '') > (local.updatedAt ?? '')) ? remote : local;
  const other = base === local ? remote : local;
  return { ...base, awarded: { ...(other.awarded ?? {}), ...(base.awarded ?? {}) } };
}
