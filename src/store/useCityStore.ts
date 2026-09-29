import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_PREFIX, storage } from './persist';
import { catalogItem, LAND_WORKS, type CrewId, type RoadKind, type TerrainKind, type ZoneKind } from '@/data/city/catalog';
import {
  canHire,
  CREWS,
  deliver as deliverStep,
  distributeShifts,
  isDone,
  newSite,
  settle,
  type HireCheck,
  type Site,
} from '@/services/city/construction';
import { resolveEconomy, type StudyEvent } from '@/services/city/economy';
import { add, EMPTY_MATERIALS, subtract, type Materials } from '@/services/city/materials';
import {
  canLandWork,
  canPlace,
  canRoad,
  canUnlockRegion,
  key,
  occupancy,
  type PlaceCheck,
  type RegionCheck,
  type RoadCheck,
  type World,
  type WorkCheck,
} from '@/services/city/placement';
import { canAdvanceEra } from '@/services/city/progression';
import { EMPTY_CITY, type CityPayload } from '@/services/city/sync';
import { generateTerrain, START_REGIONS, type LandWork } from '@/services/city/terrain';
import { vnToday } from '@/services/gamification/golden';

/**
 * THÀNH PHỐ TRI THỨC của người học. Luật ở `src/services/city/*` (thuần, có
 * test); store chỉ nối luật với dữ liệu đã lưu.
 *
 * `earn()` được gọi từ `useGameStore` ở MỌI thiết bị — học trên điện thoại vẫn
 * cộng vật liệu và ca làm việc; mở máy tính là thấy.
 *
 * Mọi thao tác quan trọng đều idempotent trong một lần bấm nhanh / tải lại:
 * sự kiện học có mã chống trùng, giao vật liệu kiểm cờ `delivered`, đặt công
 * trình kiểm ô đã chiếm, chuyển công đoạn chỉ khi đủ điều kiện.
 */
type Actions = {
  earn: (event: StudyEvent) => Partial<Materials>;
  chooseTerrain: (kind: TerrainKind, seed: number) => boolean;
  place: (type: string, x: number, y: number, rot: 0 | 1 | 2 | 3, seed: number) => PlaceCheck & { siteId?: string };
  cancelSite: (siteId: string) => boolean;
  deliver: (siteId: string) => ReturnType<typeof deliverStep> | { ok: false; reason: 'missing' };
  hire: (siteId: string, crew: CrewId, level: number) => HireCheck | { ok: false; reason: 'missing' };
  setPriority: (siteId: string | null) => void;
  road: (x: number, y: number, kind: RoadKind) => RoadCheck;
  removeRoad: (x: number, y: number) => boolean;
  zone: (tiles: [number, number][], zone: ZoneKind | null) => void;
  landWork: (x: number, y: number, work: LandWork) => WorkCheck;
  unlockRegion: (id: number) => RegionCheck;
  advanceEra: (level: number) => boolean;
  rename: (name: string) => void;
  /** Hoàn tất các bước đã đủ điều kiện (móng hết giờ đông cứng…) và dùng ca còn trong kho. */
  settleAll: () => void;
};

export type CityState = CityPayload & Actions;

const now = () => new Date();
const stamp = () => new Date().toISOString();

export function worldOf(s: CityPayload): World | null {
  if (!s.terrain) return null;
  return {
    terrain: generateTerrain(s.terrain.kind, s.terrain.seed),
    works: s.works,
    roads: s.roads,
    zones: s.zones,
    regions: s.regions,
    sites: s.sites,
    era: s.era,
  };
}

/** Dùng ca trong kho cho các công trường có đội. */
function work(s: CityPayload): Pick<CityPayload, 'sites' | 'shiftBank'> {
  const r = distributeShifts(s.sites, s.shiftBank, s.priority, now());
  return { sites: r.sites, shiftBank: r.bank };
}

