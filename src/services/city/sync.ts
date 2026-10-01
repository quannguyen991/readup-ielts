import type { RoadTile } from './placement';
import type { Site } from './construction';
import { EMPTY_ECONOMY, ECONOMY, shiftDay, type EconomyState, type LedgerEntry } from './economy';
import { MATERIAL_KINDS } from './materials';
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
 *
 * Sổ giao dịch (đổi sao / góp Trung tâm) cũng là HỢP, và dòng nào chỉ bản thua
 * có thì ÁP BÙ vào kho của bản thắng: vật liệu đã đổi bằng sao không mất, vật
 * liệu đã góp không hiện lại. Dòng quá hạn giữ sổ thì bỏ qua (bên kia đã tỉa).
 */
export function mergeCity(local: CityPayload | null, remote: CityPayload | null): CityPayload {
  if (!local) return remote ?? EMPTY_CITY;
  if (!remote) return local;
  const lScore = local.lifetime ?? 0;
  const rScore = remote.lifetime ?? 0;
  const base = rScore > lScore || (rScore === lScore && (remote.updatedAt ?? '') > (local.updatedAt ?? '')) ? remote : local;
  const other = base === local ? remote : local;
  const merged: CityPayload = { ...base, awarded: { ...(other.awarded ?? {}), ...(base.awarded ?? {}) } };
  return reconcileLedger(merged, other.ledger);
}

/** Áp những dòng sổ bản thắng chưa có (trong hạn giữ sổ) vào kho của nó. */
function reconcileLedger(base: CityPayload, theirs: Record<string, LedgerEntry> | undefined): CityPayload {
  const mine = base.ledger ?? {};
  const days = Object.values(mine).map((e) => e.day).concat(Object.values(theirs ?? {}).map((e) => e.day)).sort();
  const newest = days[days.length - 1];
  if (!newest) return base;
  const limit = shiftDay(newest, -ECONOMY.ledger.keepDays);
  const inventory = { ...base.inventory };
  const ledger = { ...mine };
  let changed = false;
  for (const [id, e] of Object.entries(theirs ?? {})) {
    if (ledger[id] || !e || typeof e.day !== 'string' || e.day < limit) continue;
    for (const k of MATERIAL_KINDS) {
      const d = Math.trunc(e.delta?.[k] ?? 0);
      if (d) inventory[k] = Math.max(0, inventory[k] + d);
    }
    ledger[id] = e;
    changed = true;
  }
  return changed ? { ...base, inventory, ledger } : base;
}