/** Bản cũ (≤ v3: lưới 5×5, xây một lần) — hoàn đủ vật liệu cho nhà đã xây. */
const V3_REFUND: Record<string, Partial<Materials>> = {
  park: { wood: 15, stone: 5 },
  house2: { wood: 30, brick: 20, glass: 4 },
  townhouse: { wood: 10, brick: 45, stone: 25, glass: 10 },
  highrise: { stone: 70, brick: 50, steel: 25, glass: 25 },
  skyscraper: { stone: 50, steel: 80, glass: 90 },
  landmark: { stone: 120, steel: 180, glass: 200 },
};

export function migrateCity(persisted: unknown, version: number): CityPayload {
  const p = (persisted ?? {}) as Record<string, unknown>;
  if (version >= 4) return { ...EMPTY_CITY, ...(p as Partial<CityPayload>) };
  let inventory: Materials = { ...EMPTY_MATERIALS, ...((p.inventory as Materials | undefined) ?? {}) };
  const plots = (p.plots as Record<string, { type: string }> | undefined) ?? {};
  for (const plot of Object.values(plots)) inventory = add(inventory, V3_REFUND[plot.type] ?? {});
  return { ...EMPTY_CITY, inventory, updatedAt: stamp() };
}

export const useCityStore = create<CityState>()(
  persist(
    (set, get) => ({
      ...EMPTY_CITY,

      earn: (event) => {
        const s = get();
        const r = resolveEconomy(s, event, vnToday(now()).key);
        if (r.state === s) return {};
        const gainedCount = Object.values(r.gained).reduce((a, b) => a + (b ?? 0), 0);
        let next: Partial<CityPayload> = { ...r.state, lifetime: s.lifetime + gainedCount + r.shifts, updatedAt: stamp() };
        if (r.shifts > 0) next = { ...next, ...work({ ...s, ...next } as CityPayload) };
        set(next);
        return r.gained;
      },

      chooseTerrain: (kind, seed) => {
        const s = get();
        // Đã bắt đầu xây thì không đổi địa hình — không xoá tiến độ.
        if (s.terrain && (s.sites.length > 0 || Object.keys(s.roads).length > 0)) return false;
        set({ terrain: { kind, seed }, regions: [...START_REGIONS], updatedAt: stamp() });
        return true;
      },

      place: (type, x, y, rot, seed) => {
        const s = get();
        const w = worldOf(s);
        if (!w) return { ok: false, reason: 'outside', tiles: [], bad: [] };
        const check = canPlace(w, type, x, y, rot);
        if (!check.ok) return check;
        const id = `${type}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
        const site = newSite({ id, type, seed, x, y, rot, now: stamp() });
        set({ sites: [...s.sites, site], priority: s.priority ?? id, updatedAt: stamp() });
        return { ...check, siteId: id };
      },

      cancelSite: (siteId) => {
        const s = get();
        const site = s.sites.find((x) => x.id === siteId);
        // Chỉ huỷ được công trường chưa giao vật liệu nào (đặt nhầm chỗ) — không có đường "hoàn tiền".
        if (!site || site.stageIdx > 0 || site.shifts > 0) return false;
        const it = catalogItem(site.type);
        if (it && site.delivered && Object.keys(it.cost).length && site.startedAt !== site.createdAt) return false;
        set({ sites: s.sites.filter((x) => x.id !== siteId), priority: s.priority === siteId ? null : s.priority, updatedAt: stamp() });
        return true;
      },

      deliver: (siteId) => {
        const s = get();
        const site = s.sites.find((x) => x.id === siteId);
        if (!site) return { ok: false, reason: 'missing' };
        const r = deliverStep(site, s.inventory, stamp());
        if (!r.ok) return r;
        const sites = s.sites.map((x) => (x.id === siteId ? r.site : x));
        set({ inventory: r.inventory, ...work({ ...s, sites }), updatedAt: stamp() });
        return r;
      },

      hire: (siteId, crew, level) => {
        const s = get();
        const site = s.sites.find((x) => x.id === siteId);
        if (!site) return { ok: false, reason: 'missing' };
        const check = canHire(crew, site, s.sites, s.inventory, s.era, level);
        if (!check.ok) return check;
        const sites = s.sites.map((x) => (x.id === siteId ? { ...x, crew } : x));
        set({ inventory: subtract(s.inventory, CREWS[crew].hireCost), ...work({ ...s, sites }), updatedAt: stamp() });
        return check;
      },

      setPriority: (siteId) => {
        const s = get();
        set({ priority: siteId, ...work({ ...s, priority: siteId }), updatedAt: stamp() });
      },

      road: (x, y, kind) => {
        const s = get();
        const w = worldOf(s);
        if (!w) return { ok: false, reason: 'outside' };
        const r = canRoad(w, x, y, kind, s.inventory);
        if (!r.ok) return r;
        set({ roads: { ...s.roads, [key(x, y)]: r.tile }, inventory: subtract(s.inventory, r.cost), updatedAt: stamp() });
        return r;
      },

      removeRoad: (x, y) => {
        const s = get();
        const k = key(x, y);
        if (!s.roads[k]) return false;
        const roads = { ...s.roads };
        delete roads[k];
        set({ roads, updatedAt: stamp() });
        return true;
      },

      zone: (tiles, zone) => {
        const s = get();
        const zones = { ...s.zones };
        // Sửa nhãn phân khu không phá công trình đã xây.
        for (const [x, y] of tiles) {
          if (zone) zones[key(x, y)] = zone;
          else delete zones[key(x, y)];
        }
        set({ zones, updatedAt: stamp() });
      },

      landWork: (x, y, workKind) => {
        const s = get();
        const w = worldOf(s);
        if (!w) return { ok: false, reason: 'outside' };
        const r = canLandWork(w, x, y, workKind, s.inventory);
        if (!r.ok) return r;
        set({ works: { ...s.works, [key(x, y)]: workKind }, inventory: subtract(s.inventory, LAND_WORKS[workKind].cost), updatedAt: stamp() });
        return r;
      },

      unlockRegion: (id) => {
        const s = get();
        const w = worldOf(s);
        if (!w) return { ok: false, reason: 'not_adjacent' };
        const r = canUnlockRegion(w, id, s.inventory, START_REGIONS.length);
        if (!r.ok) return r;
        set({ regions: [...s.regions, id], inventory: subtract(s.inventory, r.cost), updatedAt: stamp() });
        return r;
      },

      advanceEra: (level) => {
        const s = get();
        if (s.era >= 5 || !canAdvanceEra(s.era, s.sites, level)) return false;
        set({ era: s.era + 1, updatedAt: stamp() });
        return true;
      },

      rename: (name) => set({ name: name.trim().slice(0, 40) || null, updatedAt: stamp() }),

      settleAll: () => {
        const s = get();
        const settled = s.sites.map((x) => settle(x, now()));
        const next = work({ ...s, sites: settled });
        if (JSON.stringify(next.sites) !== JSON.stringify(s.sites) || next.shiftBank !== s.shiftBank) set({ ...next, updatedAt: stamp() });
      },
    }),
    {
      name: `${STORAGE_PREFIX}city`,
      storage: storage<CityState>(),
      version: 4,
      migrate: (persisted, version) => migrateCity(persisted, version) as CityState,
      partialize: (s) => cityPayloadOf(s) as CityState,
      merge: (persisted, current) => ({ ...current, ...migrateCity(persisted, 4) }),
    },
  ),
);

export function cityPayloadOf(s: CityPayload): CityPayload {
  return {
    inventory: s.inventory,
    daily: s.daily,
    awarded: s.awarded,
    seen: s.seen,
    shiftCounter: s.shiftCounter,
    shiftBank: s.shiftBank,
    terrain: s.terrain,
    regions: s.regions,
    zones: s.zones,
    roads: s.roads,
    works: s.works,
    sites: s.sites,
    era: s.era,
    priority: s.priority,
    name: s.name,
    lifetime: s.lifetime,
    updatedAt: s.updatedAt,
  };
}

export function cityPayload(): CityPayload {
  return cityPayloadOf(useCityStore.getState());
}

/** Tiện cho giao diện: ô → công trình. */
export function useOccupancy(): Map<string, string> {
  return occupancy(useCityStore.getState().sites);
}

export { isDone };
